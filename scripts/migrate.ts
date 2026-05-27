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
        is_featured INTEGER NOT NULL DEFAULT 0,
        relevance_score INTEGER NOT NULL DEFAULT 0,
        relevance_meta TEXT
      )
    `);

    try { sqlite.exec(`ALTER TABLE articles ADD COLUMN relevance_score INTEGER NOT NULL DEFAULT 0`); } catch {}
    try { sqlite.exec(`ALTER TABLE articles ADD COLUMN relevance_meta TEXT`); } catch {}

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

    // 创建内容源表
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

    // 创建职业发展内容表
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

    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN quality_score INTEGER NOT NULL DEFAULT 0`); } catch {}
    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN quality_reasons TEXT`); } catch {}
    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN match_score INTEGER NOT NULL DEFAULT 0`); } catch {}
    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN match_keywords TEXT`); } catch {}
    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN match_core_matched INTEGER NOT NULL DEFAULT 0`); } catch {}
    try { sqlite.exec(`ALTER TABLE career_contents ADD COLUMN match_core_missing TEXT`); } catch {}

    // 创建内容缓存表
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

    // 创建内容抓取日志表
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

    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_source ON career_contents(source_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_platform ON career_contents(platform)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_category ON career_contents(category)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_status ON career_contents(status)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_published ON career_contents(published_at)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_career_contents_featured ON career_contents(is_featured)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_content_cache_type ON content_cache(cache_type)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON content_cache(expires_at)`);

    // ===== 题库训练 =====

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS training_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_key TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        industry TEXT NOT NULL,
        product_type TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'intermediate',
        reference_points TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    try { sqlite.exec(`ALTER TABLE training_questions ADD COLUMN question_key TEXT NOT NULL DEFAULT ''`); } catch {}

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS training_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_key TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS training_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_key TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        answer TEXT NOT NULL,
        submitted_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS training_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER NOT NULL UNIQUE,
        total_score INTEGER NOT NULL,
        value_score INTEGER NOT NULL,
        business_score INTEGER NOT NULL,
        design_score INTEGER NOT NULL,
        competition_score INTEGER NOT NULL,
        report TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_training_drafts_user_question ON training_drafts(user_key, question_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_training_questions_active ON training_questions(is_active)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_training_questions_industry ON training_questions(industry)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_training_questions_product_type ON training_questions(product_type)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_training_attempts_user ON training_attempts(user_key)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_training_attempts_question ON training_attempts(question_id)`);

    // ===== 编程知识训练 =====

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS programming_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_key TEXT NOT NULL UNIQUE,
        domain TEXT NOT NULL,
        stem TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL,
        explanation TEXT NOT NULL,
        links TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS programming_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_key TEXT NOT NULL,
        domains TEXT NOT NULL,
        question_ids TEXT NOT NULL,
        current_index INTEGER NOT NULL DEFAULT 0,
        answers TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_programming_questions_domain ON programming_questions(domain)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_programming_sessions_user ON programming_sessions(user_key)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_programming_sessions_status ON programming_sessions(status)`);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
