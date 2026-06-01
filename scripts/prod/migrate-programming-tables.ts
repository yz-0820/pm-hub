/**
 * 编程知识训练表结构迁移脚本
 * 运行命令: npx tsx scripts/migrate-programming-tables.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'sqlite.db');
const db = new Database(DB_PATH);

console.log('开始创建编程知识训练表结构...');
console.log('数据库路径:', DB_PATH);

try {
  // 创建 programming_questions 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS programming_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_key TEXT NOT NULL UNIQUE,
      domain TEXT NOT NULL,
      category TEXT NOT NULL,
      stem TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT NOT NULL,
      links TEXT,
      difficulty TEXT NOT NULL DEFAULT 'intermediate',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✓ programming_questions 表创建成功');

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pq_domain ON programming_questions(domain)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pq_category ON programming_questions(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pq_difficulty ON programming_questions(difficulty)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pq_is_active ON programming_questions(is_active)`);
  console.log('✓ 索引创建成功');

  // 创建 programming_sessions 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS programming_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_key TEXT NOT NULL,
      domains TEXT NOT NULL,
      question_ids TEXT NOT NULL,
      current_index INTEGER NOT NULL DEFAULT 0,
      answers TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  console.log('✓ programming_sessions 表创建成功');

  // 验证表是否存在
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'programming%'
  `).all() as Array<{ name: string }>;
  
  console.log('\n已创建的表:');
  tables.forEach(t => console.log(`  - ${t.name}`));

  console.log('\n✅ 迁移完成！');
} catch (error) {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
} finally {
  db.close();
}
