import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 文章表
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  viewCount: integer('view_count').notNull().default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  relevanceScore: integer('relevance_score').notNull().default(0),
  relevanceMeta: text('relevance_meta'),
});

// RSS 源状态表
export const rssSourceStatus = sqliteTable('rss_source_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: text('source_id').notNull().unique(),
  sourceName: text('source_name').notNull(),
  lastFetchAt: integer('last_fetch_at', { mode: 'timestamp' }),
  lastFetchCount: integer('last_fetch_count').default(0),
  lastError: text('last_error'),
  lastErrorAt: integer('last_error_at', { mode: 'timestamp' }),
  totalArticles: integer('total_articles').default(0),
  isHealthy: integer('is_healthy', { mode: 'boolean' }).default(true),
});

// 抓取日志表
export const fetchLogs = sqliteTable('fetch_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  totalSources: integer('total_sources').default(0),
  successfulSources: integer('successful_sources').default(0),
  totalNewArticles: integer('total_new_articles').default(0),
  errors: text('errors'),
});

// 职业发展资源表 - 用于手动维护的精选资源
export const resources = sqliteTable('resources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // communication/productivity/teamwork/leadership
  resourceType: text('resource_type').notNull(), // article/video/blog/case
  url: text('url').notNull(),
  coverImage: text('cover_image'),
  author: text('author'),
  sourceName: text('source_name').notNull().default(''),
  difficulty: text('difficulty').notNull().default('all'), // beginner/intermediate/advanced/all
  tags: text('tags'), // JSON 数组字符串
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ===== 职业发展实时内容聚合表 =====

// 内容源配置表 - 支持RSS、API、爬虫等多种源
export const contentSources = sqliteTable('content_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: text('source_id').notNull().unique(), // 唯一标识，如 xiaohongshu-pm
  sourceName: text('source_name').notNull(), // 显示名称
  sourceType: text('source_type').notNull(), // rss/api/scraper/webhook
  platform: text('platform').notNull(), // xiaohongshu/douyin/bilibili/zhihu/wechat/rss
  category: text('category').notNull(), // 关联职业分类
  url: text('url').notNull(), // 源地址/接口地址
  apiKey: text('api_key'), // API密钥（加密存储）
  config: text('config'), // JSON配置：选择器、过滤规则等
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  weight: integer('weight').notNull().default(10), // 权重，影响排序
  fetchInterval: integer('fetch_interval').notNull().default(3600), // 抓取间隔（秒）
  lastFetchAt: integer('last_fetch_at', { mode: 'timestamp' }),
  lastFetchCount: integer('last_fetch_count').default(0),
  lastError: text('last_error'),
  lastErrorAt: integer('last_error_at', { mode: 'timestamp' }),
  totalContents: integer('total_contents').default(0),
  isHealthy: integer('is_healthy', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 职业发展聚合内容表 - 统一存储各平台内容
export const careerContents = sqliteTable('career_contents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 基础信息
  title: text('title').notNull(),
  description: text('description'), // 摘要/简介
  content: text('content'), // 完整内容（如有）
  
  // 来源信息
  sourceId: text('source_id').notNull(), // 关联contentSources
  sourceName: text('source_name').notNull(), // 平台名称
  platform: text('platform').notNull(), // xiaohongshu/douyin/bilibili/zhihu/wechat/rss
  originalUrl: text('original_url').notNull(), // 原始链接
  originalId: text('original_id'), // 平台内容ID
  author: text('author'), // 作者
  authorId: text('author_id'), // 作者ID
  authorAvatar: text('author_avatar'), // 作者头像
  
  // 内容类型
  contentType: text('content_type').notNull(), // article/video/short_video/live/audio
  category: text('category').notNull(), // communication/productivity/teamwork/leadership
  tags: text('tags'), // JSON数组
  
  // 媒体资源
  coverImage: text('cover_image'), // 封面图
  videoUrl: text('video_url'), // 视频地址
  videoDuration: integer('video_duration'), // 视频时长（秒）
  images: text('images'), // JSON数组，多图内容
  
  // 互动数据
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  shareCount: integer('share_count').default(0),
  
  // 状态管理
  status: text('status').notNull().default('pending'), // pending/active/archived/rejected
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  priority: integer('priority').notNull().default(0), // 优先级，影响排序

  qualityScore: integer('quality_score').notNull().default(0),
  qualityReasons: text('quality_reasons'),
  matchScore: integer('match_score').notNull().default(0),
  matchKeywords: text('match_keywords'),
  matchCoreMatched: integer('match_core_matched', { mode: 'boolean' }).notNull().default(false),
  matchCoreMissing: text('match_core_missing'),
  
  // 时间戳
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(), // 原始发布时间
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(), // 抓取时间
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 内容缓存表 - 用于性能优化
export const contentCache = sqliteTable('content_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cacheKey: text('cache_key').notNull().unique(), // 缓存键
  cacheType: text('cache_type').notNull(), // list/detail/feed
  data: text('data').notNull(), // JSON数据
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(), // 过期时间
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// 内容抓取日志表
export const contentFetchLogs = sqliteTable('content_fetch_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: text('source_id').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  fetchedCount: integer('fetched_count').default(0),
  newCount: integer('new_count').default(0),
  updatedCount: integer('updated_count').default(0),
  errorCount: integer('error_count').default(0),
  errors: text('errors'), // JSON错误详情
});

// ===== 题库训练 =====

export const trainingQuestions = sqliteTable('training_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionKey: text('question_key').notNull().unique(),
  title: text('title').notNull(),
  logoUrl: text('logo_url'),
  prompt: text('prompt').notNull(),
  industry: text('industry').notNull(),
  productType: text('product_type').notNull(),
  difficulty: text('difficulty').notNull().default('intermediate'),
  referencePoints: text('reference_points'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const trainingDrafts = sqliteTable('training_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userKey: text('user_key').notNull(),
  questionId: integer('question_id').notNull(),
  content: text('content').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const trainingAttempts = sqliteTable('training_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userKey: text('user_key').notNull(),
  questionId: integer('question_id').notNull(),
  answer: text('answer').notNull(),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const trainingEvaluations = sqliteTable('training_evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  attemptId: integer('attempt_id').notNull().unique(),
  totalScore: integer('total_score').notNull(),
  valueScore: integer('value_score').notNull(),
  businessScore: integer('business_score').notNull(),
  designScore: integer('design_score').notNull(),
  competitionScore: integer('competition_score').notNull(),
  report: text('report').notNull(),
  model: text('model').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const programmingQuestions = sqliteTable('programming_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionKey: text('question_key').notNull().unique(),
  domain: text('domain').notNull(), // frontend/backend/database
  category: text('category').notNull(), // 细分分类：html-css/js/framework/browser/server/api/backend-framework/http/auth/sql/design/optimization
  stem: text('stem').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctOption: text('correct_option').notNull(), // A/B/C/D
  explanation: text('explanation').notNull(),
  links: text('links'), // JSON [{title, url}]
  difficulty: text('difficulty').notNull().default('intermediate'), // beginner/intermediate/advanced
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const programmingSessions = sqliteTable('programming_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userKey: text('user_key').notNull(),
  domains: text('domains').notNull(),
  questionIds: text('question_ids').notNull(),
  currentIndex: integer('current_index').notNull().default(0),
  answers: text('answers'),
  status: text('status').notNull().default('in_progress'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type RSSSourceStatus = typeof rssSourceStatus.$inferSelect;
export type FetchLog = typeof fetchLogs.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ContentSource = typeof contentSources.$inferSelect;
export type NewContentSource = typeof contentSources.$inferInsert;
export type CareerContent = typeof careerContents.$inferSelect;
export type NewCareerContent = typeof careerContents.$inferInsert;
export type ContentCache = typeof contentCache.$inferSelect;
export type ContentFetchLog = typeof contentFetchLogs.$inferSelect;
export type TrainingQuestion = typeof trainingQuestions.$inferSelect;
export type NewTrainingQuestion = typeof trainingQuestions.$inferInsert;
export type TrainingDraft = typeof trainingDrafts.$inferSelect;
export type TrainingAttempt = typeof trainingAttempts.$inferSelect;
export type TrainingEvaluation = typeof trainingEvaluations.$inferSelect;
export type ProgrammingQuestion = typeof programmingQuestions.$inferSelect;
export type NewProgrammingQuestion = typeof programmingQuestions.$inferInsert;
export type ProgrammingSession = typeof programmingSessions.$inferSelect;
