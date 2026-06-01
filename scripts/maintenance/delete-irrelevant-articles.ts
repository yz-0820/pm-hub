/**
 * 删除 AI 分类中错误分类的文章
 * 直接从数据库中删除，而不是标记状态
 */

import { db } from '../../lib/db/client';
import { articles } from '../../lib/db/schema';
import { evaluateFinanceRelevance } from '../../lib/rss/finance-relevance';
import { evaluateAIRelevance, AI_THRESHOLD } from '../../lib/rss/ai-relevance';
import { evaluateTechRelevance, TECH_THRESHOLD } from '../../lib/rss/tech-relevance';
import { eq, inArray, sql } from 'drizzle-orm';

// 强金融信号词
const STRONG_FINANCE_SIGNALS_TITLE = [
  '涨超', '跌超', '涨逾', '跌逾', '涨幅', '跌幅', '暴涨', '暴跌',
  '涨停', '跌停', '停牌', '复牌',
  '创业板指', '创业板', '科创50', '科创板', '上证指数', '深证成指', '沪深300', '沪指', '深指',
  '恒生指数', '纳斯达克', '道琼斯',
  'A股', '港股', '美股', '中概股', '概念股', 'ST股',
  '龙头股', '白马股', '蓝筹股', '权重股', '成分股',
  '北向资金', '南向资金', '北向', '南向',
  '主力资金', '主力', '庄家', '游资',
  '做多', '做空', '多头', '空头',
  '拉升', '跳水', '砸盘', '护盘',
  '全线上涨', '全线下跌', '全线飘红', '全线飘绿',
  '股价', '每股', '市值', '市值蒸发', '市值缩水',
  '上市', '上市首日', '破发', '破发价',
  '财报', '年报', '季报', '半年报', '业绩', '营收', '净利润', '归母净利润',
  '亏损', '盈利', '扭亏', '预盈', '预亏',
  '分红', '分红派息', '派息', '股息',
  '回购', '减持', '增持', '大股东减持', '大股东增持',
  '定增', '配股', '增发', '股权融资',
  'IPO', 'ipo', '招股', '招股书', '上市申请', '上会', '过会',
  '融资', '募资', '估值', '投后估值',
  '板块大涨', '板块大跌', '板块拉升', '板块跳水',
  '行业龙头', '行业指数',
  '牛市', '熊市', '牛市来了', '熊市来了',
  '震荡', '反弹', '回调', '筑底', '探底',
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasStrongFinanceSignal(title: string): boolean {
  const normalizedTitle = normalizeText(title);
  for (const signal of STRONG_FINANCE_SIGNALS_TITLE) {
    if (normalizedTitle.includes(normalizeText(signal))) {
      return true;
    }
  }
  return false;
}

async function fixArticles() {
  console.log('=== 开始清理 AI 分类中的错误文章 ===\n');

  // 获取 AI 分类的所有文章
  const aiArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      category: articles.category,
      summary: articles.summary,
      content: articles.content,
    })
    .from(articles)
    .where(eq(articles.category, 'ai'));

  console.log(`AI 分类下共有 ${aiArticles.length} 篇文章需要检查\n`);

  const toDelete: number[] = [];
  const toMoveToFinance: number[] = [];
  const toKeep: number[] = [];

  for (const article of aiArticles) {
    const articleData = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      link: '',
      pubDate: new Date(),
    };

    const financeR = evaluateFinanceRelevance(articleData);
    const aiR = evaluateAIRelevance(articleData);

    // 检查是否有强金融信号
    const hasFinanceSignal = hasStrongFinanceSignal(article.title) || (financeR.passed && financeR.score >= 70);

    if (hasFinanceSignal) {
      toMoveToFinance.push(article.id);
      continue;
    }

    // 检查 AI 相关度
    const shouldKeepAsAI = aiR.passed && !aiR.meta.financeConflict && aiR.score >= 35;

    if (shouldKeepAsAI) {
      toKeep.push(article.id);
    } else {
      toDelete.push(article.id);
    }
  }

  console.log('=== 检查结果汇总 ===\n');
  console.log(`保留为 AI: ${toKeep.length} 篇`);
  console.log(`重新分类为金融: ${toMoveToFinance.length} 篇`);
  console.log(`需要删除: ${toDelete.length} 篇\n`);

  // 执行删除
  if (toDelete.length > 0) {
    console.log('正在删除不相关的文章...');

    // 分批删除，每批50条
    const batchSize = 50;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await db.delete(articles).where(inArray(articles.id, batch));
      console.log(`  已删除 ${Math.min(i + batchSize, toDelete.length)}/${toDelete.length}`);
    }
  }

  // 执行重新分类
  if (toMoveToFinance.length > 0) {
    console.log('\n正在重新分类为金融...');

    for (let i = 0; i < toMoveToFinance.length; i += 50) {
      const batch = toMoveToFinance.slice(i, i + 50);
      await db.update(articles)
        .set({ category: 'finance' })
        .where(inArray(articles.id, batch));
      console.log(`  已更新 ${Math.min(i + 50, toMoveToFinance.length)}/${toMoveToFinance.length}`);
    }
  }

  console.log(`\n✅ 完成！`);
  console.log(`   - 删除: ${toDelete.length} 篇`);
  console.log(`   - 重新分类为金融: ${toMoveToFinance.length} 篇`);
  console.log(`   - 保留为 AI: ${toKeep.length} 篇`);

  process.exit(0);
}

fixArticles().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
