import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'sqlite.db');
const db = new Database(dbPath);

const toDelete = db
  .prepare(`SELECT COUNT(1) AS c FROM career_contents WHERE category='all' AND content_type IN ('video','short_video')`)
  .get() as { c: number };

const info = db
  .prepare(`DELETE FROM career_contents WHERE category='all' AND content_type IN ('video','short_video')`)
  .run();

db.prepare(`DELETE FROM content_cache`).run();

console.log(`[Career Clean] DB: ${dbPath}`);
console.log(`[Career Clean] to_delete=${toDelete.c}`);
console.log(`[Career Clean] deleted=${info.changes}`);

db.close();
