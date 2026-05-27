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
  '市场',
  '股市',
  '股票',
  'a股',
  '美股',
  '港股',
  '上证',
  '深证',
  '创业板',
  '科创板',
  '指数',
  '大盘',
  'etf',
  '基金',
  '理财',
  '投资',
  '交易',
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
  '营收',
  '收入',
  '净利润',
  '毛利',
  '利润',
  '亏损',
  '同比',
  '环比',
  '业绩',
  '融资',
  '募资',
  '增资',
  '入股',
  '股权',
  '并购',
  '收购',
  '上市',
  'ipo',
  '招股书',
  '回购',
  '分红',
  '估值',
  '市盈率',
  'pe',
  'pb',
  '债务',
  '违约',
  '重组',
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

  const titleHits = matchKeywords(title, FINANCE_KEYWORDS);
  const bodyHits = matchKeywords(full, FINANCE_KEYWORDS);
  const uniq = Array.from(new Set([...titleHits, ...bodyHits]));

  const productHints = matchKeywords(full, PRODUCT_NEWS_HINTS);
  const hasFinanceSignal = uniq.length >= 2 && (titleHits.length >= 1 || bodyHits.length >= 3);
  const hasProductNews = productHints.length >= 2;
  if (hasProductNews && !hasFinanceSignal) {
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

