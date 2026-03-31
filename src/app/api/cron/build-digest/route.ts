import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs, posts, summaries, digests } from '@/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import { buildDigest } from '@/lib/digest/builder';
import { verifyCronSecret } from '@/lib/cron-auth';
import { subDays, subWeeks, startOfDay, format } from 'date-fns';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type') || 'daily';
  const now = new Date();

  let periodStart: Date;
  let periodLabel: string;

  if (type === 'weekly') {
    periodStart = startOfDay(subWeeks(now, 1));
    periodLabel = `Weekly Digest (${format(periodStart, 'MMM d')} - ${format(now, 'MMM d, yyyy')})`;
  } else {
    periodStart = startOfDay(subDays(now, 1));
    periodLabel = `Daily Digest (${format(now, 'MMM d, yyyy')})`;
  }

  // Get all summarized posts in the period
  const recentPosts = await db
    .select({
      postTitle: posts.title,
      blogName: blogs.name,
      summary: summaries.summary,
      investmentRelevance: summaries.investmentRelevance,
      sentiment: summaries.sentiment,
      topics: summaries.topics,
    })
    .from(summaries)
    .innerJoin(posts, eq(summaries.postId, posts.id))
    .innerJoin(blogs, eq(posts.blogId, blogs.id))
    .where(
      and(
        gte(posts.discoveredAt, periodStart),
        lte(posts.discoveredAt, now),
        eq(posts.summarizationStatus, 'completed')
      )
    )
    .orderBy(desc(posts.publishedAt));

  if (recentPosts.length === 0) {
    return NextResponse.json({
      message: 'No posts to digest',
      type,
      periodStart,
      periodEnd: now,
    });
  }

  // Build digest via AI
  const digestContent = await buildDigest(
    recentPosts.map((p) => ({
      title: p.postTitle,
      blogName: p.blogName,
      summary: p.summary,
      investmentRelevance: p.investmentRelevance || '',
      sentiment: p.sentiment || 'neutral',
      topics: (p.topics as string[]) || [],
    })),
    periodLabel
  );

  // Compute metadata
  const topicCounts: Record<string, number> = {};
  const blogCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};

  for (const post of recentPosts) {
    for (const topic of (post.topics as string[]) || []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
    blogCounts[post.blogName] = (blogCounts[post.blogName] || 0) + 1;
    const s = post.sentiment || 'neutral';
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
  }

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);
  const topBlogs = Object.entries(blogCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([b]) => b);

  // Store digest
  const [digest] = await db
    .insert(digests)
    .values({
      title: periodLabel,
      periodStart,
      periodEnd: now,
      type,
      content: digestContent,
      postCount: recentPosts.length,
      metadata: {
        topTopics,
        topBlogs,
        sentimentBreakdown: sentimentCounts,
      },
    })
    .returning();

  return NextResponse.json({
    digestId: digest.id,
    type,
    postCount: recentPosts.length,
    periodStart,
    periodEnd: now,
  });
}
