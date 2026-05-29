import sqlite3
import os

db_path = './data/sqlite.db'

# 确保目录存在
os.makedirs('./data', exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 删除旧表（如果存在）
cursor.execute("DROP TABLE IF EXISTS articles")
cursor.execute("DROP TABLE IF EXISTS rss_source_status")
cursor.execute("DROP TABLE IF EXISTS fetch_logs")

# 创建 articles 表 - 与 schema.ts 和 fetcher.ts 匹配
cursor.execute('''
CREATE TABLE articles (
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
  status TEXT DEFAULT 'published' NOT NULL,
  relevance_score INTEGER DEFAULT 0 NOT NULL,
  relevance_meta TEXT
)
''')

# 创建索引
cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_idx ON articles (slug)')
cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS articles_original_url_idx ON articles (original_url)')
cursor.execute('CREATE INDEX IF NOT EXISTS articles_category_idx ON articles ("category")')
cursor.execute('CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles (published_at)')
cursor.execute('CREATE INDEX IF NOT EXISTS articles_status_idx ON articles ("status")')
cursor.execute('CREATE INDEX IF NOT EXISTS articles_source_idx ON articles (source_id)')

# 创建 rss_source_status 表
cursor.execute('''
CREATE TABLE rss_source_status (
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
)
''')

cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS rss_source_status_source_id_idx ON rss_source_status (source_id)')
cursor.execute('CREATE INDEX IF NOT EXISTS rss_source_status_category_idx ON rss_source_status ("category")')
cursor.execute('CREATE INDEX IF NOT EXISTS rss_source_status_status_idx ON rss_source_status ("status")')

# 创建 fetch_logs 表
cursor.execute('''
CREATE TABLE fetch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  total_sources INTEGER DEFAULT 0 NOT NULL,
  successful_sources INTEGER DEFAULT 0 NOT NULL,
  total_new_articles INTEGER DEFAULT 0 NOT NULL,
  errors TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
)
''')

conn.commit()
conn.close()

print("Database initialized successfully!")
