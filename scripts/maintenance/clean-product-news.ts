/**
 * 清理产品发布/促销类新闻
 * 产品发布的典型特征：发布/发售 + 售价/规格
 */

import { db } from '../../lib/db/client';
import { articles } from '../../lib/db/schema';
import { inArray } from 'drizzle-orm';

// 产品发布的特征组合
const productReleaseSignals = ['发布', '发售', '开售', '上市', '推出', '亮相', '开卖'];
const productPriceSignals = ['元', '售价', '首发价', '起价', '限时价', '优惠价'];
const productSpecSignals = ['配置', '参数', '规格', '处理器', '内存', '屏幕', '电池', '英寸', '刷新率'];

function isProductReleaseNews(title: string): boolean {
  const hasRelease = productReleaseSignals.some(s => title.includes(s));
  const hasPrice = productPriceSignals.some(s => title.includes(s));
  const specCount = productSpecSignals.filter(s => title.includes(s)).length;

  // 标题同时包含发布信号 + (价格信号 或 多个规格信号)
  return hasRelease && (hasPrice || specCount >= 2);
}

async function cleanProductNews() {
  console.log('=== 开始清理产品发布/促销类新闻 ===\n');

  // 获取所有文章
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      category: articles.category,
    })
    .from(articles);

  console.log(`总共有 ${allArticles.length} 篇文章需要检查\n`);

  const toDelete: number[] = [];
  const toDeleteByCategory: Record<string, number> = {};

  for (const article of allArticles) {
    if (isProductReleaseNews(article.title)) {
      toDelete.push(article.id);
      toDeleteByCategory[article.category] = (toDeleteByCategory[article.category] || 0) + 1;
    }
  }

  console.log('=== 检查结果 ===\n');
  console.log(`需要删除: ${toDelete.length} 篇\n`);

  // 按分类统计
  for (const [category, count] of Object.entries(toDeleteByCategory)) {
    console.log(`  ${category}: ${count} 篇`);
  }

  // 显示示例
  console.log('\n=== 部分示例 ===\n');
  const examples = allArticles.filter(a => isProductReleaseNews(a.title)).slice(0, 10);
  for (const article of examples) {
    console.log(`[${article.category}] ${article.title}`);
  }
  if (examples.length < toDelete.length) {
    console.log(`... 还有 ${toDelete.length - examples.length} 篇\n`);
  }

  // 执行删除
  if (toDelete.length > 0) {
    console.log('\n=== 开始删除 ===\n');

    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await db.delete(articles).where(inArray(articles.id, batch));
      console.log(`  已删除 ${Math.min(i + 50, toDelete.length)}/${toDelete.length}`);
    }

    console.log(`\n✅ 完成！共删除 ${toDelete.length} 篇产品发布/促销类新闻`);
  } else {
    console.log('\n✅ 没有发现需要删除的产品发布/促销类新闻');
  }

  process.exit(0);
}

cleanProductNews().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
