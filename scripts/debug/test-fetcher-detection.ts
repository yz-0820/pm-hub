/**
 * 测试 fetcher 中的检测逻辑
 */

import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

// 模拟 RSS 抓取的文章
const testArticles = [
  {
    title: '狼蛛推出 SC580EVO 三模鼠标：双 8KHz 回报率，109 元起',
    summary: 'IT之家 6 月 1 日消息，狼蛛现已上架一款型号为 SC580EVO 的三模鼠标，该产品提供双 8KHz 回报率，其中黑 / 白配色定价为 109 元，昼夜 / 白透配色定价为 119 元。',
    content: '',
  },
  {
    title: '（更新：修正为 5 死 2 伤）韩国韩华航空航天工厂发生爆炸，致 6 死 1 伤',
    summary: '6 月 1 日 14:01 更新：伤亡人数已修正为 5 死 2 伤。IT之家 6 月 1 日消息，据央视新闻今日报道，总台记者获悉，当地时间 6 月 1 日，位于韩国大田市的韩华航空航天的工厂发生爆炸事故，爆炸引发了火灾。',
    content: '',
  },
  {
    title: '2026 款宏碁非凡 Go 锐龙版 16 英寸笔记本发售：锐龙 AI 7 H 350 + 16G + 1T 售 8499 元',
    summary: 'IT之家 6 月 1 日消息，宏碁旗下 2026 款非凡 Go 锐龙版 16 英寸笔记本现已京东发售，该机搭载锐龙 AI 7 H 350，匹配 16GB RAM 和 1TB PCIe Gen 4 NVMe SSD，首发价为 8499 元。',
    content: '',
  },
];

console.log('IT之家产品发售检测测试\n');
console.log('='.repeat(70));

for (const article of testArticles) {
  const fullText = `${article.summary || ''} ${article.content || ''}`;
  const result = detectITHomeProductLaunch(article.title, fullText);
  
  console.log(`\n标题: ${article.title}`);
  console.log(`检测结果: ${result.isProductLaunch ? '❌ 产品发售 - 应该跳过' : '✅ 非产品发售 - 可以入库'}`);
  if (result.reason) {
    console.log(`原因: ${result.reason}`);
  }
}
