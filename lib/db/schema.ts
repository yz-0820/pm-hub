import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const articles = pgTable(
  'articles',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    content: text('content').notNull(),
    slug: text('slug'),
    originalUrl: text('original_url').notNull(),
    sourceId: text('source_id').notNull(),
    sourceName: text('source_name').notNull(),
    category: text('category').notNull(),
    author: text('author'),
    imageUrl: text('image_url'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
    viewCount: integer('view_count').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
    relevanceScore: integer('relevance_score').notNull().default(0),
    relevanceMeta: text('relevance_meta'),
  },
  (table) => ({
    slugIdx: uniqueIndex('articles_slug_idx').on(table.slug),
    originalUrlIdx: uniqueIndex('articles_original_url_idx').on(table.originalUrl),
    categoryIdx: index('articles_category_idx').on(table.category),
    publishedAtIdx: index('articles_published_at_idx').on(table.publishedAt),
    relevanceIdx: index('articles_relevance_idx').on(table.relevanceScore),
  })
);

export const rssSourceStatus = pgTable(
  'rss_source_status',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceName: text('source_name').notNull(),
    lastFetchAt: timestamp('last_fetch_at', { withTimezone: true }),
    lastFetchCount: integer('last_fetch_count').notNull().default(0),
    lastError: text('last_error'),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    totalArticles: integer('total_articles').notNull().default(0),
    isHealthy: boolean('is_healthy').notNull().default(true),
  },
  (table) => ({
    sourceIdIdx: uniqueIndex('rss_source_status_source_id_idx').on(table.sourceId),
  })
);

export const fetchLogs = pgTable('fetch_logs', {
  id: serial('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  totalSources: integer('total_sources').notNull().default(0),
  successfulSources: integer('successful_sources').notNull().default(0),
  totalNewArticles: integer('total_new_articles').notNull().default(0),
  errors: text('errors'),
});

export const resources = pgTable(
  'resources',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    resourceType: text('resource_type').notNull(),
    url: text('url').notNull(),
    coverImage: text('cover_image'),
    author: text('author'),
    sourceName: text('source_name').notNull().default(''),
    difficulty: text('difficulty').notNull().default('all'),
    tags: text('tags'),
    isFeatured: boolean('is_featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    categoryIdx: index('resources_category_idx').on(table.category),
    typeIdx: index('resources_type_idx').on(table.resourceType),
    featuredIdx: index('resources_featured_idx').on(table.isFeatured),
  })
);

export const contentSources = pgTable(
  'content_sources',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceName: text('source_name').notNull(),
    sourceType: text('source_type').notNull(),
    platform: text('platform').notNull(),
    category: text('category').notNull(),
    url: text('url').notNull(),
    apiKey: text('api_key'),
    config: text('config'),
    enabled: boolean('enabled').notNull().default(true),
    weight: integer('weight').notNull().default(10),
    fetchInterval: integer('fetch_interval').notNull().default(3600),
    lastFetchAt: timestamp('last_fetch_at', { withTimezone: true }),
    lastFetchCount: integer('last_fetch_count').notNull().default(0),
    lastError: text('last_error'),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    totalContents: integer('total_contents').notNull().default(0),
    isHealthy: boolean('is_healthy').notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => ({
    sourceIdIdx: uniqueIndex('content_sources_source_id_idx').on(table.sourceId),
    platformIdx: index('content_sources_platform_idx').on(table.platform),
    categoryIdx: index('content_sources_category_idx').on(table.category),
    enabledIdx: index('content_sources_enabled_idx').on(table.enabled),
  })
);

export const careerContents = pgTable(
  'career_contents',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    content: text('content'),
    sourceId: text('source_id').notNull(),
    sourceName: text('source_name').notNull(),
    platform: text('platform').notNull(),
    originalUrl: text('original_url').notNull(),
    originalId: text('original_id'),
    author: text('author'),
    authorId: text('author_id'),
    authorAvatar: text('author_avatar'),
    contentType: text('content_type').notNull(),
    category: text('category').notNull(),
    tags: text('tags'),
    coverImage: text('cover_image'),
    videoUrl: text('video_url'),
    videoDuration: integer('video_duration'),
    images: text('images'),
    viewCount: integer('view_count').notNull().default(0),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    shareCount: integer('share_count').notNull().default(0),
    status: text('status').notNull().default('pending'),
    isFeatured: boolean('is_featured').notNull().default(false),
    priority: integer('priority').notNull().default(0),
    qualityScore: integer('quality_score').notNull().default(0),
    qualityReasons: text('quality_reasons'),
    matchScore: integer('match_score').notNull().default(0),
    matchKeywords: text('match_keywords'),
    matchCoreMatched: boolean('match_core_matched').notNull().default(false),
    matchCoreMissing: text('match_core_missing'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    originalUrlIdx: uniqueIndex('career_contents_original_url_idx').on(table.originalUrl),
    categoryIdx: index('career_contents_category_idx').on(table.category),
    sourceIdx: index('career_contents_source_idx').on(table.sourceId),
    platformIdx: index('career_contents_platform_idx').on(table.platform),
    typeIdx: index('career_contents_type_idx').on(table.contentType),
    statusIdx: index('career_contents_status_idx').on(table.status),
    publishedAtIdx: index('career_contents_published_at_idx').on(table.publishedAt),
    qualityIdx: index('career_contents_quality_idx').on(table.qualityScore),
  })
);

export const contentCache = pgTable(
  'content_cache',
  {
    id: serial('id').primaryKey(),
    cacheKey: text('cache_key').notNull(),
    cacheType: text('cache_type').notNull(),
    data: text('data').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => ({
    cacheKeyIdx: uniqueIndex('content_cache_key_idx').on(table.cacheKey),
    expiresAtIdx: index('content_cache_expires_idx').on(table.expiresAt),
  })
);

export const contentFetchLogs = pgTable(
  'content_fetch_logs',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    fetchedCount: integer('fetched_count').notNull().default(0),
    newCount: integer('new_count').notNull().default(0),
    updatedCount: integer('updated_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    errors: text('errors'),
  },
  (table) => ({
    sourceIdx: index('content_fetch_logs_source_idx').on(table.sourceId),
    startedAtIdx: index('content_fetch_logs_started_at_idx').on(table.startedAt),
  })
);

export const trainingQuestions = pgTable(
  'training_questions',
  {
    id: serial('id').primaryKey(),
    questionKey: text('question_key').notNull(),
    title: text('title').notNull(),
    logoUrl: text('logo_url'),
    prompt: text('prompt').notNull(),
    industry: text('industry').notNull(),
    productType: text('product_type').notNull(),
    difficulty: text('difficulty').notNull().default('intermediate'),
    referencePoints: text('reference_points'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => ({
    questionKeyIdx: uniqueIndex('training_questions_question_key_idx').on(table.questionKey),
    activeIdx: index('training_questions_active_idx').on(table.isActive),
  })
);

export const trainingDrafts = pgTable('training_drafts', {
  id: serial('id').primaryKey(),
  userKey: text('user_key').notNull(),
  questionId: integer('question_id').notNull(),
  content: text('content').notNull().default(''),
  updatedAt,
});

export const trainingAttempts = pgTable('training_attempts', {
  id: serial('id').primaryKey(),
  userKey: text('user_key').notNull(),
  questionId: integer('question_id').notNull(),
  answer: text('answer').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt,
});

export const trainingEvaluations = pgTable(
  'training_evaluations',
  {
    id: serial('id').primaryKey(),
    attemptId: integer('attempt_id').notNull(),
    totalScore: integer('total_score').notNull(),
    valueScore: integer('value_score').notNull(),
    businessScore: integer('business_score').notNull(),
    designScore: integer('design_score').notNull(),
    competitionScore: integer('competition_score').notNull(),
    report: text('report').notNull(),
    model: text('model').notNull().default(''),
    createdAt,
  },
  (table) => ({
    attemptIdx: uniqueIndex('training_evaluations_attempt_idx').on(table.attemptId),
  })
);

export const programmingQuestions = pgTable(
  'programming_questions',
  {
    id: serial('id').primaryKey(),
    questionKey: text('question_key').notNull(),
    domain: text('domain').notNull(),
    category: text('category').notNull(),
    stem: text('stem').notNull(),
    optionA: text('option_a').notNull(),
    optionB: text('option_b').notNull(),
    optionC: text('option_c').notNull(),
    optionD: text('option_d').notNull(),
    correctOption: text('correct_option').notNull(),
    explanation: text('explanation').notNull(),
    links: text('links'),
    difficulty: text('difficulty').notNull().default('intermediate'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => ({
    questionKeyIdx: uniqueIndex('programming_questions_question_key_idx').on(table.questionKey),
    domainIdx: index('programming_questions_domain_idx').on(table.domain),
    activeIdx: index('programming_questions_active_idx').on(table.isActive),
  })
);

export const programmingSessions = pgTable('programming_sessions', {
  id: serial('id').primaryKey(),
  userKey: text('user_key').notNull(),
  domains: text('domains').notNull(),
  questionIds: text('question_ids').notNull(),
  currentIndex: integer('current_index').notNull().default(0),
  answers: text('answers'),
  status: text('status').notNull().default('in_progress'),
  createdAt,
  updatedAt,
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type RSSSourceStatus = typeof rssSourceStatus.$inferSelect;
export type NewRSSSourceStatus = typeof rssSourceStatus.$inferInsert;
export type FetchLog = typeof fetchLogs.$inferSelect;
export type NewFetchLog = typeof fetchLogs.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ContentSource = typeof contentSources.$inferSelect;
export type NewContentSource = typeof contentSources.$inferInsert;
export type CareerContent = typeof careerContents.$inferSelect;
export type NewCareerContent = typeof careerContents.$inferInsert;
export type ContentCache = typeof contentCache.$inferSelect;
export type NewContentCache = typeof contentCache.$inferInsert;
export type ContentFetchLog = typeof contentFetchLogs.$inferSelect;
export type NewContentFetchLog = typeof contentFetchLogs.$inferInsert;
export type TrainingQuestion = typeof trainingQuestions.$inferSelect;
export type NewTrainingQuestion = typeof trainingQuestions.$inferInsert;
export type TrainingDraft = typeof trainingDrafts.$inferSelect;
export type NewTrainingDraft = typeof trainingDrafts.$inferInsert;
export type TrainingAttempt = typeof trainingAttempts.$inferSelect;
export type NewTrainingAttempt = typeof trainingAttempts.$inferInsert;
export type TrainingEvaluation = typeof trainingEvaluations.$inferSelect;
export type NewTrainingEvaluation = typeof trainingEvaluations.$inferInsert;
export type ProgrammingQuestion = typeof programmingQuestions.$inferSelect;
export type NewProgrammingQuestion = typeof programmingQuestions.$inferInsert;
export type ProgrammingSession = typeof programmingSessions.$inferSelect;
export type NewProgrammingSession = typeof programmingSessions.$inferInsert;
