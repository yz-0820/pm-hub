CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"relevance_score" integer DEFAULT 0 NOT NULL,
	"relevance_meta" text
);
--> statement-breakpoint
CREATE TABLE "career_contents" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"quality_score" integer DEFAULT 0 NOT NULL,
	"quality_reasons" text,
	"match_score" integer DEFAULT 0 NOT NULL,
	"match_keywords" text,
	"match_core_matched" boolean DEFAULT false NOT NULL,
	"match_core_missing" text,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"cache_type" text NOT NULL,
	"data" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_fetch_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"fetched_count" integer DEFAULT 0 NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors" text
);
--> statement-breakpoint
CREATE TABLE "content_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_type" text NOT NULL,
	"platform" text NOT NULL,
	"category" text NOT NULL,
	"url" text NOT NULL,
	"api_key" text,
	"config" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"fetch_interval" integer DEFAULT 3600 NOT NULL,
	"last_fetch_at" timestamp with time zone,
	"last_fetch_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"total_contents" integer DEFAULT 0 NOT NULL,
	"is_healthy" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fetch_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"total_sources" integer DEFAULT 0 NOT NULL,
	"successful_sources" integer DEFAULT 0 NOT NULL,
	"total_new_articles" integer DEFAULT 0 NOT NULL,
	"errors" text
);
--> statement-breakpoint
CREATE TABLE "programming_questions" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programming_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" text NOT NULL,
	"domains" text NOT NULL,
	"question_ids" text NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"answers" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"resource_type" text NOT NULL,
	"url" text NOT NULL,
	"cover_image" text,
	"author" text,
	"source_name" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT 'all' NOT NULL,
	"tags" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rss_source_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"last_fetch_at" timestamp with time zone,
	"last_fetch_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"total_articles" integer DEFAULT 0 NOT NULL,
	"is_healthy" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" text NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_key" text NOT NULL,
	"question_id" integer NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"total_score" integer NOT NULL,
	"value_score" integer NOT NULL,
	"business_score" integer NOT NULL,
	"design_score" integer NOT NULL,
	"competition_score" integer NOT NULL,
	"report" text NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_key" text NOT NULL,
	"title" text NOT NULL,
	"logo_url" text,
	"prompt" text NOT NULL,
	"industry" text NOT NULL,
	"product_type" text NOT NULL,
	"difficulty" text DEFAULT 'intermediate' NOT NULL,
	"reference_points" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_original_url_idx" ON "articles" USING btree ("original_url");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "articles_relevance_idx" ON "articles" USING btree ("relevance_score");--> statement-breakpoint
CREATE UNIQUE INDEX "career_contents_original_url_idx" ON "career_contents" USING btree ("original_url");--> statement-breakpoint
CREATE INDEX "career_contents_category_idx" ON "career_contents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "career_contents_source_idx" ON "career_contents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "career_contents_platform_idx" ON "career_contents" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "career_contents_type_idx" ON "career_contents" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "career_contents_status_idx" ON "career_contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "career_contents_published_at_idx" ON "career_contents" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "career_contents_quality_idx" ON "career_contents" USING btree ("quality_score");--> statement-breakpoint
CREATE UNIQUE INDEX "content_cache_key_idx" ON "content_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "content_cache_expires_idx" ON "content_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "content_fetch_logs_source_idx" ON "content_fetch_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "content_fetch_logs_started_at_idx" ON "content_fetch_logs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_sources_source_id_idx" ON "content_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "content_sources_platform_idx" ON "content_sources" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "content_sources_category_idx" ON "content_sources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "content_sources_enabled_idx" ON "content_sources" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "programming_questions_question_key_idx" ON "programming_questions" USING btree ("question_key");--> statement-breakpoint
CREATE INDEX "programming_questions_domain_idx" ON "programming_questions" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "programming_questions_active_idx" ON "programming_questions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "resources_category_idx" ON "resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "resources_type_idx" ON "resources" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "resources_featured_idx" ON "resources" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "rss_source_status_source_id_idx" ON "rss_source_status" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_evaluations_attempt_idx" ON "training_evaluations" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "training_questions_question_key_idx" ON "training_questions" USING btree ("question_key");--> statement-breakpoint
CREATE INDEX "training_questions_active_idx" ON "training_questions" USING btree ("is_active");