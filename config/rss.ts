export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  language: 'zh' | 'en';
  weight: number;
  enabled: boolean;
}

export const rssSources: RSSSource[] = [
  // ===== 中文源 - 产品经理 =====
  {
    id: 'woshipm',
    name: '人人都是产品经理',
    url: 'https://www.woshipm.com/feed',
    category: 'product-management',
    language: 'zh',
    weight: 10,
    enabled: true,
  },
  {
    id: 'pmcaff',
    name: 'PMCAFF',
    url: 'https://rsshub.app/pmcaff/list/2',
    category: 'product-management',
    language: 'zh',
    weight: 9,
    enabled: false,
  },
  {
    id: 'huxiu-pm',
    name: '虎嗅网',
    url: 'https://www.huxiu.com/rss/0.xml',
    category: 'product-management',
    language: 'zh',
    weight: 8,
    enabled: false,
  },
  {
    id: 'geekpark-pm',
    name: '极客公园',
    url: 'https://www.geekpark.net/rss',
    category: 'product-management',
    language: 'zh',
    weight: 8,
    enabled: true,
  },

  // ===== 中文源 - 科技资讯 =====
  {
    id: '36kr',
    name: '36氪',
    url: 'https://www.36kr.com/feed',
    category: 'tech',
    language: 'zh',
    weight: 10,
    enabled: true,
  },
  {
    id: '36kr-hot',
    name: '36氪热榜',
    url: 'https://rsshub.app/36kr/hot-list',
    category: 'tech',
    language: 'zh',
    weight: 9,
    enabled: false,
  },
  {
    id: 'huxiu',
    name: '虎嗅网',
    url: 'https://www.huxiu.com/rss/0.xml',
    category: 'tech',
    language: 'zh',
    weight: 9,
    enabled: false,
  },
  {
    id: 'geekpark',
    name: '极客公园',
    url: 'https://www.geekpark.net/rss',
    category: 'tech',
    language: 'zh',
    weight: 8,
    enabled: false,
  },
  {
    id: 'ifanr',
    name: '爱范儿',
    url: 'https://www.ifanr.com/feed',
    category: 'tech',
    language: 'zh',
    weight: 8,
    enabled: true,
  },
  {
    id: 'ithome',
    name: 'IT之家',
    url: 'https://www.ithome.com/rss/',
    category: 'tech',
    language: 'zh',
    weight: 7,
    enabled: true,
  },
  {
    id: 'cnbeta',
    name: 'cnBeta',
    url: 'https://www.cnbeta.com.tw/backend.php',
    category: 'tech',
    language: 'zh',
    weight: 7,
    enabled: false,
  },
  {
    id: 'sspai',
    name: '少数派',
    url: 'https://sspai.com/feed',
    category: 'tech',
    language: 'zh',
    weight: 8,
    enabled: true,
  },

  // ===== 中文源 - 人工智能 =====
  {
    id: 'jiqizhixin',
    name: '机器之心',
    url: 'https://www.jiqizhixin.com/rss',
    category: 'ai',
    language: 'zh',
    weight: 10,
    enabled: false,
  },
  {
    id: 'leiphone',
    name: '雷峰网',
    url: 'https://www.leiphone.com/feed',
    category: 'ai',
    language: 'zh',
    weight: 8,
    enabled: true,
  },
  {
    id: 'aibase',
    name: '量子位',
    url: 'https://www.qbitai.com/rss/',
    category: 'ai',
    language: 'zh',
    weight: 9,
    enabled: true,
  },
  {
    id: 'jiqiren',
    name: '新智元',
    url: 'https://rsshub.app/ai/newarrival',
    category: 'ai',
    language: 'zh',
    weight: 8,
    enabled: false,
  },
  // 注：36氪统一使用 tech 分类，通过内容智能判断子分类

  // ===== 中文源 - 金融市场 =====
  {
    id: 'xueqiu',
    name: '雪球',
    url: 'https://xueqiu.com/hots/topic/rss',
    category: 'finance',
    language: 'zh',
    weight: 9,
    enabled: true,
  },
  {
    id: 'wallstreetcn',
    name: '华尔街见闻',
    url: 'https://rsshub.app/wallstreetcn/news/global',
    category: 'finance',
    language: 'zh',
    weight: 9,
    enabled: false,
  },
  {
    id: 'eastmoney',
    name: '东方财富',
    url: 'https://rsshub.app/eastmoney/report/strategyreport',
    category: 'finance',
    language: 'zh',
    weight: 7,
    enabled: false,
  },
  {
    id: 'cls',
    name: '财联社',
    url: 'https://rsshub.app/cls/telegraph',
    category: 'finance',
    language: 'zh',
    weight: 10,
    enabled: false,
  },
  {
    id: 'ithome-finance',
    name: 'IT之家财经',
    url: 'https://www.ithome.com/rss/',
    category: 'finance',
    language: 'zh',
    weight: 8,
    enabled: false,
  },
  // 注：36氪统一使用 tech 分类，金融相关内容通过智能分类识别

  // ===== 已禁用的源 =====
  {
    id: 'mindtheproduct',
    name: 'Mind the Product',
    url: 'https://www.mindtheproduct.com/feed/',
    category: 'product-management',
    language: 'en',
    weight: 9,
    enabled: false,
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    language: 'en',
    weight: 7,
    enabled: false,
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    language: 'en',
    weight: 7,
    enabled: false,
  },
];

export const categoryLabels: Record<string, { name: string; description: string }> = {
  'product-management': {
    name: '产品经理',
    description: '产品思维、需求分析',
  },
  'tech': {
    name: '科技动态',
    description: '前沿技术、行业趋势',
  },
  'ai': {
    name: '人工智能',
    description: 'AI 技术、应用洞察',
  },
  'finance': {
    name: '金融市场',
    description: '投资分析、财经动态',
  },
};
