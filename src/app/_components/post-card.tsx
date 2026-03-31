'use client';

import { useState } from 'react';

interface PostCardProps {
  title: string;
  url: string;
  blogName: string;
  blogSlug: string;
  author: string | null;
  publishedAt: string | null;
  summary: string | null;
  keyInsights: string[] | null;
  investmentRelevance: string | null;
  sentiment: string | null;
  topics: string[] | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PostCard({
  title,
  url,
  blogName,
  author,
  publishedAt,
  summary,
  keyInsights,
  investmentRelevance,
  sentiment,
  topics,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sentimentClass =
    sentiment === 'positive'
      ? 'tag-sentiment-positive'
      : sentiment === 'negative'
        ? 'tag-sentiment-negative'
        : sentiment === 'mixed'
          ? 'tag-sentiment-mixed'
          : 'tag-sentiment-neutral';

  return (
    <article className="panel glow-border">
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-surface-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-accent-light">{blogName}</span>
            {author && <span className="font-mono text-[10px] text-text-dim">/ {author}</span>}
            {publishedAt && (
              <span className="font-mono text-[10px] text-text-dim ml-auto flex-shrink-0">
                {timeAgo(publishedAt)}
              </span>
            )}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-primary hover:text-accent-light transition-colors leading-snug line-clamp-2"
          >
            {title}
            <span className="inline-block ml-1 text-text-dim text-[10px]">↗</span>
          </a>
        </div>
      </div>

      {/* Summary section */}
      {summary && (
        <div className="px-4 py-3">
          <div className={`text-xs text-text-secondary leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {summary}
          </div>

          {(keyInsights?.length || investmentRelevance) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="font-mono text-[10px] text-accent-light hover:text-accent mt-2 transition-colors"
            >
              {expanded ? '— COLLAPSE' : '+ EXPAND ANALYSIS'}
            </button>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {/* Key Insights */}
              {keyInsights && keyInsights.length > 0 && (
                <div className="pl-3 border-l-2 border-accent/30">
                  <p className="data-label mb-1.5">Key Insights</p>
                  <ul className="space-y-1">
                    {keyInsights.map((insight, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-accent-light mt-0.5 flex-shrink-0">›</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Investment Relevance */}
              {investmentRelevance && (
                <div className="bg-terminal-amber/5 border border-terminal-amber/15 rounded-sm px-3 py-2">
                  <p className="data-label text-terminal-amber/80 mb-1">Investment Signal</p>
                  <p className="text-xs text-text-secondary">{investmentRelevance}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer tags */}
      <div className="flex items-center flex-wrap gap-1.5 px-4 py-2 border-t border-surface-3">
        {sentiment && (
          <span className={`tag ${sentimentClass}`}>{sentiment}</span>
        )}
        {topics?.slice(0, 4).map((topic) => (
          <span key={topic} className="tag tag-default">{topic}</span>
        ))}
      </div>
    </article>
  );
}
