/**
 * 排查金融文章分类问题 v3 - 详细调试
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// 手动复制评估逻辑来调试
function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchKeywords(text: string, keywords: string[]): string[] {
  const hits: string[] = [];
  for (const k of keywords) {
    const nk = normalizeText(k);
    if (!nk) continue;
    if (text.includes(nk)) hits.push(k);
  }
  return hits;
}

const FINANCE_KEYWORDS = [
  '研报', '研究报告', '研报指出', '研报称', '研报显示',
  '估值', '市值', '股价', '每股',
  '券商', '投行', '投资银行',
];

const testCases = [
  {
    title: '申万宏源：短期结构分化走向极致，市场再突破仍需蓄力',
    content: '36氪获悉，申万宏源发布研究报告称，短期总体市场难有效突破...',
  },
];

console.log('详细调试\n');

for (const article of testCases) {
  const title = normalizeText(article.title);
  const body = normalizeText(article.content);
  const full = `${title}\n${body}`.trim();

  console.log(`标题: ${title}`);
  console.log(`内容: ${body.substring(0, 100)}...\n`);

  const titleHits = matchKeywords(title, FINANCE_KEYWORDS);
  const bodyHits = matchKeywords(full, FINANCE_KEYWORDS);
  const uniq = Array.from(new Set([...titleHits, ...bodyHits]));

  console.log('匹配结果:');
  console.log(`  titleHits: ${titleHits.join(', ') || '无'}`);
  console.log(`  bodyHits: ${bodyHits.join(', ') || '无'}`);
  console.log(`  uniq: ${uniq.join(', ') || '无'}`);
  console.log(`  uniq.length: ${uniq.length}`);
  console.log(`  titleHits.length: ${titleHits.length}`);
  console.log(`  bodyHits.length: ${bodyHits.length}`);

  const hasFinanceSignal = uniq.length >= 2 && (titleHits.length >= 1 || bodyHits.length >= 3);
  console.log(`\nhasFinanceSignal: ${hasFinanceSignal}`);
  console.log(`  uniq.length >= 2: ${uniq.length >= 2}`);
  console.log(`  titleHits.length >= 1: ${titleHits.length >= 1}`);
  console.log(`  bodyHits.length >= 3: ${bodyHits.length >= 3}`);
}
