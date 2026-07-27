import { describe, expect, it } from 'vitest';
import { withConcurrencyLimit } from '@/lib/rss/fetcher';

describe('RSS fetch concurrency', () => {
  it('waits for every source while respecting the concurrency limit', async () => {
    const completed: number[] = [];
    let active = 0;
    let peakActive = 0;

    await withConcurrencyLimit([0, 1, 2, 3, 4, 5], 2, async (item) => {
      active++;
      peakActive = Math.max(peakActive, active);
      await new Promise((resolve) => setTimeout(resolve, item % 2 === 0 ? 8 : 2));
      completed.push(item);
      active--;
    });

    expect(completed.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(peakActive).toBe(2);
  });
});
