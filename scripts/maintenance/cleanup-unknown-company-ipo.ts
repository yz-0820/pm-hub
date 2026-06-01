/**
 * 清理不知名公司IPO文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';

async function cleanup() {
  console.log('========================================');
  console.log('清理不知名公司IPO文章');
  console.log('========================================\n');

  const allArticles = await db.select().from(articles);
  const financeArticles = allArticles.filter(a => a.category === 'finance');
  
  console.log(`金融市场文章总数: ${financeArticles.length}\n`);

  let deletedCount = 0;
  let keptCount = 0;
  const deletedArticles: string[] = [];

  for (const article of financeArticles) {
    const body = article.content || article.summary || '';
    const r = evaluateFinanceRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (!r.passed) {
      await db.delete(articles).where(eq(articles.id, article.id));
      deletedCount++;
      deletedArticles.push(article.title);
      console.log(`❌ 删除: ${article.title.substring(0, 60)}...`);
      if (r.meta.rejectedBy) {
        console.log(`   原因: ${r.meta.rejectedBy}`);
      }
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
