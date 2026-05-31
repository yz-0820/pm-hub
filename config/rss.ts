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
  // 中文源 - 产品经理
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
    url: 'https://www.pmcaff.com/rss',
    category: 'product-management',
    language: 'zh',
    weight: 9,
    enabled: true,
  },
  // 中文源 - 科技资讯
  {
    id: 'geekpark',
    name: '极客公园',
    url: 'https://www.geekpark.net/rss',
    category: 'tech',
    language: 'zh',
    weight: 8,
    enabled: true,
  },
  {
    id: '36kr',
    name: '36氪',
    url: 'https://36kr.com/feed',
    category: 'tech',
    language: 'zh',
    weight: 8,
    enabled: true,
  },
  {
    id: 'huxiu',
    name: '虎嗅',
    url: 'https://www.huxiu.com/rss/0.xml',
    category: 'tech',
    language: 'zh',
    weight: 7,
    enabled: true,
  },
  // 英文源 - Product Management
  {
    id: 'producthunt',
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/feed',
    category: 'product-discovery',
    language: 'en',
    weight: 8,
    enabled: true,
  },
  {
    id: 'mindtheproduct',
    name: 'Mind the Product',
    url: 'https://www.mindtheproduct.com/feed/',
    category: 'product-management',
    language: 'en',
    weight: 9,
    enabled: true,
  },
  // 英文源 - Tech & AI
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
    language: 'en',
    weight: 7,
    enabled: true,
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    language: 'en',
    weight: 7,
    enabled: true,
  },
];

export const categoryLabels: Record<string, { name: string; description: string }> = {
  'product-management': {
    name: '产品经理',
    description: '产品设计、需求分析、项目管理等',
  },
  'product-discovery': {
    name: '产品发现',
    description: '新产品、创新工具、产品推荐',
  },
  'tech': {
    name: '科技资讯',
    description: '科技行业动态、技术趋势',
  },
  'ai': {
    name: '人工智能',
    description: 'AI技术、应用案例、行业分析',
  },
  'finance': {
    name: '金融市场',
    description: '美股市场、投资分析、财经资讯',
  },
};
