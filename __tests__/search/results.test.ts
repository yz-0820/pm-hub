import { describe, expect, it } from 'vitest';
import { mergeSearchHits, normalizeSearchTimestamp, type SearchHit } from '@/lib/search/results';

function hit(kind: SearchHit['kind'], id: number, publishedAt: string): SearchHit {
  return {
    kind,
    id,
    title: `${kind}-${id}`,
    summary: '',
    category: 'tech',
    sourceName: 'test',
    publishedAt,
    originalUrl: '',
    imageUrl: null,
  };
}

describe('search results', () => {
  it('normalizes both millisecond and legacy second timestamps', () => {
    const milliseconds = Date.UTC(2026, 6, 13, 8);

    expect(normalizeSearchTimestamp(milliseconds)).toBe('2026-07-13T08:00:00.000Z');
    expect(normalizeSearchTimestamp(milliseconds / 1000)).toBe('2026-07-13T08:00:00.000Z');
  });

  it('rejects missing timestamps instead of silently using the Unix epoch', () => {
    expect(() => normalizeSearchTimestamp(null)).toThrow('publishedAt is required');
    expect(() => normalizeSearchTimestamp('')).toThrow('publishedAt is required');
  });

  it('merges article and career hits before applying a page offset', () => {
    const articles = [hit('article', 1, '2026-07-13T10:00:00.000Z'), hit('article', 2, '2026-07-13T08:00:00.000Z')];
    const careers = [hit('career', 3, '2026-07-13T09:00:00.000Z'), hit('career', 4, '2026-07-13T07:00:00.000Z')];

    expect(mergeSearchHits(articles, careers, 1, 2).map(({ kind, id }) => `${kind}:${id}`)).toEqual([
      'career:3',
      'article:2',
    ]);
  });
});
