import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';

// 确保数据库目录存在
import { mkdirSync } from 'fs';
import { dirname } from 'path';

try {
  mkdirSync(dirname(dbPath), { recursive: true });
} catch {
  // 目录已存在或无法创建
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

// Export raw sqlite instance for direct SQL queries
export { sqlite };
export { schema };
