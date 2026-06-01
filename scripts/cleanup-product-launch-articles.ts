/**
 * 清理产品发售文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

async function cleanup() {
  console.log('========================================');
  console.log('清理产品发售文章');
  console.log('========================================\n');

  // 查询所有 IT之家 文章
  const allArticles = await db.select().from(articles);
  const ithomeArticles = allArticles.filter(a => a.sourceId === 'ithome');
  
  console.log(`IT之家文章总数: ${ithomeArticles.length}\n`);

  let deletedCount = 0;
  let keptCount = 0;

  for (const article of ithomeArticles) {
    const body = article.content || article.summary || '';
    const check = detectITHomeProductLaunch(article.title, body);

    if (check.isProductLaunch) {
      await db.delete(articles).where(eq(articles.id, article.id));
      deletedCount++;
      console.log(`❌ 删除: ${article.title.substring(0, 60)}...`);
      console.log(`   原因: ${check.reason}`);
    } else {
      keptCount++;
    }
  }

  console.log('\n========================================');
  console.log('清理完成！');
  console.log('========================================');
  console.log(`已删除: ${deletedCount} 篇`);
  console.log(`保留: ${keptCount} 篇`);

  process.exit(0);
}

cleanup();
