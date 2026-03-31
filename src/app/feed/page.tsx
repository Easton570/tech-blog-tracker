import { PostCard } from '../_components/post-card';

async function getFeedPosts(offset: number = 0) {
  try {
    const { db } = await import('@/db');
    const { blogs, posts, summaries } = await import('@/db/schema');
    const { eq, desc } = await import('drizzle-orm');

    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        author: posts.author,
        publishedAt: posts.publishedAt,
        blogName: blogs.name,
        blogSlug: blogs.slug,
        summary: summaries.summary,
        keyInsights: summaries.keyInsights,
        investmentRelevance: summaries.investmentRelevance,
        sentiment: summaries.sentiment,
        topics: summaries.topics,
      })
      .from(posts)
      .innerJoin(blogs, eq(posts.blogId, blogs.id))
      .leftJoin(summaries, eq(posts.id, summaries.postId))
      .orderBy(desc(posts.publishedAt))
      .limit(20)
      .offset(offset);

    return result.map((r) => ({
      ...r,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      keyInsights: r.keyInsights as string[] | null,
      topics: r.topics as string[] | null,
    }));
  } catch {
    return [];
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const offset = (page - 1) * 20;
  const posts = await getFeedPosts(offset);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="font-mono text-lg font-semibold tracking-tight text-text-primary">
          Live Feed
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim mt-1">
          Chronological stream of all discovered posts with AI analysis
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="space-y-3 stagger">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              url={post.url}
              blogName={post.blogName}
              blogSlug={post.blogSlug}
              author={post.author}
              publishedAt={post.publishedAt}
              summary={post.summary}
              keyInsights={post.keyInsights}
              investmentRelevance={post.investmentRelevance}
              sentiment={post.sentiment}
              topics={post.topics}
            />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {page > 1 && (
              <a
                href={`/feed?page=${page - 1}`}
                className="font-mono text-xs text-accent-light hover:text-accent transition-colors"
              >
                ← PREV
              </a>
            )}
            <span className="font-mono text-[10px] text-text-dim">PAGE {page}</span>
            {posts.length === 20 && (
              <a
                href={`/feed?page=${page + 1}`}
                className="font-mono text-xs text-accent-light hover:text-accent transition-colors"
              >
                NEXT →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="panel p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-3/50 mb-4">
            <svg className="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <p className="font-mono text-sm text-text-secondary">Feed is empty</p>
          <p className="font-mono text-[10px] text-text-dim mt-2 max-w-sm mx-auto">
            Posts will appear here once the RSS cron jobs discover new content from the tracked blogs.
            Feed checks run every 4 hours.
          </p>
        </div>
      )}
    </div>
  );
}
