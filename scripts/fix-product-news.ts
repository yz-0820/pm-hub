/**
 * 修复被错误分类到 AI 的产品新闻
 */

import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { evaluateTechRelevance } from '../lib/rss/tech-relevance';
import { eq, inArray } from 'drizzle-orm';

// 产品新闻关键词
const PRODUCT_NEWS_KEYWORDS = [
  '发布', '发售', '上市', '推出', '亮相', '曝光', '开箱', '评测', '体验',
  '显示器', '手机', '笔记本', '平板', '耳机', '音箱', '键盘', '鼠标',
  '配置', '参数', '规格', '性能', '跑分', '测试',
  '售价', '定价', '价格', '元', '美元', '欧元',
  '英寸', '分辨率', '刷新率', '色域', '亮度',
];

function isProductNews(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  const hits = PRODUCT_NEWS_KEYWORDS.filter(k => lowerTitle.includes(k.toLowerCase()));
  return hits.length >= 2;
}

async function fixProductNews() {
  console.log('=== 开始修复产品新闻分类 ===\n');

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

  console.log(`AI 分类下共有 ${aiArticles.length} 篇文章\n`);

  const toMoveToTech: number[] = [];

  for (const article of aiArticles) {
    // 快速筛选：标题包含产品新闻特征
    if (!isProductNews(article.title)) {
      continue;
    }

    const articleData = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      link: '',
      pubDate: new Date(),
    };

    const techR = evaluateTechRelevance(articleData);

    // 如果科技评估通过，应该归类为 tech
    if (techR.passed) {
      toMoveToTech.push(article.id);
      console.log(`[将移动到 tech] ${article.title}`);
      console.log(`  科技分数: ${techR.score}, topic: ${techR.topic}`);
    }
  }

  console.log(`\n=== 找到 ${toMoveToTech.length} 篇需要重新分类的文章 ===\n`);

  // 执行重新分类
  if (toMoveToTech.length > 0) {
    console.log('正在重新分类...');

    for (let i = 0; i < toMoveToTech.length; i += 50) {
      const batch = toMoveToTech.slice(i, i + 50);
      await db.update(articles)
        .set({ category: 'tech' })
        .where(inArray(articles.id, batch));
      console.log(`  已更新 ${Math.min(i + 50, toMoveToTech.length)}/${toMoveToTech.length}`);
    }

    console.log(`\n✅ 完成！共重新分类 ${toMoveToTech.length} 篇文章到科技分类`);
  } else {
    console.log('✅ 没有发现需要重新分类的文章');
  }

  process.exit(0);
}

fixProductNews().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
