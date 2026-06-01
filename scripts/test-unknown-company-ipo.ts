/**
 * 测试不知名公司IPO检测 v2
 */

import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';

const testCases = [
  '一家不知名的宠物用品公司冲刺港股IPO',
  '某小公司谋求上市',
  '宠物用品公司筹备上市',
];

for (const title of testCases) {
  const r = evaluateFinanceRelevance({ title, content: '', link: '', pubDate: new Date() });
  console.log(`标题: ${title}`);
  console.log(`  passed: ${r.passed}, score: ${r.score}, rejectedBy: ${r.meta.rejectedBy || '无'}`);
  console.log();
}
