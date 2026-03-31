import Link from 'next/link';

async function getDigests() {
  try {
    const { db } = await import('@/db');
    const { digests } = await import('@/db/schema');
    const { desc } = await import('drizzle-orm');

    return await db.select().from(digests).orderBy(desc(digests.createdAt)).limit(50);
  } catch {
    return [];
  }
}

export default async function DigestsPage() {
  const digestList = await getDigests();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="font-mono text-lg font-semibold tracking-tight text-text-primary">
          Research Digests
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim mt-1">
          AI-compiled periodic summaries for investment research
        </p>
      </header>

      {digestList.length > 0 ? (
        <div className="space-y-3 stagger">
          {digestList.map((digest) => (
            <Link key={digest.id} href={`/digests/${digest.id}`} className="block">
              <div className="panel glow-border hover:border-accent/20 transition-all">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`tag ${
                        digest.type === 'weekly' ? 'tag-accent' : 'tag-default'
                      }`}
                    >
                      {digest.type}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {digest.postCount} posts analyzed
                    </span>
                    {digest.createdAt && (
                      <span className="font-mono text-[10px] text-text-dim ml-auto">
                        {new Date(digest.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-medium text-text-primary">{digest.title}</h2>
                  <p className="text-xs text-text-secondary mt-2 line-clamp-3">
                    {digest.content.replace(/[#*_]/g, '').slice(0, 300)}...
                  </p>

                  {/* Metadata tags */}
                  {digest.metadata && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(digest.metadata as { topTopics: string[] }).topTopics?.slice(0, 5).map((topic) => (
                        <span key={topic} className="tag tag-default">{topic}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-3/50 mb-4">
            <svg className="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="font-mono text-sm text-text-secondary">No digests generated yet</p>
          <p className="font-mono text-[10px] text-text-dim mt-2 max-w-sm mx-auto">
            Digests are automatically compiled daily at 6 AM UTC and weekly on Mondays at 7 AM UTC.
          </p>
        </div>
      )}
    </div>
  );
}
