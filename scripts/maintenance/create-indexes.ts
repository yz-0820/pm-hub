/**
 * 创建职业发展系统的数据库性能索引
 * 运行: npx tsx scripts/create-indexes.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data/sqlite.db');
const db = new Database(DB_PATH);

console.log('[Index] Creating performance indexes...');

const indexes = [
  // career_contents: 核心查询索引
  `CREATE INDEX IF NOT EXISTS idx_cc_status_category ON career_contents(status, category)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_category_published ON career_contents(category, published_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_platform ON career_contents(platform)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_source_original ON career_contents(source_id, original_url)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_content_type ON career_contents(content_type)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_status_published ON career_contents(status, published_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cc_category_status_published ON career_contents(category, status, published_at DESC)`,

  // content_cache: 缓存查询索引
  `CREATE INDEX IF NOT EXISTS idx_cache_key ON content_cache(cache_key)`,
  `CREATE INDEX IF NOT EXISTS idx_cache_type_expires ON content_cache(cache_type, expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_cache_expires ON content_cache(expires_at)`,

  // content_sources: 源管理索引
  `CREATE INDEX IF NOT EXISTS idx_cs_enabled ON content_sources(enabled)`,
  `CREATE INDEX IF NOT EXISTS idx_cs_platform ON content_sources(platform)`,
  `CREATE INDEX IF NOT EXISTS idx_cs_category ON content_sources(category)`,
];

let created = 0;
for (const sql of indexes) {
  try {
    db.exec(sql);
    created++;
  } catch (e) {
    console.error(`  FAILED: ${sql.substring(0, 60)}... - ${e}`);
  }
}

// 验证索引
const indexList = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all() as Array<{ name: string }>;
console.log(`\n[Index] Created ${created}/${indexes.length} indexes`);
console.log(`[Index] Total indexes: ${indexList.length}`);
indexList.forEach(i => console.log(`  - ${i.name}`));

db.close();
console.log('[Index] Done');
