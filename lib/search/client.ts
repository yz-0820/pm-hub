import { Meilisearch } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || '';

export const meiliClient = new Meilisearch({
  host,
  apiKey,
});

export const articlesIndex = meiliClient.index('articles');

export async function initSearchIndex() {
  try {
    // 配置索引设置
    await articlesIndex.updateSettings({
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
    console.log('Search index initialized successfully');
  } catch (error) {
    console.error('Failed to initialize search index:', error);
  }
}
