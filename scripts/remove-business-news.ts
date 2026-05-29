/**
 * 删除商业/融资类新闻（不属于职场内容）
 */

import { db } from '../lib/db/client';
import { careerContents } from '../lib/db/schema';
import { hasCareerRelevance } from '../lib/career/quality';
import { inArray } from 'drizzle-orm';

async function removeBusinessNews() {
  console.log('=== 开始清理商业/融资类新闻 ===\n');

  // 获取所有文章
  const allArticles = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      category: careerContents.category,
      description: careerContents.description,
      content: careerContents.content,
    })
    .from(careerContents);

  console.log(`总共有 ${allArticles.length} 篇文章需要检查\n`);

  const toDelete: number[] = [];

  for (const article of allArticles) {
    const content = {
      title: article.title,
      description: article.description || '',
      content: article.content || '',
    };

    const relevance = hasCareerRelevance(content);

    // 如果与职场不相关，标记为删除
    if (!relevance.relevant && relevance.reason.includes('商业/融资')) {
      toDelete.push(article.id);
      console.log(`[将删除] ${article.title}`);
      console.log(`  原因: ${relevance.reason}`);
    }
  }

  console.log(`\n=== 找到 ${toDelete.length} 篇商业/融资类文章需要删除 ===\n`);

  // 执行删除
  if (toDelete.length > 0) {
    console.log('正在删除...');

    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await db.delete(careerContents).where(inArray(careerContents.id, batch));
      console.log(`  已删除 ${Math.min(i + 50, toDelete.length)}/${toDelete.length}`);
    }

    console.log(`\n✅ 完成！共删除 ${toDelete.length} 篇商业/融资类文章`);
  } else {
    console.log('✅ 没有发现需要删除的商业/融资类文章');
  }

  process.exit(0);
}

removeBusinessNews().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
