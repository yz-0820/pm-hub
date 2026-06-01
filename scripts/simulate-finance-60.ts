/**
 * 金融阈值模拟分析
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';

async function simulateFinanceThreshold() {
  console.log('========================================');
  console.log('金融阈值模拟分析 (95 → 60)');
  console.log('========================================\n');

  const CURRENT_THRESHOLD = 95;
  const NEW_THRESHOLD = 60;

  const allArticles = await db.select().from(articles);
  
  console.log(`总文章数: ${allArticles.length}\n`);

  let currentPass = 0;
  let newPass = 0;
  let wouldNewPass: Array<{title: string; category: string; score: number}> = [];

  for (const article of allArticles) {
    const body = article.content || article.summary || '';
    const financeR = evaluateFinanceRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (financeR.passed && financeR.score >= CURRENT_THRESHOLD) {
      currentPass++;
    }

    if (financeR.passed && financeR.score >= NEW_THRESHOLD) {
      newPass++;
      
      if (!(financeR.score >= CURRENT_THRESHOLD)) {
        wouldNewPass.push({
          title: article.title,
          category: article.category,
          score: financeR.score,
        });
      }
    }
  }

  console.log('========================================');
  console.log('分析结果');
  console.log('========================================');
  console.log(`金融阈值 >= ${CURRENT_THRESHOLD}（当前）: 通过 ${currentPass} 篇`);
  console.log(`金融阈值 >= ${NEW_THRESHOLD}: 通过 ${newPass} 篇`);
  console.log(`\n如果金融阈值改为 >= ${NEW_THRESHOLD}：`);
  console.log(`新增文章数: ${wouldNewPass.length} 篇\n`);

  if (wouldNewPass.length > 0) {
    console.log('========================================');
    console.log('新增文章');
    console.log('========================================');
    wouldNewPass
      .sort((a, b) => b.score - a.score)
      .forEach((item, i) => {
        console.log(`${i + 1}. [${item.category}] 分数=${item.score}`);
        console.log(`   ${item.title.substring(0, 70)}`);
      });
  }

  process.exit(0);
}

simulateFinanceThreshold();
