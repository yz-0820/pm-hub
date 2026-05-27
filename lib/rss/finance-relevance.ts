import type { ParsedArticle } from '@/types';

type FinanceRelevanceResult = {
  passed: boolean;
  score: number;
  meta: {
    score: number;
    positiveHits: string[];
    titleHits: string[];
    negativeHits: string[];
    adHits: string[];
    threshold: number;
  };
};

export const FINANCE_THRESHOLD = 45;

const FINANCE_KEYWORDS = [
  '金融',
  '财经',
  '股市',
  '股票',
  'a股',
  '美股',
  '港股',
  '上证',
  '深证',
  '创业板',
  '科创板',
  'etf',
  '基金',
  '理财',
  '期货',
  '期权',
  '外汇',
  '汇率',
  '利率',
  '降息',
  '加息',
  '债券',
  '国债',
  '收益率',
  '央行',
  '美联储',
  '通胀',
  'cpi',
  'ppi',
  '财报',
  '净利润',
  '毛利',
  '亏损',
  'ipo',
  '招股书',
  '回购',
  '分红',
  '市盈率',
  'pe',
  'pb',
  '债务',
  '违约',
  '重组',
  'ipo',
  '大盘',
  '降准',
  '放水',
  '印花税',
  '北向资金',
  '南向资金',
  '涨停',
  '跌停',
  '牛市',
  '熊市',
  '退市',
  '做空',
  '做多',
  '基金定投',
  '理财',
  '信托',
  '金价',
  '黄金',
  '原油',
  '大宗商品',
  '期货市场',
  '期货价格',
  '股票市场',
  '资本市场',
];

// 明显的非金融信号 - 匹配这些关键词的文章不应归类为金融
 const NON_FINANCE_KEYWORDS = [
   // 产品发布与科技
   '新品', '开售', '首发',
   '评测', '体验', '开箱',
   '游戏本', '芯片', '处理器',
   '骁龙', '天玑',
   // AI
   '人工智能', '大模型', '算法',
   '机器人', '自动驾驶', 'deepseek',
   // 汽车
   '新车', '充电', '续航',
   '试驾', '测试车', '车型',
   // 招聘/裁员
   '招聘', '裁员',
   // 监管
   '市场监管', '罚款', '违法',
   // 营销/广告
   '联名', '代言',
 ];
 

// 强信号非金融关键词 - 匹配 1 个就排除（这些词几乎不可能出现在纯金融文章中）
const STRONG_NON_FINANCE_KEYWORDS = [
  '新品', '评测', '开箱', '开售', '首发',
  '测试车', '游戏本',
  '裁员', '招聘',
  '联名', '代言',
  '试驾', '续航', '充电',
];

const PRODUCT_NEWS_HINTS = [
  '预售',
  '售价',
  '开售',
  '发布',
  '发布会',
  '新品',
  '上新',
  '评测',
  '体验',
  '开箱',
  '参数',
  '配置',
  '镜头',
  '传感器',
  'imx',
  '骁龙',
  '天玑',
  'intel',
  'amd',
  'nvidia',
  'gpu',
  'cpu',
  '测试车',
  '充电',
  '续航',
  'kg',
  '毫米',
  '英寸',
  '刷新率',
];

const AD_HINT_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: '广告/推广声明', re: /(本文|本内容).*(广告|推广|赞助|合作|商务)/i },
  { label: '广告/赞助', re: /(广告|赞助|推广|软文)/i },
  { label: '商务合作', re: /(商务合作|商业合作|合作洽谈|投放|品牌合作)/i },
  { label: '扫码/加微信', re: /(扫码|加微(信|v)|vx[:：]?\s*[a-z0-9_-]{4,})/i },
  { label: '进群/私信', re: /(进群|加群|私信|私聊)/i },
  { label: '报名/训练营/课程', re: /(报名|训练营|课程|公开课|直播课|讲座|咨询课)/i },
  { label: '领取/优惠/折扣', re: /(领取|福利|优惠|折扣|限时|0元|免费领取|抽奖|赠送)/i },
  { label: '购买/下单', re: /(购买|下单|立刻买|立即购买|马上买)/i },
  { label: '点击链接', re: /(点击(下方|链接)|戳这里|直达链接)/i },
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getText(article: ParsedArticle) {
  const title = normalizeText(article.title);
  const summary = normalizeText(article.summary || '');
  const content = normalizeText(article.content || '');
  return { title, body: `${summary}\n${content}`.trim() };
}

function matchKeywords(text: string, keywords: string[]): string[] {
  const hits: string[] = [];
  for (const k of keywords) {
    const nk = normalizeText(k);
    if (!nk) continue;
    if (text.includes(nk)) hits.push(k);
  }
  return hits;
}

function countOccurrences(text: string, token: string): number {
  if (!token) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    const next = text.indexOf(token, idx);
    if (next === -1) break;
    count++;
    idx = next + token.length;
  }
  return count;
}

function detectAdvertorial(fullText: string): string[] {
  const hits = AD_HINT_PATTERNS.filter((p) => p.re.test(fullText)).map((p) => p.label);
  if (hits.length === 0) return [];

  const httpCount = countOccurrences(fullText, 'http');
  const hasStrongCta = hits.some((h) =>
    ['扫码/加微信', '进群/私信', '报名/训练营/课程', '领取/优惠/折扣', '购买/下单', '点击链接'].includes(h)
  );
  const hasDisclosure = hits.some((h) => ['广告/推广声明', '广告/赞助', '商务合作'].includes(h));

  if (hasDisclosure) return hits;
  if (hasStrongCta) return hits;
  if (httpCount >= 6) return hits;
  return [];
}

export function evaluateFinanceRelevance(article: ParsedArticle): FinanceRelevanceResult {
  const { title, body } = getText(article);
  const full = `${title}\n${body}`.trim();

  const adHits = detectAdvertorial(full);
  if (adHits.length > 0) {
    return { passed: false, score: 0, meta: { score: 0, positiveHits: [], titleHits: [], negativeHits: [], adHits, threshold: FINANCE_THRESHOLD } };
  }

  // 优先检查非金融信号 - 如果文章包含明显的非金融关键词，直接排除
  const nonFinanceHits = matchKeywords(full, NON_FINANCE_KEYWORDS);
  const strongNonFinanceHits = matchKeywords(full, STRONG_NON_FINANCE_KEYWORDS);

  // 强信号：匹配 1 个就排除
  if (strongNonFinanceHits.length >= 1) {
    return {
      passed: false,
      score: 0,
      meta: { score: 0, positiveHits: [], titleHits: [], negativeHits: [...strongNonFinanceHits, ...nonFinanceHits], adHits: [], threshold: FINANCE_THRESHOLD },
    };
  }

  // 普通非金融信号：需要 >=2 个
  if (nonFinanceHits.length >= 2) {
    return {
      passed: false,
      score: 0,
      meta: { score: 0, positiveHits: [], titleHits: [], negativeHits: nonFinanceHits, adHits: [], threshold: FINANCE_THRESHOLD },
    };
  }

  const titleHits = matchKeywords(title, FINANCE_KEYWORDS);
  const bodyHits = matchKeywords(full, FINANCE_KEYWORDS);
  const uniq = Array.from(new Set([...titleHits, ...bodyHits]));

  const productHints = matchKeywords(full, PRODUCT_NEWS_HINTS);
  const hasFinanceSignal = uniq.length >= 2 && (titleHits.length >= 1 || bodyHits.length >= 3);
  const hasProductNews = productHints.length >= 2;

  // 产品/科技类新闻，即使匹配了部分金融关键词，也不应归为金融
  if (hasProductNews) {
    // 除非标题中有非常明确的金融信号
    if (titleHits.length < 2) {
      return {
        passed: false,
        score: 0,
        meta: {
          score: 0,
          positiveHits: uniq,
          titleHits,
          negativeHits: productHints,
          adHits: [],
          threshold: FINANCE_THRESHOLD,
        },
      };
    }
  }

  // 如果不是标题明确指向金融的文章，但正文匹配了宽泛关键词，也需要更严格
  if (!titleHits.length && bodyHits.length > 0) {
    // 仅在正文中出现关键词而标题没有 - 需要更高的正文匹配数
    if (bodyHits.length < 5) {
      return {
        passed: false,
        score: 0,
        meta: { score: 0, positiveHits: uniq, titleHits, negativeHits: [], adHits: [], threshold: FINANCE_THRESHOLD },
      };
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(titleHits.length * 26 + uniq.length * 12)));
  const passed = score >= FINANCE_THRESHOLD && hasFinanceSignal;

  return {
    passed,
    score,
    meta: {
      score,
      positiveHits: uniq,
      titleHits,
      negativeHits: [],
      adHits: [],
      threshold: FINANCE_THRESHOLD,
    },
  };
}

