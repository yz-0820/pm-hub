/**
 * 调试产品发售检测
 */

import { detectProductLaunch } from '@/lib/rss/product-launch';

const article = {
  title: '以科技与基普乔格共同赋能跑者，华为WATCH GT Runner 2赛道传奇款发布',
  content: '<p>虽然全球智能穿戴行业集中激烈，但华为穿戴始终占据引领者地位。全球累计出货量突破2亿台，且常年稳居国内腕戴设备市场出货量第一，是全球为数不多在专业穿戴赛道实现规模化、高端化、专业化同步发展的品牌。</p><p>伴随着华为NOVA 16系列及全场景新品发布会的如期举行，华为携手两届奥运会马拉松冠军、华为WATCH GT Runner全球代言人基普乔格深度共创的华为WATCH GT Runner 2赛道传奇款正式发布。</p>',
};

console.log('产品发售检测调试\n');
console.log('='.repeat(80));
console.log(`标题: ${article.title}\n`);

const result = detectProductLaunch(article.title, article.content);
console.log('检测结果:');
console.log(`  isProductLaunch: ${result.isProductLaunch}`);
if (result.reason) {
  console.log(`  原因: ${result.reason}`);
}
