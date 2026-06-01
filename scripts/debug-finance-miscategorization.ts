/**
 * 排查金融文章被错误分类问题
 */

import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';
import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';
import type { ParsedArticle } from '@/types';

const testCases = [
  {
    title: '申万宏源：短期结构分化走向极致，市场再突破仍需蓄力',
    body: '36氪获悉，申万宏源发布研究报告称，短期总体市场难有效突破，结构分化行情正走向极致，动量延续的AI算力通胀方向减少，已向PCB细分领域、电容等方向聚焦。中期，继续看好新能源、新能车和出口链的景气验证机会，同时，继续围绕着AI产业链和战略资源做配置。',
  },
  {
    title: '中信建投：海外商业航天出现短期扰动，持续看好卫星互联网及可复用火箭方向',
    body: '36氪获悉，中信建投研报指出，海外偶发的发射失利和估值波动，恰恰是硬科技产业从0到1、从1到10规模化过程中的正常特征。蓝色起源此次失利属新格伦火箭回收与复用验证过程中的技术必经波折，SpaceX估值调整更多反映流动性及预期变化，而非产业方向逆转。短期情绪冲...',
  },
];

console.log('金融文章分类排查\n');
console.log('='.repeat(80));

for (const article of testCases) {
  const parsedArticle: ParsedArticle = {
    title: article.title,
    content: article.body,
    summary: article.body,
    link: '',
    pubDate: new Date(),
  };
  const financeR = evaluateFinanceRelevance(parsedArticle);
  const techR = evaluateTechRelevance(parsedArticle);
  const aiR = evaluateAIRelevance(parsedArticle);

  console.log(`\n标题: ${article.title}`);
  console.log('\n评分结果:');
  console.log(`  金融市场: passed=${financeR.passed}, score=${financeR.score}`);
  if (financeR.meta.positiveHits.length > 0) {
    console.log(`    命中关键词: ${financeR.meta.positiveHits.slice(0, 10).join(', ')}`);
  }
  console.log(`  科技动态: passed=${techR.passed}, score=${techR.score}`);
  if (techR.meta.positiveHits && Object.keys(techR.meta.positiveHits).length > 0) {
    console.log(`    命中主题: ${Object.keys(techR.meta.positiveHits).join(', ')}`);
  }
  console.log(`  人工智能: passed=${aiR.passed}, score=${aiR.score}`);
  
  // 模拟36氪的分类逻辑
  console.log('\n  36氪分类逻辑:');
  if (financeR.passed && financeR.score >= 60) {
    console.log('    → 应归类为: 金融市场');
  } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= 95) {
    console.log('    → 应归类为: 人工智能');
  } else if (financeR.passed && financeR.score >= 60) {
    console.log('    → 应归类为: 金融市场');
  } else if (techR.passed && techR.score >= 95) {
    console.log('    → 应归类为: 科技动态');
  } else {
    console.log('    → 应跳过');
  }
}
