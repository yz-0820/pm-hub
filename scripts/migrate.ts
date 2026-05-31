import { db } from '@/lib/db/client';
import { articles, rssSourceStatus, fetchLogs } from '@/lib/db/schema';

async function migrate() {
  console.log('Running migrations...');
  
  try {
    // 创建表（如果不存在）
    const sqlite = (db as any).$client;
    
    // 创建文章表
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        slug TEXT UNIQUE,
        original_url TEXT NOT NULL UNIQUE,
        source_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        category TEXT NOT NULL,
        author TEXT,
        image_url TEXT,
        published_at INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        view_count INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0
      )
    `);

    // 创建RSS源状态表
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS rss_source_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL UNIQUE,
        source_name TEXT NOT NULL,
        last_fetch_at INTEGER,
        last_fetch_count INTEGER DEFAULT 0,
        last_error TEXT,
        last_error_at INTEGER,
        total_articles INTEGER DEFAULT 0,
        is_healthy INTEGER DEFAULT 1
      )
    `);

    // 创建抓取日志表
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS fetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        total_sources INTEGER DEFAULT 0,
        successful_sources INTEGER DEFAULT 0,
        total_new_articles INTEGER DEFAULT 0,
        errors TEXT
      )
    `);

    // 创建索引
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured)`);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
