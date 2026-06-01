/**
 * 职业发展种子内容脚本
 * 为4个分类各生成高匹配度种子内容，覆盖多平台来源
 * 运行: npx tsx scripts/seed-career-content.ts
 */
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data/sqlite.db');
const db = new Database(DB_PATH);

// 确保表存在
db.exec(`
  CREATE TABLE IF NOT EXISTS career_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    source_id TEXT NOT NULL DEFAULT '',
    source_name TEXT NOT NULL DEFAULT '',
    platform TEXT NOT NULL DEFAULT 'rss',
    original_url TEXT NOT NULL DEFAULT '',
    original_id TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT '',
    author_id TEXT DEFAULT '',
    author_avatar TEXT DEFAULT '',
    content_type TEXT NOT NULL DEFAULT 'article',
    category TEXT NOT NULL DEFAULT 'all',
    tags TEXT DEFAULT '[]',
    cover_image TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    video_duration INTEGER DEFAULT 0,
    images TEXT DEFAULT '[]',
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    is_featured INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    published_at INTEGER NOT NULL,
    fetched_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

// 每种来源类型至少保证>=3种
// RSS文章: 人人都是产品经理、少数派
// 知乎专栏: (模拟)
// 视频平台: B站 (模拟)
// 微信公众号: (模拟)

const now = Math.floor(Date.now() / 1000);

const seedContents = [
  // ============ 领导力 (leadership) - 6条 ============
  {
    title: '中层管理者的战略决策能力：如何在高不确定性中做出正确选择',
    description: '中层管理者每天面对复杂的商业环境与有限的信息，如何培养战略思维与决策判断力？本文从信息搜集、风险评估、资源分配到决策复盘，系统拆解管理者必备的战略决策能力框架。',
    content: '战略决策是领导力的核心，管理者需要在不确定性中做出判断...',
    source_id: 'zhihu-column-leadership', source_name: '知乎·管理方法论', platform: 'zhihu',
    content_type: 'article', category: 'leadership', author: '管理实践派',
    cover_image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    view_count: 12000, like_count: 856, comment_count: 142, share_count: 320,
    published_at: now - 3600,
  },
  {
    title: '从技术骨干到团队管理者：转型过程中的核心挑战与领导力修炼',
    description: '从一线执行到带团队管理，很多技术骨干在角色转变中挣扎。本文分享从0到1带团队的真实经历，涵盖授权的艺术、绩效管理、人才培养和团队文化建设等核心领导力修炼。',
    content: '从技术转管理是许多人的职业跃迁，领导力修炼需要从带团队开始...',
    source_id: 'woshipm-manage', source_name: '人人都是产品经理', platform: 'rss',
    content_type: 'article', category: 'leadership', author: '产品领导力',
    cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    view_count: 9800, like_count: 632, comment_count: 98, share_count: 245,
    published_at: now - 7200,
  },
  {
    title: '变革管理实战：如何引领团队拥抱变化、推动组织转型',
    description: '组织变革失败率高达70%，核心原因是缺乏有效的变革引领能力。本文深入剖析变革管理的八大步骤，从建立紧迫感到巩固变革成果，教你如何成为真正的变革推动者。',
    content: '变革管理是领导者最核心的能力之一，拥抱变化才能真正推动组织转型...',
    source_id: 'wechat-leadership', source_name: '哈佛商业评论', platform: 'wechat',
    content_type: 'article', category: 'leadership', author: 'John Kotter',
    cover_image: 'https://images.unsplash.com/photo-1507679799987-c7950b7c348?w=800&h=400&fit=crop',
    view_count: 15600, like_count: 1200, comment_count: 210, share_count: 580,
    published_at: now - 14400,
  },
  {
    title: 'CEO必须掌握的商业模式创新与战略思维框架',
    description: '在竞争激烈的市场中，战略思维是CEO级别领导者的核心竞争力。本文将商业模式画布、蓝海战略、颠覆式创新等经典框架融会贯通，提炼出可落地的战略决策方法论。',
    content: '商业模式创新需要前瞻性的战略思维和决策能力...',
    source_id: 'bilibili-leadership', source_name: 'B站·商业评论', platform: 'bilibili',
    content_type: 'video', category: 'leadership', author: '商业小纸条',
    cover_image: 'https://images.unsplash.com/photo-1559136555-9303bae8f683?w=800&h=400&fit=crop',
    view_count: 25000, like_count: 2300, comment_count: 320, share_count: 890,
    published_at: now - 21600,
  },
  {
    title: '激励团队的艺术：从物质奖励到精神认可的全方位激励体系',
    description: '真正优秀的领导者不仅靠薪酬激励团队，更要懂得如何通过认可、授权、成长机会和使命感来激发团队的持续动力。本文分享激励四象限模型和落地话术。',
    content: '激励团队需要超越物质奖励，精神和认可才是持续动力的源泉...',
    source_id: 'xiaohongshu-leadership', source_name: '小红书·管理日记', platform: 'xiaohongshu',
    content_type: 'article', category: 'leadership', author: '管理笔记',
    cover_image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
    view_count: 8700, like_count: 1250, comment_count: 180, share_count: 410,
    published_at: now - 36000,
  },
  {
    title: '管理者思维升级：从执行者到战略家的认知跃迁之路',
    description: '管理者角色的核心是思维模式的转变。从关注执行到关注方向，从个人贡献到团队成果，本文通过真实案例解析管理者思维升级的五个关键阶段以及对应的领导力能力模型。',
    content: '管理者思维决定了团队的天花板，从执行到战略需要认知跃迁...',
    source_id: 'douyin-leadership', source_name: '抖音·职言职语', platform: 'douyin',
    content_type: 'short_video', category: 'leadership', author: '老李说管理',
    cover_image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=400&fit=crop',
    view_count: 35000, like_count: 3200, comment_count: 450, share_count: 1200,
    published_at: now - 54000,
  },

  // ============ 职场沟通 (communication) - 6条 ============
  {
    title: '有效倾听的力量：为什么顶级管理者都是卓越的倾听者',
    description: '沟通的起点不是表达，而是倾听。本文揭示有效倾听的四个层级——假装听、选择性听、专注听、同理心倾听，并提供可落地的倾听训练方法，帮你成为更好的沟通者。',
    content: '有效倾听是沟通技巧的基石，共情和换位思考让沟通更有深度...',
    source_id: 'woshipm-career', source_name: '人人都是产品经理', platform: 'rss',
    content_type: 'article', category: 'communication', author: '沟通教练',
    cover_image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    view_count: 11000, like_count: 780, comment_count: 135, share_count: 290,
    published_at: now - 1800,
  },
  {
    title: '金字塔原理实战：如何用结构化表达让你的汇报脱颖而出',
    description: '工作汇报是职场沟通的高频场景。掌握金字塔原理——结论先行、以上统下、归类分组、逻辑递进——你的表达力将发生质变。本文包含多个真实工作汇报场景的改造案例。',
    content: '清晰表达需要结构化，金字塔原理是工作汇报的底层逻辑...',
    source_id: 'zhihu-column-communication', source_name: '知乎·表达力训练营', platform: 'zhihu',
    content_type: 'article', category: 'communication', author: '表达教练张老师',
    cover_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    view_count: 18300, like_count: 2150, comment_count: 280, share_count: 670,
    published_at: now - 5000,
  },
  {
    title: '职场冲突化解指南：从对抗到共赢的冲突管理五步法',
    description: '冲突是职场不可避免的一部分，但高水平的管理者能将冲突转化为团队进步的契机。本文结合心理学和组织行为学，提供冲突管理五步法：识别、理解、协商、化解、复盘。',
    content: '冲突管理需要技巧，从倾听矛盾到调解分歧，最终实现化解和共赢...',
    source_id: 'wechat-communication', source_name: '领英·职场洞察', platform: 'wechat',
    content_type: 'article', category: 'communication', author: '职场心理学',
    cover_image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
    view_count: 14200, like_count: 1680, comment_count: 320, share_count: 750,
    published_at: now - 9000,
  },
  {
    title: '非语言沟通的秘密：你的肢体语言正在出卖你',
    description: '研究表明93%的沟通效果取决于非语言因素。本文将系统拆解肢体语言、表情管理、眼神交流、声音控制在职场沟通中的作用，帮你打造专业可靠的沟通形象。',
    content: '肢体语言和表情管理是非语言沟通的核心，气场和仪态同样重要...',
    source_id: 'bilibili-communication', source_name: 'B站·沟通研究所', platform: 'bilibili',
    content_type: 'video', category: 'communication', author: '语言艺术家',
    cover_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
    view_count: 32000, like_count: 4200, comment_count: 580, share_count: 1600,
    published_at: now - 18000,
  },
  {
    title: '跨部门沟通的降龙十八掌：打破部门墙的实战心法',
    description: '跨部门沟通是所有大公司的痛点。本文分享横向沟通的核心方法——从利益分析到共同目标建立，从建立信任到形成沟通机制，帮你打破部门墙，实现高效协作。',
    content: '跨部门沟通需要横向思维，打破部门墙需要利益对齐和信任建立...',
    source_id: 'xiaohongshu-communication', source_name: '小红书·职场日记', platform: 'xiaohongshu',
    content_type: 'article', category: 'communication', author: '互联网老兵',
    cover_image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
    view_count: 9200, like_count: 1450, comment_count: 210, share_count: 430,
    published_at: now - 27000,
  },
  {
    title: '高情商沟通术：如何在不伤人的情况下给出建设性反馈',
    description: '给予反馈是管理者最重要的沟通场景之一。本文分享SBI反馈模型（情境-行为-影响）和如何进行建设性的批评，让你的反馈既有力度又有温度，真正帮助他人成长。',
    content: '高情商沟通需要共情和反馈技巧，建设性批评比表扬更难但更重要...',
    source_id: 'douyin-communication', source_name: '抖音·职场加油站', platform: 'douyin',
    content_type: 'short_video', category: 'communication', author: '沟通大师兄',
    cover_image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop',
    view_count: 28000, like_count: 3800, comment_count: 520, share_count: 1900,
    published_at: now - 45000,
  },

  // ============ 高效工作 (productivity) - 6条 ============
  {
    title: '深度工作法则：如何在碎片化时代保持高质量专注力',
    description: '信息过载的时代，保持专注力是所有知识工作者的必修课。本文融合卡尔·纽波特的深度工作理念，提供四种专注力训练方法和时间管理策略，帮你每天产出4小时高质量工作。',
    content: '深度工作依赖专注力和时间管理，心流状态是生产力的巅峰...',
    source_id: 'woshipm-operation', source_name: '人人都是产品经理', platform: 'rss',
    content_type: 'article', category: 'productivity', author: '效率研究所',
    cover_image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
    view_count: 15400, like_count: 1200, comment_count: 180, share_count: 520,
    published_at: now - 1200,
  },
  {
    title: '番茄工作法进阶指南：从25分钟专注到全天时间块管理',
    description: '番茄工作法不仅仅是一个25分钟的定时器。本文深入番茄钟背后的时间管理哲学，教你如何从番茄钟过渡到更大的时间块规划，实现全天高效产出与精力管理的平衡。',
    content: '番茄工作法是时间管理的基础工具，时间块是更高阶的规划方法...',
    source_id: 'zhihu-productivity', source_name: '知乎·效率指南', platform: 'zhihu',
    content_type: 'article', category: 'productivity', author: '效率控',
    cover_image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=400&fit=crop',
    view_count: 13200, like_count: 1050, comment_count: 160, share_count: 380,
    published_at: now - 6000,
  },
  {
    title: '四象限法则实战：如何正确划分任务优先级并告别忙碌低效',
    description: '很多人每天很忙但产出很低，根本问题在于没有区分任务的轻重缓急。本文深度解析艾森豪威尔四象限法则的实际应用，附真实周计划模板，帮你聚焦要事第一。',
    content: '任务优先级划分是效率管理的核心，四象限法则帮你聚焦真正重要的事...',
    source_id: 'wechat-productivity', source_name: '印象笔记·效率周刊', platform: 'wechat',
    content_type: 'article', category: 'productivity', author: '大卫·艾伦',
    cover_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
    view_count: 18900, like_count: 1600, comment_count: 245, share_count: 680,
    published_at: now - 12000,
  },
  {
    title: 'AI工具组合技：用Claude+Notion搭建第二大脑提升10倍效率',
    description: 'AI工具正在重塑知识工作者的工作方法。本文将Claude、Notion、知识管理方法论结合，展示如何用AI辅助构建工作流自动化系统，实现信息处理效率的质的飞跃。',
    content: '效率工具和AI辅助是提升生产力的捷径，工作流自动化解放创造力...',
    source_id: 'bilibili-productivity', source_name: 'B站·数字生活家', platform: 'bilibili',
    content_type: 'video', category: 'productivity', author: '工具人阿伟',
    cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
    view_count: 42000, like_count: 5200, comment_count: 680, share_count: 2100,
    published_at: now - 24000,
  },
  {
    title: '告别拖延症：基于行为科学的自律养成与习惯改造系统',
    description: '拖延症不是意志力问题，而是系统问题。本文从行为科学和神经科学角度出发，提供习惯回路设计、环境改造和正念冥想相结合的综合方案，帮你从根源上战胜拖延。',
    content: '拖延症需要自律和行为设计对抗，习惯养成的关键在于环境改造...',
    source_id: 'xiaohongshu-productivity', source_name: '小红书·自律打卡营', platform: 'xiaohongshu',
    content_type: 'article', category: 'productivity', author: '自律少女',
    cover_image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&h=400&fit=crop',
    view_count: 11500, like_count: 2100, comment_count: 290, share_count: 820,
    published_at: now - 38000,
  },
  {
    title: '敏捷复盘术：每天15分钟的高效工作复盘让效率持续提升',
    description: '复盘是效率提升的杠杆支点。本文提供轻量级每日复盘模板，结合OKR目标管理，让你在碎片化的日常中持续迭代工作方法，实现螺旋式上升的个人效能。',
    content: '复盘是效率提升的加速器，定期总结和反思让工作方法持续优化...',
    source_id: 'douyin-productivity', source_name: '抖音·效率达人秀', platform: 'douyin',
    content_type: 'short_video', category: 'productivity', author: '效率有术',
    cover_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    view_count: 26000, like_count: 3400, comment_count: 490, share_count: 1500,
    published_at: now - 60000,
  },

  // ============ 团队协作 (teamwork) - 6条 ============
  {
    title: 'OKR落地实战：如何用目标对齐打造一支使命驱动的高绩效团队',
    description: 'OKR不仅是目标管理工具，更是团队目标对齐和文化建设的利器。本文分享OKR在团队中的真实落地经验，从目标共识建立到季度复盘，打造使命驱动的协作团队。',
    content: '目标对齐是团队协作的基础，OKR帮助团队达成一致和共识...',
    source_id: 'woshipm-career', source_name: '人人都是产品经理', platform: 'rss',
    content_type: 'article', category: 'teamwork', author: '团队教练',
    cover_image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
    view_count: 13600, like_count: 950, comment_count: 170, share_count: 450,
    published_at: now - 2400,
  },
  {
    title: '远程协作时代的高绩效团队：分布式团队管理的五个关键要素',
    description: '远程办公成为常态后，团队协作面临全新挑战。本文从协同工具选型、异步沟通规范、信任建立机制到团队文化建设，全面拆解分布式团队管理的五个关键要素。',
    content: '远程协作需要协同工具和信任建立，分布式团队的关键是透明和包容...',
    source_id: 'zhihu-teamwork', source_name: '知乎·远程工作圈', platform: 'zhihu',
    content_type: 'article', category: 'teamwork', author: '远程老司机',
    cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
    view_count: 16500, like_count: 1400, comment_count: 230, share_count: 620,
    published_at: now - 8000,
  },
  {
    title: 'Scrum敏捷实战：如何用Scrum框架建立透明高效的团队协作机制',
    description: 'Scrum不仅仅是站会和Sprint，更是一套完整的团队协作哲学。本文从角色分工、仪式设计到工件管理，手把手教你落地Scrum，让团队协作效率提升200%。',
    content: 'Scrum和敏捷是团队协作的利器，站会和角色分工让协作更透明...',
    source_id: 'wechat-teamwork', source_name: 'Atlassian·敏捷社区', platform: 'wechat',
    content_type: 'article', category: 'teamwork', author: 'Scrum Master老张',
    cover_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
    view_count: 11300, like_count: 920, comment_count: 145, share_count: 350,
    published_at: now - 16000,
  },
  {
    title: '团队文化建设的秘密武器：如何在协作中建立信任和心理安全',
    description: '谷歌re:Work研究发现，团队成功的第一要素不是人才密度而是心理安全。本文分享建立信任的五个落地方法，包括脆弱性示范、包容不同的声音、建设性反馈文化。',
    content: '信任和心理安全是团队文化的基石，透明和坦诚建立凝聚力...',
    source_id: 'bilibili-teamwork', source_name: 'B站·管理自习室', platform: 'bilibili',
    content_type: 'video', category: 'teamwork', author: '管理小课堂',
    cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    view_count: 21000, like_count: 2800, comment_count: 390, share_count: 1100,
    published_at: now - 30000,
  },
  {
    title: '协作工具选型指南：飞书vs钉钉vsTeams，哪款更适合你的团队',
    description: '团队协作工具的选择直接影响协作效率。本文从即时通讯、文档协作、项目管理、视频会议四个维度，客观对比飞书、钉钉、Teams、Slack等主流协作工具的适用场景。',
    content: '协作工具选择和协同办公方案设计是提升团队协作效率的关键...',
    source_id: 'xiaohongshu-teamwork', source_name: '小红书·数字办公', platform: 'xiaohongshu',
    content_type: 'article', category: 'teamwork', author: '效率工具控',
    cover_image: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=400&fit=crop',
    view_count: 18500, like_count: 2600, comment_count: 420, share_count: 980,
    published_at: now - 42000,
  },
  {
    title: '团队角色分工的艺术：用贝尔宾模型打造优势互补的梦之队',
    description: '好的角色分工不是平均分配任务，而是基于每个人的优势进行互补搭配。本文用贝尔宾团队角色模型，教你如何识别团队成员的天然角色倾向，打造协作效率最大化的梦之队。',
    content: '角色分工和团队建设需要科学的模型指导，贝尔宾帮助管理者精准分工...',
    source_id: 'douyin-teamwork', source_name: '抖音·管理第一线', platform: 'douyin',
    content_type: 'short_video', category: 'teamwork', author: '老王的团队经',
    cover_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    view_count: 31000, like_count: 4500, comment_count: 620, share_count: 2200,
    published_at: now - 70000,
  },
];

console.log(`[Seed] Seeding ${seedContents.length} career contents...`);

// 清理旧的数据（仅清理active=1的种子数据，保留RSS抓取的内容）
// 通过 source_id 来区分种子数据和抓取数据
const seedSourceIds = [...new Set(seedContents.map(s => s.source_id))];
for (const sourceId of seedSourceIds) {
  const deleted = db.prepare('DELETE FROM career_contents WHERE source_id = ?').run(sourceId);
  if (deleted.changes > 0) {
    console.log(`  Cleaned ${deleted.changes} existing entries for ${sourceId}`);
  }
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO career_contents (
    title, description, content, source_id, source_name, platform,
    original_url, original_id, author, content_type, category,
    cover_image, video_url, view_count, like_count, comment_count, share_count,
    status, is_featured, published_at, fetched_at, created_at, updated_at
  ) VALUES (
    @title, @description, @content, @source_id, @source_name, @platform,
    @original_url, @original_id, @author, @content_type, @category,
    @cover_image, @video_url, @view_count, @like_count, @comment_count, @share_count,
    'active', 0, @published_at, @fetched_at, @created_at, @updated_at
  )
`);

let inserted = 0;
for (const item of seedContents) {
  const originalUrl = `https://example.com/${item.platform}/${crypto.randomUUID().slice(0, 8)}`;
  insert.run({
    ...item,
    original_url: originalUrl,
    original_id: crypto.createHash('md5').update(originalUrl).digest('hex').slice(0, 16),
    video_url: item.content_type === 'video' || item.content_type === 'short_video' 
      ? `https://example.com/video/${crypto.randomUUID().slice(0,8)}` : '',
    fetched_at: now,
    created_at: now,
    updated_at: now,
  });
  inserted++;
}

// 统计各分类和平台分布
console.log(`\n[Seed] Inserted ${inserted} seed contents`);

const categoryStats = db
  .prepare(`
  SELECT category, COUNT(*) as cnt FROM career_contents WHERE status = 'active' GROUP BY category ORDER BY cnt DESC
`)
  .all() as Array<{ category: string; cnt: number }>;
console.log('\n[Stats] Category distribution:');
for (const row of categoryStats) {
  console.log(`  ${row.category}: ${row.cnt} items`);
}

const platformStats = db
  .prepare(`
  SELECT platform, COUNT(*) as cnt FROM career_contents WHERE status = 'active' GROUP BY platform ORDER BY cnt DESC
`)
  .all() as Array<{ platform: string; cnt: number }>;
console.log('\n[Stats] Platform distribution:');
for (const row of platformStats) {
  console.log(`  ${row.platform}: ${row.cnt} items`);
}

// 来源多样性统计
const sourceStats = db
  .prepare(`
  SELECT source_name, platform, COUNT(*) as cnt FROM career_contents WHERE status = 'active' GROUP BY source_name, platform ORDER BY cnt DESC
`)
  .all() as Array<{ source_name: string; platform: string; cnt: number }>;
console.log('\n[Stats] Source diversity:');
for (const row of sourceStats) {
  console.log(`  ${row.source_name} (${row.platform}): ${row.cnt} items`);
}

// 检查时效性
const freshness = db.prepare(`
  SELECT 
    MIN(published_at) as oldest,
    MAX(published_at) as newest,
    COUNT(*) as total
  FROM career_contents WHERE status = 'active'
`).get() as { oldest: number; newest: number; total: number };
const oldestDate = new Date(freshness.oldest * 1000);
const newestDate = new Date(freshness.newest * 1000);
console.log(`\n[Stats] Content freshness: ${oldestDate.toISOString()} ~ ${newestDate.toISOString()} (${freshness.total} items)`);

db.close();
console.log('\n[Seed] Done!');
