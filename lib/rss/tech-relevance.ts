import type { ParsedArticle } from '@/types';

type TechRelevanceResult = {
  passed: boolean;
  score: number;
  topic: string | null;
  meta: {
    score: number;
    topic: string | null;
    topics: string[];
    positiveHits: Record<string, string[]>;
    negativeHits: string[];
    adHits: string[];
    rejectedBy: 'negative' | 'ad' | null;
    threshold: number;
  };
};

export const TECH_THRESHOLD = 40;

const NEGATIVE_KEYWORDS = [
  '游戏',
  '手游',
  '端游',
  '电竞',
  'steam',
  'ps5',
  'xbox',
  'switch',
  '任天堂',
  '索尼',
  '米哈游',
  '腾讯游戏',
  '网易游戏',
  '财政部',
  '税务',
  '税收',
  '财政',
  '国债',
  '彩票',
  '财政政策',
  '政策文件',
  '通知',
  '公告',
  '征求意见稿',
  '印发',
  '实施细则',
  '工信部',
  '发改委',
  '监管',
  '执法',
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

const GROUPS: Array<{ id: string; label: string; keywords: string[] }> = [
  {
    id: 'it',
    label: '信息技术',
    keywords: [
      '信息技术',
      '软件',
      '开源',
      'github',
      '操作系统',
      'linux',
      'windows',
      '数据库',
      '云计算',
      '云服务',
      'saas',
      'paas',
      'iaas',
      '服务器',
      '芯片',
      '半导体',
      'gpu',
      'cpu',
      '算力',
      '数据中心',
      '边缘计算',
      '5g',
      '6g',
      '通信',
      '光模块',
      '光通信',
      'pcb',
      'nand',
      'flash',
      '闪存',
      '存储',
      'ssd',
      'dram',
      'ddr',
      '内存',
      'npu',
      '网络安全',
      '安全漏洞',
      '漏洞',
      '勒索',
      '隐私',
      '加密',
      '量子计算',
      '区块链',
    ],
  },
  {
    id: 'ai',
    label: '人工智能',
    keywords: [
      '人工智能',
      'ai',
      '大模型',
      '模型',
      '推理',
      '训练',
      '机器学习',
      '深度学习',
      '多模态',
      'agent',
      '智能体',
      'llm',
      'transformer',
      'gpt',
      'deepseek',
      'claude',
      'openai',
      'rag',
      '机器人',
      '无人机',
      '自动驾驶',
      '智能驾驶',
      'robotaxi',
    ],
  },
  {
    id: 'biotech',
    label: '生物技术',
    keywords: [
      '生物技术',
      '基因',
      '基因编辑',
      'crisper',
      'crispr',
      '蛋白质',
      'mRNA',
      'mrna',
      '合成生物',
      '细胞治疗',
      '医学影像',
      '新药',
      '疫苗',
    ],
  },
  {
    id: 'new_energy',
    label: '新能源',
    keywords: [
      '新能源',
      '新能源汽车',
      '电池',
      '固态电池',
      '储能',
      '光伏',
      '钙钛矿',
      '风电',
      '氢能',
      '充电桩',
      '电驱',
      '电动汽车',
      '电动车',
      '特斯拉',
      '核聚变',
      '核电',
    ],
  },
  {
    id: 'aerospace',
    label: '航天航空',
    keywords: [
      '航天',
      '航空',
      '太空',
      '宇航',
      '火箭',
      '卫星',
      '空间站',
      '低轨',
      '商业航天',
      'space',
      'spacex',
      '星链',
      '神舟',
      '天舟',
      '嫦娥',
      '探测',
      '月球',
      '火星',
      '载人',
      '发射',
    ],
  },
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

export function evaluateTechRelevance(article: ParsedArticle): TechRelevanceResult {
  const { title, body } = getText(article);
  const full = `${title}\n${body}`.trim();

  const negativeHits = matchKeywords(full, NEGATIVE_KEYWORDS);
  if (negativeHits.length > 0) {
    return {
      passed: false,
      score: 0,
      topic: null,
      meta: {
        score: 0,
        topic: null,
        topics: [],
        positiveHits: {},
        negativeHits,
        adHits: [],
        rejectedBy: 'negative',
        threshold: TECH_THRESHOLD,
      },
    };
  }

  const adHits = detectAdvertorial(full);
  if (adHits.length > 0) {
    return {
      passed: false,
      score: 0,
      topic: null,
      meta: {
        score: 0,
        topic: null,
        topics: [],
        positiveHits: {},
        negativeHits: [],
        adHits,
        rejectedBy: 'ad',
        threshold: TECH_THRESHOLD,
      },
    };
  }

  const positiveHits: Record<string, string[]> = {};
  const topicScores: Array<{ id: string; label: string; score: number; hits: string[] }> = [];

  const allHitSet = new Set<string>();
  const titleHitSet = new Set<string>();
  for (const g of GROUPS) {
    const titleHits = matchKeywords(title, g.keywords);
    const bodyHits = matchKeywords(body, g.keywords);
    const uniq = Array.from(new Set([...titleHits, ...bodyHits]));
    if (uniq.length > 0) {
      positiveHits[g.id] = uniq;
    }
    for (const h of uniq) allHitSet.add(h);
    for (const h of titleHits) titleHitSet.add(h);
    const score = titleHits.length * 20 + bodyHits.length * 12;
    topicScores.push({ id: g.id, label: g.label, score, hits: uniq });
  }

  const matchedTopics = topicScores.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const topic = matchedTopics.length > 0 ? matchedTopics[0].label : null;
  const topics = matchedTopics.map((x) => x.label);

  const score = Math.max(
    0,
    Math.min(100, Math.round(topics.length * 25 + allHitSet.size * 12 + titleHitSet.size * 8))
  );
  const passed = score >= TECH_THRESHOLD && topics.length > 0 && allHitSet.size >= 2;

  return {
    passed,
    score,
    topic,
    meta: {
      score,
      topic,
      topics,
      positiveHits,
      negativeHits: [],
      adHits: [],
      rejectedBy: null,
      threshold: TECH_THRESHOLD,
    },
  };
}
