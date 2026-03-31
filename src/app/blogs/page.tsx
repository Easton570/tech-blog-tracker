import { BlogCard } from '../_components/blog-card';
import seedData from '@/data/blogs-seed.json';

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

async function getBlogs() {
  try {
    const { db } = await import('@/db');
    const { blogs } = await import('@/db/schema');

    const result = await db.select().from(blogs).orderBy(blogs.hnRank);
    return result.map((b) => ({
      slug: b.slug,
      rank: b.hnRank,
      name: b.name,
      author: b.author,
      domain: b.domain,
      bio: b.bio,
      topics: (b.topics as string[]) || [],
      rssStatus: b.rssStatus,
      hnTotalScore: b.hnTotalScore,
      hnStories: b.hnStories,
    }));
  } catch {
    return (seedData as SeedBlog[]).map((b) => ({
      slug: b.slug,
      rank: b.rank,
      name: b.name,
      author: b.author,
      domain: b.domain,
      bio: b.bio,
      topics: b.topics,
      rssStatus: 'pending' as string | null,
      hnTotalScore: b.totalScore,
      hnStories: b.stories,
    }));
  }
}

// Get all unique topics from seed data
const allTopics = Array.from(
  new Set((seedData as SeedBlog[]).flatMap((b) => b.topics))
).sort();

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string; status?: string }>;
}) {
  const params = await searchParams;
  const allBlogs = await getBlogs();

  // Client-side-ish filtering (works with seed fallback)
  let filtered = allBlogs;
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.author?.toLowerCase().includes(q) ?? false) ||
        b.domain.toLowerCase().includes(q)
    );
  }
  if (params.topic) {
    filtered = filtered.filter((b) =>
      b.topics.some((t) => t.toLowerCase() === params.topic!.toLowerCase())
    );
  }
  if (params.status) {
    filtered = filtered.filter((b) => b.rssStatus === params.status);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="font-mono text-lg font-semibold tracking-tight text-text-primary">
          Blog Directory
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim mt-1">
          {filtered.length} of {allBlogs.length} sources tracked
        </p>
      </header>

      {/* Filter Bar */}
      <div className="panel">
        <div className="p-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <form className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Search blogs, authors, domains..."
                className="w-full bg-surface-2 border border-surface-4 rounded-sm pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-dim font-mono focus:outline-none focus:border-accent/40 transition-colors"
              />
            </div>
          </form>

          {/* Topic Filter */}
          <div className="flex items-center gap-1.5">
            <span className="data-label mr-1">Topic:</span>
            <a
              href="/blogs"
              className={`tag ${!params.topic ? 'tag-accent' : 'tag-default'}`}
            >
              All
            </a>
            {allTopics.slice(0, 8).map((topic) => (
              <a
                key={topic}
                href={`/blogs?topic=${encodeURIComponent(topic)}${params.q ? `&q=${params.q}` : ''}`}
                className={`tag ${params.topic === topic ? 'tag-accent' : 'tag-default'}`}
              >
                {topic}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 stagger">
        {filtered.map((blog) => (
          <BlogCard
            key={blog.slug}
            slug={blog.slug}
            rank={blog.rank}
            name={blog.name}
            author={blog.author}
            domain={blog.domain}
            bio={blog.bio}
            topics={blog.topics}
            rssStatus={blog.rssStatus}
            hnTotalScore={blog.hnTotalScore}
            hnStories={blog.hnStories}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="panel p-12 text-center">
          <p className="font-mono text-sm text-text-dim">No blogs match your filters</p>
        </div>
      )}
    </div>
  );
}
