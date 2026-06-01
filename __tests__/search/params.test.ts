import { describe, expect, it } from 'vitest';
import { parseSearchParams } from '@/lib/search/params';

describe('search params', () => {
  it('normalizes query, page, limit, and offset', () => {
    const result = parseSearchParams(new URLSearchParams('q=%20PRD%20&page=3&limit=8'));

    expect(result).toEqual({
      query: 'PRD',
      page: 3,
      limit: 8,
      offset: 16,
    });
  });

  it('caps limit and defaults invalid page values', () => {
    const result = parseSearchParams(new URLSearchParams('q=test&page=-1&limit=100'));

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });
});
