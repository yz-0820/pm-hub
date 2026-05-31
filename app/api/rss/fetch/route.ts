import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRSS } from '@/lib/rss/fetcher';
import { db } from '@/lib/db/client';
import { fetchLogs } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    // 验证API密钥
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.API_KEY || 'your-secret-api-key';
    
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting manual RSS fetch...');
    const startedAt = new Date();
    
    const results = await fetchAllRSS();
    
    const totalSources = results.length;
    const successfulSources = results.filter(r => r.errors.length === 0).length;
    const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);
    
    // 记录日志
    await db.insert(fetchLogs).values({
      startedAt,
      completedAt: new Date(),
      totalSources,
      successfulSources,
      totalNewArticles,
      errors: JSON.stringify(results.filter(r => r.errors.length > 0)),
    });

    return NextResponse.json({
      success: true,
      totalSources,
      successfulSources,
      totalNewArticles,
      results: results.map(r => ({
        source: r.sourceName,
        fetched: r.fetched,
        newArticles: r.newArticles,
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
