/**
 * 管理员 API：清理 IT之家 产品介绍/发售文章
 * 
 * 调用方式：
 * POST /api/admin/cleanup-ithome
 * Header: Authorization: Bearer <API_KEY>
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

export async function POST(request: NextRequest) {
  // 验证 API Key
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('开始清理 IT之家 产品介绍/发售文章...');

    // 查询所有 IT之家 来源的文章
    const ithomeArticles = await db
      .select()
      .from(articles)
      .where(like(articles.sourceId, 'ithome%'));

    let deletedCount = 0;
    let keptCount = 0;
    const deletedArticles: Array<{ title: string; category: string; reason: string }> = [];

    for (const article of ithomeArticles) {
      const check = detectITHomeProductLaunch(
        article.title,
        article.content || article.summary || ''
      );

      if (check.isProductLaunch) {
        // 删除产品介绍/发售文章
        await db.delete(articles).where(eq(articles.id, article.id));
        deletedCount++;
        deletedArticles.push({
          title: article.title,
          category: article.category,
          reason: check.reason,
        });
      } else {
        keptCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: ithomeArticles.length,
      deleted: deletedCount,
      kept: keptCount,
      deletedArticles: deletedArticles.slice(0, 50), // 最多返回50条
    });

  } catch (error) {
    console.error('清理过程中出错:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    );
  }
}
