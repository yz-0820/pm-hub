import Database from 'better-sqlite3';
import postgres from 'postgres';

type TableSpec = {
  table: string;
  columns: string[];
  booleans?: string[];
  timestamps?: string[];
  defaults?: Record<string, unknown>;
};

const sourcePath = process.env.SQLITE_SOURCE_PATH || './data/sqlite.db';
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required to import SQLite data.');
}

const databaseUrl = connectionString;

const tables: TableSpec[] = [
  {
    table: 'articles',
    columns: [
      'id',
      'title',
      'summary',
      'content',
      'slug',
      'original_url',
      'source_id',
      'source_name',
      'category',
      'author',
      'image_url',
      'published_at',
      'fetched_at',
      'created_at',
      'updated_at',
      'view_count',
      'is_featured',
      'relevance_score',
      'relevance_meta',
    ],
    booleans: ['is_featured'],
    timestamps: ['published_at', 'fetched_at', 'created_at', 'updated_at'],
  },
  {
    table: 'rss_source_status',
    columns: [
      'id',
      'source_id',
      'source_name',
      'last_fetch_at',
      'last_fetch_count',
      'last_error',
      'last_error_at',
      'total_articles',
      'is_healthy',
    ],
    booleans: ['is_healthy'],
    timestamps: ['last_fetch_at', 'last_error_at'],
  },
  {
    table: 'fetch_logs',
    columns: [
      'id',
      'started_at',
      'completed_at',
      'total_sources',
      'successful_sources',
      'total_new_articles',
      'errors',
    ],
    timestamps: ['started_at', 'completed_at'],
  },
  {
    table: 'resources',
    columns: [
      'id',
      'title',
      'description',
      'category',
      'resource_type',
      'url',
      'cover_image',
      'author',
      'source_name',
      'difficulty',
      'tags',
      'is_featured',
      'sort_order',
      'view_count',
      'published_at',
      'created_at',
      'updated_at',
    ],
    booleans: ['is_featured'],
    timestamps: ['published_at', 'created_at', 'updated_at'],
    defaults: { source_name: '' },
  },
  {
    table: 'content_sources',
    columns: [
      'id',
      'source_id',
      'source_name',
      'source_type',
      'platform',
      'category',
      'url',
      'api_key',
      'config',
      'enabled',
      'weight',
      'fetch_interval',
      'last_fetch_at',
      'last_fetch_count',
      'last_error',
      'last_error_at',
      'total_contents',
      'is_healthy',
      'created_at',
      'updated_at',
    ],
    booleans: ['enabled', 'is_healthy'],
    timestamps: ['last_fetch_at', 'last_error_at', 'created_at', 'updated_at'],
  },
  {
    table: 'career_contents',
    columns: [
      'id',
      'title',
      'description',
      'content',
      'source_id',
      'source_name',
      'platform',
      'original_url',
      'original_id',
      'author',
      'author_id',
      'author_avatar',
      'content_type',
      'category',
      'tags',
      'cover_image',
      'video_url',
      'video_duration',
      'images',
      'view_count',
      'like_count',
      'comment_count',
      'share_count',
      'status',
      'is_featured',
      'priority',
      'quality_score',
      'quality_reasons',
      'match_score',
      'match_keywords',
      'match_core_matched',
      'match_core_missing',
      'published_at',
      'fetched_at',
      'created_at',
      'updated_at',
    ],
    booleans: ['is_featured', 'match_core_matched'],
    timestamps: ['published_at', 'fetched_at', 'created_at', 'updated_at'],
  },
  {
    table: 'content_cache',
    columns: ['id', 'cache_key', 'cache_type', 'data', 'expires_at', 'created_at'],
    timestamps: ['expires_at', 'created_at'],
  },
  {
    table: 'content_fetch_logs',
    columns: [
      'id',
      'source_id',
      'started_at',
      'completed_at',
      'fetched_count',
      'new_count',
      'updated_count',
      'error_count',
      'errors',
    ],
    timestamps: ['started_at', 'completed_at'],
  },
  {
    table: 'training_questions',
    columns: [
      'id',
      'question_key',
      'title',
      'logo_url',
      'prompt',
      'industry',
      'product_type',
      'difficulty',
      'reference_points',
      'is_active',
      'created_at',
      'updated_at',
    ],
    booleans: ['is_active'],
    timestamps: ['created_at', 'updated_at'],
  },
  {
    table: 'training_drafts',
    columns: ['id', 'user_key', 'question_id', 'content', 'updated_at'],
    timestamps: ['updated_at'],
  },
  {
    table: 'training_attempts',
    columns: ['id', 'user_key', 'question_id', 'answer', 'submitted_at', 'created_at'],
    timestamps: ['submitted_at', 'created_at'],
  },
  {
    table: 'training_evaluations',
    columns: [
      'id',
      'attempt_id',
      'total_score',
      'value_score',
      'business_score',
      'design_score',
      'competition_score',
      'report',
      'model',
      'created_at',
    ],
    timestamps: ['created_at'],
  },
  {
    table: 'programming_questions',
    columns: [
      'id',
      'question_key',
      'domain',
      'category',
      'stem',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_option',
      'explanation',
      'links',
      'difficulty',
      'is_active',
      'created_at',
      'updated_at',
    ],
    booleans: ['is_active'],
    timestamps: ['created_at', 'updated_at'],
  },
  {
    table: 'programming_sessions',
    columns: [
      'id',
      'user_key',
      'domains',
      'question_ids',
      'current_index',
      'answers',
      'status',
      'created_at',
      'updated_at',
    ],
    timestamps: ['created_at', 'updated_at'],
  },
];

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function convertValue(value: unknown, column: string, spec: TableSpec): unknown {
  if (value === undefined) return spec.defaults?.[column] ?? null;
  if (spec.timestamps?.includes(column)) return toDate(value);
  if (spec.booleans?.includes(column)) return value === null || value === undefined ? null : Boolean(value);
  return value;
}

async function importTable(
  pg: postgres.Sql,
  sqlite: Database.Database,
  spec: TableSpec
): Promise<{ imported: number; source: number; target: number }> {
  const existingColumns = new Set(
    sqlite.prepare(`PRAGMA table_info(${quoteIdentifier(spec.table)})`).all().map((row) => String((row as { name: string }).name))
  );
  const sourceRows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(spec.table)}`).all() as Record<string, unknown>[];
  const columns = spec.columns.filter((column) => existingColumns.has(column) || spec.defaults?.[column] !== undefined);

  if (columns.length === 0 || sourceRows.length === 0) {
    const targetRows = await pg.unsafe(`SELECT cast(count(*) as int) as count FROM ${quoteIdentifier(spec.table)}`);
    return { imported: 0, source: sourceRows.length, target: Number(targetRows[0]?.count || 0) };
  }

  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const batchSize = 100;

  let imported = 0;
  await pg.begin(async (tx) => {
    for (let offset = 0; offset < sourceRows.length; offset += batchSize) {
      const batch = sourceRows.slice(offset, offset + batchSize);
      const values: unknown[] = [];
      const valueGroups = batch.map((row, rowIndex) => {
        const placeholders = columns.map((column, columnIndex) => {
          values.push(convertValue(row[column], column, spec));
          return `$${rowIndex * columns.length + columnIndex + 1}`;
        });
        return `(${placeholders.join(', ')})`;
      });
      const statement = `INSERT INTO ${quoteIdentifier(spec.table)} (${quotedColumns}) VALUES ${valueGroups.join(', ')} ON CONFLICT DO NOTHING`;
      const result = await tx.unsafe(statement, values as postgres.ParameterOrJSON<never>[]);
      imported += result.count || 0;
    }
  });

  const targetRows = await pg.unsafe(`SELECT cast(count(*) as int) as count FROM ${quoteIdentifier(spec.table)}`);
  return { imported, source: sourceRows.length, target: Number(targetRows[0]?.count || 0) };
}

async function resetSequences(pg: postgres.Sql) {
  for (const { table } of tables) {
    await pg.unsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST(COALESCE((SELECT max(id) FROM ${quoteIdentifier(table)}), 0), 1), true)`
    );
  }
}

async function main() {
  const sqlite = new Database(sourcePath, { readonly: true });
  const pg = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    console.log(`Importing SQLite data from ${sourcePath}...`);
    for (const spec of tables) {
      const stats = await importTable(pg, sqlite, spec);
      console.log(`${spec.table}: source=${stats.source} imported=${stats.imported} target=${stats.target}`);
    }
    await resetSequences(pg);
    console.log('Import completed and Postgres sequences were reset.');
  } finally {
    sqlite.close();
    await pg.end();
  }
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
