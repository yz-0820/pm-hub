import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchAllRSS } from '@/lib/rss/fetcher';
import { fetchAllCareerContents } from '@/lib/career/fetcher';
import { invalidateContentCache } from '@/lib/career/cache';

export const runtime = 'nodejs';

type JobSummary = {
  success: boolean;
  sources: number;
  fetched: number;
  newItems: number;
  updatedItems?: number;
  errors: string[];
};

function verifyCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Missing CRON_SECRET' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const startedAt = new Date();

  const rss: JobSummary = {
    success: false,
    sources: 0,
    fetched: 0,
    newItems: 0,
    errors: [],
  };

  const career: JobSummary = {
    success: false,
    sources: 0,
    fetched: 0,
    newItems: 0,
    updatedItems: 0,
    errors: [],
  };

  try {
    const results = await fetchAllRSS();
    rss.success = true;
    rss.sources = results.length;
    rss.fetched = results.reduce((sum, r) => sum + r.fetched, 0);
    rss.newItems = results.reduce((sum, r) => sum + r.newArticles, 0);
    rss.errors = results.flatMap((r) => r.errors.map((error) => `${r.sourceName}: ${error}`));
  } catch (error) {
    rss.errors.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const results = await fetchAllCareerContents();
    career.success = true;
    career.sources = results.length;
    career.fetched = results.reduce((sum, r) => sum + r.fetched, 0);
    career.newItems = results.reduce((sum, r) => sum + r.newContents, 0);
    career.updatedItems = results.reduce((sum, r) => sum + r.updatedContents, 0);
    career.errors = results.flatMap((r) => r.errors.map((error) => `${r.sourceName}: ${error}`));

    if (career.newItems > 0 || (career.updatedItems ?? 0) > 0) {
      await invalidateContentCache();
    }
  } catch (error) {
    career.errors.push(error instanceof Error ? error.message : String(error));
  }

  revalidatePath('/', 'layout');
  revalidatePath('/articles', 'layout');
  revalidatePath('/career', 'layout');

  const success = rss.success && career.success;

  return NextResponse.json(
    {
      success,
      data: {
        rss,
        career,
      },
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      timestamp: Date.now(),
    },
    { status: success ? 200 : 207 }
  );
}
