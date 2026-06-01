/**
 * 测试事件新闻过滤
 */

import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';

const testCases = [
  '（更新：修正为 5 死 2 伤）韩国韩华航空航天工厂发生爆炸，致 6 死 1 伤',
  '狼蛛推出 SC580EVO 三模鼠标：双 8KHz 回报率，109 元起',
  '英伟达发布 5500 亿参数 Nemotron 3 Ultra 开源模型',
  '特斯拉工厂发生火灾，暂无人员伤亡',
];

console.log('事件新闻过滤测试\n');
console.log('='.repeat(70));

for (const title of testCases) {
  const r = evaluateTechRelevance({ title, content: '', link: '', pubDate: new Date() });
  console.log(`\n标题: ${title}`);
  console.log(`结果: ${r.passed ? '✅ 通过' : '❌ 过滤'}`);
  console.log(`分数: ${r.score}`);
  if (r.meta.rejectedBy) {
    console.log(`过滤原因: ${r.meta.rejectedBy}`);
  }
  if (r.meta.negativeHits.length > 0) {
    console.log(`命中负面词: ${r.meta.negativeHits.join(', ')}`);
  }
}
