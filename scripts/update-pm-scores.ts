/**
 * 更新产品经理文章分数脚本
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluatePMRelevance } from '@/lib/rss/pm-relevance';

async function updatePMScores() {
  console.log('========================================');
  console.log('更新产品经理文章分数');
  console.log('========================================\n');

  const all = await db.select().from(articles);
  const pm = all.filter(a => a.category === 'product-management');
  
  console.log(`PM文章总数: ${pm.length}`);

  let updated = 0;
  let deleted = 0;

  for (const article of pm) {
    const body = article.content || article.summary || '';
    const r = evaluatePMRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (r.passed) {
      // 更新分数
      await db.update(articles)
        .set({ relevanceScore: r.score })
        .where(eq(articles.id, article.id));
      updated++;
      
      if (updated <= 10) {
        console.log(`✅ 更新: 分数=${r.score} | ${article.title.substring(0, 40)}...`);
      }
    } else {
      // 删除低分文章
      await db.delete(articles).where(eq(articles.id, article.id));
      deleted++;
    }
  }

  console.log('\n========================================');
  console.log('更新完成！');
  console.log('========================================');
  console.log(`更新分数: ${updated} 篇`);
  console.log(`删除低分: ${deleted} 篇`);

  process.exit(0);
}

updatePMScores();
