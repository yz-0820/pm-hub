import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRSS } from '@/lib/rss/fetcher';
import { db } from '@/lib/db/client';
import { fetchLogs } from '@/lib/db/schema';
import { createRSSFetchLogPayload } from '@/lib/rss/fetch-summary';
import { revalidatePath } from 'next/cache';
import { verifyApiAuth } from '@/lib/utils/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth.success) {
      return auth.response;
    }

    console.log('Starting manual RSS fetch...');
    const startedAt = new Date();
    
    const results = await fetchAllRSS();
    
    const totalSources = results.length;
    const successfulSources = results.filter(r => r.errors.length === 0).length;
    const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);
    const totalRejectedArticles = results.reduce((sum, r) => sum + r.rejectedArticles, 0);
    const logPayload = createRSSFetchLogPayload(results);
    
    // 记录日志
    await db.insert(fetchLogs).values({
      startedAt,
      completedAt: new Date(),
      totalSources,
      successfulSources,
      totalNewArticles,
      errors: JSON.stringify(logPayload),
    });

    if (totalNewArticles > 0) {
      revalidatePath('/articles', 'layout');
    }

    return NextResponse.json({
      success: true,
      totalSources,
      successfulSources,
      totalNewArticles,
      totalRejectedArticles,
      results: results.map(r => ({
        source: r.sourceName,
        fetched: r.fetched,
        newArticles: r.newArticles,
        rejectedArticles: r.rejectedArticles,
        rejectionReasons: r.rejectionReasons,
        errors: r.errors,
      })),
    });
  } catch (error) {
    console.error('RSS fetch API error:', error);
    return NextResponse.json(
      { error: 'Fetch failed', message: String(error) },
      { status: 500 }
    );
  }
}
