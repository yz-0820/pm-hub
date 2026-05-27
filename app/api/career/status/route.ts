import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents, contentSources as contentSourcesTable } from '@/lib/db/schema';
import { and, desc, notLike, eq, sql } from 'drizzle-orm';

function normalizeTimestamp(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n < 10_000_000_000 ? n * 1000 : n;
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const category = u.searchParams.get('category') || 'all';
    const yearStart = Math.floor(Date.parse('2026-01-01T00:00:00.000Z') / 1000);
    const yearEnd = Math.floor(Date.parse('2027-01-01T00:00:00.000Z') / 1000);

    const conditions = and(
      eq(careerContents.status, 'active'),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%'),
      sql`(${careerContents.publishedAt} >= ${yearStart} AND ${careerContents.publishedAt} < ${yearEnd})`,
      ...(category !== 'all' ? [eq(careerContents.category, category)] : [])
    );

    const latestContent = await db.query.careerContents.findFirst({
      where: conditions,
      orderBy: [desc(careerContents.publishedAt)],
      columns: {
        publishedAt: true,
        id: true,
      },
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(careerContents)
      .where(conditions);

    const totalContents = countResult[0]?.count || 0;

    const latestFetchResult = await db
      .select({ latest: sql<number | null>`max(${contentSourcesTable.lastFetchAt})` })
      .from(contentSourcesTable);

    const latestFetchedAtMs = normalizeTimestamp(latestFetchResult[0]?.latest ?? null);

    const version = latestContent
      ? `${latestContent.id}-${totalContents}-${latestContent.publishedAt.getTime()}-${latestFetchedAtMs ?? 0}`
      : `0-${totalContents}-0-${latestFetchedAtMs ?? 0}`;

    return NextResponse.json({
      success: true,
      data: {
        version,
        latestPublishedAt: latestContent?.publishedAt?.toISOString() || null,
        latestFetchedAt: latestFetchedAtMs ? new Date(latestFetchedAtMs).toISOString() : null,
        totalContents,
        category,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching career status:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取职业发展状态失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
