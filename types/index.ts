export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string | null;
  originalUrl: string;
  sourceId: string;
  sourceName: string;
  category: string;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  isFeatured: boolean;
  relevanceScore?: number;
  relevanceMeta?: string | null;
}

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  language: 'zh' | 'en';
  weight: number;
  enabled: boolean;
}

export interface ParsedArticle {
  title: string;
  link: string;
  pubDate: Date;
  content?: string;
  summary?: string;
  author?: string;
  categories?: string[];
  imageUrl?: string;
}

export interface FetchResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  newArticles: number;
  errors: string[];
}

export interface SearchResult {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

// 职业发展资源相关类型
export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  resourceType: 'article' | 'video' | 'blog' | 'case';
  url: string;
  coverImage: string | null;
  author: string | null;
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced';
  tags: string | null;
  isFeatured: boolean;
  sortOrder: number;
  viewCount: number;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
}

export type ResourceType = 'article' | 'video' | 'blog' | 'case';
export type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';
