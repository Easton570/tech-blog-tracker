import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs } from '@/db/schema';
import { sql, ilike, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topic = searchParams.get('topic');
  const status = searchParams.get('status');
  const search = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const conditions = [];

  if (topic) {
    conditions.push(sql`${blogs.topics}::jsonb ? ${topic}`);
  }
  if (status) {
    conditions.push(eq(blogs.rssStatus, status));
  }
  if (search) {
    conditions.push(
      sql`(${ilike(blogs.name, `%${search}%`)} OR ${ilike(blogs.author, `%${search}%`)} OR ${ilike(blogs.domain, `%${search}%`)})`
    );
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined;

  const result = await db
    .select()
    .from(blogs)
    .where(where)
    .orderBy(blogs.hnRank)
    .limit(limit)
    .offset(offset);

  return NextResponse.json(result);
}
