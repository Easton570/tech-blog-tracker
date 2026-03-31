import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { digests } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  const result = await db
    .select()
    .from(digests)
    .orderBy(desc(digests.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(result);
}
