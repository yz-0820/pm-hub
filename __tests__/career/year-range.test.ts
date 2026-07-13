import { describe, expect, it } from 'vitest';
import { getUtcYearRange } from '@/lib/career/year-range';

describe('career current year range', () => {
  it('uses UTC natural-year boundaries', () => {
    const range = getUtcYearRange(new Date('2027-06-15T08:00:00.000Z'));

    expect(range.start.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(range.end.toISOString()).toBe('2028-01-01T00:00:00.000Z');
  });

  it('switches ranges exactly at the UTC year boundary', () => {
    expect(getUtcYearRange(new Date('2026-12-31T23:59:59.999Z')).start.getUTCFullYear()).toBe(2026);
    expect(getUtcYearRange(new Date('2027-01-01T00:00:00.000Z')).start.getUTCFullYear()).toBe(2027);
  });
});
