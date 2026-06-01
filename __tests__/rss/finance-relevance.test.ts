import { describe, expect, it } from 'vitest';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import type { ParsedArticle } from '@/types';

function article(title: string, content = ''): ParsedArticle {
  return {
    title,
    content,
    summary: content,
    link: 'https://example.com/article',
    pubDate: new Date('2026-06-01T00:00:00.000Z'),
  };
}

describe('finance relevance', () => {
  it('allows clear US stock market signals', () => {
    const result = evaluateFinanceRelevance(article('美股三大指数收涨，纳指涨超2%，英伟达盘后继续走强'));

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.meta.positiveHits).toContain('美股三大指数');
  });

  it('does not allow company product news by company name alone', () => {
    const result = evaluateFinanceRelevance(
      article('英伟达推出面向AI智能体的新款CPU Vera', '这是一次产品发布，主要介绍处理器架构与AI模型能力。')
    );

    expect(result.passed).toBe(false);
  });
});
