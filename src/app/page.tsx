import { StatsGrid } from './_components/stats-grid';
import seedData from '@/data/blogs-seed.json';
import Link from 'next/link';

// Type for seed data
interface SeedBlog {
  rank: number;
  domain: string;
  slug: string;
  name: string;
  author: string;
  bio: string;
  topics: string[];
  totalScore: number;
  stories: number;
}

async function getDashboardData() {
  try {
    const { db } = await import('@/db');
    const { blogs, posts, summaries, digests } = await import('@/db/schema');
    const { sql, desc, eq, count } = await import('drizzle-orm');

    const [blogCount, postCount, summaryCount, feedHealth, recentPosts, latestDigest] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(blogs),
        db.select({ count: sql<number>`count(*)` }).from(posts),
        db.select({ count: sql<number>`count(*)` }).from(summaries),
        db
          .select({
            status: blogs.rssStatus,
            count: sql<number>`count(*)`,
          })
          .from(blogs)
          .groupBy(blogs.rssStatus),
        db
          .select({
            id: posts.id,
            title: posts.title,
            url: posts.url,
            publishedAt: posts.publishedAt,
            blogName: blogs.name,
            blogSlug: blogs.slug,
            summary: summaries.summary,
            sentiment: summaries.sentiment,
          })
          .from(posts)
          .innerJoin(blogs, eq(posts.blogId, blogs.id))
          .leftJoin(summaries, eq(posts.id, summaries.postId))
          .orderBy(desc(posts.discoveredAt))
          .limit(8),
        db.select().from(digests).orderBy(desc(digests.createdAt)).limit(1),
      ]);

    return {
      blogCount: Number(blogCount[0]?.count ?? 0),
      postCount: Number(postCount[0]?.count ?? 0),
      summaryCount: Number(summaryCount[0]?.count ?? 0),
      feedHealth: feedHealth.reduce(
        (acc, row) => {
          acc[row.status || 'pending'] = Number(row.count);
          return acc;
        },
        {} as Record<string, number>
      ),
      recentPosts,
      latestDigest: latestDigest[0] || null,
    };
  } catch {
    // DB not connected — use seed fallback
    return {
      blogCount: (seedData as SeedBlog[]).length,
      postCount: 0,
      summaryCount: 0,
      feedHealth: { pending: (seedData as SeedBlog[]).length } as Record<string, number>,
      recentPosts: [] as Array<{
        id: number;
        title: string;
        url: string;
        publishedAt: Date | null;
        blogName: string;
        blogSlug: string;
        summary: string | null;
        sentiment: string | null;
      }>,
      latestDigest: null as null | { id: number; title: string; type: string; content: string; postCount: number | null; createdAt: Date | null },
    };
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();

  const activeFeeds = data.feedHealth['active'] || 0;
  const failingFeeds = data.feedHealth['failing'] || 0;
  const deadFeeds = data.feedHealth['dead'] || 0;
  const pendingFeeds = data.feedHealth['pending'] || 0;
  const totalFeeds = activeFeeds + failingFeeds + deadFeeds + pendingFeeds;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim mt-1">
            Real-time blog intelligence overview
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
          <span className="status-dot status-dot-active animate-pulse-slow" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </header>

      {/* Stats Grid */}
      <StatsGrid
        stats={[
          { label: 'Blogs Tracked', value: data.blogCount, color: 'cyan' },
          { label: 'Posts Discovered', value: data.postCount, color: 'green' },
          { label: 'AI Summaries', value: data.summaryCount, color: 'amber' },
          {
            label: 'Active Feeds',
            value: activeFeeds,
            sub: `${failingFeeds} warn · ${deadFeeds} dead`,
            color: activeFeeds > 0 ? 'green' : 'default',
          },
        ]}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Posts (2/3 width) */}
        <div className="xl:col-span-2 panel">
          <div className="panel-header">
            <h2>Recent Posts</h2>
            <Link href="/feed" className="font-mono text-[10px] text-accent-light hover:text-accent transition-colors">
              VIEW ALL →
            </Link>
          </div>
          <div className="divide-y divide-surface-2">
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map((post) => (
                <div key={post.id} className="ticker-row">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-accent-light flex-shrink-0">
                        {post.blogName}
                      </span>
                      {post.publishedAt && (
                        <span className="font-mono text-[10px] text-text-dim">
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {post.sentiment && (
                        <span
                          className={`tag text-[8px] py-0 ${
                            post.sentiment === 'positive'
                              ? 'tag-sentiment-positive'
                              : post.sentiment === 'negative'
                                ? 'tag-sentiment-negative'
                                : post.sentiment === 'mixed'
                                  ? 'tag-sentiment-mixed'
                                  : 'tag-sentiment-neutral'
                          }`}
                        >
                          {post.sentiment}
                        </span>
                      )}
                    </div>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-text-primary hover:text-accent-light transition-colors line-clamp-1"
                    >
                      {post.title}
                    </a>
                    {post.summary && (
                      <p className="text-[11px] text-text-dim mt-0.5 line-clamp-1">{post.summary}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="font-mono text-xs text-text-dim">No posts discovered yet</p>
                <p className="font-mono text-[10px] text-text-dim mt-1">
                  Feed checks will populate this view automatically
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Feed Health */}
          <div className="panel">
            <div className="panel-header">
              <h3>Feed Health</h3>
            </div>
            <div className="panel-body">
              {/* Health bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-surface-3 mb-4">
                {totalFeeds > 0 && (
                  <>
                    <div
                      className="bg-terminal-green transition-all"
                      style={{ width: `${(activeFeeds / totalFeeds) * 100}%` }}
                    />
                    <div
                      className="bg-terminal-amber transition-all"
                      style={{ width: `${(failingFeeds / totalFeeds) * 100}%` }}
                    />
                    <div
                      className="bg-terminal-red transition-all"
                      style={{ width: `${(deadFeeds / totalFeeds) * 100}%` }}
                    />
                    <div
                      className="bg-muted transition-all"
                      style={{ width: `${(pendingFeeds / totalFeeds) * 100}%` }}
                    />
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-active" />
                  <span className="font-mono text-[10px] text-text-secondary">Active</span>
                  <span className="font-mono text-[10px] text-text-primary ml-auto">{activeFeeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-failing" />
                  <span className="font-mono text-[10px] text-text-secondary">Failing</span>
                  <span className="font-mono text-[10px] text-text-primary ml-auto">{failingFeeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-dead" />
                  <span className="font-mono text-[10px] text-text-secondary">Dead</span>
                  <span className="font-mono text-[10px] text-text-primary ml-auto">{deadFeeds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-pending" />
                  <span className="font-mono text-[10px] text-text-secondary">Pending</span>
                  <span className="font-mono text-[10px] text-text-primary ml-auto">{pendingFeeds}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Digest */}
          <div className="panel">
            <div className="panel-header">
              <h3>Latest Digest</h3>
            </div>
            <div className="panel-body">
              {data.latestDigest ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`tag ${data.latestDigest.type === 'weekly' ? 'tag-accent' : 'tag-default'}`}
                    >
                      {data.latestDigest.type}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {data.latestDigest.postCount} posts
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">{data.latestDigest.title}</h4>
                  <p className="text-xs text-text-secondary line-clamp-4">
                    {data.latestDigest.content.slice(0, 200)}...
                  </p>
                  <Link
                    href={`/digests/${data.latestDigest.id}`}
                    className="inline-block mt-3 font-mono text-[10px] text-accent-light hover:text-accent transition-colors"
                  >
                    READ FULL DIGEST →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="font-mono text-xs text-text-dim">No digests generated yet</p>
                  <p className="font-mono text-[10px] text-text-dim mt-1">
                    Digests are compiled daily and weekly
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Blogs Quick List */}
          <div className="panel">
            <div className="panel-header">
              <h3>Top Blogs by HN Score</h3>
              <Link href="/blogs" className="font-mono text-[10px] text-accent-light hover:text-accent transition-colors">
                ALL →
              </Link>
            </div>
            <div className="divide-y divide-surface-2">
              {(seedData as SeedBlog[]).slice(0, 5).map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blogs/${blog.slug}`}
                  className="ticker-row text-xs"
                >
                  <span className="font-mono text-[10px] text-text-dim w-6">
                    {String(blog.rank).padStart(2, '0')}
                  </span>
                  <span className="text-text-primary flex-1 truncate">{blog.name}</span>
                  <span className="font-mono text-[10px] text-terminal-amber flex-shrink-0">
                    ▲{(blog.totalScore / 1000).toFixed(1)}k
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
