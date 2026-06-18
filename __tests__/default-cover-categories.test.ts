import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getArticleDefaultCover, getCareerDefaultCover } from '@/config/default-covers';

const articleCategories = ['product-management', 'tech', 'ai', 'finance'] as const;
const careerCategories = ['communication', 'productivity', 'teamwork', 'leadership'] as const;

function expectLocalFile(publicPath: string) {
  expect(existsSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')))).toBe(true);
}

describe('default cover category integrity', () => {
  it.each(articleCategories)('keeps article covers inside the %s category', (category) => {
    for (let index = 0; index < 100; index += 1) {
      const cover = getArticleDefaultCover(category, `${category}-${index}`);
      expect(cover.startsWith(`/covers/articles/${category}/`)).toBe(true);
      expectLocalFile(cover);
    }
  });

  it.each(careerCategories)('keeps career covers inside the %s category', (category) => {
    for (let index = 0; index < 100; index += 1) {
      const cover = getCareerDefaultCover(category, `${category}-${index}`);
      expect(cover.startsWith(`/covers/career/${category}/`)).toBe(true);
      expectLocalFile(cover);
    }
  });
});
