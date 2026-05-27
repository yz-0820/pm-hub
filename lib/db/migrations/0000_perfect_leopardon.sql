CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`slug` text,
	`original_url` text NOT NULL,
	`source_id` text NOT NULL,
	`source_name` text NOT NULL,
	`category` text NOT NULL,
	`author` text,
	`image_url` text,
	`published_at` integer NOT NULL,
	`fetched_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `articles_original_url_unique` ON `articles` (`original_url`);--> statement-breakpoint
CREATE TABLE `fetch_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`total_sources` integer DEFAULT 0,
	`successful_sources` integer DEFAULT 0,
	`total_new_articles` integer DEFAULT 0,
	`errors` text
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`resource_type` text NOT NULL,
	`url` text NOT NULL,
	`cover_image` text,
	`author` text,
	`difficulty` text DEFAULT 'all' NOT NULL,
	`tags` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`published_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rss_source_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` text NOT NULL,
	`source_name` text NOT NULL,
	`last_fetch_at` integer,
	`last_fetch_count` integer DEFAULT 0,
	`last_error` text,
	`last_error_at` integer,
	`total_articles` integer DEFAULT 0,
	`is_healthy` integer DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rss_source_status_source_id_unique` ON `rss_source_status` (`source_id`);