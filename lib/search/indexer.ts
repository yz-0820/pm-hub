import { articlesIndex } from './client';
import { Article } from '@/types';

export interface SearchableArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string | null;
  category: string;
  sourceId: string;
  sourceName: string;
  author: string | null;
  imageUrl: string | null;
  publishedAt: number;
  createdAt: number;
}

export function toSearchableArticle(article: Article): SearchableArticle {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    slug: article.slug,
    category: article.category,
    sourceId: article.sourceId,
    sourceName: article.sourceName,
    author: article.author,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt.getTime(),
    createdAt: article.createdAt.getTime(),
  };
}

export async function indexArticle(article: Article) {
  try {
    await articlesIndex.addDocuments([toSearchableArticle(article)]);
    console.log(`Indexed article: ${article.title}`);
  } catch (error) {
    console.error(`Failed to index article ${article.id}:`, error);
  }
}

export async function indexArticles(articles: Article[]) {
  if (articles.length === 0) return;
  
  try {
    const task = articlesIndex.addDocuments(articles.map(toSearchableArticle), {
      primaryKey: 'id',
    });
    const result = await task.waitTask();
    if (result.status !== 'succeeded') {
      const detail = 'error' in result && result.error ? `: ${result.error.message}` : '';
      throw new Error(`Meilisearch task ${result.uid} ended with status ${result.status}${detail}`);
    }
    console.log(`Indexed ${articles.length} articles`);
  } catch (error) {
    console.error('Failed to index articles:', error);
    throw error;
  }
}

export async function removeArticleFromIndex(articleId: number) {
  try {
    await articlesIndex.deleteDocument(articleId);
    console.log(`Removed article ${articleId} from index`);
  } catch (error) {
    console.error(`Failed to remove article ${articleId}:`, error);
  }
}

export async function clearIndex() {
  try {
    const task = articlesIndex.deleteAllDocuments();
    const result = await task.waitTask();
    if (result.status !== 'succeeded') {
      const detail = 'error' in result && result.error ? `: ${result.error.message}` : '';
      throw new Error(`Meilisearch task ${result.uid} ended with status ${result.status}${detail}`);
    }
    console.log('Cleared search index');
  } catch (error) {
    console.error('Failed to clear index:', error);
    throw error;
  }
}
