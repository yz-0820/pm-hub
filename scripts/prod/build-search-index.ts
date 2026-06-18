import { db } from '@/lib/db/client';
import './load-env';

async function main() {
  const [{ indexArticles, clearIndex }, { initSearchIndex }] = await Promise.all([
    import('@/lib/search/indexer'),
    import('@/lib/search/client'),
  ]);

  console.log('Building search index...');
  
  try {
    // 初始化索引设置
    await initSearchIndex();
    
    // 清空现有索引
    await clearIndex();
    
    // 获取所有文章
    const allArticles = await db.query.articles.findMany({
      orderBy: (articles, { desc }) => [desc(articles.publishedAt)],
    });
    
    console.log(`Found ${allArticles.length} articles to index`);
    
    // 批量索引（每批100条）
    const batchSize = 100;
    for (let i = 0; i < allArticles.length; i += batchSize) {
      const batch = allArticles.slice(i, i + batchSize);
      await indexArticles(batch);
      console.log(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allArticles.length / batchSize)}`);
    }
    
    console.log('Search index built successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to build search index:', error);
    process.exit(1);
  }
}

main();
