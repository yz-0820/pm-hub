import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const platform = u.searchParams.get('platform');
  const status = u.searchParams.get('status') || 'active';
  const since = u.searchParams.get('since');
  const sinceSeconds = since ? Number(since) : null;

  const typeParam = u.searchParams.get('contentType');
  const contentTypes = typeParam ? typeParam.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const whereClause = and(
    ...(status ? [eq(careerContents.status, status)] : []),
    ...(platform ? [eq(careerContents.platform, platform)] : []),
    ...(contentTypes.length > 0 ? [inArray(careerContents.contentType, contentTypes)] : []),
    ...(Number.isFinite(sinceSeconds) ? [sql`${careerContents.publishedAt} >= ${sinceSeconds as number}`] : [])
  );

  const result = await db
    .select({
      count: sql<number>`count(*)`,
      latestPublishedAt: sql<number | null>`max(${careerContents.publishedAt})`,
    })
    .from(careerContents)
    .where(whereClause);

  return NextResponse.json({
    success: true,
    data: {
      count: result[0]?.count || 0,
      latestPublishedAt: result[0]?.latestPublishedAt ?? null,
    },
  });
}

