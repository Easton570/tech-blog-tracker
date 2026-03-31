import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs, posts, summaries } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { summarizePost } from '@/lib/ai/summarizer';
import { verifyCronSecret } from '@/lib/cron-auth';
import { POSTS_PER_SUMMARIZE_RUN } from '@/lib/constants';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Grab pending posts
  const pendingPosts = await db
    .select({
      post: posts,
      blog: blogs,
    })
    .from(posts)
    .innerJoin(blogs, eq(posts.blogId, blogs.id))
    .where(eq(posts.summarizationStatus, 'pending'))
    .orderBy(posts.discoveredAt)
    .limit(POSTS_PER_SUMMARIZE_RUN);

  if (pendingPosts.length === 0) {
    return NextResponse.json({ message: 'No pending posts', processed: 0 });
  }

  // Claim posts by marking as processing
  const postIds = pendingPosts.map((p) => p.post.id);
  await db
    .update(posts)
    .set({ summarizationStatus: 'processing' })
    .where(inArray(posts.id, postIds));

  const results: Array<{ postId: number; status: string; error?: string }> = [];

  for (const { post, blog } of pendingPosts) {
    try {
      // Skip posts with no content
      if (!post.contentSnippet && post.title.length < 10) {
        await db
          .update(posts)
          .set({ summarizationStatus: 'skipped' })
          .where(eq(posts.id, post.id));
        results.push({ postId: post.id, status: 'skipped' });
        continue;
      }

      const result = await summarizePost(
        post.title,
        post.contentSnippet || post.title,
        blog.name,
        post.author || blog.author
      );

      await db.insert(summaries).values({
        postId: post.id,
        summary: result.summary,
        keyInsights: result.keyInsights,
        investmentRelevance: result.investmentRelevance,
        sentiment: result.sentiment,
        topics: result.topics,
        model: 'gpt-4o-mini',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      });

      await db
        .update(posts)
        .set({ summarizationStatus: 'completed' })
        .where(eq(posts.id, post.id));

      results.push({ postId: post.id, status: 'completed' });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      await db
        .update(posts)
        .set({ summarizationStatus: 'failed' })
        .where(eq(posts.id, post.id));

      results.push({ postId: post.id, status: 'failed', error: errMsg });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
