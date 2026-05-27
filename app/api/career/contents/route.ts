/**
 * 职业发展内容API
 * GET: 获取内容列表
 * POST: 手动触发内容抓取（需要授权）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContentList, invalidateContentCache } from '@/lib/career/cache';
import { fetchAllCareerContents, fetchCareerContentsBySource } from '@/lib/career/fetcher';
import { revalidatePath } from 'next/cache';

// GET /api/career/contents - 获取内容列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const params = {
      category: searchParams.get('category') || undefined,
      platform: searchParams.get('platform') || undefined,
      contentType: searchParams.get('contentType') || undefined,
      status: searchParams.get('status') || 'active',
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '10', 10), 50), // 最大50条
      orderBy: (searchParams.get('orderBy') as 'newest' | 'popular' | 'featured') || 'newest',
    };

    const result = await getContentList(params);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching career contents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取内容失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// POST /api/career/contents - 手动触发内容抓取
export async function POST(request: NextRequest) {
  try {
    // 验证API密钥
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.API_KEY || 'your-secret-api-key';

    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { sourceId } = body;

    console.log('Starting manual career content fetch...');

    let results;
    if (sourceId) {
      // 抓取指定源
      const result = await fetchCareerContentsBySource(sourceId);
      results = result ? [result] : [];
    } else {
      // 抓取所有源
      results = await fetchAllCareerContents();
    }

    // 计算统计
    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newContents, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedContents, 0);
    const hasErrors = results.some(r => r.errors.length > 0);

    // 如果有新内容，使缓存失效
    if (totalNew > 0 || totalUpdated > 0) {
      await invalidateContentCache();
      revalidatePath('/career', 'layout');
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFetched,
        totalNew,
        totalUpdated,
        hasErrors,
        results: results.map(r => ({
          source: r.sourceName,
          fetched: r.fetched,
          newContents: r.newContents,
          updatedContents: r.updatedContents,
          errors: r.errors,
        })),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching career contents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '抓取失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
