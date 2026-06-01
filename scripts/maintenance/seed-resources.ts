import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';
const sqlite = new Database(dbPath);

const seedData = [
  // 职场沟通
  {
    title: '如何与上级有效沟通：产品经理的向上管理指南',
    description: '深入探讨产品经理如何与上级建立良好的沟通渠道，包括汇报技巧、预期管理、冲突处理等实用方法。',
    category: 'communication',
    resource_type: 'article',
    url: 'https://www.woshipm.com/zhichang/123456.html',
    cover_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'intermediate',
    tags: JSON.stringify(['向上管理', '沟通技巧', '职场关系']),
    is_featured: 1,
    sort_order: 10,
    published_at: Math.floor(new Date('2026-05-20').getTime() / 1000),
  },
  {
    title: '跨部门协作的艺术：打破部门墙',
    description: '分享在互联网大厂中如何有效进行跨部门协作，建立信任关系，推动项目顺利进行。',
    category: 'communication',
    resource_type: 'blog',
    url: 'https://zhuanlan.zhihu.com/p/123456',
    cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    author: '知乎专栏',
    difficulty: 'intermediate',
    tags: JSON.stringify(['跨部门协作', '团队沟通', '项目管理']),
    is_featured: 0,
    sort_order: 5,
    published_at: Math.floor(new Date('2026-05-18').getTime() / 1000),
  },
  {
    title: '职场沟通心理学：读懂他人的真实意图',
    description: '从心理学角度解析职场沟通中的微妙信号，帮助你更好地理解同事和上级的真实想法。',
    category: 'communication',
    resource_type: 'video',
    url: 'https://www.bilibili.com/video/BV123456',
    cover_image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    author: '职场心理学',
    difficulty: 'beginner',
    tags: JSON.stringify(['心理学', '沟通技巧', '职场关系']),
    is_featured: 1,
    sort_order: 8,
    published_at: Math.floor(new Date('2026-05-15').getTime() / 1000),
  },
  {
    title: '阿里P9的会议沟通技巧',
    description: '阿里巴巴P9级别产品经理分享的会议沟通方法论，包括如何组织高效会议、如何在会议中表达观点。',
    category: 'communication',
    resource_type: 'case',
    url: 'https://www.36kr.com/p/123456',
    cover_image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['会议技巧', '大厂经验', '沟通方法']),
    is_featured: 0,
    sort_order: 3,
    published_at: Math.floor(new Date('2026-05-12').getTime() / 1000),
  },

  // 高效工作
  {
    title: '产品经理的时间管理：从混乱到高效',
    description: '介绍产品经理常用的时间管理方法和工具，帮助你从繁忙的工作中解脱出来，提升工作效率。',
    category: 'productivity',
    resource_type: 'article',
    url: 'https://www.woshipm.com/zhichang/234567.html',
    cover_image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'beginner',
    tags: JSON.stringify(['时间管理', '效率提升', '工作方法']),
    is_featured: 1,
    sort_order: 10,
    published_at: Math.floor(new Date('2026-05-22').getTime() / 1000),
  },
  {
    title: 'OKR工作法在产品管理中的应用',
    description: '详细讲解OKR目标管理方法如何应用于产品团队，包括目标设定、关键结果追踪、复盘总结等。',
    category: 'productivity',
    resource_type: 'video',
    url: 'https://www.bilibili.com/video/BV234567',
    cover_image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop',
    author: '产品思维',
    difficulty: 'intermediate',
    tags: JSON.stringify(['OKR', '目标管理', '团队管理']),
    is_featured: 0,
    sort_order: 6,
    published_at: Math.floor(new Date('2026-05-19').getTime() / 1000),
  },
  {
    title: '高效产品经理的10个习惯',
    description: '总结优秀产品经理的日常工作习惯，帮助你建立高效的工作流程和思维模式。',
    category: 'productivity',
    resource_type: 'blog',
    url: 'https://sspai.com/post/123456',
    cover_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
    author: '少数派',
    difficulty: 'beginner',
    tags: JSON.stringify(['工作习惯', '效率提升', '个人成长']),
    is_featured: 1,
    sort_order: 8,
    published_at: Math.floor(new Date('2026-05-16').getTime() / 1000),
  },
  {
    title: '字节跳动的产品工作方法论',
    description: '深度解析字节跳动的产品工作流程和方法论，包括需求评审、迭代管理、数据驱动等。',
    category: 'productivity',
    resource_type: 'case',
    url: 'https://www.36kr.com/p/234567',
    cover_image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['字节跳动', '工作方法', '大厂经验']),
    is_featured: 0,
    sort_order: 4,
    published_at: Math.floor(new Date('2026-05-10').getTime() / 1000),
  },

  // 团队协作
  {
    title: '打造高绩效产品团队：从组建到管理',
    description: '分享如何组建和管理一支高效的产品团队，包括人才招聘、团队文化、激励机制等。',
    category: 'teamwork',
    resource_type: 'article',
    url: 'https://www.woshipm.com/zhichang/345678.html',
    cover_image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'advanced',
    tags: JSON.stringify(['团队建设', '团队管理', '高绩效']),
    is_featured: 1,
    sort_order: 10,
    published_at: Math.floor(new Date('2026-05-21').getTime() / 1000),
  },
  {
    title: '远程协作时代的团队管理',
    description: '探讨远程办公环境下如何保持团队协作效率，包括沟通工具、会议管理、文化建设等。',
    category: 'teamwork',
    resource_type: 'video',
    url: 'https://www.bilibili.com/video/BV345678',
    cover_image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=400&fit=crop',
    author: '远程工作指南',
    difficulty: 'intermediate',
    tags: JSON.stringify(['远程协作', '团队管理', '工作效率']),
    is_featured: 0,
    sort_order: 5,
    published_at: Math.floor(new Date('2026-05-17').getTime() / 1000),
  },
  {
    title: '如何处理团队冲突：产品经理的调解艺术',
    description: '分享产品经理在团队中处理冲突的经验和方法，帮助你化解矛盾、促进团队合作。',
    category: 'teamwork',
    resource_type: 'blog',
    url: 'https://zhuanlan.zhihu.com/p/234567',
    cover_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
    author: '知乎专栏',
    difficulty: 'intermediate',
    tags: JSON.stringify(['冲突解决', '团队管理', '沟通技巧']),
    is_featured: 0,
    sort_order: 4,
    published_at: Math.floor(new Date('2026-05-14').getTime() / 1000),
  },
  {
    title: '腾讯产品团队的协作模式解析',
    description: '深度分析腾讯产品团队的工作协作模式，包括跨部门配合、项目管理、决策机制等。',
    category: 'teamwork',
    resource_type: 'case',
    url: 'https://www.36kr.com/p/345678',
    cover_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['腾讯', '团队协作', '大厂经验']),
    is_featured: 1,
    sort_order: 7,
    published_at: Math.floor(new Date('2026-05-11').getTime() / 1000),
  },

  // 领导力
  {
    title: '从技术到管理：产品经理的领导力修炼',
    description: '帮助产品经理从技术思维转向管理思维，培养领导力，提升团队影响力。',
    category: 'leadership',
    resource_type: 'article',
    url: 'https://www.woshipm.com/zhichang/456789.html',
    cover_image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'advanced',
    tags: JSON.stringify(['领导力', '管理思维', '职业发展']),
    is_featured: 1,
    sort_order: 10,
    published_at: Math.floor(new Date('2026-05-23').getTime() / 1000),
  },
  {
    title: '产品经理的决策艺术：如何在不确定性中做出选择',
    description: '分享产品经理在面对复杂情况时的决策方法和思维框架，提升决策质量。',
    category: 'leadership',
    resource_type: 'video',
    url: 'https://www.bilibili.com/video/BV456789',
    cover_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    author: '产品领导力',
    difficulty: 'advanced',
    tags: JSON.stringify(['决策能力', '领导力', '思维框架']),
    is_featured: 1,
    sort_order: 9,
    published_at: Math.floor(new Date('2026-05-20').getTime() / 1000),
  },
  {
    title: '如何培养和激励产品团队',
    description: '探讨产品经理如何培养和激励团队成员，帮助他们成长，提升团队整体能力。',
    category: 'leadership',
    resource_type: 'blog',
    url: 'https://sspai.com/post/234567',
    cover_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    author: '少数派',
    difficulty: 'intermediate',
    tags: JSON.stringify(['人才培养', '团队激励', '领导力']),
    is_featured: 0,
    sort_order: 5,
    published_at: Math.floor(new Date('2026-05-15').getTime() / 1000),
  },
  {
    title: '美团产品总监的管理哲学',
    description: '美团产品总监分享的管理经验和领导力心得，包括团队建设、人才培养、文化建设等。',
    category: 'leadership',
    resource_type: 'case',
    url: 'https://www.36kr.com/p/456789',
    cover_image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['美团', '管理哲学', '领导力']),
    is_featured: 0,
    sort_order: 6,
    published_at: Math.floor(new Date('2026-05-08').getTime() / 1000),
  },
];

console.log('开始插入资源数据...');

const insert = sqlite.prepare(`
  INSERT INTO resources (
    title, description, category, resource_type, url, cover_image, author, source_name,
    difficulty, tags, is_featured, sort_order, published_at
  ) VALUES (
    @title, @description, @category, @resource_type, @url, @cover_image, @author, COALESCE(@author, '未知来源'),
    @difficulty, @tags, @is_featured, @sort_order, @published_at
  )
`);

let successCount = 0;
let errorCount = 0;

for (const resource of seedData) {
  try {
    insert.run(resource);
    console.log(`✓ 插入资源: ${resource.title}`);
    successCount++;
  } catch (error) {
    console.error(`✗ 插入失败: ${resource.title}`, error);
    errorCount++;
  }
}

console.log(`\n资源数据插入完成！`);
console.log(`成功: ${successCount} 条`);
console.log(`失败: ${errorCount} 条`);

sqlite.close();
