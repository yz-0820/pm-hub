import { pgTable, text, integer, serial, boolean, timestamp } from 'drizzle-orm/pg-core';

// 文章表
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  slug: text('slug').unique(),
  originalUrl: text('original_url').notNull().unique(),
  sourceId: text('source_id').notNull(),
  sourceName: text('source_name').notNull(),
  category: text('category').notNull(),
  author: text('author'),
  imageUrl: text('image_url'),
  publishedAt: timestamp('published_at').notNull(),
  fetchedAt: timestamp('fetched_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  viewCount: integer('view_count').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(false),
});

// RSS 源状态表
export const rssSourceStatus = pgTable('rss_source_status', {
  id: serial('id').primaryKey(),
  sourceId: text('source_id').notNull().unique(),
  sourceName: text('source_name').notNull(),
  lastFetchAt: timestamp('last_fetch_at'),
  lastFetchCount: integer('last_fetch_count').default(0),
  lastError: text('last_error'),
  lastErrorAt: timestamp('last_error_at'),
  totalArticles: integer('total_articles').default(0),
  isHealthy: boolean('is_healthy').default(true),
});

// 抓取日志表
export const fetchLogs = pgTable('fetch_logs', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  totalSources: integer('total_sources').default(0),
  successfulSources: integer('successful_sources').default(0),
  totalNewArticles: integer('total_new_articles').default(0),
  errors: text('errors'),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type RSSSourceStatus = typeof rssSourceStatus.$inferSelect;
export type FetchLog = typeof fetchLogs.$inferSelect;
