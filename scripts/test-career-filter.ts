/**
 * 验证 career 过滤规则对示例文章的判定结果
 * 运行: npx tsx scripts/test-career-filter.ts
 */

import { hasCareerRelevance, assessQuality, evaluateBestCategoryMatch } from '../lib/career/quality';
import { autoClassify } from '../config/content-sources';

const testCases = [
  {
    name: '外卖大战王兴',
    title: '外卖大战中场休息，王兴下一场硬仗是AI',
    description: '打开后门也要守住定价权，王兴的"To A"，真正的赌注在哪?',
    content: '',
  },
  {
    name: '钉钉换帅',
    title: '钉钉换帅：无招卸任，92年技术极客陈宇森接任钉钉CEO',
    description: '6月11日，阿里巴巴宣布钉钉管理层调整：陈航卸任钉钉CEO，陈宇森接任。陈宇森生于1992年，是技术型连续创业者。公开资料显示，他22岁时创办网络安全公司长亭科技，后者后来被阿里云收购。2025年，陈宇森在阿里云内部创业，带队研发AI Agent产品MuleRun。接任钉钉...',
    content: '',
  },
  {
    name: '真正职场文章-向上管理',
    title: '如何正确向上管理？这3个技巧让老板主动给你资源',
    description: '在职场中，向上管理是一项关键能力。本文分享三个实用技巧：1.主动对齐目标 2.用数据说话 3.管理老板预期。帮助你获得更多支持和资源。',
    content: '',
  },
  {
    name: '真正职场文章-时间管理',
    title: '番茄工作法实战：我是如何用3个月告别拖延症的',
    description: '拖延症困扰了我很久，直到我系统实践番茄工作法。本文记录我的完整实践过程，包括初期遇到的困难和调整方法。',
    content: '',
  },
];

for (const tc of testCases) {
  const content = { title: tc.title, description: tc.description, content: tc.content };

  console.log(`\n========== ${tc.name} ==========`);
  console.log(`标题: ${tc.title}`);

  // 1. 职场相关性检查
  const relevance = hasCareerRelevance(content);
  console.log(`\n[职场相关性] ${relevance.relevant ? '✅ 相关' : '❌ 不相关'} — ${relevance.reason}`);

  if (!relevance.relevant) {
    console.log('→ 已被过滤，不会进入 career');
    continue;
  }

  // 2. 自动分类
  const category = autoClassify(tc.title, tc.description);
  console.log(`[自动分类] ${category}`);

  // 3. 质量评估
  const normalized = {
    ...content,
    sourceId: 'test',
    sourceName: 'test',
    platform: 'rss' as const,
    originalId: 'test',
    originalUrl: 'https://example.com/test',
    author: '',
    authorId: '',
    authorAvatar: '',
    contentType: 'article' as const,
    category,
    tags: [],
    coverImage: '',
    videoUrl: '',
    videoDuration: 0,
    images: [],
    publishedAt: new Date(),
  };
  const quality = assessQuality(normalized);
  console.log(`[质量评分] ${quality.score}分 ${quality.passed ? '✅ 通过' : '❌ 不通过'}`);
  if (quality.reasons.length > 0) {
    console.log(`  原因: ${quality.reasons.join(', ')}`);
  }

  // 4. 分类匹配度
  const match = evaluateBestCategoryMatch(normalized);
  console.log(`[分类匹配] ${match.category} — ${match.matchScore}% ${match.matched ? '✅ 匹配' : '❌ 不匹配'}`);
  console.log(`  关键词: ${match.keywords.join(', ') || '无'}`);
  console.log(`  核心组: ${match.coreMatched ? '✅ 命中' : '❌ 未命中'} ${match.coreMissing.length > 0 ? `(缺失: ${match.coreMissing.join(', ')})` : ''}`);
}

console.log('\n========== 验证完成 ==========');
