/**
 * 职业发展内容系统初始化脚本
 * 用于初始化数据库表和内容源配置
 */

import { initContentSources } from '@/lib/career/fetcher';
import { db, sqlite } from '@/lib/db/client';

async function initCareerSystem() {
  console.log('Initializing Career Content System...\n');

  try {
    // 1. 创建内容源表
    console.log('1. Creating content_sources table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS content_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL UNIQUE,
        source_name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        platform TEXT NOT NULL,
        category TEXT NOT NULL,
        url TEXT NOT NULL,
        api_key TEXT,
        config TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        weight INTEGER NOT NULL DEFAULT 10,
        fetch_interval INTEGER NOT NULL DEFAULT 3600,
        last_fetch_at INTEGER,
        last_fetch_count INTEGER DEFAULT 0,
        last_error TEXT,
        last_error_at INTEGER,
        total_contents INTEGER DEFAULT 0,
        is_healthy INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('   ✓ content_sources table created\n');

    // 2. 创建职业发展内容表
    console.log('2. Creating career_contents table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS career_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        source_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        platform TEXT NOT NULL,
        original_url TEXT NOT NULL,
        original_id TEXT,
        author TEXT,
        author_id TEXT,
        author_avatar TEXT,
        content_type TEXT NOT NULL DEFAULT 'article',
        category TEXT NOT NULL,
        tags TEXT,
        cover_image TEXT,
        video_url TEXT,
        video_duration INTEGER,
        images TEXT,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        is_featured INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        published_at INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('   ✓ career_contents table created\n');

    // 3. 创建内容缓存表
    console.log('3. Creating content_cache table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS content_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT NOT NULL UNIQUE,
        cache_type TEXT NOT NULL,
        data TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log('   ✓ content_cache table created\n');

    // 4. 创建内容抓取日志表
    console.log('4. Creating content_fetch_logs table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS content_fetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        fetched_count INTEGER DEFAULT 0,
        new_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        errors TEXT
      )
    `);
    console.log('   ✓ content_fetch_logs table created\n');

    // 5. 创建索引
    console.log('5. Creating indexes...');
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_source ON career_contents(source_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_platform ON career_contents(platform)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_category ON career_contents(category)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_status ON career_contents(status)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_published ON career_contents(published_at)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_featured ON career_contents(is_featured)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_content_cache_type ON content_cache(cache_type)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON content_cache(expires_at)`);
    console.log('   ✓ Indexes created\n');

    // 6. 初始化内容源配置
    console.log('6. Initializing content sources...');
    await initContentSources();
    console.log('   ✓ Content sources initialized\n');

    console.log('========================================');
    console.log('Career Content System initialized successfully!');
    console.log('========================================\n');

    console.log('Next steps:');
    console.log('1. Run content fetch: POST /api/career/contents');
    console.log('2. Set up scheduled fetch using cron job or similar');
    console.log('3. Visit /career to view the content');

  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

// 运行初始化
initCareerSystem();
