/**
 * 清理残留的问题文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { detectProductLaunch } from '@/lib/rss/product-launch';

async function cleanup() {
  console.log('========================================');
  console.log('清理残留问题文章');
  console.log('========================================\n');

  const allArticles = await db.select().from(articles);
  console.log(`总文章数: ${allArticles.length}\n`);

  let deletedCount = 0;

  for (const article of allArticles) {
    const body = article.content || article.summary || '';
    let shouldDelete = false;
    let reason = '';

    // 1. 产品发售检测
    const productCheck = detectProductLaunch(article.title, body);
    if (productCheck.isProductLaunch) {
      shouldDelete = true;
      reason = `产品发售: ${productCheck.reason}`;
    }

    // 2. 事件新闻检测（爆炸、火灾、伤亡等）
    const eventKeywords = ['发生爆炸', '发生火灾', '工厂爆炸', '伤亡', '死亡', '遇难', '致死', '死伤'];
    if (eventKeywords.some(k => article.title.includes(k) || body.includes(k))) {
      shouldDelete = true;
      reason = '事件新闻';
    }

    if (shouldDelete) {
      await db.delete(articles).where(eq(articles.id, article.id));
      deletedCount++;
      console.log(`❌ 删除: ${article.title.substring(0, 50)}...`);
      console.log(`   原因: ${reason}`);
    }
  }

  console.log('\n========================================');
  console.log('清理完成！');
  console.log('========================================');
  console.log(`已删除: ${deletedCount} 篇`);

  process.exit(0);
}

cleanup();
