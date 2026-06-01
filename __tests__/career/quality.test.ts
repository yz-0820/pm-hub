import { describe, expect, it } from 'vitest';
import { assessQuality, hasCareerRelevance, evaluateBestCategoryMatch } from '@/lib/career/quality';
import type { NormalizedContent } from '@/lib/career/platforms/types';

function content(overrides: Partial<NormalizedContent>): NormalizedContent {
  return {
    title: '如何通过结构化汇报提升跨部门沟通效率',
    description: '围绕职场沟通、汇报、对齐和反馈，介绍可执行的方法。',
    content: '本文介绍职场沟通场景下如何倾听、表达、汇报和处理分歧，帮助团队形成共识。',
    sourceId: 'test',
    sourceName: '测试源',
    platform: 'rss',
    originalUrl: 'https://example.org/post',
    originalId: 'post-1',
    author: 'author',
    authorId: '',
    authorAvatar: '',
    contentType: 'article',
    category: 'communication',
    tags: ['职场', '沟通'],
    coverImage: '',
    videoUrl: '',
    videoDuration: 0,
    images: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    publishedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('career quality', () => {
  it('accepts career method content and finds the best category', () => {
    const item = content({});

    expect(hasCareerRelevance(item).relevant).toBe(true);
    expect(assessQuality(item).passed).toBe(true);
    expect(evaluateBestCategoryMatch(item).category).toBe('communication');
  });

  it('rejects generic finance content from career admission', () => {
    const item = content({
      title: '美股三大指数集体收涨，纳斯达克创历史新高',
      description: '市场关注美联储议息会议与美债收益率。',
      content: '本文主要讨论股市、基金和投资机会。',
      category: 'leadership',
    });

    const relevance = hasCareerRelevance(item);
    const quality = assessQuality(item);

    expect(relevance.relevant).toBe(false);
    expect(relevance.relevant && quality.passed).toBe(false);
  });
});
