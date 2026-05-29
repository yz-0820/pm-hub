import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure a Neon/Postgres connection string.');
}

if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
  throw new Error('DATABASE_URL must be a postgres:// or postgresql:// connection string.');
}

export const postgresClient = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(postgresClient, { schema });

export { schema };
