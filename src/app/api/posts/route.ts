import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs, posts, summaries } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  const result = await db
    .select({
      post: posts,
      blog: {
        id: blogs.id,
        name: blogs.name,
        slug: blogs.slug,
        domain: blogs.domain,
        author: blogs.author,
      },
      summary: summaries,
    })
    .from(posts)
    .innerJoin(blogs, eq(posts.blogId, blogs.id))
    .leftJoin(summaries, eq(posts.id, summaries.postId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(result);
}
