import { Meilisearch, SearchResponse } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || '';

export const meiliClient = new Meilisearch({
  host,
  apiKey,
});

export const articlesIndex = meiliClient.index('articles');

// 搜索结果内存缓存（简单 LRU，最多 50 条）
const searchCache = new Map<string, { result: SearchResponse<Record<string, unknown>>; expiry: number }>();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 30_000; // 30 秒

function getCacheKey(query: string, limit: number, offset: number): string {
  return `${query}::${limit}::${offset}`;
}

function getCachedSearch(key: string): SearchResponse<Record<string, unknown>> | undefined {
  const entry = searchCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    searchCache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCachedSearch(key: string, result: SearchResponse<Record<string, unknown>>): void {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }
  searchCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
}

/**
 * 执行带缓存的搜索
 */
export async function searchArticles(
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<SearchResponse<Record<string, unknown>>> {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  const cacheKey = getCacheKey(query, limit, offset);

  const cached = getCachedSearch(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await articlesIndex.search(query, {
    limit,
    offset,
    sort: ['publishedAt:desc'],
    attributesToRetrieve: ['id', 'title', 'summary', 'category', 'sourceName', 'publishedAt', 'imageUrl'],
  });

  setCachedSearch(cacheKey, result);
  return result;
}

export async function initSearchIndex() {
  try {
    // 配置索引设置
    const task = articlesIndex.updateSettings({
      searchableAttributes: ['title', 'summary', 'content', 'author'],
      filterableAttributes: ['category', 'sourceId', 'publishedAt'],
      sortableAttributes: ['publishedAt', 'createdAt'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    });
    const result = await task.waitTask();
    if (result.status !== 'succeeded') {
      const detail = 'error' in result && result.error ? `: ${result.error.message}` : '';
      throw new Error(`Meilisearch task ${result.uid} ended with status ${result.status}${detail}`);
    }
    console.log('Search index initialized successfully');
  } catch (error) {
    console.error('Failed to initialize search index:', error);
    throw error;
  }
}
