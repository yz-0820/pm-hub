import './load-env';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required to run migrations.');
}

const databaseUrl = connectionString;

function splitStatements(sqlText: string): string[] {
  return sqlText
    .split('--> statement-breakpoint')
    .flatMap((chunk) => chunk.split(/;\s*(?:\r?\n|$)/))
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function migrate() {
  const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => {} });
  const migrationsDir = join(process.cwd(), 'lib', 'db', 'migrations');
  const migrationFiles = [
    '0000_initial_postgres.sql',
    ...readdirSync(migrationsDir)
      .filter((fileName) => /^\d{4}_.+\.sql$/.test(fileName) && !fileName.startsWith('0000_'))
      .sort(),
  ];
  let lockAcquired = false;
  try {
    await sql`SELECT pg_advisory_lock(hashtext('pm-hub:migrations'))`;
    lockAcquired = true;
    await sql`
      CREATE TABLE IF NOT EXISTS pmhub_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    const appliedRows = await sql<{ name: string }[]>`SELECT name FROM pmhub_migrations`;
    const applied = new Set(appliedRows.map((row) => row.name));
    const pendingFiles = migrationFiles.filter((fileName) => !applied.has(fileName));

    console.log(`Applying ${pendingFiles.length} pending PostgreSQL migration files...`);
    for (const fileName of pendingFiles) {
      const statements = splitStatements(readFileSync(join(migrationsDir, fileName), 'utf8'));
      await sql.begin(async (transaction) => {
        for (const statement of statements) {
          await transaction.unsafe(statement);
        }
        await transaction`INSERT INTO pmhub_migrations (name) VALUES (${fileName})`;
      });
    }
    console.log('Postgres migrations completed successfully.');
  } finally {
    if (lockAcquired) {
      await sql`SELECT pg_advisory_unlock(hashtext('pm-hub:migrations'))`;
    }
    await sql.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
