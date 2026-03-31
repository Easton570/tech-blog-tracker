import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs, posts, feedCheckLogs } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { fetchFeed } from '@/lib/rss/fetcher';
import { discoverFeedUrl } from '@/lib/rss/discovery';
import { verifyCronSecret } from '@/lib/cron-auth';
import { BATCH_COUNT, MAX_CONSECUTIVE_ERRORS } from '@/lib/constants';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batchIndex = parseInt(
    request.nextUrl.searchParams.get('batch') || '0'
  );

  // Fetch blogs assigned to this batch
  const batchBlogs = await db
    .select()
    .from(blogs)
    .where(
      and(
        eq(blogs.isActive, true),
        sql`${blogs.id} % ${BATCH_COUNT} = ${batchIndex}`
      )
    );

  const results: Array<{
    blog: string;
    status: string;
    newPosts?: number;
    error?: string;
  }> = [];

  for (const blog of batchBlogs) {
    const startTime = Date.now();
    try {
      // If no RSS URL yet, attempt discovery
      let rssUrl = blog.rssUrl;
      if (!rssUrl || blog.rssStatus === 'pending') {
        rssUrl = await discoverFeedUrl(blog.domain);
        if (rssUrl) {
          await db
            .update(blogs)
            .set({ rssUrl, rssStatus: 'active', updatedAt: new Date() })
            .where(eq(blogs.id, blog.id));
        } else {
          await db
            .update(blogs)
            .set({
              rssStatus: 'failing',
              rssLastError: 'Could not discover RSS feed',
              rssLastCheckedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(blogs.id, blog.id));

          await db.insert(feedCheckLogs).values({
            blogId: blog.id,
            status: 'error',
            error: 'RSS discovery failed',
            durationMs: Date.now() - startTime,
          });

          results.push({ blog: blog.slug, status: 'no_rss' });
          continue;
        }
      }

      // Fetch and parse RSS
      const items = await fetchFeed(rssUrl);

      // Insert new posts (skip duplicates)
      let newCount = 0;
      for (const item of items) {
        if (!item.url && !item.guid) continue;

        const result = await db
          .insert(posts)
          .values({
            blogId: blog.id,
            guid: item.guid,
            url: item.url,
            title: item.title,
            author: item.author,
            contentSnippet: item.contentSnippet,
            publishedAt: item.publishedAt,
          })
          .onConflictDoNothing();

        if (result.rowCount && result.rowCount > 0) newCount++;
      }

      // Update blog metadata
      await db
        .update(blogs)
        .set({
          rssStatus: 'active',
          rssLastCheckedAt: new Date(),
          rssLastSuccessAt: new Date(),
          rssErrorCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(blogs.id, blog.id));

      // Log success
      await db.insert(feedCheckLogs).values({
        blogId: blog.id,
        status: 'success',
        newPostsFound: newCount,
        durationMs: Date.now() - startTime,
      });

      results.push({ blog: blog.slug, status: 'ok', newPosts: newCount });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const newErrorCount = (blog.rssErrorCount || 0) + 1;

      await db
        .update(blogs)
        .set({
          rssStatus:
            newErrorCount >= MAX_CONSECUTIVE_ERRORS ? 'dead' : 'failing',
          rssErrorCount: newErrorCount,
          rssLastError: errMsg.slice(0, 500),
          rssLastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(blogs.id, blog.id));

      await db.insert(feedCheckLogs).values({
        blogId: blog.id,
        status: 'error',
        error: errMsg.slice(0, 500),
        durationMs: Date.now() - startTime,
      });

      results.push({ blog: blog.slug, status: 'error', error: errMsg });
    }
  }

  return NextResponse.json({
    batch: batchIndex,
    processed: results.length,
    results,
  });
}
