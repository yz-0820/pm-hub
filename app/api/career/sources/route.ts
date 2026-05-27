import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { contentSources as contentSourcesTable } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const platform = u.searchParams.get('platform');
  const enabledOnly = u.searchParams.get('enabledOnly') !== 'false';

  const whereClause = and(
    ...(enabledOnly ? [eq(contentSourcesTable.enabled, true)] : []),
    ...(platform ? [eq(contentSourcesTable.platform, platform)] : [])
  );

  const rows = await db
    .select({
      sourceId: contentSourcesTable.sourceId,
      sourceName: contentSourcesTable.sourceName,
      platform: contentSourcesTable.platform,
      enabled: contentSourcesTable.enabled,
      fetchInterval: contentSourcesTable.fetchInterval,
      lastFetchAt: contentSourcesTable.lastFetchAt,
      lastFetchCount: contentSourcesTable.lastFetchCount,
      lastError: contentSourcesTable.lastError,
      lastErrorAt: contentSourcesTable.lastErrorAt,
      isHealthy: contentSourcesTable.isHealthy,
    })
    .from(contentSourcesTable)
    .where(whereClause);

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      ...r,
      lastFetchAt: r.lastFetchAt ? r.lastFetchAt.toISOString() : null,
      lastErrorAt: r.lastErrorAt ? r.lastErrorAt.toISOString() : null,
    })),
  });
}

