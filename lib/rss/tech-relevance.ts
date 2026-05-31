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
    rejectedBy: 'negative' | 'ad' | 'finance' | 'product_release' | null;
    financeSignal?: string[];
    threshold: number;
  };
};

export const TECH_THRESHOLD = 40;

// 强金融信号词 - 标题中出现这些词时，即使有科技关键词也应排除
// 注意：只包含最明确的金融术语，避免与科技/AI文章混淆
const STRONG_FINANCE_SIGNALS_TITLE = [
  // === 股票涨跌信号（最明确）===
  '涨超', '跌超', '涨逾', '跌逾', '涨幅', '跌幅', '暴涨', '暴跌',
  '涨停', '跌停', '停牌', '复牌',

  // === 指数信号（最明确）===
  '创业板指', '创业板', '科创50', '科创板', '上证指数', '深证成指', '沪深300', '沪指', '深指',
  '恒生指数', '纳斯达克', '道琼斯',

  // === 市场/股票类型信号（最明确）===
  'A股', '港股', '美股', '中概股', '概念股', 'ST股',
  '龙头股', '白马股', '蓝筹股', '权重股', '成分股',

  // === 资金流向信号（最明确）===
  '北向资金', '南向资金', '北向', '南向',
  '主力资金', '主力', '庄家', '游资',
  '做多', '做空', '多头', '空头',

  // === 交易行为信号（最明确）===
  '拉升', '跳水', '砸盘', '护盘',
  '全线上涨', '全线下跌', '全线飘红', '全线飘绿',

  // === 公司/股票财务信号（最明确）===
  '股价', '每股', '市值', '市值蒸发', '市值缩水',
  '上市', '上市首日', '破发', '破发价',
  '财报', '年报', '季报', '半年报', '业绩', '营收', '净利润', '归母净利润',
  '亏损', '盈利', '扭亏', '预盈', '预亏',
  '分红', '分红派息', '派息', '股息',
  '回购', '减持', '增持', '大股东减持', '大股东增持',
  '定增', '配股', '增发', '股权融资',

  // === IPO/融资信号（最明确）===
  'IPO', 'ipo', '招股', '招股书', '上市申请', '上会', '过会',
  '融资', '募资', '估值', '投后估值',

  // === 板块/行业信号（最明确）===
  '板块大涨', '板块大跌', '板块拉升', '板块跳水',
  '行业龙头', '行业指数',

  // === 牛熊市场信号（最明确）===
  '牛市', '熊市', '牛市来了', '熊市来了',
  '震荡', '反弹', '回调', '筑底', '探底',
];

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

import { detectPromoDeal } from './promo-deal';

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

// 产品新闻关键词 - 如果文章包含这些词，说明是正常的产品新闻而非广告
const PRODUCT_NEWS_KEYWORDS = [
  '发布', '发售', '上市', '推出', '亮相', '曝光', '开箱', '评测', '体验',
  '显示器', '手机', '笔记本', '平板', '耳机', '音箱', '键盘', '鼠标',
  '配置', '参数', '规格', '性能', '跑分', '测试',
  '售价', '定价', '价格', '元', '美元', '欧元',
  '英寸', '分辨率', '刷新率', '色域', '亮度',
];

// 顶尖科技公司/品牌白名单 - 只有这些公司的产品新闻才允许通过
const TOP_TIER_BRANDS = [
  // 国际科技巨头
  '苹果', 'apple', 'iphone', 'ipad', 'mac', 'vision pro',
  '谷歌', 'google', 'pixel',
  '微软', 'microsoft', 'surface', 'xbox',
  '三星', 'samsung', 'galaxy',
  '索尼', 'sony', 'playstation', 'ps5',
  'meta', 'quest',
  '亚马逊', 'amazon',
  '英伟达', 'nvidia', 'rtx', 'geforce',
  'amd', '锐龙', 'ryzen', 'radeon',
  '特斯拉', 'tesla',
  // 中国科技巨头
  '华为', 'huawei', '鸿蒙', 'harmonyos', 'mate', 'pura',
  '小米', 'xiaomi', '红米', 'redmi', '澎湃', 'su7',
  'oppo', '一加', 'oneplus', '真我', 'realme',
  'vivo', 'iqoo',
  '荣耀', 'honor',
  '魅族', 'meizu',
  '联想', 'lenovo', 'thinkpad', '拯救者', 'legion',
  '华硕', 'asus', 'rog', '玩家国度',
  '戴尔', 'dell', '外星人', 'alienware',
  '惠普', 'hp',
  '大疆', 'dji', 'mavic', 'pocket', 'osmo',
  '比亚迪', 'byd', '仰望', '方程豹', '腾势',
    '蔚来', 'nio', '小鹏', 'xpeng', '理想', 'li auto',
    '问界', 'aito', '赛力斯', 'seres',
  // 其他知名品牌
  '任天堂', 'nintendo', 'switch',
  'steam', 'valve',
  '罗技', 'logitech',
  '雷蛇', 'razer',
];

// 芯片/组件供应商 - 这些不能单独作为品牌通过的依据
// 只有当文章同时匹配产品品牌时，芯片供应商才有效
const CHIP_SUPPLIERS = [
  '英特尔', 'intel', '酷睿', 'core',
  '高通', 'qualcomm', '骁龙', 'snapdragon',
  '天玑', 'mediatek',
  'imx', '索尼传感器',
];

/**
 * 检查是否为顶尖公司的产品新闻
 * 如果不是顶尖公司的产品，即使是正常产品新闻也应该被拒绝
 */
function isTopTierProductNews(title: string, body: string): boolean {
  const fullText = `${title} ${body}`.toLowerCase();

  // 检查是否包含顶尖产品品牌（排除芯片供应商）
  const hasTopTierBrand = TOP_TIER_BRANDS.some(brand =>
    fullText.includes(brand.toLowerCase())
  );

  // 检查是否包含芯片供应商
  const hasChipSupplier = CHIP_SUPPLIERS.some(chip =>
    fullText.includes(chip.toLowerCase())
  );

  // 只有芯片供应商没有产品品牌 → 不通过
  if (!hasTopTierBrand && hasChipSupplier) {
    return false;
  }

  if (!hasTopTierBrand) {
    return false;
  }

  // 检查是否包含产品新闻特征词
  const productHits = PRODUCT_NEWS_KEYWORDS.filter(k => fullText.includes(k.toLowerCase()));
  // 如果命中至少 3 个产品新闻关键词，认为是正常产品新闻
  return productHits.length >= 3;
}

function isProductNews(title: string, body: string): boolean {
  // 现在只接受顶尖公司的产品新闻
  return isTopTierProductNews(title, body);
}

function detectAdvertorial(fullText: string, title: string = '', body: string = ''): string[] {
  const hits = AD_HINT_PATTERNS.filter((p) => p.re.test(fullText)).map((p) => p.label);
  if (hits.length === 0) return [];

  // 如果是正常的产品新闻，放宽广告检测
  if (isProductNews(title, body)) {
    // 产品新闻中只保留最强的广告信号
    const strongAdSignals = hits.filter(h =>
      ['广告/推广声明', '广告/赞助', '商务合作', '扫码/加微信', '进群/私信'].includes(h)
    );
    if (strongAdSignals.length === 0) {
      return []; // 产品新闻中忽略弱的广告信号
    }
    return strongAdSignals;
  }

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

  // ========== 优先检查：强金融信号 ==========
  // 如果标题中包含强金融信号词，排除（应该归为金融而非科技）
  const financeSignalHits = matchKeywords(title, STRONG_FINANCE_SIGNALS_TITLE);
  if (financeSignalHits.length >= 1) {
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
        adHits: [],
        rejectedBy: 'finance',
        financeSignal: financeSignalHits,
        threshold: TECH_THRESHOLD,
      },
    };
  }

  // ========== 检查：产品发布/促销新闻 ==========
  // 如果是明显的产品发布/促销新闻，不收录
  // 产品发布的典型特征：发布/发售 + 售价/规格
  // 促销的典型特征：促 + 售价
  const productReleaseSignals = ['发布', '发售', '开售', '上市', '推出', '亮相', '开卖', '促'];
  const productPriceSignals = ['元', '售价', '首发价', '起价', '限时价', '优惠价'];
  const productSpecSignals = ['配置', '参数', '规格', '处理器', '内存', '屏幕', '电池', '英寸', '刷新率'];

  const hasProductRelease = productReleaseSignals.some(s => title.includes(s));
  const hasProductPrice = productPriceSignals.some(s => title.includes(s));
  const specCount = productSpecSignals.filter(s => title.includes(s)).length;

  // 如果标题同时包含：
  // 1. 发布信号 + (价格信号 或 多个规格信号)
  // 2. 或 促销("促") + 价格信号
  // 则认为是产品发布/促销新闻
  const isProductRelease = (hasProductRelease && (hasProductPrice || specCount >= 2)) ||
                           (title.includes('促') && hasProductPrice);
  if (isProductRelease) {
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
        adHits: [],
        rejectedBy: 'product_release',
        threshold: TECH_THRESHOLD,
      },
    };
  }

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

  // ========== 促销导购检测（优先级最高，不可豁免） ==========
  const promoCheck = detectPromoDeal(title, body);
  if (promoCheck.isPromo) {
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
        adHits: [promoCheck.reason],
        rejectedBy: 'promo_deal',
        threshold: TECH_THRESHOLD,
      },
    };
  }

  const adHits = detectAdvertorial(full, title, body);
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
