/**
 * 调试产品发售检测
 */

import { detectProductLaunch } from '@/lib/rss/product-launch';

const testCases = [
  '狼蛛推出 SC580EVO 三模鼠标：双 8KHz 回报率，109 元起',
  '(更新：修正为 5 死 2 伤) 韩国韩华航空航天工厂发生爆炸，致 6 死 1 伤',
  '2026 款宏碁非凡 Go 锐龙版 16 英寸笔记本发售：锐龙 AI 7 H 350 + 16G + 1T 售 8499 元',
];

console.log('产品发售检测调试\n');
console.log('='.repeat(60));

for (const title of testCases) {
  const result = detectProductLaunch(title, '');
  console.log(`\n标题: ${title}`);
  console.log(`结果: ${result.isProductLaunch ? '❌ 产品发售' : '✅ 非产品发售'}`);
  if (result.reason) {
    console.log(`原因: ${result.reason}`);
  }
}
