import Link from 'next/link';
import seedData from '@/data/blogs-seed.json';
import { notFound } from 'next/navigation';

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

interface BlogDetail {
  blog: {
    id: number;
    slug: string;
    name: string;
    domain: string;
    author: string | null;
    bio: string | null;
    topics: string[];
    rssStatus: string | null;
    rssUrl: string | null;
    rssLastCheckedAt: Date | null;
    hnRank: number | null;
    hnTotalScore: number | null;
    hnStories: number | null;
  };
  posts: Array<{
    id: number;
    title: string;
    url: string;
    publishedAt: Date | null;
    summary: string | null;
    sentiment: string | null;
    keyInsights: string[] | null;
    investmentRelevance: string | null;
    topics: string[] | null;
  }>;
}

async function getBlogDetail(slug: string): Promise<BlogDetail | null> {
  // First try database
  try {
    const { db } = await import('@/db');
    const { blogs, posts, summaries } = await import('@/db/schema');
    const { eq, desc } = await import('drizzle-orm');

    const [blog] = await db.select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
    if (!blog) return null;

    const blogPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        url: posts.url,
        publishedAt: posts.publishedAt,
        summary: summaries.summary,
        sentiment: summaries.sentiment,
        keyInsights: summaries.keyInsights,
        investmentRelevance: summaries.investmentRelevance,
        topics: summaries.topics,
      })
      .from(posts)
      .leftJoin(summaries, eq(posts.id, summaries.postId))
      .where(eq(posts.blogId, blog.id))
      .orderBy(desc(posts.publishedAt))
      .limit(50);

    return {
      blog: {
        id: blog.id,
        slug: blog.slug,
        name: blog.name,
        domain: blog.domain,
        author: blog.author,
        bio: blog.bio,
        topics: (blog.topics as string[]) || [],
        rssStatus: blog.rssStatus,
        rssUrl: blog.rssUrl,
        rssLastCheckedAt: blog.rssLastCheckedAt,
        hnRank: blog.hnRank,
        hnTotalScore: blog.hnTotalScore,
        hnStories: blog.hnStories,
      },
      posts: blogPosts.map((p) => ({
        ...p,
        keyInsights: p.keyInsights as string[] | null,
        topics: p.topics as string[] | null,
      })),
    };
  } catch {
    // Fallback to seed data
    const seedBlog = (seedData as SeedBlog[]).find((b) => b.slug === slug);
    if (!seedBlog) return null;

    return {
      blog: {
        id: seedBlog.rank,
        slug: seedBlog.slug,
        name: seedBlog.name,
        domain: seedBlog.domain,
        author: seedBlog.author,
        bio: seedBlog.bio,
        topics: seedBlog.topics,
        rssStatus: 'pending',
        rssUrl: null,
        rssLastCheckedAt: null,
        hnRank: seedBlog.rank,
        hnTotalScore: seedBlog.totalScore,
        hnStories: seedBlog.stories,
      },
      posts: [],
    };
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBlogDetail(slug);

  if (!data) notFound();

  const { blog, posts } = data;

  const statusClass =
    blog.rssStatus === 'active'
      ? 'status-dot-active'
      : blog.rssStatus === 'failing'
        ? 'status-dot-failing'
        : blog.rssStatus === 'dead'
          ? 'status-dot-dead'
          : 'status-dot-pending';

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
        <Link href="/blogs" className="hover:text-accent-light transition-colors">
          BLOGS
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{blog.name}</span>
      </nav>

      {/* Blog Header */}
      <div className="panel">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {blog.hnRank && (
                  <span className="font-mono text-xs font-semibold text-text-dim bg-surface-3/60 px-2 py-1 rounded-sm">
                    #{String(blog.hnRank).padStart(3, '0')}
                  </span>
                )}
                <span className={`status-dot ${statusClass}`} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
                  {blog.rssStatus || 'pending'}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-text-primary">{blog.name}</h1>
              <p className="font-mono text-xs text-text-dim mt-1">
                <a
                  href={`https://${blog.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-light transition-colors"
                >
                  {blog.domain} ↗
                </a>
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex gap-6">
              {blog.hnTotalScore && (
                <div className="text-right">
                  <p className="data-label">HN Score</p>
                  <p className="font-mono text-lg font-semibold text-terminal-amber">
                    {blog.hnTotalScore.toLocaleString()}
                  </p>
                </div>
              )}
              {blog.hnStories && (
                <div className="text-right">
                  <p className="data-label">Stories</p>
                  <p className="font-mono text-lg font-semibold text-text-primary">
                    {blog.hnStories}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Author & Bio */}
          <div className="mt-4 flex items-center gap-3">
            {blog.author && (
              <p className="text-sm text-text-secondary">{blog.author}</p>
            )}
            {blog.bio && (
              <>
                <span className="text-text-dim">·</span>
                <p className="text-sm text-text-dim">{blog.bio}</p>
              </>
            )}
          </div>

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {blog.topics.map((topic) => (
              <span key={topic} className="tag tag-accent">{topic}</span>
            ))}
          </div>

          {/* RSS Info */}
          {blog.rssUrl && (
            <div className="mt-4 pt-4 border-t border-surface-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="data-label">RSS Feed</p>
                  <p className="font-mono text-[11px] text-text-dim mt-0.5 break-all">{blog.rssUrl}</p>
                </div>
                {blog.rssLastCheckedAt && (
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="data-label">Last Checked</p>
                    <p className="font-mono text-[11px] text-text-dim mt-0.5">
                      {new Date(blog.rssLastCheckedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="panel">
        <div className="panel-header">
          <h2>Post History</h2>
          <span className="font-mono text-[10px] text-text-dim">{posts.length} posts</span>
        </div>
        <div className="divide-y divide-surface-2">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="px-4 py-4 hover:bg-surface-2/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-text-primary hover:text-accent-light transition-colors"
                    >
                      {post.title}
                      <span className="ml-1 text-[10px] text-text-dim">↗</span>
                    </a>

                    {post.summary && (
                      <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{post.summary}</p>
                    )}

                    {post.keyInsights && post.keyInsights.length > 0 && (
                      <div className="mt-2 pl-3 border-l border-accent/20">
                        {post.keyInsights.slice(0, 2).map((insight, i) => (
                          <p key={i} className="text-[11px] text-text-dim flex items-start gap-1.5">
                            <span className="text-accent-light">›</span> {insight}
                          </p>
                        ))}
                      </div>
                    )}

                    {post.investmentRelevance && (
                      <div className="mt-2 bg-terminal-amber/5 border border-terminal-amber/15 rounded-sm px-2.5 py-1.5">
                        <p className="text-[10px] text-terminal-amber/80 font-mono uppercase tracking-wider mb-0.5">Investment Signal</p>
                        <p className="text-[11px] text-text-secondary">{post.investmentRelevance}</p>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mt-2">
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
                      {post.topics?.slice(0, 3).map((t) => (
                        <span key={t} className="tag tag-default text-[8px] py-0">{t}</span>
                      ))}
                    </div>
                  </div>

                  {post.publishedAt && (
                    <span className="font-mono text-[10px] text-text-dim flex-shrink-0">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-16 text-center">
              <p className="font-mono text-xs text-text-dim">No posts discovered yet</p>
              <p className="font-mono text-[10px] text-text-dim mt-1">
                Posts will appear here once the RSS feed is checked
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
