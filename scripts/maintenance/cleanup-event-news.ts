/**
 * 清理事件新闻文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';

async function cleanup() {
  console.log('========================================');
  console.log('清理事件新闻文章');
  console.log('========================================\n');

  const allArticles = await db.select().from(articles);
  const techArticles = allArticles.filter(a => a.category === 'tech');
  
  console.log(`科技文章总数: ${techArticles.length}`);

  let deletedCount = 0;
  let keptCount = 0;
  const deletedArticles: string[] = [];

  for (const article of techArticles) {
    const r = evaluateTechRelevance({ 
      title: article.title, 
      content: article.content || '', 
      link: '', 
      pubDate: new Date() 
    });

    if (!r.passed) {
      await db.delete(articles).where(eq(articles.id, article.id));
      deletedCount++;
      deletedArticles.push(article.title);
      
      if (deletedCount <= 20) {
        console.log(`❌ 删除: ${article.title.substring(0, 60)}...`);
        if (r.meta.negativeHits.length > 0) {
          console.log(`   命中: ${r.meta.negativeHits.join(', ')}`);
        }
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
