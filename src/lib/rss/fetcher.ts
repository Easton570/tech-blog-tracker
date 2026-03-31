import Parser from 'rss-parser';
import { RSS_FETCH_TIMEOUT, MAX_CONTENT_SNIPPET_LENGTH } from '../constants';

const parser = new Parser({
  timeout: RSS_FETCH_TIMEOUT,
  maxRedirects: 3,
  headers: {
    'User-Agent': 'TechBlogTracker/1.0 (RSS Feed Reader)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
  customFields: {
    item: [['content:encoded', 'contentEncoded']],
  },
});

export interface FeedItem {
  guid: string;
  url: string;
  title: string;
  author?: string;
  contentSnippet?: string;
  publishedAt?: Date;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchFeed(rssUrl: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(rssUrl);

  return (feed.items || []).map((item) => {
    const rawContent =
      (item as Record<string, string>).contentEncoded ||
      item.content ||
      item.contentSnippet ||
      '';
    const cleanContent = stripHtml(rawContent).slice(
      0,
      MAX_CONTENT_SNIPPET_LENGTH
    );

    return {
      guid: item.guid || item.link || item.title || crypto.randomUUID(),
      url: item.link || '',
      title: item.title || 'Untitled',
      author: item.creator || undefined,
      contentSnippet: cleanContent || undefined,
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
    };
  });
}
