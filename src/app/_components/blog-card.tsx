import Link from 'next/link';

interface BlogCardProps {
  slug: string;
  rank: number | null;
  name: string;
  author: string | null;
  domain: string;
  bio: string | null;
  topics: string[];
  rssStatus: string | null;
  hnTotalScore: number | null;
  hnStories: number | null;
}

export function BlogCard({
  slug,
  rank,
  name,
  author,
  domain,
  bio,
  topics,
  rssStatus,
  hnTotalScore,
  hnStories,
}: BlogCardProps) {
  const statusClass =
    rssStatus === 'active'
      ? 'status-dot-active'
      : rssStatus === 'failing'
        ? 'status-dot-failing'
        : rssStatus === 'dead'
          ? 'status-dot-dead'
          : 'status-dot-pending';

  const statusLabel =
    rssStatus === 'active' ? 'LIVE' : rssStatus === 'failing' ? 'WARN' : rssStatus === 'dead' ? 'DEAD' : 'INIT';

  return (
    <Link href={`/blogs/${slug}`} className="block">
      <div className="panel glow-border group h-full flex flex-col">
        {/* Header with rank & status */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-3">
          <div className="flex items-center gap-2">
            {rank && (
              <span className="font-mono text-[10px] font-semibold text-text-dim bg-surface-3/60 px-1.5 py-0.5 rounded-sm">
                #{String(rank).padStart(3, '0')}
              </span>
            )}
            <span className={`status-dot ${statusClass}`} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-dim">{statusLabel}</span>
          </div>
          {hnTotalScore && (
            <span className="font-mono text-[10px] text-terminal-amber">
              ▲ {(hnTotalScore / 1000).toFixed(1)}k
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-sans text-sm font-semibold text-text-primary group-hover:text-accent-light transition-colors leading-snug">
            {name}
          </h3>
          <p className="font-mono text-[10px] text-text-dim mt-1">{domain}</p>

          {author && (
            <p className="text-xs text-text-secondary mt-2">{author}</p>
          )}
          {bio && (
            <p className="text-[11px] text-text-dim mt-1 line-clamp-2">{bio}</p>
          )}

          {/* Topics */}
          <div className="flex flex-wrap gap-1.5 mt-3 mt-auto pt-3">
            {topics.slice(0, 3).map((topic) => (
              <span key={topic} className="tag tag-default">{topic}</span>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-surface-3">
          {hnStories && (
            <span className="font-mono text-[10px] text-text-dim">
              {hnStories} stories
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
