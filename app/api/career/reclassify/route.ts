/**
 * 重新分类所有内容的API
 * POST /api/career/reclassify
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { autoClassify } from '@/config/content-sources';
import { invalidateContentCache } from '@/lib/career/cache';

export async function POST() {
  try {
    // 获取所有活跃内容
    const allContents = await db.query.careerContents.findMany({
      where: eq(careerContents.status, 'active'),
    });

    let updatedCount = 0;
    const changes: Array<{ id: number; title: string; oldCategory: string; newCategory: string }> = [];

    for (const content of allContents) {
      // 只重新分类那些来自 'all' 源的内容（即自动分类的内容）
      const newCategory = autoClassify(content.title, content.description ?? undefined);

      if (newCategory !== content.category) {
        changes.push({
          id: content.id,
          title: content.title.substring(0, 50),
          oldCategory: content.category,
          newCategory,
        });

        await db.update(careerContents)
          .set({ category: newCategory, updatedAt: new Date() })
          .where(eq(careerContents.id, content.id));

        updatedCount++;
      }
    }

    // 清除所有缓存
    await invalidateContentCache();

    return NextResponse.json({
      success: true,
      totalChecked: allContents.length,
      updatedCount,
      changes,
    });
  } catch (error) {
    console.error('Reclassify error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
