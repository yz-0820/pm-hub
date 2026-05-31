/**
 * 促销导购文章自检脚本
 * 定期扫描数据库，检测并清理漏网的促销导购文章
 * 
 * 运行方式：npx tsx scripts/audit-promo-articles.ts
 */

import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { detectPromoDeal } from '../lib/rss/promo-deal';

async function auditPromoArticles() {
  console.log('=== 促销导购文章自检 ===\n');
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

  // 获取所有文章
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      category: articles.category,
      sourceName: articles.sourceName,
      createdAt: articles.createdAt,
    })
    .from(articles);

  console.log(`总文章数: ${allArticles.length}\n`);

  const toDelete: Array<{ id: number; title: string; category: string; reason: string }> = [];

  for (const article of allArticles) {
    const title = article.title || '';
    const body = article.summary || '';
    
    const check = detectPromoDeal(title, body);
    if (check.isPromo) {
      toDelete.push({
        id: article.id,
        title,
        category: article.category,
        reason: check.reason,
      });
    }
  }

  console.log(`发现 ${toDelete.length} 篇促销导购文章:\n`);

  // 按分类统计
  const byCategory: Record<string, number> = {};
  for (const a of toDelete) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    console.log(`  [${a.category}] ${a.title.substring(0, 60)}... (${a.reason})`);
  }

  console.log(`\n分类统计:`);
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count} 篇`);
  }

  if (toDelete.length > 0) {
    console.log(`\n正在删除...`);
    for (const a of toDelete) {
      await db.delete(articles).where(eq(articles.id, a.id));
    }
    console.log(`✅ 已删除 ${toDelete.length} 篇促销导购文章`);
  } else {
    console.log('\n✅ 未发现漏网的促销导购文章');
  }

  console.log(`\n完成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
}

auditPromoArticles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
