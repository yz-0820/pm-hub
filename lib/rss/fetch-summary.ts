import type { FetchResult } from '@/types';

export type RSSFetchLogPayload = {
  version: 1;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    fetched: number;
    newArticles: number;
    rejectedArticles: number;
    rejectionReasons: Record<string, number>;
    errors: string[];
  }>;
  totals: {
    fetched: number;
    newArticles: number;
    rejectedArticles: number;
    errorCount: number;
    rejectionReasons: Record<string, number>;
  };
};

function mergeReasonCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [reason, count] of Object.entries(source)) {
    target[reason] = (target[reason] || 0) + count;
  }
}

export function createRSSFetchLogPayload(results: FetchResult[]): RSSFetchLogPayload {
  const rejectionReasons: Record<string, number> = {};

  for (const result of results) {
    mergeReasonCounts(rejectionReasons, result.rejectionReasons || {});
  }

  return {
    version: 1,
    sources: results.map((result) => ({
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      fetched: result.fetched,
      newArticles: result.newArticles,
      rejectedArticles: result.rejectedArticles || 0,
      rejectionReasons: result.rejectionReasons || {},
      errors: result.errors,
    })),
    totals: {
      fetched: results.reduce((sum, result) => sum + result.fetched, 0),
      newArticles: results.reduce((sum, result) => sum + result.newArticles, 0),
      rejectedArticles: results.reduce((sum, result) => sum + (result.rejectedArticles || 0), 0),
      errorCount: results.reduce((sum, result) => sum + result.errors.length, 0),
      rejectionReasons,
    },
  };
}

export function parseRSSFetchLogPayload(value: string | null | undefined): RSSFetchLogPayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<RSSFetchLogPayload>;
    if (parsed && parsed.version === 1 && parsed.totals && Array.isArray(parsed.sources)) {
      return parsed as RSSFetchLogPayload;
    }
  } catch {
    return null;
  }

  return null;
}
