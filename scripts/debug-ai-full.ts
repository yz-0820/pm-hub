/**
 * 完整调试AI评估
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like } from 'drizzle-orm';
import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';

async function debug() {
  const keyword = '华为WATCH GT Runner 2';
  const found = await db.select().from(articles).where(like(articles.title, `%${keyword}%`));
  
  if (found.length === 0) {
    console.log('未找到文章');
    process.exit(0);
  }
  
  const article = found[0];
  console.log('数据库中的文章:');
  console.log(`  标题: ${article.title}`);
  console.log(`  内容: ${article.content?.substring(0, 200)}...`);
  console.log(`  摘要: ${article.summary?.substring(0, 200)}...`);
  console.log();
  
  // 使用实际内容评估
  const body = article.content || article.summary || '';
  const r = evaluateAIRelevance({ 
    title: article.title, 
    content: body, 
    link: '', 
    pubDate: new Date() 
  });
  
  console.log('AI评估结果:');
  console.log(`  passed: ${r.passed}`);
  console.log(`  score: ${r.score}`);
  console.log(`  命中关键词: ${r.meta.positiveHits.join(', ') || '无'}`);
  console.log(`  负面关键词: ${r.meta.negativeHits.join(', ') || '无'}`);
  console.log(`  金融冲突: ${r.meta.financeConflict}`);
  
  process.exit(0);
}

debug();
