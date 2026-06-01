/**
 * 清理低分文章脚本
 * 
 * 用途：删除数据库中不满足新阈值（>=95）的已入库文章
 * 执行：npx tsx scripts/cleanup-low-score-articles.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateAIRelevance, AI_THRESHOLD } from '@/lib/rss/ai-relevance';
import { evaluateFinanceRelevance, FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { evaluateTechRelevance, TECH_THRESHOLD } from '@/lib/rss/tech-relevance';

async function cleanupLowScoreArticles() {
  console.log('========================================');
  console.log('低分文章清理');
  console.log('========================================');
  console.log(`\n阈值配置（>= 95）：`);
  console.log(`- AI_THRESHOLD: ${AI_THRESHOLD}`);
  console.log(`- FINANCE_THRESHOLD: ${FINANCE_THRESHOLD}`);
  console.log(`- TECH_THRESHOLD: ${TECH_THRESHOLD}`);
  console.log('');

  try {
    // 查询所有专业资讯文章（非 career 分类）
    const allArticles = await db
      .select()
      .from(articles);

    console.log(`总文章数: ${allArticles.length}`);

    let deletedCount = 0;
    let keptCount = 0;
    const deletedArticles: Array<{ id: number; title: string; category: string; aiScore: number; financeScore: number; techScore: number }> = [];

    for (const article of allArticles) {
      const body = article.content || article.summary || '';
      
      // 评估各分类分数
      const aiR = evaluateAIRelevance({ title: article.title, content: body, link: '', pubDate: new Date() });
      const financeR = evaluateFinanceRelevance({ title: article.title, content: body, link: '', pubDate: new Date() });
      const techR = evaluateTechRelevance({ title: article.title, content: body, link: '', pubDate: new Date() });

      // 判断是否应该保留
      let shouldKeep = false;
      
      if (article.sourceId === '36kr' || article.sourceId === 'ithome') {
        // 36氪/IT之家：根据评估结果判断
        if (financeR.passed && financeR.score >= FINANCE_THRESHOLD) {
          shouldKeep = true;
        } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= AI_THRESHOLD) {
          shouldKeep = true;
        } else if (techR.passed && techR.score >= TECH_THRESHOLD) {
          shouldKeep = true;
        }
      } else {
        // 其他来源：直接保留（与 fetcher.ts 行为一致）
        shouldKeep = true;
      }

      if (shouldKeep) {
        keptCount++;
      } else {
        // 删除低分文章
        await db.delete(articles).where(eq(articles.id, article.id));
        deletedCount++;
        deletedArticles.push({
          id: article.id,
          title: article.title,
          category: article.category,
          aiScore: aiR.score,
          financeScore: financeR.score,
          techScore: techR.score,
        });
        
        if (deletedCount <= 30) {
          console.log(`❌ 删除: [${article.category}] ${article.title.substring(0, 50)}...`);
          console.log(`   分数: AI=${aiR.score}, Finance=${financeR.score}, Tech=${techR.score}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('清理完成！');
    console.log('========================================');
    console.log(`总计文章: ${allArticles.length}`);
    console.log(`已删除: ${deletedCount}`);
    console.log(`保留: ${keptCount}`);

    if (deletedArticles.length > 0) {
      console.log(`\n已删除的文章分类分布:`);
      const categoryCount: Record<string, number> = {};
      deletedArticles.forEach(a => {
        categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
      });
      Object.entries(categoryCount).forEach(([cat, count]) => {
        console.log(`  - ${cat}: ${count} 篇`);
      });
    }

  } catch (error) {
    console.error('清理过程中出错:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 执行清理
cleanupLowScoreArticles();
