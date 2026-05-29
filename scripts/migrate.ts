import { readFileSync } from 'node:fs';
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
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  const migrationPath = join(process.cwd(), 'lib', 'db', 'migrations', '0000_initial_postgres.sql');
  const statements = splitStatements(readFileSync(migrationPath, 'utf8'));

  console.log(`Running ${statements.length} Postgres migration statements...`);

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    console.log('Postgres migrations completed successfully.');
  } finally {
    await sql.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
