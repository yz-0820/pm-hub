import { sql } from 'drizzle-orm';
import { isIP } from 'node:net';
import { db } from '@/lib/db/client';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

type RateLimitRow = { count: number; reset_at: Date | string };

export function getRateLimitRow(result: unknown): RateLimitRow | undefined {
  if (Array.isArray(result)) return result[0] as RateLimitRow | undefined;
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows;
    return Array.isArray(rows) ? rows[0] as RateLimitRow | undefined : undefined;
  }
  return undefined;
}

export class RateLimitStorageError extends Error {
  constructor(cause: unknown) {
    super('Rate-limit storage is unavailable.', { cause });
    this.name = 'RateLimitStorageError';
  }
}

export function toRateLimitResult(
  count: number,
  resetAt: Date | string,
  maxRequests: number
): RateLimitResult {
  const resetAtMs = new Date(resetAt).getTime();
  if (!Number.isFinite(resetAtMs)) {
    throw new Error('Rate-limit storage returned an invalid reset time.');
  }

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt: resetAtMs,
  };
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + options.windowMs);
  let result: unknown;
  try {
    result = await db.execute(sql`
      WITH expired AS (
        DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'
      )
      INSERT INTO rate_limits (key, count, reset_at, updated_at)
      VALUES (${identifier}, 1, ${resetAt.toISOString()}::timestamptz, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.reset_at <= now() THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at
          ELSE rate_limits.reset_at
        END,
        updated_at = now()
      RETURNING count, reset_at
    `);
  } catch (error) {
    throw new RateLimitStorageError(error);
  }
  const row = getRateLimitRow(result);
  if (!row) {
    throw new Error('Rate-limit storage did not return a counter.');
  }

  return toRateLimitResult(Number(row.count), row.reset_at, options.maxRequests);
}

export function getClientIdentifier(
  request: Request,
  env: NodeJS.ProcessEnv = process.env
): string {
  const platformIp = request.headers.get('cf-connecting-ip');
  if (platformIp && isIP(platformIp.trim())) {
    return platformIp.trim();
  }
  const ip = (request as unknown as { ip?: string }).ip;
  if (ip && isIP(ip.trim())) return ip.trim();

  if (env.TRUST_X_FORWARDED_FOR === 'true') {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    if (forwarded && isIP(forwarded)) return forwarded;
  }

  return 'unknown';
}
