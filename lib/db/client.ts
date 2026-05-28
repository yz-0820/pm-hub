import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import * as schema from './schema';

const configuredDbPath = process.env.DATABASE_URL || './data/sqlite.db';

function copyIfExists(source: string, target: string) {
  if (existsSync(source) && !existsSync(target)) {
    copyFileSync(source, target);
  }
}

function prepareDatabasePath(): string {
  if (process.env.VERCEL === '1' && !configuredDbPath.startsWith('/tmp/')) {
    const source = resolve(configuredDbPath);
    const targetDir = '/tmp/pm-hub-db';
    const target = join(targetDir, 'sqlite.db');

    mkdirSync(targetDir, { recursive: true });
    copyIfExists(source, target);
    copyIfExists(`${source}-wal`, `${target}-wal`);
    copyIfExists(`${source}-shm`, `${target}-shm`);

    return target;
  }

  try {
    mkdirSync(dirname(configuredDbPath), { recursive: true });
  } catch {
    // Directory may already exist or be read-only in constrained environments.
  }

  return configuredDbPath;
}

const dbPath = prepareDatabasePath();
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export { sqlite };
export { schema };
