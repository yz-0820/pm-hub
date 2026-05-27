import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles, fetchLogs, rssSourceStatus } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

function normalizeTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const ms = n < 10_000_000_000 ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET() {
  const latestLog = await db.query.fetchLogs.findFirst({
    orderBy: [desc(fetchLogs.startedAt)],
  });

  const latestSourceFetch = await db
    .select({ latest: sql<Date | null>`max(${rssSourceStatus.lastFetchAt})` })
    .from(rssSourceStatus);

  const latestArticle = await db.query.articles.findFirst({
    orderBy: [desc(articles.publishedAt)],
    columns: { id: true, publishedAt: true, sourceName: true, title: true },
  });

  const latestSourceFetchAt = normalizeTimestamp(latestSourceFetch[0]?.latest ?? null);
  const latestLogStartedAt = normalizeTimestamp(latestLog?.startedAt ?? null);
  const latestLogCompletedAt = normalizeTimestamp(latestLog?.completedAt ?? null);
  const latestArticlePublishedAt = normalizeTimestamp(latestArticle?.publishedAt ?? null);

  return NextResponse.json({
    success: true,
    data: {
      latestSourceFetchAt: latestSourceFetchAt ? latestSourceFetchAt.toISOString() : null,
      latestFetchLog: latestLog
        ? {
            startedAt: latestLogStartedAt ? latestLogStartedAt.toISOString() : null,
            completedAt: latestLogCompletedAt ? latestLogCompletedAt.toISOString() : null,
            totalSources: latestLog.totalSources ?? 0,
            successfulSources: latestLog.successfulSources ?? 0,
            totalNewArticles: latestLog.totalNewArticles ?? 0,
          }
        : null,
      latestArticle: latestArticle
        ? {
            id: latestArticle.id,
            publishedAt: latestArticlePublishedAt ? latestArticlePublishedAt.toISOString() : null,
            sourceName: latestArticle.sourceName,
            title: latestArticle.title,
          }
        : null,
      timestamp: Date.now(),
    },
  });
}
