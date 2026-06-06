/**
 * 更新现有文章的分类
 * 将标题包含高权重职场关键词的文章从"product-management"改为"career"
 */

import { db } from '../lib/db/client';
import { articles, careerContents } from '../lib/db/schema';
import { eq, like, or } from 'drizzle-orm';

// 高权重职场关键词
const HIGH_WEIGHT_CAREER_KEYWORDS = [
  '领导力', '团队管理', '管理能力', '向上管理',
];

async function updateArticleCategories() {
  console.log('开始更新文章分类...');

  // 构建查询条件：标题包含任意一个高权重职场关键词
  const conditions = HIGH_WEIGHT_CAREER_KEYWORDS.map(keyword => 
    like(articles.title, `%${keyword}%`)
  );

  // 查找当前分类为 product-management 且标题包含职场关键词的文章
  const articlesToUpdate = await db
    .select({
      id: articles.id,
      title: articles.title,
      category: articles.category,
    })
    .from(articles)
    .where(
      or(...conditions)
    );

  console.log(`找到 ${articlesToUpdate.length} 篇需要更新的 articles 表文章`);

  // 筛选出当前分类为 product-management 的文章
  const pmArticles = articlesToUpdate.filter(article => article.category === 'product-management');
  
  console.log(`其中分类为"产品经理"的文章: ${pmArticles.length} 篇`);

  if (pmArticles.length > 0) {
    console.log('\n将要更新的 articles 表文章:');
    pmArticles.forEach(article => {
      console.log(`  - [ID: ${article.id}] ${article.title}`);
    });

    // 更新分类
    let updatedCount = 0;
    for (const article of pmArticles) {
      await db
        .update(articles)
        .set({ category: 'career' })
        .where(eq(articles.id, article.id));
      updatedCount++;
      console.log(`✅ 已更新 articles 表: ${article.title}`);
    }
    console.log(`\n完成！共更新 ${updatedCount} 篇 articles 表文章的分类`);
  }

  // 同时更新 careerContents 表
  const careerConditions = HIGH_WEIGHT_CAREER_KEYWORDS.map(keyword => 
    like(careerContents.title, `%${keyword}%`)
  );

  const careerToUpdate = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      category: careerContents.category,
    })
    .from(careerContents)
    .where(
      or(...careerConditions)
    );

  console.log(`\n找到 ${careerToUpdate.length} 篇需要更新的 careerContents 表文章`);

  // 筛选出当前分类不是 leadership 的文章
  const nonLeadershipArticles = careerToUpdate.filter(article => article.category !== 'leadership');
  
  console.log(`其中分类不是"领导力"的文章: ${nonLeadershipArticles.length} 篇`);

  if (nonLeadershipArticles.length > 0) {
    console.log('\n将要更新的 careerContents 表文章:');
    nonLeadershipArticles.forEach(article => {
      console.log(`  - [ID: ${article.id}] ${article.title} (当前分类: ${article.category})`);
    });

    let updatedCareerCount = 0;
    for (const article of nonLeadershipArticles) {
      await db
        .update(careerContents)
        .set({ category: 'leadership' })
        .where(eq(careerContents.id, article.id));
      updatedCareerCount++;
      console.log(`✅ 已更新 careerContents 表: ${article.title}`);
    }
    console.log(`\n完成！共更新 ${updatedCareerCount} 篇 careerContents 表文章的分类`);
  }
}

// 执行更新
updateArticleCategories()
  .then(() => {
    console.log('\n脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
