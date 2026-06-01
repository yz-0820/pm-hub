/**
 * 阈值模拟分析脚本
 * 分析不同阈值下的文章准入数量
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';

async function analyzeThresholds() {
  console.log('========================================');
  console.log('阈值模拟分析');
  console.log('========================================\n');

  // 排除 IT之家 (已被过滤，但数据库中可能还有旧数据)
  // 排除 career_contents 表（职业发展）
  const allArticles = await db
    .select()
    .from(articles);

  console.log(`总文章数: ${allArticles.length}\n`);

  // 当前阈值配置
  const currentConfig = {
    financeThreshold: 45,
    financeStrongSignal: 70,
    aiThreshold: 35,
    techThreshold: 40,
  };

  // 新阈值配置（全部 >= 95）
  const newConfig = {
    financeThreshold: 95,
    financeStrongSignal: 95,  // 强信号也改为 95
    aiThreshold: 95,
    techThreshold: 95,
  };

  let currentAdmit = 0;
  let newAdmit = 0;
  let wouldBeRejected: Array<{title: string; category: string; score: number; reason: string}> = [];

  for (const article of allArticles) {
    const articleBody = article.content || article.summary || '';
    const aiR = evaluateAIRelevance({ title: article.title, content: articleBody, link: '', pubDate: new Date() });
    const financeR = evaluateFinanceRelevance({ title: article.title, content: articleBody, link: '', pubDate: new Date() });
    const techR = evaluateTechRelevance({ title: article.title, content: articleBody, link: '', pubDate: new Date() });

    // ========== 当前阈值判断 ==========
    let currentPass = false;
    let currentCategory = '';

    // 36氪/IT之家 的分类逻辑
    if (article.sourceId === '36kr' || article.sourceId === 'ithome') {
      if (financeR.passed && financeR.score >= 70) {
        currentPass = true;
        currentCategory = 'finance';
      } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= 35) {
        currentPass = true;
        currentCategory = 'ai';
      } else if (financeR.passed && financeR.score >= 45) {
        currentPass = true;
        currentCategory = 'finance';
      } else if (techR.passed) {
        currentPass = true;
        currentCategory = 'tech';
      }
    } else {
      // 其他来源：按默认分类
      currentPass = true;
      currentCategory = article.category;
    }

    if (currentPass) currentAdmit++;

    // ========== 新阈值判断 ==========
    let newPass = false;
    let newRejectReason = '';

    if (article.sourceId === '36kr' || article.sourceId === 'ithome') {
      if (financeR.passed && financeR.score >= newConfig.financeThreshold) {
        newPass = true;
      } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= newConfig.aiThreshold) {
        newPass = true;
      } else if (financeR.passed && financeR.score >= newConfig.financeThreshold) {
        newPass = true;
      } else if (techR.passed && techR.score >= newConfig.techThreshold) {
        newPass = true;
      } else {
        // 记录被拒绝的原因
        newRejectReason = `AI:${aiR.score}, Finance:${financeR.score}, Tech:${techR.score}`;
      }
    } else {
      newPass = true;
    }

    if (newPass) {
      newAdmit++;
    } else {
      wouldBeRejected.push({
        title: article.title,
        category: article.category,
        score: Math.max(aiR.score, financeR.score, techR.score),
        reason: newRejectReason,
      });
    }
  }

  console.log('========================================');
  console.log('当前阈值配置（部分 >= 70）');
  console.log('========================================');
  console.log(`- 金融市场: >= 45 (强信号 >= 70)`);
  console.log(`- 人工智能: >= 35`);
  console.log(`- 科技动态: >= 40`);
  console.log(`准入文章数: ${currentAdmit}\n`);

  console.log('========================================');
  console.log('新阈值配置（全部 >= 70）');
  console.log('========================================');
  console.log(`- 金融市场: >= 70`);
  console.log(`- 人工智能: >= 70`);
  console.log(`- 科技动态: >= 70`);
  console.log(`准入文章数: ${newAdmit}`);
  console.log(`将被拒绝: ${wouldBeRejected.length}\n`);

  if (wouldBeRejected.length > 0) {
    console.log('========================================');
    console.log('将被拒绝的文章示例（前20条）');
    console.log('========================================');
    wouldBeRejected
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .forEach((item, i) => {
        console.log(`${i + 1}. [${item.category}] ${item.title.substring(0, 50)}...`);
        console.log(`   分数: ${item.reason}`);
      });
  }

  console.log('\n========================================');
  console.log('差异分析');
  console.log('========================================');
  console.log(`当前准入: ${currentAdmit}`);
  console.log(`新阈值准入: ${newAdmit}`);
  console.log(`减少: ${currentAdmit - newAdmit} 篇`);
  console.log(`减少比例: ${((currentAdmit - newAdmit) / currentAdmit * 100).toFixed(1)}%`);

  process.exit(0);
}

analyzeThresholds();
