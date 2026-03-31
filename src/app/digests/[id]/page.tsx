import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getDigest(id: number) {
  try {
    const { db } = await import('@/db');
    const { digests } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const [digest] = await db.select().from(digests).where(eq(digests.id, id)).limit(1);
    return digest || null;
  } catch {
    return null;
  }
}

// Simple markdown-to-html for digest content
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-text-primary mt-6 mb-2 font-mono uppercase tracking-wider">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-text-primary mt-8 mb-3 pb-2 border-b border-surface-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-text-primary mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-medium">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="text-xs text-text-secondary ml-4 mb-1 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="text-xs text-text-secondary ml-4 mb-1 list-decimal">$1</li>')
    // Paragraphs (lines not already processed)
    .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="text-xs text-text-secondary leading-relaxed mb-3">$1</p>')
    // Wrap adjacent li tags in ul
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="mb-4">$1</ul>');
}

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const digestId = parseInt(id);

  if (isNaN(digestId)) notFound();

  const digest = await getDigest(digestId);
  if (!digest) notFound();

  const metadata = digest.metadata as { topTopics?: string[]; topBlogs?: string[]; sentimentBreakdown?: Record<string, number> } | null;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
        <Link href="/digests" className="hover:text-accent-light transition-colors">
          DIGESTS
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{digest.title}</span>
      </nav>

      {/* Header */}
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`tag ${digest.type === 'weekly' ? 'tag-accent' : 'tag-default'}`}>
            {digest.type}
          </span>
          <span className="font-mono text-[10px] text-text-dim">
            {digest.postCount} posts analyzed
          </span>
          {digest.createdAt && (
            <span className="font-mono text-[10px] text-text-dim">
              Generated {new Date(digest.createdAt).toLocaleString()}
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-text-primary">{digest.title}</h1>
        <p className="font-mono text-xs text-text-dim mt-1">
          Period: {new Date(digest.periodStart).toLocaleDateString()} — {new Date(digest.periodEnd).toLocaleDateString()}
        </p>

        {/* Metadata sidebar */}
        {metadata && (
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-surface-3">
            {metadata.topTopics && metadata.topTopics.length > 0 && (
              <div>
                <p className="data-label mb-1.5">Top Topics</p>
                <div className="flex flex-wrap gap-1">
                  {metadata.topTopics.map((t) => (
                    <span key={t} className="tag tag-default">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {metadata.sentimentBreakdown && (
              <div>
                <p className="data-label mb-1.5">Sentiment Breakdown</p>
                <div className="flex gap-3">
                  {Object.entries(metadata.sentimentBreakdown).map(([key, value]) => (
                    <span key={key} className="font-mono text-[10px]">
                      <span
                        className={
                          key === 'positive'
                            ? 'text-terminal-green'
                            : key === 'negative'
                              ? 'text-terminal-red'
                              : key === 'mixed'
                                ? 'text-terminal-amber'
                                : 'text-terminal-cyan'
                        }
                      >
                        {value}
                      </span>{' '}
                      <span className="text-text-dim">{key}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Digest Content */}
      <div className="panel p-6">
        <div
          className="prose-terminal max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(digest.content) }}
        />
      </div>
    </div>
  );
}
