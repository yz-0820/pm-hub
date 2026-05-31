import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from './parser';
import { db } from '@/lib/db/client';
import { articles, rssSourceStatus } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { FetchResult, ParsedArticle } from '@/types';

export async function fetchAllRSS(): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  
  for (const source of rssSources.filter(s => s.enabled)) {
    const result: FetchResult = {
      sourceId: source.id,
      sourceName: source.name,
      fetched: 0,
      newArticles: 0,
      errors: [],
    };
    
    try {
      console.log(`Fetching: ${source.name}`);
      const parsedArticles = await parseRSSFeed(source.url);
      result.fetched = parsedArticles.length;
      
      for (const article of parsedArticles) {
        // 使用 INSERT OR IGNORE 避免 TOCTOU 竞态条件
        // originalUrl 有唯一索引，重复插入会被静默忽略
        const insertResult = await db.run(
          sql`INSERT OR IGNORE INTO articles (title, summary, content, slug, original_url, source_id, source_name, category, author, image_url, published_at, fetched_at, created_at, updated_at, view_count, is_featured) VALUES (${article.title}, ${article.summary?.slice(0, 500) || ''}, ${article.content || article.summary || ''}, ${generateSlug(article.title)}, ${article.link}, ${source.id}, ${source.name}, ${source.category}, ${article.author || null}, ${article.imageUrl || null}, ${article.pubDate}, ${new Date()}, ${new Date()}, ${new Date()}, 0, 0)`
        );

        if (insertResult.changes > 0) {
          result.newArticles++;
        }
      }
      
      // 更新RSS源状态
      await updateSourceStatus(source.id, source.name, result.fetched, null);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error(`Error fetching ${source.name}:`, error);
      
      // 更新错误状态
      await updateSourceStatus(source.id, source.name, 0, errorMsg);
    }
    
    results.push(result);
  }
  
  return results;
}

async function updateSourceStatus(
  sourceId: string, 
  sourceName: string, 
  fetchCount: number, 
  error: string | null
) {
  // 先尝试更新已有记录
  const updateResult = await db.update(rssSourceStatus)
    .set({
      lastFetchAt: new Date(),
      lastFetchCount: fetchCount,
      totalArticles: sql`${rssSourceStatus.totalArticles} + ${fetchCount}`,
      lastError: error,
      lastErrorAt: error ? new Date() : rssSourceStatus.lastErrorAt,
      isHealthy: !error,
    })
    .where(eq(rssSourceStatus.sourceId, sourceId));

  // 如果没有更新到任何行，说明记录不存在，插入新记录
  if (updateResult.changes === 0) {
    await db.insert(rssSourceStatus).values({
      sourceId,
      sourceName,
      lastFetchAt: new Date(),
      lastFetchCount: fetchCount,
      totalArticles: fetchCount,
      lastError: error,
      lastErrorAt: error ? new Date() : null,
      isHealthy: !error,
    });
  }
}
