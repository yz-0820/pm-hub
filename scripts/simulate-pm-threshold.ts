/**
 * PM 阈值模拟分析
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { evaluatePMRelevance } from '@/lib/rss/pm-relevance';

async function simulatePMThreshold() {
  console.log('========================================');
  console.log('PM 阈值模拟分析 (>= 95)');
  console.log('========================================\n');

  const allArticles = await db.select().from(articles);
  
  const pmArticles = allArticles.filter(a => a.category === 'product-management');
  console.log(`总文章数: ${allArticles.length}`);
  console.log(`产品经理文章数: ${pmArticles.length}\n`);

  let passed = 0;
  let rejected = 0;
  const rejectedArticles: Array<{title: string; score: number; reason: string}> = [];

  for (const article of pmArticles) {
    const body = article.content || article.summary || '';
    const r = evaluatePMRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (r.passed) {
      passed++;
    } else {
      rejected++;
      rejectedArticles.push({
        title: article.title,
        score: r.score,
        reason: r.meta.rejectedBy || `score ${r.score} < 95`,
      });
    }
  }

  console.log('========================================');
  console.log('分析结果');
  console.log('========================================');
  console.log(`通过 (>= 95): ${passed} 篇`);
  console.log(`被拒绝 (< 95): ${rejected} 篇`);
  console.log(`通过率: ${((passed / pmArticles.length) * 100).toFixed(1)}%\n`);

  if (rejectedArticles.length > 0) {
    console.log('========================================');
    console.log('被拒绝的文章');
    console.log('========================================');
    rejectedArticles
      .sort((a, b) => b.score - a.score)
      .forEach((item, i) => {
        console.log(`${i + 1}. 分数=${item.score} | ${item.title.substring(0, 60)}`);
      });
  }

  process.exit(0);
}

simulatePMThreshold();
