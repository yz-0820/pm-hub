import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const platform = u.searchParams.get('platform');
  const status = u.searchParams.get('status') || 'active';
  const since = u.searchParams.get('since');
  const sinceNumber = since ? Number(since) : null;
  const sinceDate =
    sinceNumber && Number.isFinite(sinceNumber)
      ? new Date(sinceNumber < 10_000_000_000 ? sinceNumber * 1000 : sinceNumber)
      : null;

  const typeParam = u.searchParams.get('contentType');
  const contentTypes = typeParam ? typeParam.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const whereClause = and(
    ...(status ? [eq(careerContents.status, status)] : []),
    ...(platform ? [eq(careerContents.platform, platform)] : []),
    ...(contentTypes.length > 0 ? [inArray(careerContents.contentType, contentTypes)] : []),
    ...(sinceDate ? [gte(careerContents.publishedAt, sinceDate)] : [])
  );

  const result = await db
    .select({
      count: sql<number>`cast(count(*) as int)`,
      latestPublishedAt: sql<Date | null>`max(${careerContents.publishedAt})`,
    })
    .from(careerContents)
    .where(whereClause);

  return NextResponse.json({
    success: true,
    data: {
      count: result[0]?.count || 0,
      latestPublishedAt: result[0]?.latestPublishedAt?.toISOString() ?? null,
    },
  });
}
