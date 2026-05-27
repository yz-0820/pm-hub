/**
 * 职业发展内容流API
 * 用于实时加载更多内容（瀑布流/无限滚动）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContentFeed } from '@/lib/career/cache';

/**
 * GET /api/career/feed
 * 获取内容流，支持分页加载
 * @param lastId - 最后一条内容的ID（用于分页）
 * @param limit - 返回数量（默认10，最大20）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lastId = searchParams.get('lastId')
      ? parseInt(searchParams.get('lastId')!, 10)
      : undefined;

    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      20
    );

    const contents = await getContentFeed(lastId, limit);

    return NextResponse.json({
      success: true,
      data: {
        contents,
        hasMore: contents.length === limit,
        lastId: contents.length > 0 ? contents[contents.length - 1].id : lastId,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching career content feed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取内容流失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
