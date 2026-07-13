import { describe, expect, it } from 'vitest';
import { getClientIdentifier, getRateLimitRow, toRateLimitResult } from '@/lib/utils/rate-limiter';

describe('rate limiter', () => {
  it('allows requests through the configured maximum and clamps remaining requests', () => {
    const resetAt = new Date('2026-07-13T10:00:00.000Z');

    expect(toRateLimitResult(4, resetAt, 5)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: resetAt.getTime(),
    });
    expect(toRateLimitResult(6, resetAt, 5)).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: resetAt.getTime(),
    });
  });

  it('uses only the first trusted forwarding hop as the identifier', () => {
    const request = new Request('https://pmhub.icu', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.2' },
    });

    expect(getClientIdentifier(request, { ...process.env, TRUST_X_FORWARDED_FOR: 'true' })).toBe('203.0.113.5');
  });

  it('does not trust forwarded headers unless explicitly configured', () => {
    const request = new Request('https://pmhub.icu', {
      headers: { 'x-forwarded-for': '203.0.113.5' },
    });

    expect(getClientIdentifier(request, { ...process.env, TRUST_X_FORWARDED_FOR: 'false' })).toBe('unknown');
  });

  it('reads rows from both postgres-js and neon-http execute results', () => {
    const row = { count: 1, reset_at: '2026-07-13T10:00:00.000Z' };

    expect(getRateLimitRow([row])).toEqual(row);
    expect(getRateLimitRow({ rows: [row] })).toEqual(row);
  });
});
