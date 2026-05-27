import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

/**
 * 获取最新文章状态API
 * 用于客户端比对是否需要刷新内容
 */
export async function GET() {
  try {
    // 获取最新文章的时间和数量
    const latestArticle = await db.query.articles.findFirst({
      orderBy: [desc(articles.publishedAt)],
      columns: {
        publishedAt: true,
        id: true,
      },
    });

    // 获取文章总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles);

    const totalArticles = countResult[0]?.count || 0;

    // 生成版本号：基于最新文章ID和总数
    const version = latestArticle
      ? `${latestArticle.id}-${totalArticles}-${latestArticle.publishedAt.getTime()}`
      : `0-${totalArticles}-0`;

    return NextResponse.json({
      success: true,
      data: {
        version,
        latestPublishedAt: latestArticle?.publishedAt?.toISOString() || null,
        totalArticles,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching article status:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取文章状态失败',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
