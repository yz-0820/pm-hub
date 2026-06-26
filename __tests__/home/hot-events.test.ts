import { describe, expect, it } from 'vitest';
import { isHotEventCandidate } from '@/lib/home/hot-events';

describe('isHotEventCandidate', () => {
  it('rejects product-management articles even when they match entity and event terms', () => {
    expect(isHotEventCandidate({
      category: 'product-management',
      title: '别再什么都塞进 CLAUDE.md 了——Anthropic 官方发布的七种自定义方式决策框架',
    })).toBe(false);

    expect(isHotEventCandidate({
      category: 'product-management',
      title: '被面试官嘲笑的“自动连播”，为什么小红书和抖音都悄悄上线了？',
    })).toBe(false);
  });

  it('accepts finance articles that match a known entity and finance terms', () => {
    expect(isHotEventCandidate({
      category: 'finance',
      title: 'Adobe收跌6.7%，本周跌超18.8%，美股AI软件指数累跌约6.5%，软件ETF连跌九天',
    })).toBe(true);
  });

  it('accepts tech or ai articles that match a known entity and finance terms', () => {
    expect(isHotEventCandidate({
      category: 'tech',
      title: '英伟达股价大涨，再创历史新高',
    })).toBe(true);

    expect(isHotEventCandidate({
      category: 'ai',
      title: 'OpenAI估值预期上调，美股AI板块集体收涨',
    })).toBe(true);
  });

  it('rejects macro finance titles without a known company or financial institution', () => {
    expect(isHotEventCandidate({
      category: 'finance',
      title: '美联储降息预期升温，美股三大指数收涨',
    })).toBe(false);
  });

  it('rejects titles that only match a known entity', () => {
    expect(isHotEventCandidate({
      category: 'finance',
      title: '高盛全球业务布局观察',
    })).toBe(false);
  });
});
