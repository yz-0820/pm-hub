import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents, contentSources as contentSourcesTable } from '@/lib/db/schema';
import { and, desc, notLike, eq, gte, lt, sql } from 'drizzle-orm';

function normalizeTimestamp(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  // PostgreSQL 返回字符串格式的时间戳，如 "2026-05-29 10:27:41+00"
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n < 10_000_000_000 ? n * 1000 : n;
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const category = u.searchParams.get('category') || 'all';
    const yearStart = new Date('2026-01-01T00:00:00.000Z');
    const yearEnd = new Date('2027-01-01T00:00:00.000Z');

    const conditions = and(
      eq(careerContents.status, 'active'),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%'),
      gte(careerContents.publishedAt, yearStart),
      lt(careerContents.publishedAt, yearEnd),
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
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(careerContents)
      .where(conditions);

    const totalContents = countResult[0]?.count || 0;

    const latestFetchResult = await db
      .select({ latest: sql<Date | null>`max(${contentSourcesTable.lastFetchAt})` })
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
