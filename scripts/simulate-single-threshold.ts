/**
 * 金融阈值模拟分析
 * 分析金融阈值从 95 改为 80 后会有多少文章新增
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';

async function simulateFinanceThreshold() {
  console.log('========================================');
  console.log('金融阈值模拟分析 (95 → 80)');
  console.log('========================================\n');

  // 当前阈值配置
  const CURRENT_FINANCE_THRESHOLD = 95;
  const NEW_FINANCE_THRESHOLD = 70;

  const allArticles = await db.select().from(articles);
  
  console.log(`总文章数: ${allArticles.length}\n`);

  let currentPass = 0;  // 当前阈值(95)通过数
  let newPass = 0;       // 新阈值(80)通过数
  let wouldNewPass: Array<{title: string; category: string; score: number}> = [];

  for (const article of allArticles) {
    const body = article.content || article.summary || '';
    const financeR = evaluateFinanceRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    // 当前阈值判断
    if (financeR.passed && financeR.score >= CURRENT_FINANCE_THRESHOLD) {
      currentPass++;
    }

    // 新阈值判断
    if (financeR.passed && financeR.score >= NEW_FINANCE_THRESHOLD) {
      newPass++;
      
      // 如果当前阈值不通过但新阈值通过，记录下来
      if (!(financeR.score >= CURRENT_FINANCE_THRESHOLD)) {
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
  console.log(`金融阈值 >= 95: 通过 ${currentPass} 篇`);
  console.log(`金融阈值 >= 80: 通过 ${newPass} 篇`);
  console.log(`\n如果金融阈值改为 >= 80：`);
  console.log(`新增文章数: ${wouldNewPass.length} 篇\n`);

  if (wouldNewPass.length > 0) {
    console.log('========================================');
    console.log('新增文章示例（前30条）');
    console.log('========================================');
    wouldNewPass
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .forEach((item, i) => {
        console.log(`${i + 1}. [${item.category}] ${item.title.substring(0, 60)}...`);
        console.log(`   Finance分数: ${item.score}`);
      });
  }

  process.exit(0);
}

simulateFinanceThreshold();
