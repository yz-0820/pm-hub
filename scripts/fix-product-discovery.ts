import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function fixProductDiscovery() {
  console.log('检查当前文章分类分布...');
  
  // 查看所有分类
  const cats = await db
    .select({ category: articles.category, count: sql<number>`count(*)` })
    .from(articles)
    .groupBy(articles.category);
  
  console.log('当前分类统计:');
  cats.forEach(c => console.log(`  ${c.category}: ${c.count}`));

  // 将部分产品经理文章分配到产品发现
  // 选择标题包含"产品"、"工具"、"App"等关键词的文章
  const result = await db
    .update(articles)
    .set({ category: 'product-discovery' })
    .where(sql`(category = 'product-management' OR category = 'tech') AND (
      title LIKE '%工具%' OR 
      title LIKE '%App%' OR 
      title LIKE '%应用%' OR
      title LIKE '%产品发现%' OR
      title LIKE '%推荐%' OR
      title LIKE '%评测%' OR
      title LIKE '%体验%' OR
      title LIKE '%上手%' OR
      title LIKE '%新功能%' OR
      title LIKE '%发布%' OR
      title LIKE '%新品%' OR
      title LIKE '%手机%' OR
      title LIKE '%电脑%' OR
      title LIKE '%平板%' OR
      title LIKE '%耳机%' OR
      title LIKE '%智能%' OR
      title LIKE '%AI%' OR
      title LIKE '%小米%' OR
      title LIKE '%华为%' OR
      title LIKE '%苹果%' OR
      title LIKE '%特斯拉%' OR
      title LIKE '%电动车%'
    )`)
    .returning({ id: articles.id, title: articles.title });

  console.log(`\n已将 ${result.length} 篇文章移动到产品发现分类:`);
  result.slice(0, 10).forEach(r => console.log(`  - ${r.title}`));
  if (result.length > 10) console.log(`  ... 还有 ${result.length - 10} 篇`);

  // 再次统计
  const cats2 = await db
    .select({ category: articles.category, count: sql<number>`count(*)` })
    .from(articles)
    .groupBy(articles.category);
  
  console.log('\n更新后分类统计:');
  cats2.forEach(c => console.log(`  ${c.category}: ${c.count}`));
}

fixProductDiscovery().catch(console.error);
