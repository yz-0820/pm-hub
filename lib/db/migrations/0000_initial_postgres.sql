CREATE TABLE IF NOT EXISTS "articles" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "content" text NOT NULL,
  "slug" text,
  "original_url" text NOT NULL,
  "source_id" text NOT NULL,
  "source_name" text NOT NULL,
  "category" text NOT NULL,
  "author" text,
  "image_url" text,
  "published_at" timestamptz NOT NULL,
  "fetched_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "view_count" integer NOT NULL DEFAULT 0,
  "is_featured" boolean NOT NULL DEFAULT false,
  "relevance_score" integer NOT NULL DEFAULT 0,
  "relevance_meta" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_unique" ON "articles" ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_original_url_unique" ON "articles" ("original_url");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_category" ON "articles" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_published_at" ON "articles" ("published_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_source_id" ON "articles" ("source_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_is_featured" ON "articles" ("is_featured");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rss_source_status" (
  "id" serial PRIMARY KEY,
  "source_id" text NOT NULL,
  "source_name" text NOT NULL,
  "last_fetch_at" timestamptz,
  "last_fetch_count" integer DEFAULT 0,
  "last_error" text,
  "last_error_at" timestamptz,
  "total_articles" integer DEFAULT 0,
  "is_healthy" boolean DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rss_source_status_source_id_unique" ON "rss_source_status" ("source_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fetch_logs" (
  "id" serial PRIMARY KEY,
  "started_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "total_sources" integer DEFAULT 0,
  "successful_sources" integer DEFAULT 0,
  "total_new_articles" integer DEFAULT 0,
  "errors" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL,
  "resource_type" text NOT NULL,
  "url" text NOT NULL,
  "cover_image" text,
  "author" text,
  "source_name" text NOT NULL DEFAULT '',
  "difficulty" text NOT NULL DEFAULT 'all',
  "tags" text,
  "is_featured" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "view_count" integer NOT NULL DEFAULT 0,
  "published_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_sources" (
  "id" serial PRIMARY KEY,
  "source_id" text NOT NULL,
  "source_name" text NOT NULL,
  "source_type" text NOT NULL,
  "platform" text NOT NULL,
  "category" text NOT NULL,
  "url" text NOT NULL,
  "api_key" text,
  "config" text,
  "enabled" boolean NOT NULL DEFAULT true,
  "weight" integer NOT NULL DEFAULT 10,
  "fetch_interval" integer NOT NULL DEFAULT 3600,
  "last_fetch_at" timestamptz,
  "last_fetch_count" integer DEFAULT 0,
  "last_error" text,
  "last_error_at" timestamptz,
  "total_contents" integer DEFAULT 0,
  "is_healthy" boolean DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_sources_source_id_unique" ON "content_sources" ("source_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "career_contents" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "content" text,
  "source_id" text NOT NULL,
  "source_name" text NOT NULL,
  "platform" text NOT NULL,
  "original_url" text NOT NULL,
  "original_id" text,
  "author" text,
  "author_id" text,
  "author_avatar" text,
  "content_type" text NOT NULL,
  "category" text NOT NULL,
  "tags" text,
  "cover_image" text,
  "video_url" text,
  "video_duration" integer,
  "images" text,
  "view_count" integer DEFAULT 0,
  "like_count" integer DEFAULT 0,
  "comment_count" integer DEFAULT 0,
  "share_count" integer DEFAULT 0,
  "status" text NOT NULL DEFAULT 'pending',
  "is_featured" boolean NOT NULL DEFAULT false,
  "priority" integer NOT NULL DEFAULT 0,
  "quality_score" integer NOT NULL DEFAULT 0,
  "quality_reasons" text,
  "match_score" integer NOT NULL DEFAULT 0,
  "match_keywords" text,
  "match_core_matched" boolean NOT NULL DEFAULT false,
  "match_core_missing" text,
  "published_at" timestamptz NOT NULL,
  "fetched_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_source" ON "career_contents" ("source_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_platform" ON "career_contents" ("platform");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_category" ON "career_contents" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_status" ON "career_contents" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_published" ON "career_contents" ("published_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_career_contents_featured" ON "career_contents" ("is_featured");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_cache" (
  "id" serial PRIMARY KEY,
  "cache_key" text NOT NULL,
  "cache_type" text NOT NULL,
  "data" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_cache_cache_key_unique" ON "content_cache" ("cache_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_cache_type" ON "content_cache" ("cache_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_cache_expires" ON "content_cache" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_fetch_logs" (
  "id" serial PRIMARY KEY,
  "source_id" text NOT NULL,
  "started_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "fetched_count" integer DEFAULT 0,
  "new_count" integer DEFAULT 0,
  "updated_count" integer DEFAULT 0,
  "error_count" integer DEFAULT 0,
  "errors" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_questions" (
  "id" serial PRIMARY KEY,
  "question_key" text NOT NULL,
  "title" text NOT NULL,
  "logo_url" text,
  "prompt" text NOT NULL,
  "industry" text NOT NULL,
  "product_type" text NOT NULL,
  "difficulty" text NOT NULL DEFAULT 'intermediate',
  "reference_points" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "training_questions_question_key_unique" ON "training_questions" ("question_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_questions_active" ON "training_questions" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_questions_industry" ON "training_questions" ("industry");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_questions_product_type" ON "training_questions" ("product_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_drafts" (
  "id" serial PRIMARY KEY,
  "user_key" text NOT NULL,
  "question_id" integer NOT NULL,
  "content" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_training_drafts_user_question" ON "training_drafts" ("user_key", "question_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_attempts" (
  "id" serial PRIMARY KEY,
  "user_key" text NOT NULL,
  "question_id" integer NOT NULL,
  "answer" text NOT NULL,
  "submitted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_attempts_user" ON "training_attempts" ("user_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_attempts_question" ON "training_attempts" ("question_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_evaluations" (
  "id" serial PRIMARY KEY,
  "attempt_id" integer NOT NULL,
  "total_score" integer NOT NULL,
  "value_score" integer NOT NULL,
  "business_score" integer NOT NULL,
  "design_score" integer NOT NULL,
  "competition_score" integer NOT NULL,
  "report" text NOT NULL,
  "model" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "training_evaluations_attempt_id_unique" ON "training_evaluations" ("attempt_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programming_questions" (
  "id" serial PRIMARY KEY,
  "question_key" text NOT NULL,
  "domain" text NOT NULL,
  "category" text NOT NULL,
  "stem" text NOT NULL,
  "option_a" text NOT NULL,
  "option_b" text NOT NULL,
  "option_c" text NOT NULL,
  "option_d" text NOT NULL,
  "correct_option" text NOT NULL,
  "explanation" text NOT NULL,
  "links" text,
  "difficulty" text NOT NULL DEFAULT 'intermediate',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "programming_questions_question_key_unique" ON "programming_questions" ("question_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programming_questions_domain" ON "programming_questions" ("domain");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programming_sessions" (
  "id" serial PRIMARY KEY,
  "user_key" text NOT NULL,
  "domains" text NOT NULL,
  "question_ids" text NOT NULL,
  "current_index" integer NOT NULL DEFAULT 0,
  "answers" text,
  "status" text NOT NULL DEFAULT 'in_progress',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programming_sessions_user" ON "programming_sessions" ("user_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_programming_sessions_status" ON "programming_sessions" ("status");
