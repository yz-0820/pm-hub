export const HOT_EVENT_CATEGORIES = ['tech', 'ai', 'finance'] as const;

const HOT_EVENT_ACTION_TERMS = [
  '发布会', '大会', '峰会', '论坛', '财报', '营收', '季报', '年报',
  '上线', '发布', '推出', '开测', '公测', '融资', '收购', '并购',
  'IPO', '上市', '监管', '政策', '法规', '禁令', '批准',
] as const;

const HOT_EVENT_FINANCE_TERMS = [
  '股价', '股市', '股票', 'A股', '港股', '美股', '纳指', '标普', '道指',
  '指数', '期货', '黄金', '原油', '加息', '降息', '利率', '通胀',
  'CPI', 'PPI', '非农', '美联储', '央行', '人民币', '汇率', '债券',
  '国债', 'ETF', '基金', '回购', '分红', '减持', '增持', '业绩',
  '预期', '大涨', '大跌', '暴涨', '暴跌', '涨超', '跌超', '收涨',
  '收跌', '累涨', '累跌', '创新高', '新高',
] as const;

export const HOT_EVENT_TRIGGER_TERMS = [
  ...HOT_EVENT_ACTION_TERMS,
  ...HOT_EVENT_FINANCE_TERMS,
] as const;

const HOT_EVENT_BRAND_ENTITIES = [
  '苹果', 'Apple', '谷歌', 'Google', '微软', 'Microsoft', '亚马逊', 'Amazon',
  'Meta', 'Facebook', '特斯拉', 'Tesla', '英伟达', 'NVIDIA', 'AMD', '英特尔', 'Intel',
  'OpenAI', 'ChatGPT', 'Anthropic', 'Claude', 'Space X', 'SpaceX',
  '字节跳动', '抖音', 'TikTok', '腾讯', '微信', 'QQ', '阿里巴巴', '淘宝', '天猫',
  '百度', '美团', '滴滴', '小米', '华为', 'OPPO', 'vivo', '京东', '拼多多', '网易',
  '快手', 'B站', '哔哩哔哩', '知乎', '小红书', '微博', '携程', '饿了么',
  'Salesforce', 'Oracle', 'IBM', 'SAP', 'Adobe', 'Zoom', 'Slack', 'Shopify',
  'Netflix', '网飞', 'Spotify', 'Uber', 'Airbnb', 'PayPal', 'Stripe', 'Square',
  '标普', '纳斯达克', '纳指',
] as const;

const HOT_EVENT_FINANCE_ENTITIES = [
  '摩根大通', '高盛', '摩根士丹利', '花旗', '美国银行', '伯克希尔',
  '贝莱德', '桥水', '淡马锡', '汇丰', '渣打', '瑞银', '巴克莱',
  '德银', 'Visa', 'Mastercard', 'Coinbase', 'Robinhood',
] as const;

export const HOT_EVENT_ENTITIES = [
  ...HOT_EVENT_BRAND_ENTITIES,
  ...HOT_EVENT_FINANCE_ENTITIES,
] as const;

type HotEventCategory = (typeof HOT_EVENT_CATEGORIES)[number];

function includesAnyTerm(value: string, terms: readonly string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

export function isHotEventCategory(category: string): category is HotEventCategory {
  return HOT_EVENT_CATEGORIES.includes(category as HotEventCategory);
}

export function isHotEventCandidate(article: { title: string; category: string }) {
  return (
    isHotEventCategory(article.category) &&
    includesAnyTerm(article.title, HOT_EVENT_ENTITIES) &&
    includesAnyTerm(article.title, HOT_EVENT_TRIGGER_TERMS)
  );
}
