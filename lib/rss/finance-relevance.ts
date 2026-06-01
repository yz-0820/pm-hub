import type { ParsedArticle } from '@/types';
import { detectPromoDeal } from './promo-deal';

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
    strongFinanceSignal?: boolean;  // 强金融信号标记
    rejectedBy?: string;  // 拒绝原因
  };
};

export const FINANCE_THRESHOLD = 60;

// ========== 低质量金融新闻过滤 ==========

// 知名公司白名单 - 这些公司的一句话公告有信息价值
const WELL_KNOWN_COMPANIES = [
  // 科技巨头
  '腾讯', '阿里', '阿里巴巴', '百度', '字节跳动', '字节', '京东', '美团', '拼多多', '网易',
  '小米', '华为', '苹果', '微软', '谷歌', '亚马逊', 'meta', '英伟达', 'nvidia', '特斯拉',
  '三星', '台积电', 'intel', 'amd', '高通', 'openai', '特斯拉',
  'apple', 'microsoft', 'alphabet', 'google', 'amazon', 'tesla', 'netflix', 'broadcom', '博通',
  '礼来', '英特尔', '甲骨文', 'salesforce', 'oracle', 'palantir', 'coinbase',
  // 金融巨头
  '工商银行', '建设银行', '农业银行', '中国银行', '招商银行', '交通银行',
  '中信证券', '中金公司', '华泰证券', '国泰君安',
  '中国平安', '中国人寿', '中国人保',
  // 头部新能源/制造
  '比亚迪', '宁德时代', '中芯国际', '贵州茅台', '五粮液',
  '隆基绿能', '阳光电源', '海尔', '美的', '格力',
  '中国石油', '中国石化', '中国神华',
  // 互联网/平台
  '滴滴', '快手', '哔哩哔哩', 'b站', '微博', '知乎', '小红书',
  '蚂蚁集团', '微众银行', '网商银行',
  // 知名车企
  '蔚来', '理想汽车', '小鹏', '小鹏汽车', '赛力斯', '吉利', '长城汽车', '上汽',
  '宝马', '奔驰', '奥迪', '丰田', '本田', '大众',
  // 知名AI公司
  'deepseek', '智谱', '月之暗面', 'minimax', '零一万物', '百川智能', '商汤', '科大讯飞',
  // 知名金融机构/央行
  '央行', '美联储', '欧洲央行', '英国央行', '日本央行', '瑞士央行', '加拿大央行',
  '高盛', '摩根', '花旗', '瑞银', '德银', '黑石', '贝莱德',
  '方正证券', '中信建投', '海通证券', '申万宏源', '银河证券', '广发证券',
  '中国信达', '东方财富', '同花顺',
];

// 一句话公告模式 - 标题格式为"公司名：XXX"的简短公告
const ONE_LINE_ANNOUNCEMENT_RE = /^[\u4e00-\u9fa5a-zA-Z0-9（）()]+[：:]\s*.+$/;

// 低价值公告关键词 - 这些公告即使来自知名公司也缺乏分析价值
const LOW_VALUE_ANNOUNCEMENT_KEYWORDS = [
  '不减持', '承诺不减持', '承诺不减持公司股份',
  '增持', '增持公司股份', '增持公司股票',
  '减持', '减持计划', '减持公司股份', '减持股份',
  '质押', '解除质押', '股份质押', '质押股份',
  '收到监管函', '收到警示函', '收到关注函', '收到问询函',
  '立案调查', '被立案',
  '回购', '回购股份', '回购公司股份',
  '变更', '变更董事长', '变更董事', '变更监事', '人事变动',
  '聘任', '解聘', '辞职', '离任',
];

/**
 * 检测是否为低质量的一句式公告新闻
 * 特征：标题为"公司名：一句话"，正文极短，缺乏分析价值
 */
function detectLowQualityAnnouncement(title: string, body: string): { rejected: boolean; reason: string } {
  // 检查标题是否符合"公司名：XXX"格式
  if (!ONE_LINE_ANNOUNCEMENT_RE.test(title)) {
    return { rejected: false, reason: '' };
  }

  // 提取公司名（冒号前的部分）
  const colonIdx = title.indexOf('：') !== -1 ? title.indexOf('：') : title.indexOf(':');
  const companyName = title.substring(0, colonIdx).trim();

  // 检查是否为知名公司
  const isWellKnown = WELL_KNOWN_COMPANIES.some(c =>
    companyName.includes(c) || c.includes(companyName)
  );

  // 检查正文长度（去除空白后）
  const bodyLength = body.replace(/\s+/g, '').length;

  // 检查是否命中低价值公告关键词
  const hasLowValueKeyword = LOW_VALUE_ANNOUNCEMENT_KEYWORDS.some(k => title.includes(k));

  // 规则1：不知名公司 + 短内容 → 拒绝
  if (!isWellKnown && bodyLength < 150) {
    return { rejected: true, reason: 'unknown_company_short_content' };
  }

  // 规则2：不知名公司 + 低价值公告关键词 → 拒绝
  if (!isWellKnown && hasLowValueKeyword) {
    return { rejected: true, reason: 'unknown_company_low_value_announcement' };
  }

  // 规则3：不知名公司 + 正文极短（<80字）→ 拒绝
  if (!isWellKnown && bodyLength < 80) {
    return { rejected: true, reason: 'unknown_company_very_short' };
  }

  return { rejected: false, reason: '' };
}

// 不知名公司 IPO/上市申请检测
// 特征：标题包含"向XX交易所提交上市申请"、"递表"、"招股书"等，但公司不在知名列表中
const IPO_APPLICATION_SIGNALS = [
  '提交上市申请', '递交上市申请', '提交上市申请书', '递交上市申请书',
  '向港交所提交', '向上交所提交', '向深交所提交', '向纳斯达克提交', '向纽交所提交',
  '递表', '递表港交所', '递表上市',
  '招股书', '招股说明书',
  '申请上市', '申请IPO', '申请港股',
  '冲刺上市', '冲击上市', '谋求上市', '筹备上市', '计划上市',
  '获准上市', '通过上市聆讯',
];

function detectUnknownCompanyIPO(title: string, body: string): { rejected: boolean; reason: string } {
  // 检查是否包含 IPO 申请信号
  const hasIPOSignal = IPO_APPLICATION_SIGNALS.some(k => title.includes(k));
  if (!hasIPOSignal) {
    return { rejected: false, reason: '' };
  }

  // 检查标题中提到的公司是否在知名列表中
  const isWellKnown = WELL_KNOWN_COMPANIES.some(c =>
    title.includes(c) || body.includes(c)
  );

  // 不知名公司 + IPO 申请信号 → 拒绝
  if (!isWellKnown) {
    return { rejected: true, reason: 'unknown_company_ipo_application' };
  }

  return { rejected: false, reason: '' };
}

// 强金融信号词 - 标题中出现这些词，几乎可以确定是金融内容
// 这些词的检测优先级最高，只要命中就直接通过
// 注意：只包含最明确的金融术语，避免与科技/AI文章混淆
const STRONG_FINANCE_SIGNALS_TITLE = [
  // === 股票涨跌信号（最明确）===
  '涨超', '跌超', '涨逾', '跌逾', '涨幅', '跌幅', '暴涨', '暴跌',
  '涨停', '跌停', '停牌', '复牌',

  // === 指数信号（最明确）===
  '创业板指', '创业板', '科创50', '科创板', '上证指数', '深证成指', '沪深300', '沪指', '深指',
  '恒生指数', '纳斯达克', '纳指', '道琼斯', '道指',
  '标普500', '标普 500', '标普指数', 'S&P 500', 'S&P500', '美股三大指数',

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
  '盘前涨', '盘前跌', '盘后涨', '盘后跌', '盘前', '盘后',

  // === 公司/股票财务信号（最明确）===
  '股价', '每股', '市值', '市值蒸发', '市值缩水',
  '上市首日', '破发', '破发价',
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

  // === 券商研报信号（明确）===
  '研报', '研究报告', '研报指出', '研报称', '研报显示',
  '券商', '投行', '投资银行',

  // === 美股宏观信号（明确）===
  '美债收益率', '美联储', '议息会议',
];

const US_STOCK_COMPANY_KEYWORDS = [
  '英伟达',
  'nvidia',
  'nvda',
  '特斯拉',
  'tesla',
  'tsla',
  '苹果',
  'apple',
  'aapl',
  '微软',
  'microsoft',
  'msft',
  '谷歌',
  'alphabet',
  'google',
  'googl',
  '亚马逊',
  'amazon',
  'amzn',
  'meta',
  '奈飞',
  'netflix',
  'nflx',
  '台积电',
  'tsm',
  '博通',
  'broadcom',
  'avgo',
  '礼来',
  'lly',
  '英特尔',
  'intel',
  'intc',
  'amd',
];

// 扩展金融关键词 - 包含强信号词和其他金融术语
const FINANCE_KEYWORDS = [
  // === 强金融信号词（标题权重更高）===
  ...STRONG_FINANCE_SIGNALS_TITLE,

  // === 基础金融词汇 ===
  '金融',
  '财经',
  '股市',
  '股票',
  'a股',
  '美股',
  '港股',
  '中概股',
  '纳斯达克',
  '纳指',
  '道琼斯',
  '道指',
  '标普',
  '标普500',
  '标普 500',
  's&p 500',
  's&p500',
  'spx',
  'nasdaq',
  'dow jones',
  '盘前',
  '盘后',
  '美债收益率',
  '美债',
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
  '债务',
  '违约',
  '重组',
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

  // === 美股公司/代码信号：需与财报、股价、指数等其他金融词共同出现才通过 ===
  ...US_STOCK_COMPANY_KEYWORDS,

  // === 新增：科技金融交叉领域的股票信号 ===
  'AI概念股', '大模型概念股', '科技股', '互联网股',
  '中概科技股', '芯片股', '半导体股', '新能源车股',
  '智谱', 'MiniMax', '月之暗面', '零一万物',  // AI公司股票（间接）
  '市值管理', '股票代码', '股价波动',
];

// 明显的非金融信号 - 匹配这些关键词的文章不应归类为金融
const NON_FINANCE_KEYWORDS = [
  // 产品发布与科技
  '新品', '开售', '首发', '首销',
  '评测', '体验', '开箱',
  '游戏本', '芯片', '处理器',
  '骁龙', '天玑',
  // AI
  '人工智能', '大模型', '算法',
  '机器人', '自动驾驶', 'deepseek',
  // 汽车
  '新车', '充电', '续航',
  '试驾', '测试车', '车型',
  // 产品发布信号（非金融）
  '官图发布', '正式发布', '产品发布',
  '预售', '起售价', '定价',
  // 招聘/裁员
  '招聘', '裁员',
  // 监管
  '市场监管', '罚款', '违法',
  // 营销/广告
  '联名', '代言',
  // 科技大会/演讲/行业活动（CEO演讲、技术大会等不是金融新闻）
  '大会', '峰会', '论坛', '演讲', ' keynote',
  'gtc', 'GTC', '开发者大会', '技术大会',
  '黄仁勋', '马斯克', '雷军', '李彦宏', '马化腾',
];


// 强信号非金融关键词 - 匹配 1 个就排除（这些词几乎不可能出现在纯金融文章中）
const STRONG_NON_FINANCE_KEYWORDS = [
  '新品', '评测', '开箱', '开售', '首发', '首销',
  '测试车', '游戏本',
  '裁员', '招聘',
  '联名', '代言',
  '试驾', '续航', '充电',
  '官图发布', '正式发布', '产品发布',
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

  // ========== 最高优先级：促销导购检测 ==========
  const promoCheck = detectPromoDeal(title, body);
  if (promoCheck.isPromo) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: [],
        adHits: [],
        threshold: FINANCE_THRESHOLD,
        rejectedBy: promoCheck.reason,
      },
    };
  }

  const adHits = detectAdvertorial(full);
  if (adHits.length > 0) {
    return { passed: false, score: 0, meta: { score: 0, positiveHits: [], titleHits: [], negativeHits: [], adHits, threshold: FINANCE_THRESHOLD } };
  }

  // ========== 优先检查：不知名公司 IPO/上市申请 ==========
  const ipoCheck = detectUnknownCompanyIPO(title, body);
  if (ipoCheck.rejected) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: [],
        adHits: [],
        threshold: FINANCE_THRESHOLD,
        rejectedBy: ipoCheck.reason,
      },
    };
  }

  // ========== 优先检查：强金融信号 ==========
  // 如果标题中包含强金融信号词，先检查是否有非金融信号（如科技大会、CEO演讲等）
  const strongFinanceHits = matchKeywords(title, STRONG_FINANCE_SIGNALS_TITLE);
  if (strongFinanceHits.length >= 1) {
    // 检查非金融信号：科技大会、CEO演讲、行业活动等
    const nonFinanceHits = matchKeywords(full, NON_FINANCE_KEYWORDS);
    const strongNonFinanceHits = matchKeywords(full, STRONG_NON_FINANCE_KEYWORDS);
    
    // 如果包含科技大会/演讲/CEO等信号，且包含AI/科技关键词，则不是金融新闻
    const hasTechEventSignal = nonFinanceHits.some(h => 
      ['大会', '峰会', '论坛', '演讲', 'gtc', 'GTC', '开发者大会', '技术大会'].includes(h)
    );
    const hasCEOSignal = nonFinanceHits.some(h =>
      ['黄仁勋', '马斯克', '雷军', '李彦宏', '马化腾'].includes(h)
    );
    const hasAITechSignal = matchKeywords(full, ['人工智能', 'AI', '大模型', '算力', '英伟达', 'nvidia']).length > 0;
    
    // 科技大会/CEO演讲 + AI技术内容 = 不是金融新闻
    if ((hasTechEventSignal || hasCEOSignal) && hasAITechSignal) {
      return {
        passed: false,
        score: 0,
        meta: {
          score: 0,
          positiveHits: strongFinanceHits,
          titleHits: strongFinanceHits,
          negativeHits: [...nonFinanceHits, 'tech_event_not_finance'],
          adHits: [],
          threshold: FINANCE_THRESHOLD,
          rejectedBy: 'tech_event_not_finance',
        },
      };
    }
    
    // 强非金融信号：直接排除
    if (strongNonFinanceHits.length >= 1) {
      return {
        passed: false,
        score: 0,
        meta: { score: 0, positiveHits: [], titleHits: [], negativeHits: [...strongNonFinanceHits, ...nonFinanceHits], adHits: [], threshold: FINANCE_THRESHOLD },
      };
    }

    // ========== 质量门槛检查：过滤低质量的一句式公告 ==========
    const qualityCheck = detectLowQualityAnnouncement(title, body);
    if (qualityCheck.rejected) {
      return {
        passed: false,
        score: 0,
        meta: {
          score: 0,
          positiveHits: strongFinanceHits,
          titleHits: strongFinanceHits,
          negativeHits: [],
          adHits: [],
          threshold: FINANCE_THRESHOLD,
          strongFinanceSignal: true,
          rejectedBy: qualityCheck.reason,
        },
      };
    }

    // 强信号：只要标题命中1个就通过，分数给到70以上确保优先级
    const strongSignalScore = Math.max(70, 70 + strongFinanceHits.length * 10);
    return {
      passed: true,
      score: strongSignalScore,
      meta: {
        score: strongSignalScore,
        positiveHits: strongFinanceHits,
        titleHits: strongFinanceHits,
        negativeHits: [],
        adHits: [],
        threshold: FINANCE_THRESHOLD,
        strongFinanceSignal: true,
      },
    };
  }

  // ========== 常规检查：非金融信号 ==========
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
  const nonCompanyFinanceHits = uniq.filter((hit) => !US_STOCK_COMPANY_KEYWORDS.includes(hit));

  const productHints = matchKeywords(full, PRODUCT_NEWS_HINTS);
  const hasProductNews = productHints.length >= 2;

  // 检查是否为券商研报（优先于产品新闻检测）
  const brokerReportHits = matchKeywords(full, ['研报', '研究报告', '研报指出', '研报称', '券商', '投行']);
  const isBrokerReport = brokerReportHits.length >= 1;

  // 券商研报降低门槛：只要命中1个金融关键词即可
  const hasFinanceSignal = isBrokerReport 
    ? uniq.length >= 1 
    : nonCompanyFinanceHits.length >= 1 && uniq.length >= 2 && (titleHits.length >= 1 || bodyHits.length >= 3);

  // 产品/科技类新闻，即使匹配了部分金融关键词，也不应归为金融
  // 但券商研报例外，即使涉及科技内容也应归为金融
  if (hasProductNews && !isBrokerReport) {
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
  // 但券商研报例外：允许只有正文命中
  if (!titleHits.length && bodyHits.length > 0 && !isBrokerReport) {
    // 仅在正文中出现关键词而标题没有 - 需要更高的正文匹配数
    if (bodyHits.length < 5) {
      return {
        passed: false,
        score: 0,
        meta: { score: 0, positiveHits: uniq, titleHits, negativeHits: [], adHits: [], threshold: FINANCE_THRESHOLD },
      };
    }
  }

  // 分数计算：标题匹配权重更高
  // 券商研报特殊处理：只要有研报关键词，直接给及格分
  const titleScore = titleHits.length * 26;
  let bodyScore = Math.min(bodyHits.length * 12, 50);
  
  if (isBrokerReport && titleScore + bodyScore < FINANCE_THRESHOLD) {
    // 券商研报保底分数（确保达到阈值）
    bodyScore = Math.max(bodyScore, FINANCE_THRESHOLD);
  }
  
  const score = Math.max(0, Math.min(100, Math.round(titleScore + bodyScore)));
  const passed = score >= FINANCE_THRESHOLD && hasFinanceSignal;

  // ========== 最终质量门槛：即使通过了分数检查，也要过滤低质量公告 ==========
  if (passed) {
    const qualityCheck = detectLowQualityAnnouncement(title, body);
    if (qualityCheck.rejected) {
      return {
        passed: false,
        score: 0,
        meta: {
          score: 0,
          positiveHits: uniq,
          titleHits,
          negativeHits: [],
          adHits: [],
          threshold: FINANCE_THRESHOLD,
          rejectedBy: qualityCheck.reason,
        },
      };
    }
  }

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
