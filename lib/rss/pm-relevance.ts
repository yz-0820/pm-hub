/**
 * 产品经理文章相关性评估
 * 用于判断文章是否与产品经理专业内容相关
 */

import type { ParsedArticle } from '@/types';

type PMRelevanceResult = {
  passed: boolean;
  score: number;
  meta: {
    score: number;
    positiveHits: string[];
    titleHits: string[];
    negativeHits: string[];
    threshold: number;
    rejectedBy?: string;
  };
};

export const PM_THRESHOLD = 95;

// ========== 核心产品经理关键词（权重最高）==========
const CORE_PM_KEYWORDS = [
  // 产品经理核心技能
  '产品经理', '产品总监', '产品负责人', '产品负责人',
  '需求分析', '需求管理', '需求文档', '需求评审',
  '用户研究', '用户调研', '用户画像', '用户洞察', '用户访谈',
  '竞品分析', '竞品调研', '竞品研究',
  '产品设计', '产品规划', '产品策略', '产品定位', '产品线',
  'PRD', '需求文档', '产品文档',
  '原型设计', '原型', '交互设计', '交互', 'UI设计',
  'Axure', 'Figma', 'Sketch',
  '信息架构', '功能设计', '功能规划',
  '产品思维', '产品方法论', '产品体系',
  'MVP', '最小可行产品',
  '敏捷', 'Scrum', '迭代', '版本规划', '版本迭代',
  '产品生命周期', '生命周期',
  '数据驱动', '数据产品', '数据埋点', '数据分析',
  'AB测试', 'A/B测试',
  '增长黑客', '增长策略', '增长产品',
  '商业化', '变现', '盈利模式',
  'SaaS', 'B端', 'C端', 'B2B', 'B2C',
  '后台产品', '中台', '前台',
  'API产品', '开放平台',
  '产品运营', '运营策略',
  'To B', 'To C', 'toB', 'toC',
  'SOP', '标准化', '流程优化',
];

// ========== 产品思维关键词（中等权重）==========
const PRODUCT_THINKING_KEYWORDS = [
  '用户体验', '用户痛点', '用户需求', '用户场景', '用户旅程',
  '用户价值', '用户增长', '用户留存', '用户转化', '用户活跃',
  '商业模式', '商业价值', '商业逻辑',
  '市场分析', '市场洞察', '市场定位',
  '行业分析', '行业洞察', '行业趋势',
  '痛点', '痒点', '爽点',
  '场景化', '场景设计',
  '降本增效', '效率提升',
  '数字化转型', '数字化',
  '产品力', '产品感',
  '认知升级', '认知',
  '复盘', '总结',
  '方法论', '框架', '模型',
  '实战', '案例', '拆解',
  '思考', '洞察', '视角',
  '底层逻辑', '本质',
  '策略', '规划', '路径',
];

// ========== 职场发展关键词（低权重，但增加相关性）==========
const CAREER_KEYWORDS = [
  '职业发展', '职业规划', '职业成长',
  '面试', '简历', '求职', '跳槽',
  '团队管理', '团队协作', '跨部门',
  '沟通', '汇报', '向上管理',
  '领导力', '管理能力',
  '职场', '晋升', '加薪',
  '软技能', '硬技能',
  'PM', '产品人',
];

// ========== 非相关信号（直接拒绝）==========
const NON_PM_SIGNALS = [
  // 纯技术开发
  '代码', '编程', '算法实现', '源码', 'GitHub', '开源项目',
  '前端开发', '后端开发', '数据库优化', 'SQL',
  // 硬件产品发布/促销
  '开售', '发售', '上市', '首销', '众筹',
  '降价', '直降', '到手价', '折扣',
  // 纯金融
  '涨停', '跌停', '涨超', '跌超', 'A股', '港股', '美股',
  '基金', '债券', '理财',
  // 游戏评测
  '游戏评测', '游戏体验', '游戏推荐',
];

// ========== 匹配工具函数 ==========
function matchKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter(k => lowerText.includes(k.toLowerCase()));
}

/**
 * 评估文章与产品经理领域的相关性
 */
export function evaluatePMRelevance(article: ParsedArticle): PMRelevanceResult {
  const title = article.title || '';
  const body = article.content || article.summary || '';
  const fullText = `${title} ${body}`;
  const lowerTitle = title.toLowerCase();

  // ========== 1. 非相关信号检测 ==========
  const nonPmHits = matchKeywords(fullText, NON_PM_SIGNALS);
  // 如果非相关信号过多（>=3），直接拒绝
  if (nonPmHits.length >= 3) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: nonPmHits,
        threshold: PM_THRESHOLD,
        rejectedBy: 'non_pm_content',
      },
    };
  }

  // ========== 2. 核心关键词匹配（标题权重更高）==========
  const coreTitleHits = matchKeywords(lowerTitle, CORE_PM_KEYWORDS);
  const coreBodyHits = matchKeywords(fullText, CORE_PM_KEYWORDS);
  const coreHits = [...new Set([...coreTitleHits, ...coreBodyHits])];

  // 标题命中核心关键词，直接给高分
  if (coreTitleHits.length >= 1) {
    const titleScore = Math.min(100, 50 + coreTitleHits.length * 20 + coreHits.length * 10);
    return {
      passed: titleScore >= PM_THRESHOLD,
      score: titleScore,
      meta: {
        score: titleScore,
        positiveHits: coreHits,
        titleHits: coreTitleHits,
        negativeHits: nonPmHits,
        threshold: PM_THRESHOLD,
      },
    };
  }

  // ========== 3. 综合评分 ==========
  const productThinkingHits = matchKeywords(fullText, PRODUCT_THINKING_KEYWORDS);
  const careerHits = matchKeywords(fullText, CAREER_KEYWORDS);

  // 去重
  const allHits = [...new Set([...coreHits, ...productThinkingHits, ...careerHits])];

  // 分数计算
  let score = 0;

  // 核心关键词：每个 +15 分
  score += coreHits.length * 15;

  // 产品思维关键词：每个 +8 分
  score += productThinkingHits.length * 8;

  // 职场关键词：每个 +5 分
  score += careerHits.length * 5;

  // 标题中命中任何关键词额外加分
  const titleAllHits = matchKeywords(lowerTitle, [...CORE_PM_KEYWORDS, ...PRODUCT_THINKING_KEYWORDS, ...CAREER_KEYWORDS]);
  if (titleAllHits.length >= 1) {
    score += 15;
  }

  // 上限 100
  score = Math.min(100, score);

  // 必须有至少一个核心或产品思维关键词命中
  const passed = score >= PM_THRESHOLD && (coreHits.length >= 1 || productThinkingHits.length >= 2);

  return {
    passed,
    score,
    meta: {
      score,
      positiveHits: allHits,
      titleHits: titleAllHits,
      negativeHits: nonPmHits,
      threshold: PM_THRESHOLD,
    },
  };
}
