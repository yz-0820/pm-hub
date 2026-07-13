export type UtcYearRange = { start: Date; end: Date };

export function getUtcYearRange(now = new Date()): UtcYearRange {
  const year = now.getUTCFullYear();
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}
