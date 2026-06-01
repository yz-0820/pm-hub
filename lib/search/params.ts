export type SearchParamsState = {
  query: string;
  page: number;
  limit: number;
  offset: number;
};

export function parseSearchParams(searchParams: URLSearchParams): SearchParamsState {
  const query = (searchParams.get('q') || '').trim();
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(10, rawLimit) : 10;

  return {
    query,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}
