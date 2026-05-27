/**
 * 职业发展内容源配置
 * 支持RSS、API、爬虫等多种内容获取方式
 */

export interface ContentSourceConfig {
  sourceId: string;
  sourceName: string;
  sourceType: 'rss' | 'api' | 'scraper' | 'webhook';
  platform: 'xiaohongshu' | 'douyin' | 'bilibili' | 'zhihu' | 'wechat' | 'rss' | 'weibo';
  category: 'communication' | 'productivity' | 'teamwork' | 'leadership' | 'all';
  url: string;
  enabled: boolean;
  weight: number;
  fetchInterval: number; // 秒
  description?: string;
  config?: {
    selectors?: Record<string, string>;
    filters?: string[];
    apiEndpoint?: string;
    headers?: Record<string, string>;
  };
}

// 内容平台标签映射
export const platformLabels: Record<string, { name: string; icon: string; color: string }> = {
  xiaohongshu: {
    name: '小红书',
    icon: 'BookOpen',
    color: '#FF2442',
  },
  douyin: {
    name: '抖音',
    icon: 'Video',
    color: '#000000',
  },
  bilibili: {
    name: '哔哩哔哩',
    icon: 'PlayCircle',
    color: '#00A1D6',
  },
  zhihu: {
    name: '知乎',
    icon: 'MessageCircle',
    color: '#0066FF',
  },
  wechat: {
    name: '微信公众号',
    icon: 'MessageSquare',
    color: '#07C160',
  },
  rss: {
    name: 'RSS订阅',
    icon: 'Rss',
    color: '#FFA500',
  },
  weibo: {
    name: '微博',
    icon: 'AtSign',
    color: '#E6162D',
  },
};

// 内容类型标签
export const contentTypeLabels: Record<string, { name: string; icon: string }> = {
  article: { name: '文章', icon: 'FileText' },
  video: { name: '视频', icon: 'Video' },
  short_video: { name: '短视频', icon: 'Smartphone' },
  live: { name: '直播', icon: 'Radio' },
  audio: { name: '音频', icon: 'Headphones' },
};

// 职业分类与关键词映射（用于自动分类与匹配度验证）
// 格式: [关键词, 权重] — 权重越高表示该关键词对该分类的指示性越强
// 每个分类覆盖其核心要素，匹配度>=80%
export const categoryKeywords: Record<string, Array<[string, number]>> = {
  // ============ 职场沟通 ============
  // 核心要素：有效倾听、清晰表达、非语言沟通、冲突解决
  communication: [
    // --- 有效倾听 ---
    ['倾听', 3], ['聆听', 3], ['共情', 3], ['同理心', 3], ['换位思考', 3],
    ['理解对方', 2], ['虚心听取', 2], ['接纳意见', 2],
    // --- 清晰表达 ---
    ['沟通', 3], ['表达', 3], ['汇报', 3], ['演讲', 3], ['写作', 2],
    ['PPT', 2], ['演示', 2], ['表达力', 3], ['口才', 2], ['说服力', 3],
    ['沟通技巧', 3], ['沟通能力', 3], ['沟通方法', 3], ['沟通方式', 2],
    ['讲清楚', 2], ['说清楚', 2], ['结构表达', 3], ['逻辑表达', 3],
    ['工作汇报', 3], ['汇报工作', 3], ['述职', 3], ['周报', 1],
    // --- 非语言沟通 ---
    ['肢体语言', 2], ['表情管理', 2], ['气场', 2], ['仪态', 2],
    ['眼神交流', 2], ['声音控制', 1],
    // --- 冲突解决 ---
    ['冲突', 3], ['矛盾', 3], ['分歧', 3], ['调解', 3], ['化解', 3],
    ['冲突管理', 3], ['冲突处理', 3], ['对立', 2], ['协商', 3],
    ['和解', 2], ['谈判', 3], ['协调', 2], ['斡旋', 3],
    // --- 向上沟通 ---
    ['向上管理', 3], ['领导沟通', 3], ['和老板', 3], ['对上级', 2],
    ['汇报技巧', 3],
    // --- 跨部门/横向沟通 ---
    ['跨部门', 3], ['横向沟通', 3], ['部门协作', 2], ['跨职能', 2],
    // --- 情商/人际关系 ---
    ['情商', 3], ['人际关系', 3], ['职场关系', 3], ['同事关系', 3],
    ['人脉', 2], ['社交', 1], ['赞美', 2], ['批评方式', 2], ['反馈', 2],
    // --- 其他 ---
    ['会议发言', 3], ['公开场合', 2], ['面试', 1], ['谈薪资', 2],
    ['说话', 1], ['开口', 1], ['提问', 2], ['回答', 1],
    ['communication', 3], ['listen', 3], ['listening', 3], ['active listening', 3],
    ['nonverbal', 2], ['body language', 2], ['conflict', 3], ['conflict resolution', 3],
    ['negotiation', 3], ['feedback', 2], ['presentation', 2],
  ],

  // ============ 高效工作 ============
  // 核心要素：时间管理、任务优先级划分、专注力提升、工作方法优化
  productivity: [
    // --- 时间管理 ---
    ['时间管理', 3], ['时间规划', 3], ['日程', 2], ['日历', 1],
    ['番茄工作法', 3], ['番茄钟', 3], ['GTD', 3], ['时间块', 3],
    ['时间分配', 3], ['时间记录', 2],
    // --- 任务优先级划分 ---
    ['优先级', 3], ['轻重缓急', 3], ['四象限', 3], ['要事第一', 3],
    ['任务管理', 3], ['任务分解', 3], ['待办', 2], ['TODO', 2],
    ['计划', 1], ['规划', 1], ['目标拆分', 2],
    // --- 专注力提升 ---
    ['专注', 3], ['注意力', 3], ['心流', 3], ['深度工作', 3],
    ['免受打扰', 2], ['手机成瘾', 2], ['分心', 2], ['干扰', 2],
    ['冥想', 2], ['正念', 2], ['精力管理', 3], ['精神状态', 2],
    // --- 工作方法优化 ---
    ['效率', 3], ['生产力', 3], ['工作方法', 3], ['方法论', 2],
    ['工作流', 3], ['流程优化', 3], ['自动化', 3], ['批处理', 2],
    ['习惯', 2], ['自律', 2], ['拖延', 2], ['拖延症', 3],
    // --- 数字工具 ---
    ['效率工具', 3], ['浏览器扩展', 2], ['Chrome扩展', 2], ['插件', 1],
    ['知识管理', 3], ['笔记', 2], ['Notion', 2], ['Obsidian', 2],
    ['AI工具', 3], ['Claude', 2], ['ChatGPT', 2], ['AI辅助', 3],
    // --- 复盘总结 ---
    ['复盘', 2], ['总结', 1], ['反思', 1], ['迭代', 1],
    ['碎片时间', 2], ['时间碎片', 2],
    ['productivity', 3], ['time management', 3], ['prioritization', 3], ['priority', 2],
    ['focus', 3], ['deep work', 3], ['task management', 3], ['workflow', 2],
    ['automation', 2], ['gtd', 3], ['pomodoro', 3],
  ],

  // ============ 团队协作 ============
  // 核心要素：目标对齐、角色分工、信任建立、协作工具应用
  teamwork: [
    // --- 目标对齐 ---
    ['目标对齐', 3], ['目标一致', 3], ['统一目标', 3], ['共同目标', 3],
    ['OKR', 3], ['KPI', 2], ['目标管理', 3], ['战略对齐', 3],
    ['愿景', 2], ['使命', 2], ['共识', 3], ['达成一致', 3],
    // --- 角色分工 ---
    ['角色分工', 3], ['职责', 2], ['角色清晰', 3], ['分工', 3],
    ['授权', 2], ['RACI', 2], ['职责矩阵', 2], ['边界', 1],
    // --- 信任建立 ---
    ['信任', 3], ['坦诚', 3], ['透明', 2], ['心理安全', 3],
    ['包容', 2], ['尊重', 2], ['可靠', 1], ['承诺', 1],
    // --- 协作工具应用 ---
    ['协作工具', 3], ['协同工具', 3], ['协同办公', 3], ['在线协作', 3],
    ['飞书', 2], ['钉钉', 2], ['企业微信', 2], ['Teams', 2], ['Slack', 2],
    ['文档协作', 3], ['共享文档', 2], ['石墨', 1], ['语雀', 1],
    // --- 团队建设 ---
    ['团队', 3], ['协作', 3], ['合作', 3], ['协同', 3],
    ['团队建设', 3], ['凝聚力', 3], ['团队文化', 3], ['团队氛围', 3],
    ['团建', 3], ['团队精神', 2],
    // --- 项目管理 ---
    ['项目管理', 3], ['项目经理', 3], ['PMP', 2], ['里程碑', 2],
    ['范围管理', 2], ['进度管理', 2], ['风险管理', 2], ['问题管理', 2],
    ['干系人', 2], ['资源管理', 2], ['需求管理', 2],
    ['Scrum', 3], ['Kanban', 3], ['敏捷', 3],
    ['项目进度', 2], ['跟进', 1], ['执行', 1],
    // --- 跨团队/远程 ---
    ['跨团队', 2], ['远程协作', 3], ['远程办公', 3], ['分布式团队', 3],
    ['异地', 2], ['时差', 1],
    // --- 会议/沟通 ---
    ['头脑风暴', 2], ['站会', 2], ['晨会', 1], ['周会', 1],
    ['会议效率', 3], ['高效会议', 3],
    ['teamwork', 3], ['collaboration', 3], ['collaborative', 2],
    ['alignment', 3], ['goal alignment', 3], ['coordination', 2], ['handoff', 2],
    ['role', 2], ['roles', 2], ['responsibility', 2], ['raci', 2],
    ['trust', 3], ['psychological safety', 3], ['cross-functional', 2], ['remote', 2], ['remote work', 2],
    ['agile', 3], ['scrum', 3], ['kanban', 3],
    ['async', 2], ['asynchronous', 2], ['meeting', 2], ['meetings', 2],
  ],

  // ============ 领导力 ============
  // 核心要素：战略决策、变革引领
  leadership: [
    ['领导力', 3], ['管理', 2], ['带团队', 3], ['团队管理', 3],
    ['绩效', 3], ['绩效管理', 3], ['激励', 3], ['授权', 2],
    ['培养', 2], ['辅导', 2], ['教练', 2], ['一对一', 2], ['1对1', 2],
    ['晋升', 2], ['人才', 2], ['梯队', 2],
    ['战略', 3], ['战略规划', 3], ['战略选择', 3], ['战略决策', 3], ['战略思维', 3],
    ['决策', 3], ['决策框架', 3], ['决策模型', 3], ['关键决策', 3], ['权衡', 3], ['取舍', 3],
    ['资源配置', 3], ['资源分配', 3], ['投入产出', 2], ['风险决策', 3],
    ['变革', 3], ['组织变革', 3], ['变革管理', 3], ['变更管理', 3],
    ['转型', 3], ['转型升级', 3], ['文化变革', 3], ['推进变革', 3], ['推动变更', 3],
    ['阻力', 2], ['变革阻力', 3], ['利益相关方', 3], ['再造', 2], ['重构', 2],
    ['strategy', 3], ['strategic', 3], ['decision', 3], ['decision making', 3],
    ['change management', 3], ['organizational change', 3], ['transformation', 3], ['stakeholder', 3],
    ['leadership', 3], ['management', 3], ['people management', 3], ['performance', 3], ['coach', 2],
  ],
};

// 内容源配置列表
export const contentSources: ContentSourceConfig[] = [
  // ===== 通用源（category=all，自动分类到4个分类） =====
  // 说明：这些通用源会经过「质量检测 + 分类匹配」双重筛选；若提供 filters，将先做一次强相关关键词初筛以提升命中率。
  {
    sourceId: 'woshipm-career',
    sourceName: '人人都是产品经理-职场',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/category/zhichang/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800, // 30分钟
    description: '人人都是产品经理职场分类RSS，自动分类到各子分类',
  },
  {
    sourceId: 'woshipm-operation',
    sourceName: '人人都是产品经理-运营',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/category/yunying/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '人人都是产品经理运营分类RSS',
  },
  {
    sourceId: 'woshipm-manage',
    sourceName: '人人都是产品经理-管理',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/category/guanli/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '人人都是产品经理管理分类RSS',
  },
  {
    sourceId: 'woshipm-tag-leadership',
    sourceName: '人人都是产品经理-标签：领导力',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E9%A2%86%E5%AF%BC%E5%8A%9B/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800,
    description: '更聚焦“领导力”的标签RSS，减少泛行业新闻噪声',
  },
  {
    sourceId: 'woshipm-tag-strategy',
    sourceName: '人人都是产品经理-标签：战略',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E6%88%98%E7%95%A5/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '战略与决策相关内容的标签RSS',
  },
  {
    sourceId: 'woshipm-tag-change',
    sourceName: '人人都是产品经理-标签：变革',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E5%8F%98%E9%9D%A9/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '组织变革/转型相关内容的标签RSS',
  },
  {
    sourceId: 'woshipm-tag-change-mgmt',
    sourceName: '人人都是产品经理-标签：变革管理',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E5%8F%98%E9%9D%A9%E7%AE%A1%E7%90%86/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800,
    description: '变革管理标签RSS（更贴近“变革引领”要求）',
  },
  {
    sourceId: 'woshipm-tag-org-change',
    sourceName: '人人都是产品经理-标签：组织变革',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E7%BB%84%E7%BB%87%E5%8F%98%E9%9D%A9/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800,
    description: '组织变革标签RSS（更贴近“变革引领”要求）',
  },
  {
    sourceId: 'woshipm-tag-communication',
    sourceName: '人人都是产品经理-标签：沟通',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E6%B2%9F%E9%80%9A/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800,
    description: '更聚焦“职场沟通”类内容的标签RSS',
  },
  {
    sourceId: 'woshipm-tag-upward-management',
    sourceName: '人人都是产品经理-标签：向上管理',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E5%90%91%E4%B8%8A%E7%AE%A1%E7%90%86/feed',
    enabled: true,
    weight: 10,
    fetchInterval: 1800,
    description: '更聚焦“向上管理/汇报/对齐”的标签RSS',
  },
  {
    sourceId: 'woshipm-tag-feedback',
    sourceName: '人人都是产品经理-标签：反馈',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E5%8F%8D%E9%A6%88/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '绩效反馈/沟通反馈相关的标签RSS',
  },
  {
    sourceId: 'woshipm-tag-review',
    sourceName: '人人都是产品经理-标签：复盘',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.woshipm.com/tag/%E5%A4%8D%E7%9B%98/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 1800,
    description: '复盘方法与复盘实践相关的标签RSS',
  },
  {
    sourceId: 'sspai-all',
    sourceName: '少数派',
    sourceType: 'rss',
    platform: 'rss',
    category: 'productivity',
    url: 'https://sspai.com/feed',
    enabled: true,
    weight: 9,
    fetchInterval: 3600,
    description: '少数派全部内容RSS（效率工具与方法为主）',
  },
  {
    sourceId: 'firstround-review',
    sourceName: 'First Round Review',
    sourceType: 'rss',
    platform: 'rss',
    category: 'leadership',
    url: 'https://review.firstround.com/rss',
    enabled: false,
    weight: 8,
    fetchInterval: 7200,
    description: '领导力/团队管理/组织建设相关文章（英文）',
  },
  {
    sourceId: 'hbr-org',
    sourceName: 'Harvard Business Review',
    sourceType: 'rss',
    platform: 'rss',
    category: 'leadership',
    url: 'http://feeds.harvardbusiness.org/harvardbusiness/',
    enabled: false,
    weight: 8,
    fetchInterval: 7200,
    description: '战略决策、领导力、组织管理相关文章（英文）',
  },
  {
    sourceId: 'atlassian-blog',
    sourceName: 'Atlassian Blog',
    sourceType: 'rss',
    platform: 'rss',
    category: 'teamwork',
    url: 'https://www.atlassian.com/blog/feed',
    enabled: false,
    weight: 7,
    fetchInterval: 7200,
    description: '团队协作、敏捷实践、协作工具相关文章（英文）',
  },
  {
    sourceId: 'asana-blog',
    sourceName: 'Asana Blog',
    sourceType: 'rss',
    platform: 'rss',
    category: 'teamwork',
    url: 'https://blog.asana.com/feed/',
    enabled: false,
    weight: 7,
    fetchInterval: 7200,
    description: '团队协作、目标对齐、工作方法相关文章（英文）',
  },
  {
    sourceId: 'calnewport-blog',
    sourceName: 'Cal Newport',
    sourceType: 'rss',
    platform: 'rss',
    category: 'productivity',
    url: 'https://www.calnewport.com/blog/feed/',
    enabled: false,
    weight: 7,
    fetchInterval: 7200,
    description: '专注力与高效工作方法（英文）',
  },
  {
    sourceId: 'fs-blog',
    sourceName: 'Farnam Street',
    sourceType: 'rss',
    platform: 'rss',
    category: 'leadership',
    url: 'https://fs.blog/feed/',
    enabled: false,
    weight: 7,
    fetchInterval: 7200,
    description: '决策与领导力相关文章（英文）',
  },
  {
    sourceId: 'signal-v-noise',
    sourceName: 'Signal v. Noise',
    sourceType: 'rss',
    platform: 'rss',
    category: 'teamwork',
    url: 'https://signalvnoise.com/posts.rss',
    enabled: false,
    weight: 7,
    fetchInterval: 7200,
    description: '团队协作、管理与工作方式相关文章（英文）',
  },

  {
    sourceId: 'zhihu-daily-selection',
    sourceName: '知乎',
    sourceType: 'rss',
    platform: 'zhihu',
    category: 'all',
    url: 'https://www.zhihu.com/rss',
    enabled: false,
    weight: 6,
    fetchInterval: 1800,
    description: '知乎RSS（通过关键词匹配筛选职业发展相关内容）',
  },
  {
    sourceId: 'zhihu-hotlist-career',
    sourceName: '知乎-热榜',
    sourceType: 'rss',
    platform: 'zhihu',
    category: 'all',
    url: 'https://rsshub.app/zhihu/hotlist?filter=产品经理|职场|沟通|汇报|领导力|效率|时间管理|跨部门|项目管理|OKR|面试',
    enabled: true,
    weight: 6,
    fetchInterval: 1800,
    description: '知乎热榜中职业发展相关内容（RSSHub + 关键词过滤 + 站内匹配）',
  },
  {
    sourceId: 'zhihu-daily-career',
    sourceName: '知乎-日报',
    sourceType: 'rss',
    platform: 'zhihu',
    category: 'all',
    url: 'https://rsshub.app/zhihu/daily?filter=产品经理|职场|沟通|汇报|领导力|效率|时间管理|跨部门|项目管理|OKR|面试',
    enabled: true,
    weight: 5,
    fetchInterval: 3600,
    description: '知乎日报中职业发展相关内容（RSSHub + 关键词过滤 + 站内匹配）',
  },
  {
    sourceId: 'xiaohongshu-career-board',
    sourceName: '小红书-职场',
    sourceType: 'rss',
    platform: 'xiaohongshu',
    category: 'all',
    url: 'https://rsshub.app/xiaohongshu/board/5db6f79200000000020032df',
    enabled: false,
    weight: 5,
    fetchInterval: 3600,
    description: '小红书笔记（需要自建 RSSHub + Puppeteer，建议配置 RSSHUB_BASE_URL 和 XIAOHONGSHU_COOKIE）',
  },
  {
    sourceId: '36kr-articles',
    sourceName: '36氪-文章资讯',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://36kr.com/feed-article',
    enabled: true,
    weight: 7,
    fetchInterval: 3600,
    description: '商业/管理/职场相关中文资讯（通过关键词匹配筛选）',
    config: {
      filters: [
        '职场',
        '向上管理',
        '汇报',
        '沟通',
        '跨部门',
        '协作',
        '团队',
        '团队建设',
        'OKR',
        'KPI',
        '项目管理',
        '敏捷',
        '时间管理',
        '优先级',
        '复盘',
        '效率',
        '专注',
        '工作流',
        'SOP',
        '组织变革',
        '变革管理',
        '战略',
        '决策',
      ],
    },
  },
  {
    sourceId: 'huxiu-rss',
    sourceName: '虎嗅',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://rss.huxiu.com/',
    enabled: true,
    weight: 7,
    fetchInterval: 3600,
    description: '商业/管理/职场相关中文资讯（通过关键词匹配筛选）',
    config: {
      filters: [
        '职场',
        '向上管理',
        '汇报',
        '沟通',
        '跨部门',
        '协作',
        '团队',
        '团队建设',
        'OKR',
        'KPI',
        '项目管理',
        '敏捷',
        '时间管理',
        '优先级',
        '复盘',
        '效率',
        '专注',
        '工作流',
        'SOP',
        '组织变革',
        '变革管理',
        '战略',
        '决策',
      ],
    },
  },
  {
    sourceId: 'tmtpost',
    sourceName: '钛媒体',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.tmtpost.com/feed',
    enabled: true,
    weight: 7,
    fetchInterval: 3600,
    description: '商业/组织/管理相关中文资讯（通过关键词匹配筛选）',
    config: {
      filters: [
        '职场',
        '向上管理',
        '汇报',
        '沟通',
        '跨部门',
        '协作',
        '团队',
        '团队建设',
        'OKR',
        'KPI',
        '项目管理',
        '敏捷',
        '时间管理',
        '优先级',
        '复盘',
        '效率',
        '专注',
        '工作流',
        'SOP',
        '组织变革',
        '变革管理',
        '战略',
        '决策',
      ],
    },
  },
  {
    sourceId: 'ifanr',
    sourceName: '爱范儿',
    sourceType: 'rss',
    platform: 'rss',
    category: 'all',
    url: 'https://www.ifanr.com/feed',
    enabled: true,
    weight: 6,
    fetchInterval: 3600,
    description: '科技/商业与工作方式相关中文资讯（通过关键词匹配筛选）',
    config: {
      filters: [
        '职场',
        '向上管理',
        '汇报',
        '沟通',
        '跨部门',
        '协作',
        '团队',
        '团队建设',
        'OKR',
        'KPI',
        '项目管理',
        '敏捷',
        '时间管理',
        '优先级',
        '复盘',
        '效率',
        '专注',
        '工作流',
        'SOP',
        '组织变革',
        '变革管理',
        '战略',
        '决策',
      ],
    },
  },

  // ===== 短视频/社交平台源（通过RSSHub接入） =====
  {
    sourceId: 'bilibili-video-curation',
    sourceName: '哔哩哔哩',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'http://localhost:3001/api/career/video-feed?platform=bilibili',
    enabled: true,
    weight: 6,
    fetchInterval: 1800,
    description: '站内维护的视频链接清单（点击跳转原站播放）',
  },
  {
    sourceId: 'bilibili-weekly',
    sourceName: '哔哩哔哩-每周必看',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/weekly',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站每周必看（通过RSSHub接入，实时增量）',
  },
  {
    sourceId: 'bilibili-career-ranking',
    sourceName: '哔哩哔哩-职场热榜',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/partion/ranking/209/7',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站职业职场分区热榜（近7天，通过RSSHub接入）',
  },
  {
    sourceId: 'bilibili-xiapengbenpeng',
    sourceName: 'B站-夏鹏本鹏',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/user/dynamic/3546800797518640',
    enabled: false,
    weight: 5,
    fetchInterval: 1800, // 30分钟
    description: 'B站UP主：夏鹏本鹏（动态）',
  },
  {
    sourceId: 'bilibili-vsearch-workplace-communication',
    sourceName: 'B站-视频搜索：职场沟通',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/vsearch/%E8%81%8C%E5%9C%BA%E6%B2%9F%E9%80%9A/pubdate',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站视频搜索（按最新发布），扩充“职场沟通”相关视频池',
  },
  {
    sourceId: 'bilibili-vsearch-leadership',
    sourceName: 'B站-视频搜索：领导力',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/vsearch/%E9%A2%86%E5%AF%BC%E5%8A%9B/pubdate',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站视频搜索（按最新发布），扩充“领导力”相关视频池',
  },
  {
    sourceId: 'bilibili-vsearch-upward-management',
    sourceName: 'B站-视频搜索：向上管理',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/vsearch/%E5%90%91%E4%B8%8A%E7%AE%A1%E7%90%86/pubdate',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站视频搜索（按最新发布），扩充“向上管理”相关视频池',
  },
  {
    sourceId: 'bilibili-vsearch-cross-team-communication',
    sourceName: 'B站-视频搜索：跨部门沟通',
    sourceType: 'rss',
    platform: 'bilibili',
    category: 'all',
    url: 'https://rsshub.app/bilibili/vsearch/%E8%B7%A8%E9%83%A8%E9%97%A8%E6%B2%9F%E9%80%9A/pubdate',
    enabled: true,
    weight: 5,
    fetchInterval: 1800,
    description: 'B站视频搜索（按最新发布），扩充“跨部门沟通”相关视频池',
  },
  {
    sourceId: 'xiaohongshu-career',
    sourceName: '小红书-职场成长',
    sourceType: 'rss',
    platform: 'xiaohongshu',
    category: 'all',
    url: 'https://rsshub.app/xiaohongshu/user/职场成长',  // RSSHub地址
    enabled: false,
    weight: 5,
    fetchInterval: 1800,
    description: '小红书职场/成长类博主内容',
  },
  {
    sourceId: 'douyin-career',
    sourceName: '抖音-职场干货',
    sourceType: 'rss',
    platform: 'douyin',
    category: 'all',
    url: 'https://rsshub.app/douyin/user/职场干货',  // RSSHub地址
    enabled: false,
    weight: 5,
    fetchInterval: 1800,
    description: '抖音职场干货短视频内容',
  },
];

// 获取启用的内容源
export function getEnabledSources(): ContentSourceConfig[] {
  return contentSources.filter(source => source.enabled);
}

// 根据分类获取内容源
export function getSourcesByCategory(category: string): ContentSourceConfig[] {
  return contentSources.filter(
    source => source.enabled && (source.category === category || source.category === 'all')
  );
}

// 根据平台获取内容源
export function getSourcesByPlatform(platform: string): ContentSourceConfig[] {
  return contentSources.filter(
    source => source.enabled && source.platform === platform
  );
}

// 自动分类函数 - 根据标题和描述判断分类
// 使用加权关键词匹配，需要达到最低阈值才分配到具体分类
export function autoClassify(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  const scores: Record<string, number> = {
    communication: 0,
    productivity: 0,
    teamwork: 0,
    leadership: 0,
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const [keyword, weight] of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] += weight;
      }
    }
  }
  
  // 找到得分最高的分类
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const maxScore = sorted[0][1];
  const secondScore = sorted[1][1];
  
  // 最低阈值：至少需要2分才能分配到具体分类
  // 且领先第二名至少1分，确保分类有区分度
  if (maxScore >= 2 && maxScore > secondScore) {
    return sorted[0][0];
  }
  
  // 未达到阈值，归为'all'（综合）
  return 'all';
}

// 内容去重键生成
export function generateContentKey(platform: string, originalId: string): string {
  return `${platform}:${originalId}`;
}

// 默认封面图
export const defaultCoverImages: Record<string, string> = {
  communication: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
  productivity: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
  teamwork: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
  leadership: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
  all: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
};

export function getDefaultCover(category: string): string {
  return defaultCoverImages[category] || defaultCoverImages.all;
}
