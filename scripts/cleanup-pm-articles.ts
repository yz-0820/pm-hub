/**
 * 清理低分产品经理文章脚本
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluatePMRelevance, PM_THRESHOLD } from '@/lib/rss/pm-relevance';

async function cleanupPMArticles() {
  console.log('========================================');
  console.log('产品经理低分文章清理');
  console.log('========================================');
  console.log(`阈值: >= ${PM_THRESHOLD}\n`);

  const allArticles = await db.select().from(articles);
  const pmArticles = allArticles.filter(a => a.category === 'product-management');

  console.log(`产品经理文章数: ${pmArticles.length}`);

  let deletedCount = 0;
  let keptCount = 0;
  const deletedArticles: Array<{ title: string; score: number }> = [];

  for (const article of pmArticles) {
    const body = article.content || article.summary || '';
    const r = evaluatePMRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (r.passed) {
      keptCount++;
    } else {
      await db.delete(articles).where(eq(articles.id, article.id));
      deletedCount++;
      deletedArticles.push({ title: article.title, score: r.score });
      
      if (deletedCount <= 30) {
        console.log(`❌ 删除: 分数=${r.score} | ${article.title.substring(0, 50)}...`);
      }
    }
  }

  console.log('\n========================================');
  console.log('清理完成！');
  console.log('========================================');
  console.log(`总计: ${pmArticles.length} 篇`);
  console.log(`已删除: ${deletedCount} 篇`);
  console.log(`保留: ${keptCount} 篇`);

  process.exit(0);
}

cleanupPMArticles();
