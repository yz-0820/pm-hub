import { describe, expect, it } from 'vitest';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';
import type { ParsedArticle } from '@/types';

function article(title: string, content = ''): ParsedArticle {
  return {
    title,
    content,
    summary: content,
    link: 'https://example.com/article',
    pubDate: new Date('2026-06-13T00:00:00.000Z'),
  };
}

describe('tech relevance low-value hardware filtering', () => {
  it('rejects phone certification and battery spec snippets', () => {
    const result = evaluateTechRelevance(
      article(
        '小米新机 23116PN5BC 入网：预计为 14 Pro 增大电池验证机，后续有望开放换新电池服务',
        '该机尺寸为 161.93×76.12×8.7 毫米，重量 223.7 克，配备 6.73 英寸显示屏，分辨率 1440×3200。'
      )
    );

    expect(result.passed).toBe(false);
    expect(result.meta.rejectedBy).toBe('low_value_hardware');
  });

  it('rejects phone model certification articles from IT之家 precheck', () => {
    const result = detectITHomeProductLaunch(
      '荣耀 MRK-AN00 新机入网：搭载 7900mAh 大容量电池',
      '这款新机机身尺寸为 168.3×78.54×8.3 mm，配备 6.872 英寸 TFT 显示屏，采用直板设计。'
    );

    expect(result.isProductLaunch).toBe(true);
    expect(result.reason).toContain('low_value_hardware');
  });

  it('rejects generic certified phone parameter articles', () => {
    const result = evaluateTechRelevance(
      article(
        '某手机通过认证，配备 6.8 英寸屏幕、7900mAh 电池',
        '参数显示该机拥有 8GB 内存、OLED 屏幕、5000 万像素摄像头和快充。'
      )
    );

    expect(result.passed).toBe(false);
    expect(result.meta.rejectedBy).toBe('low_value_hardware');
  });

  it('allows phone-related articles with clear platform and technology value', () => {
    const result = evaluateTechRelevance(
      article(
        '手机厂商发布端侧 AI 架构和操作系统级 AI 能力',
        '这次更新涉及自研芯片、开发者生态、平台能力、算力调度、安全标准、云计算协同和开源工具链。'
      )
    );

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(95);
  });
});
