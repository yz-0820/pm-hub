-- 初始化 SQLite 数据库表

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT,
  original_url TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT,
  image_url TEXT,
  published_at INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  read_time INTEGER DEFAULT 5 NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  is_featured INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'published' NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug);
CREATE UNIQUE INDEX IF NOT EXISTS articles_original_url_idx ON articles (original_url);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles ([category]);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles (published_at);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles ([status]);
CREATE INDEX IF NOT EXISTS articles_source_idx ON articles (source_id);

CREATE TABLE IF NOT EXISTS rss_source_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  last_fetched_at INTEGER,
  last_success_at INTEGER,
  last_error_at INTEGER,
  last_error TEXT,
  consecutive_errors INTEGER DEFAULT 0 NOT NULL,
  total_fetched INTEGER DEFAULT 0 NOT NULL,
  total_errors INTEGER DEFAULT 0 NOT NULL,
  average_articles_per_fetch INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS rss_source_status_source_id_idx ON rss_source_status (source_id);
CREATE INDEX IF NOT EXISTS rss_source_status_category_idx ON rss_source_status ([category]);
CREATE INDEX IF NOT EXISTS rss_source_status_status_idx ON rss_source_status ([status]);

CREATE TABLE IF NOT EXISTS fetch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  total_sources INTEGER DEFAULT 0 NOT NULL,
  successful_sources INTEGER DEFAULT 0 NOT NULL,
  total_new_articles INTEGER DEFAULT 0 NOT NULL,
  errors TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
