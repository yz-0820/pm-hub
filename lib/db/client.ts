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
  max: 10,                  // 连接池最大连接数
  // 超时配置（单位：秒）
  connect_timeout: 30,      // 连接超时 30 秒
  idle_timeout: 20,         // 空闲连接超时 20 秒
  max_lifetime: 60,         // 连接最大生命周期 60 秒
});

export const db = drizzle(postgresClient, { schema });

export { schema };
