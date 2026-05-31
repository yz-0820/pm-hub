import type { ParsedArticle } from '@/types';
import { detectPromoDeal } from './promo-deal';

type AIRelevanceResult = {
  passed: boolean;
  score: number;
  meta: {
    score: number;
    positiveHits: string[];
    titleHits: string[];
    negativeHits: string[];
    threshold: number;
    financeConflict?: boolean;  // 金融冲突标记
    rejectedBy?: string;  // 拒绝原因
  };
};

export const AI_THRESHOLD = 35;

// 强金融信号词 - 标题中出现这些词时，即使有 AI 关键词也应排除
// 因为这些词明确表明文章主题是金融而非 AI 技术
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
];

// AI相关关键词
const AI_KEYWORDS = [
  '人工智能', 'ai', 'a.i.',
  '机器学习', '深度学习', '神经网络',
  '大模型', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini',
  '生成式', '生成式ai', 'aigc',
  '算法', '模型训练', '推理', '微调', 'fine-tuning',
  '自然语言处理', 'nlp', '计算机视觉', 'cv',
  '语音识别', '图像识别', '人脸识别',
  '自动驾驶', '智能驾驶', '无人驾驶',
  '机器人', '具身智能', '人形机器人',
  '智能体', 'agent', 'ai agent',
  '多模态', 'transformer', 'diffusion', 'gan',
  'openai', 'anthropic', 'google ai', 'meta ai',
  '百度智能', '文心一言', '通义千问', '讯飞星火', '智谱',
  '算力', 'gpu', '英伟达', 'nvidia', 'cuda',
  'ai芯片', '神经网络芯片', 'npu', 'tpu',
  '数据标注', '数据集', '预训练',
  'rag', '检索增强', '向量数据库',
  'prompt', '提示词', '提示工程',
  'ai应用', 'ai工具', 'ai平台',
  '智能客服', '智能助手', '虚拟人', '数字人',
  'ai医疗', 'ai金融', 'ai教育', 'ai法律',
  'ai安全', 'ai伦理', 'ai治理',
  '幻觉', 'hallucination',
  'token', '上下文', 'context window',
  '参数', '百亿参数', '千亿参数', '万亿参数',
  '量化', '蒸馏', '剪枝',
  '强化学习', 'rlhf', '人类反馈',
  '涌现能力', 'emergent abilities',
];

// 非AI关键词（排除这些文章）
const NON_AI_KEYWORDS = [
  '世界杯', '足球', '篮球', 'nba', '转播', '咪咕', '体育',
  '新车', '汽车销量', '注册量', '上牌量', '交付量',
  '影视', '电影', '票房', '艺人', '明星', '综艺',
  '美食', '餐饮', '火锅', '奶茶', '咖啡', '餐厅',
  '旅游', '酒店', '民宿', '景区', '机票', '签证',
  '服装', '时尚', '穿搭', '美妆', '护肤', '化妆品',
  '母婴', '育儿', '早教', '幼儿园',
  '宠物', '猫', '狗', '猫粮', '狗粮',
  '房地产', '楼市', '房价', '楼盘', '购房', '租房',
  '装修', '家具', '家电', '建材',
  '婚庆', '婚纱', '摄影',
  '彩票', '博彩', '赌博',
];

// 游戏/娱乐行业关键词 - 这些文章即使提及 AI 也不是 AI 技术新闻
const GAMING_ENTERTAINMENT_KEYWORDS = [
  // 游戏相关
  '游戏', '手游', '端游', '网游', '主机游戏', '单机游戏',
  'steam', 'epic', 'playstation', 'xbox', 'switch', '任天堂',
  '使命召唤', 'cod', 'call of duty', '黑色行动', '现代战争',
  '原神', '王者荣耀', '和平精英', '英雄联盟', 'lol',
  '游戏发售', '游戏发布', '游戏上线', '游戏更新', 'dlc',
  '玩家', '游戏角色', '游戏剧情', '游戏画面', '游戏引擎',
  '电竞', '职业联赛', '游戏比赛',
  // 影视娱乐
  '电影', '电视剧', '网剧', '综艺', '动画', '动漫',
  '票房', '上映', '首映', '导演', '演员', '主演',
  'netflix', '迪士尼', '漫威', 'dc',
];

// 产品发布体裁信号 - 即使提及 AI，产品发布新闻也不是 AI 技术新闻
const PRODUCT_RELEASE_GENRE = [
  '开启预约', '开启预售', '现已开售', '正式开售', '现已发售',
  '笔记本发布', '笔记本开启', '手机发布', '手机开启',
  '显示器发布', '平板发布', '耳机发布', '音箱发布',
  '路由器发布', '键盘发布', '鼠标发布', '显卡发布',
  '处理器：', '处理器：', '芯片：', '配置：', '规格：',
  '英寸', '刷新率', '电池容量', '续航时间',
  '元起', '元', '售价', '首发价', '预约价',
];

// 人物特写体裁信号 - 人物专访/传记不是 AI 技术新闻
const PROFILE_GENRE = [
  '我所知道的', '我所了解的', '我所认识的',
  '专访', '独家专访', '深度对话', '对话',
  '人物', '人物志', '人物故事',
  '他的故事', '她的故事', '他们的故事',
  '职业生涯', '职业经历', '从业经历',
  '离开', '加入', '出任', '担任',
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

export function evaluateAIRelevance(article: ParsedArticle): AIRelevanceResult {
  const { title, body } = getText(article);
  const full = `${title}\n${body}`.trim();

  // ========== 最高优先级：促销导购检测 ==========
  // 促销导购文章无论是否包含 AI 关键词，都应该被拒绝
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
        threshold: AI_THRESHOLD,
        rejectedBy: promoCheck.reason,
      },
    };
  }

  // ========== 高优先级：游戏/娱乐行业检测 ==========
  // 游戏/娱乐新闻即使提及 AI，也不是 AI 技术新闻
  const gamingHits = matchKeywords(full, GAMING_ENTERTAINMENT_KEYWORDS);
  if (gamingHits.length >= 2) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: gamingHits,
        threshold: AI_THRESHOLD,
        rejectedBy: 'gaming_entertainment',
      },
    };
  }

  // ========== 高优先级：产品发布体裁检测 ==========
  // 产品发布新闻即使提及 AI（如"锐龙 AI 7 处理器"），也不是 AI 技术新闻
  const productGenreHits = matchKeywords(full, PRODUCT_RELEASE_GENRE);
  if (productGenreHits.length >= 3) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: productGenreHits,
        threshold: AI_THRESHOLD,
        rejectedBy: 'product_release_genre',
      },
    };
  }

  // ========== 高优先级：人物特写体裁检测 ==========
  // 人物专访/传记即使讨论 AI 技术，也不是 AI 技术新闻
  const profileGenreHits = matchKeywords(title, PROFILE_GENRE);
  if (profileGenreHits.length >= 1) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: profileGenreHits,
        threshold: AI_THRESHOLD,
        rejectedBy: 'profile_genre',
      },
    };
  }

  // ========== 优先检查：强金融信号 ==========
  // 如果标题中包含强金融信号词，即使有 AI 关键词也应降低评分或排除
  const strongFinanceHits = matchKeywords(title, STRONG_FINANCE_SIGNALS_TITLE);
  if (strongFinanceHits.length >= 1) {
    // 强金融信号存在时，标记为金融冲突，显著降低 AI 分数
    // 这样可以确保 fetcher.ts 中的金融分类优先级更高
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: [...strongFinanceHits],
        threshold: AI_THRESHOLD,
        financeConflict: true,
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

  // 只有非顶尖公司的产品发布才拒绝
  // 顶尖公司白名单（与 tech-relevance.ts 保持一致）
  const TOP_TIER_BRANDS = [
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
    '任天堂', 'nintendo', 'switch',
    'steam', 'valve',
    '罗技', 'logitech',
    '雷蛇', 'razer',
  ];

  // 芯片/组件供应商 - 不能单独作为品牌通过的依据
  const CHIP_SUPPLIERS = [
    '英特尔', 'intel', '酷睿', 'core',
    '高通', 'qualcomm', '骁龙', 'snapdragon',
    '天玑', 'mediatek',
  ];

  const hasTopTierBrand = TOP_TIER_BRANDS.some(brand =>
    full.toLowerCase().includes(brand.toLowerCase())
  );

  const hasChipSupplier = CHIP_SUPPLIERS.some(chip =>
    full.toLowerCase().includes(chip.toLowerCase())
  );

  // 只有芯片供应商没有产品品牌 → 视为未知品牌
  const isKnownBrand = hasTopTierBrand;

  // 如果是产品发布，且不是顶尖公司的产品，则拒绝
  if (isProductRelease && !isKnownBrand) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: ['product_release_unknown_brand'],
        threshold: AI_THRESHOLD,
      },
    };
  }

  // 检查非AI关键词
  const nonAiHits = matchKeywords(full, NON_AI_KEYWORDS);
  if (nonAiHits.length >= 2) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: nonAiHits,
        threshold: AI_THRESHOLD,
      },
    };
  }

  // 检查AI关键词
  const titleHits = matchKeywords(title, AI_KEYWORDS);
  const bodyHits = matchKeywords(full, AI_KEYWORDS);
  const uniq = Array.from(new Set([...titleHits, ...bodyHits]));

  // 计算分数
  const titleScore = titleHits.length * 25;
  const bodyScore = Math.min(bodyHits.length * 8, 40);
  const score = Math.max(0, Math.min(100, Math.round(titleScore + bodyScore)));

  // 通过条件：分数达标且至少有AI相关关键词
  const passed = score >= AI_THRESHOLD && uniq.length >= 1;

  return {
    passed,
    score,
    meta: {
      score,
      positiveHits: uniq,
      titleHits,
      negativeHits: nonAiHits,
      threshold: AI_THRESHOLD,
    },
  };
}
