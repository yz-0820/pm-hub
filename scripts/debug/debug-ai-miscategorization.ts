/**
 * 排查AI分类问题
 */

import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';
import { detectPromoDeal } from '@/lib/rss/promo-deal';

const article = {
  title: '以科技与基普乔格共同赋能跑者，华为WATCH GT Runner 2赛道传奇款发布',
  content: '虽然全球智能穿戴行业集中激烈，但华为穿戴始终占据引领者地位。全球累计出货量突破2亿台，且常年稳居国内腕戴设备市场出货量第一，是全球为数不多在专业穿戴赛道实现规模化、高端化、专业化同步发展的品牌。伴随着华为NOVA 16系列及全场景新品发布会的如期举行，华...',
};

console.log('文章分类排查\n');
console.log('='.repeat(80));
console.log(`标题: ${article.title}\n`);

// 促销检测
const promo = detectPromoDeal(article.title, article.content);
console.log('促销检测:');
console.log(`  isPromo: ${promo.isPromo}`);
if (promo.reason) console.log(`  原因: ${promo.reason}`);

// AI评估
const ai = evaluateAIRelevance({ ...article, link: '', pubDate: new Date() });
console.log('\nAI评估:');
console.log(`  passed: ${ai.passed}`);
console.log(`  score: ${ai.score}`);
console.log(`  命中关键词: ${ai.meta.positiveHits.slice(0, 10).join(', ') || '无'}`);
console.log(`  金融冲突: ${ai.meta.financeConflict}`);

// 科技评估
const tech = evaluateTechRelevance({ ...article, link: '', pubDate: new Date() });
console.log('\n科技评估:');
console.log(`  passed: ${tech.passed}`);
console.log(`  score: ${tech.score}`);
if (tech.meta.positiveHits && Object.keys(tech.meta.positiveHits).length > 0) {
  console.log(`  命中主题: ${Object.keys(tech.meta.positiveHits).join(', ')}`);
}

console.log('\n36氪/雷锋网分类逻辑:');
if (ai.passed && !ai.meta.financeConflict && ai.score >= 95) {
  console.log('  → 应归类为: 人工智能');
} else if (tech.passed && tech.score >= 95) {
  console.log('  → 应归类为: 科技动态');
} else {
  console.log('  → 应跳过');
}
