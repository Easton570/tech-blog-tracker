import { RSS_DISCOVERY_TIMEOUT } from '../constants';

const COMMON_RSS_PATHS = [
  '/feed',
  '/feed.xml',
  '/rss',
  '/rss.xml',
  '/atom.xml',
  '/index.xml',
  '/blog/feed',
  '/blog/rss',
  '/feeds/posts/default',
  '/feed/atom',
  '/.rss',
  '/blog.rss',
  '/blog/atom.xml',
  '/blog/feed.xml',
];

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = RSS_DISCOVERY_TIMEOUT, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function discoverFeedUrl(domain: string): Promise<string | null> {
  const base = domain.startsWith('http') ? domain : `https://${domain}`;

  // 1. Try common paths with HEAD requests in parallel
  const results = await Promise.allSettled(
    COMMON_RSS_PATHS.map((path) =>
      fetchWithTimeout(`${base}${path}`, {
        method: 'HEAD',
        timeout: RSS_DISCOVERY_TIMEOUT,
        redirect: 'follow',
      }).then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (
          res.ok &&
          (ct.includes('xml') || ct.includes('rss') || ct.includes('atom'))
        ) {
          return `${base}${path}`;
        }
        return null;
      })
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  // 2. Fallback: fetch HTML and parse <link rel="alternate">
  try {
    const html = await fetchWithTimeout(base, { timeout: 5000 }).then((r) =>
      r.text()
    );
    const match = html.match(
      /<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i
    );
    if (match?.[2]) {
      const href = match[2];
      return href.startsWith('http') ? href : `${base}${href}`;
    }

    // Try reversed attribute order
    const match2 = html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss|atom)\+xml["']/i
    );
    if (match2?.[1]) {
      const href = match2[1];
      return href.startsWith('http') ? href : `${base}${href}`;
    }
  } catch {
    // Ignore HTML fetch errors
  }

  return null;
}
