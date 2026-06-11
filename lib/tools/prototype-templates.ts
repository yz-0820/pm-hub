import { CreatePrototypeInput, PrototypePlatform } from './prototype-spec';

export type PrototypeTemplateId =
  | 'mobile-home'
  | 'mobile-detail'
  | 'mobile-list'
  | 'mobile-form'
  | 'mobile-dashboard'
  | 'mobile-membership'
  | 'mobile-feed'
  | 'mobile-media';

export type PrototypeTemplate = {
  id: PrototypeTemplateId;
  name: string;
  platform: PrototypePlatform;
  description: string;
  preferredKeywords: string[];
  sections: string[];
};

export const prototypeTemplates: Record<PrototypeTemplateId, PrototypeTemplate> = {
  'mobile-home': {
    id: 'mobile-home',
    name: 'Mobile Home',
    platform: 'mobile',
    description: 'App home screen with search, hero, shortcuts, cards, and bottom navigation.',
    preferredKeywords: ['首页', 'home', '入口', '推荐', '发现'],
    sections: ['status bar', 'search header', 'hero', 'quick actions', 'content cards', 'bottom nav'],
  },
  'mobile-detail': {
    id: 'mobile-detail',
    name: 'Mobile Detail',
    platform: 'mobile',
    description: 'Detail page with cover, core information, action area, and related content.',
    preferredKeywords: ['详情', 'detail', '介绍', '内容页'],
    sections: ['top bar', 'cover', 'summary', 'action buttons', 'detail cards'],
  },
  'mobile-list': {
    id: 'mobile-list',
    name: 'Mobile List',
    platform: 'mobile',
    description: 'List page with filters, segmented tabs, dense cards, and primary action.',
    preferredKeywords: ['列表', 'list', '筛选', '搜索结果'],
    sections: ['search header', 'tabs', 'filter chips', 'list rows', 'bottom action'],
  },
  'mobile-form': {
    id: 'mobile-form',
    name: 'Mobile Form',
    platform: 'mobile',
    description: 'Form page with grouped inputs, helper content, and sticky submit action.',
    preferredKeywords: ['表单', 'form', '填写', '提交', '设置'],
    sections: ['top bar', 'form sections', 'helper card', 'sticky button'],
  },
  'mobile-dashboard': {
    id: 'mobile-dashboard',
    name: 'Mobile Dashboard',
    platform: 'mobile',
    description: 'Mobile analytics dashboard with KPI cards, chart placeholders, and task list.',
    preferredKeywords: ['dashboard', '数据', '看板', '分析', '指标'],
    sections: ['top bar', 'kpi cards', 'chart card', 'insight list', 'bottom nav'],
  },
  'mobile-membership': {
    id: 'mobile-membership',
    name: 'Mobile Membership',
    platform: 'mobile',
    description: 'Subscription or member-benefit page with pricing, benefits, and sticky CTA.',
    preferredKeywords: ['会员', '订阅', '权益', '续费', '付费'],
    sections: ['member hero', 'plan cards', 'benefit list', 'sticky CTA'],
  },
  'mobile-feed': {
    id: 'mobile-feed',
    name: 'Mobile Feed',
    platform: 'mobile',
    description: 'Content feed with stories, content cards, topic chips, and navigation.',
    preferredKeywords: ['内容流', 'feed', '社区', '资讯', '文章'],
    sections: ['status bar', 'topic tabs', 'featured card', 'feed cards', 'bottom nav'],
  },
  'mobile-media': {
    id: 'mobile-media',
    name: 'Mobile Media',
    platform: 'mobile',
    description: 'Music or media app home screen with player, cover art, playlist cards, ranking, and bottom nav.',
    preferredKeywords: ['音乐', 'music', '歌曲', '歌单', '播放器', '音频', '专辑', '电台'],
    sections: ['status bar', 'search header', 'daily mix hero', 'shortcuts', 'playlist cards', 'ranking', 'mini player', 'bottom nav'],
  },
};

export function selectPrototypeTemplate(input: Pick<CreatePrototypeInput, 'pageType' | 'productContext' | 'keyContent' | 'instructions'>): PrototypeTemplate {
  const haystack = [input.pageType, input.productContext, input.keyContent, input.instructions].join(' ').toLowerCase();
  const strongSignals: Partial<Record<PrototypeTemplateId, string[]>> = {
    'mobile-media': ['音乐', 'music', '歌曲', '歌单', '播放器', '音频', '专辑', '电台', '听歌'],
    'mobile-membership': ['会员', '订阅', '权益', '续费', '付费', '套餐'],
    'mobile-dashboard': ['dashboard', '数据', '看板', '分析', '指标', '报表'],
  };
  const scored = Object.values(prototypeTemplates).map((template) => ({
    template,
    score:
      template.preferredKeywords.reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0) +
      (strongSignals[template.id]?.some((keyword) => haystack.includes(keyword.toLowerCase())) ? 4 : 0),
  }));
  scored.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return prototypeTemplates[a.template.id].id.localeCompare(prototypeTemplates[b.template.id].id);
  });
  return scored[0]?.score ? scored[0].template : prototypeTemplates['mobile-home'];
}

export function getPrototypeTemplate(id?: string): PrototypeTemplate {
  return (id && prototypeTemplates[id as PrototypeTemplateId]) || prototypeTemplates['mobile-home'];
}
