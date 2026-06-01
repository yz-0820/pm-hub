/**
 * 清理 IT之家 产品介绍/发售文章脚本
 * 
 * 用途：删除数据库中已存在的 IT之家 产品介绍/发售类文章
 * 执行：npx tsx scripts/cleanup-ithome-product-launches.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

async function cleanupITHomeProductLaunches() {
  console.log('开始清理 IT之家 产品介绍/发售文章...\n');

  try {
    // 查询所有 IT之家 来源的文章
    const ithomeArticles = await db
      .select()
      .from(articles)
      .where(like(articles.sourceId, 'ithome%'));

    console.log(`找到 ${ithomeArticles.length} 篇 IT之家 文章`);

    let deletedCount = 0;
    let keptCount = 0;
    const deletedArticles: string[] = [];

    for (const article of ithomeArticles) {
      const check = detectITHomeProductLaunch(
        article.title,
        article.content || article.summary || ''
      );

      if (check.isProductLaunch) {
        // 删除产品介绍/发售文章
        await db.delete(articles).where(eq(articles.id, article.id));
        deletedCount++;
        deletedArticles.push(`[${article.category}] ${article.title}`);
        console.log(`❌ 已删除: [${article.category}] ${article.title.substring(0, 60)}...`);
        console.log(`   原因: ${check.reason}`);
      } else {
        keptCount++;
        console.log(`✅ 保留: [${article.category}] ${article.title.substring(0, 60)}...`);
      }
    }

    console.log('\n========================================');
    console.log('清理完成！');
    console.log('========================================');
    console.log(`总计文章: ${ithomeArticles.length}`);
    console.log(`已删除: ${deletedCount}`);
    console.log(`保留: ${keptCount}`);
    
    if (deletedCount > 0) {
      console.log('\n已删除的文章列表:');
      deletedArticles.forEach((title, index) => {
        console.log(`${index + 1}. ${title}`);
      });
    }

  } catch (error) {
    console.error('清理过程中出错:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 执行清理
cleanupITHomeProductLaunches();
