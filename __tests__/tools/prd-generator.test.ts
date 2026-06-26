import { describe, expect, it } from 'vitest';
import { prdInputSchema } from '@/lib/tools/prd-generator';

describe('prd generator input schema', () => {
  it('accepts a single required idea brief', () => {
    const parsed = prdInputSchema.parse({
      background: '我想做一个会员续费提醒功能，减少到期流失。',
    });

    expect(parsed.background).toContain('会员续费提醒');
    expect(parsed.productName).toBe('');
    expect(parsed.goals).toBe('');
    expect(parsed.users).toBe('');
    expect(parsed.features).toBe('');
  });

  it('still rejects an empty idea brief', () => {
    const parsed = prdInputSchema.safeParse({
      background: '   ',
    });

    expect(parsed.success).toBe(false);
  });
});
