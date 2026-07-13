export type SearchHit = {
  kind: 'article' | 'career';
  id: number;
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  publishedAt: string;
  originalUrl: string;
  imageUrl: string | null;
  contentType?: string;
};

export function normalizeSearchTimestamp(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    throw new TypeError('Search document publishedAt is required.');
  }
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new TypeError('Search document publishedAt must be a valid timestamp.');
  }

  // Current indexes store milliseconds. Accept seconds as well so an index can
  // be rebuilt without briefly rendering dates near 1970 from older documents.
  const milliseconds = numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue;
  return new Date(milliseconds).toISOString();
}

export function mergeSearchHits(
  articleHits: SearchHit[],
  careerHits: SearchHit[],
  offset: number,
  limit: number
): SearchHit[] {
  return [...articleHits, ...careerHits]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(offset, offset + limit);
}
