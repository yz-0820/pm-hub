/**
 * 审计并清理 career_contents 中已存在的误分类文章
 * 运行: npx tsx scripts/prod/audit-career-contents.ts
 *
 * 逻辑:
 * 1. 扫描所有 status='active' 的 career 内容
 * 2. 用最新的 hasCareerRelevance 规则重新判定
 * 3. 将不符合新规则的内容标记为 archived
 * 4. 输出审计报告
 */

import 'dotenv/config';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { hasCareerRelevance, evaluateBestCategoryMatch } from '@/lib/career/quality';
import { NormalizedContent } from '@/lib/career/platforms/types';

const YEAR_START = new Date('2026-01-01T00:00:00.000Z');
const YEAR_END = new Date('2027-01-01T00:00:00.000Z');

async function auditCareerContents() {
  console.log('开始审计 career_contents...\n');

  const allContents = await db.query.careerContents.findMany({
    where: and(
      eq(careerContents.status, 'active'),
      gte(careerContents.publishedAt, YEAR_START),
      lt(careerContents.publishedAt, YEAR_END)
    ),
  });

  console.log(`共找到 ${allContents.length} 条 active 内容\n`);

  const toArchive: typeof allContents = [];
  const toReclassify: Array<{ content: typeof allContents[0]; newCategory: string }> = [];

  for (const content of allContents) {
    const normalized: NormalizedContent = {
      sourceId: content.sourceId,
      sourceName: content.sourceName,
      platform: content.platform as NormalizedContent['platform'],
      originalId: content.originalId || String(content.id),
      originalUrl: content.originalUrl,
      title: content.title,
      description: content.description || '',
      content: content.content || '',
      author: content.author || '',
      authorId: '',
      authorAvatar: '',
      contentType: content.contentType as NormalizedContent['contentType'],
      category: content.category,
      tags: content.tags ? JSON.parse(content.tags) : [],
      coverImage: content.coverImage || '',
      videoUrl: content.videoUrl || '',
      videoDuration: content.videoDuration || 0,
      images: content.images ? JSON.parse(content.images) : [],
      viewCount: content.viewCount,
      likeCount: content.likeCount,
      commentCount: content.commentCount,
      shareCount: content.shareCount,
      publishedAt: content.publishedAt,
    };

    // 用最新规则重新判定职场相关性
    const relevance = hasCareerRelevance(normalized);

    if (!relevance.relevant) {
      toArchive.push(content);
      console.log(`[归档] #${content.id} — ${content.title.substring(0, 60)}`);
      console.log(`       原因: ${relevance.reason}`);
      continue;
    }

    // 重新评估最佳分类
    const bestMatch = evaluateBestCategoryMatch(normalized);
    if (bestMatch.category !== content.category && bestMatch.matched) {
      toReclassify.push({ content, newCategory: bestMatch.category });
      console.log(`[重分类] #${content.id} — ${content.title.substring(0, 60)}`);
      console.log(`         ${content.category} → ${bestMatch.category}`);
    }
  }

  console.log(`\n========== 审计结果 ==========`);
  console.log(`需归档: ${toArchive.length} 条`);
  console.log(`需重分类: ${toReclassify.length} 条`);

  if (toArchive.length === 0 && toReclassify.length === 0) {
    console.log('所有内容均符合最新规则，无需操作。');
    return;
  }

  // 执行归档
  for (const content of toArchive) {
    await db.update(careerContents)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(careerContents.id, content.id));
  }

  // 执行重分类
  for (const { content, newCategory } of toReclassify) {
    await db.update(careerContents)
      .set({
        category: newCategory,
        updatedAt: new Date(),
      })
      .where(eq(careerContents.id, content.id));
  }

  console.log(`\n已归档 ${toArchive.length} 条，已重分类 ${toReclassify.length} 条`);
  console.log('缓存将在下次请求时自动刷新');
}

auditCareerContents().catch((err) => {
  console.error('审计失败:', err);
  process.exit(1);
});
