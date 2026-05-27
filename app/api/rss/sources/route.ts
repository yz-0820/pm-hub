import { NextResponse } from 'next/server';
import { rssSources } from '@/config/rss';
import { db } from '@/lib/db/client';
import { rssSourceStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const enabledOnly = u.searchParams.get('enabledOnly') !== 'false';

  const sources = rssSources.filter((s) => (enabledOnly ? s.enabled : true));
  const statusRows = await Promise.all(
    sources.map(async (s) => {
      const row = await db.query.rssSourceStatus.findFirst({
        where: eq(rssSourceStatus.sourceId, s.id),
      });
      return {
        sourceId: s.id,
        sourceName: s.name,
        category: s.category,
        enabled: s.enabled,
        url: s.url,
        lastFetchAt: row?.lastFetchAt ? row.lastFetchAt.toISOString() : null,
        lastFetchCount: row?.lastFetchCount ?? 0,
        lastError: row?.lastError ?? null,
        lastErrorAt: row?.lastErrorAt ? row.lastErrorAt.toISOString() : null,
        isHealthy: row?.isHealthy ?? null,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: statusRows,
  });
}

