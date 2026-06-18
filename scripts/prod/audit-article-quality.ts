/**
 * 历史文章质量审计脚本
 * 扫描现有文章，按内容质量规则识别低质量文章
 *
 * 运行:
 *   npx tsx scripts/prod/audit-article-quality.ts           # dry-run（默认）
 *   npx tsx scripts/prod/audit-article-quality.ts --apply   # 执行修复和删除
 */

import 'dotenv/config';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { rssSources } from '@/config/rss';
import type { RSSSource } from '@/config/rss';
import {
  evaluateContentQuality,
  enrichContentFromUrl,
} from '@/lib/rss/content-quality';
import { eq, inArray } from 'drizzle-orm';

const IS_APPLY = process.argv.includes('--apply');

// 基线阈值（用于异常检测）
const BASELINE_DELETE_COUNT = 128;
const BASELINE_DELETE_THRESHOLD = BASELINE_DELETE_COUNT * 1.2; // 20% 上限
const MAX_ARTICLE_REPAIR_FAILS = 5;

interface AuditItem {
  id: number;
  title: string;
  sourceId: string;
  sourceName: string;
  category: string;
  originalUrl: string;
  content: string;
  summary: string;
  meaningfulChars: number;
  reason: string;
  action: 'repair' | 'delete';
  repairedContent?: string;
  repairedSummary?: string;
}

async function auditArticles() {
  console.log(`=== 文章质量审计 (${IS_APPLY ? 'APPLY 模式' : 'DRY-RUN 模式'}) ===\n`);

  // 获取所有文章
  const allArticles = await db.query.articles.findMany({
    orderBy: (articles, { desc }) => [desc(articles.id)],
  });

  console.log(`数据库中共有 ${allArticles.length} 篇文章\n`);

  // 构建 sourceId -> RSSSource 映射
  const sourceMap = new Map<string, RSSSource>();
  for (const source of rssSources) {
    sourceMap.set(source.id, source);
  }

  const toRepair: AuditItem[] = [];
  const toDelete: AuditItem[] = [];
  const sourceStats = new Map<string, { delete: number; repair: number }>();

  for (const article of allArticles) {
    const source = sourceMap.get(article.sourceId);
    const profile = source?.contentProfile || 'article';
    const rawContent = `${article.summary || ''} ${article.content || ''}`.trim();

    const quality = evaluateContentQuality(article.title, rawContent, profile);

    if (quality.passed) {
      continue;
    }

    const item: AuditItem = {
      id: article.id,
      title: article.title,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      category: article.category,
      originalUrl: article.originalUrl,
      content: article.content,
      summary: article.summary,
      meaningfulChars: quality.meaningfulChars,
      reason: quality.reason || 'unknown',
      action: 'delete',
    };

    // 长文源短摘要：尝试补全
    if (profile === 'article' && source?.enrichmentHosts && source.enrichmentHosts.length > 0) {
      item.action = 'repair';

      if (IS_APPLY) {
        const enriched = await enrichContentFromUrl(article.originalUrl, source.enrichmentHosts);
        if (enriched) {
          const reCheck = evaluateContentQuality(article.title, enriched.content, profile);
          if (reCheck.passed) {
            item.repairedContent = enriched.content;
            item.repairedSummary = enriched.summary;
            item.action = 'repair';
          } else {
            item.action = 'delete';
            item.reason = `content_enrichment_failed: ${reCheck.reason}`;
          }
        } else {
          item.action = 'delete';
          item.reason = `content_enrichment_failed: ${item.reason}`;
        }
      }
    }

    // 统计
    const stats = sourceStats.get(article.sourceId) || { delete: 0, repair: 0 };
    if (item.action === 'delete') {
      stats.delete++;
      toDelete.push(item);
    } else {
      stats.repair++;
      toRepair.push(item);
    }
    sourceStats.set(article.sourceId, stats);
  }

  // 输出审计报告
  console.log('========== 审计结果 ==========');
  console.log(`需修复: ${toRepair.length} 条`);
  console.log(`需删除: ${toDelete.length} 条`);
  console.log('\n按来源汇总:');
  for (const [sourceId, stats] of sourceStats.entries()) {
    const sourceName = sourceMap.get(sourceId)?.name || sourceId;
    console.log(`  ${sourceName}: 修复 ${stats.repair}, 删除 ${stats.delete}`);
  }

  // 异常检测
  if (toDelete.length > BASELINE_DELETE_THRESHOLD) {
    console.error(`\n[异常] 待删除量 ${toDelete.length} 超过基线 ${BASELINE_DELETE_COUNT} 的 120% (${Math.round(BASELINE_DELETE_THRESHOLD)})，停止 apply`);
    console.error('请检查规则是否过于严格，或基线是否需要更新。');
    process.exit(1);
  }

  const articleRepairFails = toRepair.filter((i) => i.action === 'delete').length;
  if (IS_APPLY && articleRepairFails > MAX_ARTICLE_REPAIR_FAILS) {
    console.error(`\n[异常] 长文源补全后仍有 ${articleRepairFails} 条待删除，超过阈值 ${MAX_ARTICLE_REPAIR_FAILS}，停止 apply`);
    process.exit(1);
  }

  // 输出详情
  if (toDelete.length > 0) {
    console.log('\n--- 待删除文章 ---');
    for (const item of toDelete.slice(0, 20)) {
      console.log(`  [#${item.id}] ${item.sourceName} | ${item.title.substring(0, 60)}`);
      console.log(`       原因: ${item.reason} | 有效字符: ${item.meaningfulChars}`);
    }
    if (toDelete.length > 20) {
      console.log(`  ... 还有 ${toDelete.length - 20} 条`);
    }
  }

  if (toRepair.length > 0) {
    console.log('\n--- 待修复文章 ---');
    for (const item of toRepair.slice(0, 20)) {
      console.log(`  [#${item.id}] ${item.sourceName} | ${item.title.substring(0, 60)}`);
      console.log(`       原因: ${item.reason} | 有效字符: ${item.meaningfulChars}`);
    }
    if (toRepair.length > 20) {
      console.log(`  ... 还有 ${toRepair.length - 20} 条`);
    }
  }

  if (!IS_APPLY) {
    console.log('\n[DRY-RUN] 未执行任何修改。使用 --apply 参数执行修复和删除。');
    return;
  }

  // 执行修复
  if (toRepair.length > 0) {
    console.log('\n开始修复文章...');
    let repairedCount = 0;
    for (const item of toRepair) {
      if (item.repairedContent && item.repairedSummary) {
        await db
          .update(articles)
          .set({
            content: item.repairedContent,
            summary: item.repairedSummary,
            updatedAt: new Date(),
          })
          .where(eq(articles.id, item.id));
        repairedCount++;
        console.log(`  [修复] #${item.id} — ${item.title.substring(0, 60)}`);
      }
    }
    console.log(`修复完成: ${repairedCount} 篇`);
  }

  // 执行删除
  if (toDelete.length > 0) {
    console.log('\n开始删除低质量文章...');
    const deleteIds = toDelete.map((i) => i.id);
    // 分批删除避免过大 IN 查询
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
      const batch = deleteIds.slice(i, i + BATCH_SIZE);
      await db.delete(articles).where(inArray(articles.id, batch));
      deletedCount += batch.length;
    }
    console.log(`删除完成: ${deletedCount} 篇`);
  }

  console.log('\n=== 审计完成 ===');
  console.log(`修复: ${toRepair.filter((i) => i.repairedContent).length} 篇`);
  console.log(`删除: ${toDelete.length} 篇`);
  console.log('\n请运行 npm run search:rebuild 重建搜索索引');
}

auditArticles().catch((err) => {
  console.error('审计失败:', err);
  process.exit(1);
});
