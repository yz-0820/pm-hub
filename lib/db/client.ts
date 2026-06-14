import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type PostgresClient = ReturnType<typeof createPostgresClient>;
type DatabaseClient = ReturnType<typeof createDbClient>;

let cachedPostgresClient: PostgresClient | null = null;
let cachedDb: DatabaseClient | null = null;

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Configure a Neon/Postgres connection string.');
  }

  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error('DATABASE_URL must be a postgres:// or postgresql:// connection string.');
  }

  return connectionString;
}

function createPostgresClient() {
  return postgres(getConnectionString(), {
    prepare: false,
    max: 10,
    connect_timeout: 30,
    idle_timeout: 20,
    max_lifetime: 60,
  });
}

function createDbClient() {
  return drizzle(getPostgresClient(), { schema });
}

export function getPostgresClient() {
  if (!cachedPostgresClient) {
    cachedPostgresClient = createPostgresClient();
  }

  return cachedPostgresClient;
}

export function getDb() {
  if (!cachedDb) {
    cachedDb = createDbClient();
  }

  return cachedDb;
}

const postgresClientTarget = ((...args: unknown[]) => {
  const client = getPostgresClient() as unknown as (...queryArgs: unknown[]) => unknown;
  return client(...args);
}) as unknown as PostgresClient;

export const postgresClient = new Proxy(postgresClientTarget, {
  get(_target, prop) {
    const client = getPostgresClient() as unknown as Record<PropertyKey, unknown>;
    const value = client[prop];

    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const db = new Proxy({} as DatabaseClient, {
  get(_target, prop) {
    const client = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = client[prop];

    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export { schema };
