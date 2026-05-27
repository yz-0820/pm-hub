import { NormalizedContent } from './platforms/types';
import { categoryKeywords } from '@/config/content-sources';

interface QualityScore {
  score: number;        // 0-100
  passed: boolean;      // 是否通过阈值
  details: {
    titleQuality: number;     // 标题质量 (0-25)
    contentLength: number;    // 内容长度 (0-25)
    completeness: number;     // 信息完整度 (0-25)
    relevance: number;        // 相关性 (0-25)
  };
  reasons: string[];    // 扣分原因
}

const MIN_QUALITY_SCORE = 60; // 最低通过分
const MIN_TITLE_LENGTH = 4;   // 最短标题字符数
const MIN_DESC_LENGTH = 20;   // 最短描述字符数

function countCjk(text: string): number {
  return (text.match(/[\u3400-\u9FFF]/g) || []).length;
}

function countLettersAndDigits(text: string): number {
  return (text.match(/[A-Za-z0-9]/g) || []).length;
}

function countPunctuation(text: string): number {
  return (text.match(/[\p{P}\p{S}]/gu) || []).length;
}

// 垃圾内容关键词黑名单
const SPAM_PATTERNS = [
  /加微信|微信号|扫码添加|免费领取|点击领取|红包|抽奖|薅羊毛/i,
  /广告|推广|营销|招商加盟/i,
  /http:\/\/[^\s]+|https:\/\/[^\s]+/g, // 多个外链（允许1-2个）
];

const CAREER_NEGATIVE_TOPICS = [
  '黄金',
  '白银',
  '原油',
  '油价',
  '金价',
  '贵金属',
  '期货',
  '外汇',
  '汇率',
  '通胀',
  'cpi',
  'ppi',
  '美联储',
  '央行',
  '国债',
  '股市',
  'a股',
  '美股',
  '港股',
  '基金',
  '比特币',
  '加密货币',
  'crypto',
  'bitcoin',
];

const CAREER_POSITIVE_ANCHORS = [
  '职场',
  '工作',
  '团队',
  '协作',
  '沟通',
  '汇报',
  '领导',
  '领导力',
  '管理',
  '绩效',
  '面试',
  '招聘',
  '员工',
  '同事',
  '上司',
  'okr',
  'kpi',
  '项目',
  '会议',
  '复盘',
  '时间管理',
  '优先级',
  '效率',
];

export const CAREER_EXCLUDED_VIDEO_PATTERNS: RegExp[] = [
  /(ai)?产品经理.*(入门|基础|进阶|教程|课程|训练营|公开课|合集|全集|系列|实战|从零到(一|1)|从0到1|从零到精通|手把手|必学|速成|系统课)/i,
  /产品运营.*(入门|基础|进阶|教程|课程|训练营|公开课|合集|全集|系列|实战|从零到(一|1)|从0到1|从零到精通|手把手|必学|速成|系统课)?/i,
  /(axure|figma|墨刀|sketch|prd|需求文档|需求分析|原型|交互稿|交互设计|ui设计|ued|用户研究|竞品分析|埋点|增长|运营增长|产品增长).*(教程|课程|训练营|公开课|合集|全集|系列|实战|从零到(一|1)|从0到1|入门|基础|进阶|手把手|速成|系统课)/i,
  /(axure|figma|墨刀|sketch|prd|原型|交互稿|交互设计)/i,
];

export function assessQuality(content: NormalizedContent): QualityScore {
  const reasons: string[] = [];
  let titleQuality = 25;
  let contentLength = 25;
  let completeness = 25;
  let relevance = 25;

  const fullText = `${content.title} ${content.description} ${content.content}`;
  const headlineText = `${content.title} ${content.description}`;
  const cjkCount = countCjk(fullText);
  if (cjkCount < 4) {
    return {
      score: 0,
      passed: false,
      details: { titleQuality: 0, contentLength: 0, completeness: 0, relevance: 0 },
      reasons: ['非中文内容（仅保留中文文章与视频）'],
    };
  }

  const normalized = fullText.toLowerCase();
  const isVideo =
    content.contentType === 'video' ||
    content.contentType === 'short_video' ||
    content.contentType === 'live' ||
    content.contentType === 'audio';
  if (isVideo) {
    const excluded = CAREER_EXCLUDED_VIDEO_PATTERNS.some((p) => p.test(fullText));
    if (excluded) {
      return {
        score: 0,
        passed: false,
        details: { titleQuality: 0, contentLength: 0, completeness: 0, relevance: 0 },
        reasons: ['非职业发展视频（产品技能课程）'],
      };
    }
  }
  const hasNegativeTopic = CAREER_NEGATIVE_TOPICS.some((k) => normalized.includes(k));
  const headlineNormalized = headlineText.toLowerCase();
  const hasPositiveAnchor = CAREER_POSITIVE_ANCHORS.some((k) => headlineNormalized.includes(k));
  if (hasNegativeTopic && !hasPositiveAnchor) {
    return {
      score: 0,
      passed: false,
      details: { titleQuality: 0, contentLength: 0, completeness: 0, relevance: 0 },
      reasons: ['疑似财经/投资内容（非职业发展主题）'],
    };
  }

  if (fullText.includes('\uFFFD')) {
    titleQuality -= 15;
    reasons.push('内容含乱码字符');
  }

  const letterDigitCount = countLettersAndDigits(fullText);
  const punctCount = countPunctuation(fullText);
  const totalLen = Math.max(1, fullText.length);
  const nonCjkRatio = (letterDigitCount + punctCount) / totalLen;
  if (nonCjkRatio > 0.65) {
    relevance -= 20;
    reasons.push('非中文字符占比过高');
  } else if (nonCjkRatio > 0.5) {
    relevance -= 10;
    reasons.push('非中文字符占比偏高');
  }

  // 1. 标题质量评估
  if (!content.title || content.title.trim().length < MIN_TITLE_LENGTH) {
    titleQuality -= 20;
    reasons.push('标题过短或为空');
  }
  if (/^[0-9]+$/.test(content.title.trim()) || /^[a-zA-Z]+$/.test(content.title.trim())) {
    titleQuality -= 10;
    reasons.push('标题为纯数字或纯英文，疑似无效内容');
  }
  // 标题不应全是标点符号
  if (/^[\p{P}\p{S}]+$/u.test(content.title.trim())) {
    titleQuality -= 25;
    reasons.push('标题仅为标点符号');
  }

  // 2. 内容长度评估
  if (fullText.length < 50) {
    contentLength -= 20;
    reasons.push('内容过短(不足50字符)');
  } else if (fullText.length < 100) {
    contentLength -= 10;
    reasons.push('内容偏短(不足100字符)');
  } else if (fullText.length < 200) {
    contentLength -= 5;
    reasons.push('内容深度不足(不足200字符)');
  }

  // 3. 信息完整度评估
  if (!content.coverImage) {
    completeness -= 5;
    // 无封面不严重
  }
  if (!content.originalUrl) {
    completeness -= 15;
    reasons.push('缺少原始链接');
  }
  if (!content.author && !content.authorId) {
    completeness -= 5;
  }
  if (!content.publishedAt) {
    completeness -= 10;
    reasons.push('缺少发布时间');
  }
  if (!content.description || content.description.trim().length < MIN_DESC_LENGTH) {
    completeness -= 10;
    reasons.push('摘要过短(不足20字符)');
  }

  // 4. 相关性评估（垃圾检测）
  const spamCount = SPAM_PATTERNS.filter(p => p.test(fullText)).length;
  if (spamCount >= 3) {
    relevance -= 25;
    reasons.push('检测到大量疑似广告/垃圾信息');
  } else if (spamCount >= 1) {
    relevance -= 10;
    reasons.push('检测到疑似广告内容');
  }

  // 确保各项不为负
  titleQuality = Math.max(0, titleQuality);
  contentLength = Math.max(0, contentLength);
  completeness = Math.max(0, completeness);
  relevance = Math.max(0, relevance);

  const score = titleQuality + contentLength + completeness + relevance;

  return {
    score,
    passed: score >= MIN_QUALITY_SCORE,
    details: { titleQuality, contentLength, completeness, relevance },
    reasons,
  };
}

// 批量评估，返回通过的内容
export function filterByQuality(contents: NormalizedContent[]): {
  passed: NormalizedContent[];
  rejected: Array<{ content: NormalizedContent; reasons: string[] }>;
} {
  const passed: NormalizedContent[] = [];
  const rejected: Array<{ content: NormalizedContent; reasons: string[] }> = [];

  for (const content of contents) {
    const result = assessQuality(content);
    if (result.passed) {
      passed.push(content);
    } else {
      rejected.push({ content, reasons: result.reasons });
    }
  }

  return { passed, rejected };
}

// ============================================================
// 分类匹配度验证（双重验证机制：关键词 + 匹配度评分）
// ============================================================

interface CategoryMatchResult {
  category: string;
  matchScore: number;    // 0-100 匹配度百分比
  matched: boolean;      // 是否达到80%阈值
  keywords: string[];    // 匹配到的关键词
  keywordScore: number;   // 关键词加权得分
  coreMatched: boolean;
  coreMissing: string[];
  passedManualReview: boolean; // 人工审核标记
}

const CATEGORY_MATCH_THRESHOLD = 80; // 80%匹配度阈值

const CATEGORY_SCORE_TARGET: Record<string, number> = {
  communication: 8,
  productivity: 8,
  teamwork: 6,
  leadership: 14,
};

function buildText(content: Pick<NormalizedContent, 'title' | 'description' | 'content' | 'tags'>) {
  const title = content.title || '';
  const description = content.description || '';
  const body = (content.content || '').replace(/<[^>]+>/g, ' ').slice(0, 600);
  const tags = Array.isArray(content.tags) ? content.tags.join(' ') : '';
  return `${title} ${description} ${tags} ${body}`.replace(/\s+/g, ' ').toLowerCase();
}

type CoreGroup = {
  label: string;
  keywords: string[];
};

const CATEGORY_CORE_GROUPS: Record<string, CoreGroup[]> = {
  leadership: [
    { label: '战略决策', keywords: ['战略', '战略规划', '战略选择', '决策', '决策框架', '权衡', '取舍', '资源配置', '资源分配', '投入产出', '风险决策'] },
    { label: '变革引领', keywords: ['变革', '组织变革', '变革管理', '变更管理', '转型', '转型升级', '推进变革', '推动变更', '变革阻力', '阻力', '利益相关方', '文化变革', '重构', '再造'] },
    { label: '团队管理', keywords: ['领导力', '管理', '带团队', '团队管理', '绩效', '绩效管理', '激励', '授权', '培养', '辅导', '教练', '一对一', '1对1'] },
  ],
  communication: [
    { label: '有效倾听', keywords: ['倾听', '聆听', '复述', '共情', '提问', '确认理解'] },
    { label: '清晰表达', keywords: ['表达', '讲清楚', '结构化', '逻辑', '沟通表达', '汇报', '陈述'] },
    { label: '冲突解决', keywords: ['冲突', '分歧', '协商', '谈判', '对齐', '共识', '化解'] },
  ],
  productivity: [
    { label: '时间管理', keywords: ['时间管理', '日程', '番茄', '时间块', '时间规划', '日计划'] },
    { label: '优先级', keywords: ['优先级', '轻重缓急', '重要紧急', '排序', '取舍', '里程碑'] },
    { label: '专注提升', keywords: ['专注', '深度工作', '心流', '抗干扰', '减少分心'] },
    { label: '方法优化', keywords: ['方法', '流程', 'SOP', '复盘', '工具', '模板', '优化'] },
  ],
  teamwork: [
    { label: '目标对齐', keywords: ['目标对齐', '对齐', 'OKR', '目标', '共识', '方向一致'] },
    { label: '角色分工', keywords: ['角色', '分工', '职责', '边界', 'RACI', '协作机制'] },
    { label: '职场协作', keywords: ['职场', '工作', '公司', '同事', '团队', '协作', '跨部门', '部门', '项目'] },
  ],
};

const CATEGORY_MIN_CORE_GROUP_HITS: Record<string, number> = {
  leadership: 1,
  communication: 1,
  productivity: 1,
  teamwork: 2,
};

function verifyCoreGroups(category: string, text: string): { coreMatched: boolean; coreMissing: string[] } {
  const groups = CATEGORY_CORE_GROUPS[category] || [];
  const missing: string[] = [];
  let hitCount = 0;
  for (const g of groups) {
    const hit = g.keywords.some(k => text.includes(k.toLowerCase()));
    if (hit) hitCount++;
    else missing.push(g.label);
  }
  const minRequired = CATEGORY_MIN_CORE_GROUP_HITS[category] ?? groups.length;
  return { coreMatched: hitCount >= minRequired, coreMissing: missing };
}

const CATEGORY_MIN_KEYWORD_HITS: Record<string, number> = {
  communication: 3,
  productivity: 3,
  teamwork: 3,
  leadership: 4,
};

const CATEGORY_CAREER_ANCHORS: Partial<Record<string, string[]>> = {
  communication: ['职场', '老板', '上司', '同事', '下属', '汇报', '述职', '周报', '跨部门', '向上管理', '绩效', '面试', '招聘', '一对一', '1对1'],
  teamwork: ['职场', '工作', '公司', '老板', '同事', '上司', '下属', '汇报', '绩效', '面试', '招聘', '跨部门', '部门', '述职', '周报', 'OKR', 'KPI', '开会', '会议', '项目'],
};

export function verifyCategoryMatch(content: NormalizedContent): CategoryMatchResult {
  const text = buildText(content);
  const keywords = categoryKeywords[content.category] || [];

  const matchedKeywords: string[] = [];
  let keywordScore = 0;

  for (const [keyword, weight] of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      keywordScore += weight;
    }
  }

  const target = CATEGORY_SCORE_TARGET[content.category] || 10;
  const matchScore = Math.max(0, Math.min(100, Math.round((keywordScore / target) * 100)));

  const { coreMatched, coreMissing } = verifyCoreGroups(content.category, text);
  const baseMinHits = CATEGORY_MIN_KEYWORD_HITS[content.category] || 3;
  const minHits =
    content.platform === 'bilibili' ? Math.max(2, baseMinHits - 1) : baseMinHits;
  const anchors = CATEGORY_CAREER_ANCHORS[content.category] || [];
  const careerAnchorOk = anchors.length === 0 || anchors.some(a => text.includes(a.toLowerCase()));
  const matched = matchScore >= CATEGORY_MATCH_THRESHOLD && matchedKeywords.length >= minHits && coreMatched && careerAnchorOk;

  return {
    category: content.category,
    matchScore,
    matched,
    keywords: matchedKeywords,
    keywordScore,
    coreMatched,
    coreMissing,
    passedManualReview: false,
  };
}

export function evaluateBestCategoryMatch(content: NormalizedContent): CategoryMatchResult {
  const candidates: Array<NormalizedContent['category']> = ['communication', 'productivity', 'teamwork', 'leadership'];
  let best: CategoryMatchResult | null = null;

  for (const cat of candidates) {
    const result = verifyCategoryMatch({ ...content, category: cat });
    const isBetterScore = !best || result.matchScore > best.matchScore || (result.matchScore === best.matchScore && result.keywordScore > best.keywordScore);
    
    if (!best) {
      best = result;
    } else if (result.coreMatched && !best.coreMatched) {
      // 核心组匹配优先：即使分数较低，也优先选择核心组匹配的分类
      best = result;
    } else if (!result.coreMatched && best.coreMatched) {
      // 当前分类核心组不匹配，保持最优不变
      continue;
    } else if (isBetterScore) {
      // 核心组匹配状态相同，按分数比较
      best = result;
    }
  }

  return best || verifyCategoryMatch(content);
}
