/**
 * 重新分类金融相关文章
 * 用于修复错误分类到 tech/ai 的财经文章
 */

import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { evaluateFinanceRelevance, FINANCE_THRESHOLD } from '../lib/rss/finance-relevance';
import { evaluateAIRelevance, AI_THRESHOLD } from '../lib/rss/ai-relevance';
import { evaluateTechRelevance, TECH_THRESHOLD } from '../lib/rss/tech-relevance';
import { inArray, sql } from 'drizzle-orm';

// 强金融信号词 - 标题中出现这些词的文章应该归为 finance
// 注意：只包含最明确的金融术语，避免与科技/AI文章混淆
const STRONG_FINANCE_SIGNALS_TITLE = [
  // === 股票涨跌信号（最明确）===
  '涨超', '跌超', '涨逾', '跌逾', '涨幅', '跌幅', '暴涨', '暴跌',
  '涨停', '跌停', '停牌', '复牌',

  // === 指数信号（最明确）===
  '创业板指', '创业板', '科创50', '科创板', '上证指数', '深证成指', '沪深300', '沪指', '深指',
  '恒生指数', '纳斯达克', '道琼斯',

  // === 市场/股票类型信号（最明确）===
  'A股', '港股', '美股', '中概股', '概念股', 'ST股',
  '龙头股', '白马股', '蓝筹股', '权重股', '成分股',

  // === 资金流向信号（最明确）===
  '北向资金', '南向资金', '北向', '南向',
  '主力资金', '主力', '庄家', '游资',
  '做多', '做空', '多头', '空头',

  // === 交易行为信号（最明确）===
  '拉升', '跳水', '砸盘', '护盘',
  '全线上涨', '全线下跌', '全线飘红', '全线飘绿',

  // === 公司/股票财务信号（最明确）===
  '股价', '每股', '市值', '市值蒸发', '市值缩水',
  '上市', '上市首日', '破发', '破发价',
  '财报', '年报', '季报', '半年报', '业绩', '营收', '净利润', '归母净利润',
  '亏损', '盈利', '扭亏', '预盈', '预亏',
  '分红', '分红派息', '派息', '股息',
  '回购', '减持', '增持', '大股东减持', '大股东增持',
  '定增', '配股', '增发', '股权融资',

  // === IPO/融资信号（最明确）===
  'IPO', 'ipo', '招股', '招股书', '上市申请', '上会', '过会',
  '融资', '募资', '估值', '投后估值',

  // === 板块/行业信号（最明确）===
  '板块大涨', '板块大跌', '板块拉升', '板块跳水',
  '行业龙头', '行业指数',

  // === 牛熊市场信号（最明确）===
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

async function reclassifyArticles() {
  console.log('=== 开始重新分类金融相关文章 ===\n');

  // 获取所有非 finance 分类的文章
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      category: articles.category,
      sourceId: articles.sourceId,
      sourceName: articles.sourceName,
      summary: articles.summary,
      content: articles.content,
    })
    .from(articles)
    .where(inArray(articles.category, ['tech', 'ai', 'product-management']));

  console.log(`总共 ${allArticles.length} 篇非金融分类文章需要检查\n`);

  let reclassifiedCount = 0;
  let checkedCount = 0;
  const toReclassify: Array<{ id: number; title: string; oldCategory: string; newCategory: string; reason: string }> = [];

  for (const article of allArticles) {
    checkedCount++;

    // 快速检查：标题是否有强金融信号
    if (hasStrongFinanceSignal(article.title)) {
      toReclassify.push({
        id: article.id,
        title: article.title,
        oldCategory: article.category,
        newCategory: 'finance',
        reason: '标题包含强金融信号词',
      });
      continue;
    }

    // 完整评估（仅对可能相关的文章）
    const articleData = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      link: '',
      pubDate: new Date(),
    };

    const financeR = evaluateFinanceRelevance(articleData);

    // 如果金融相关度达标，建议重新分类
    if (financeR.passed && financeR.score >= FINANCE_THRESHOLD) {
      toReclassify.push({
        id: article.id,
        title: article.title,
        oldCategory: article.category,
        newCategory: 'finance',
        reason: `金融相关度分数: ${financeR.score}`,
      });
    }

    // 每检查100篇输出进度
    if (checkedCount % 100 === 0) {
      console.log(`已检查 ${checkedCount}/${allArticles.length} 篇，发现 ${toReclassify.length} 篇需要重新分类`);
    }
  }

  console.log(`\n检查完成！发现 ${toReclassify.length} 篇文章需要重新分类为金融\n`);

  // 显示前20个待重新分类的文章
  if (toReclassify.length > 0) {
    console.log('=== 待重新分类的文章（前20篇）===\n');
    for (const item of toReclassify.slice(0, 20)) {
      console.log(`[${item.oldCategory} → ${item.newCategory}] ${item.title}`);
      console.log(`  原因: ${item.reason}`);
      console.log(`  ID: ${item.id}\n`);
    }

    if (toReclassify.length > 20) {
      console.log(`... 还有 ${toReclassify.length - 20} 篇未显示\n`);
    }
  }

  // 执行重新分类
  if (toReclassify.length > 0) {
    console.log('=== 开始更新数据库 ===\n');

    for (const item of toReclassify) {
      await db
        .update(articles)
        .set({
          category: 'finance',
          updatedAt: new Date(),
        })
        .where(sql`${articles.id} = ${item.id}`);

      reclassifiedCount++;

      if (reclassifiedCount % 10 === 0) {
        console.log(`已更新 ${reclassifiedCount}/${toReclassify.length} 篇`);
      }
    }

    console.log(`\n✅ 完成！共重新分类 ${reclassifiedCount} 篇文章`);
  } else {
    console.log('✅ 没有发现需要重新分类的文章');
  }

  process.exit(0);
}

reclassifyArticles().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
