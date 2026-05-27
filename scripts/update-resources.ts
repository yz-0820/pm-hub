import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';
const sqlite = new Database(dbPath);

// 真实有效的资源数据
const validResources = [
  // 职场沟通
  {
    id: 1,
    title: '产品经理如何做时间管理：番茄工作法',
    description: '详细介绍产品经理如何运用番茄工作法进行时间管理，提高工作效率，减少加班。',
    category: 'communication',
    resource_type: 'article',
    url: 'https://www.woshipm.com/pmd/830114.html',
    cover_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'intermediate',
    tags: JSON.stringify(['时间管理', '番茄工作法', '效率提升']),
    is_featured: 1,
    sort_order: 10,
  },
  {
    id: 2,
    title: 'Time Block：让时间属于你的高效工作法',
    description: '每个职场人都需要面对时间管理问题，产品经理也不例外。本文介绍Time Block高效工作法。',
    category: 'communication',
    resource_type: 'article',
    url: 'https://www.woshipm.com/zhichang/5711762.html',
    cover_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'beginner',
    tags: JSON.stringify(['时间管理', '高效工作', '职场技能']),
    is_featured: 0,
    sort_order: 5,
  },
  {
    id: 3,
    title: '产品经理的沟通能力、领导力、学习力和自省力',
    description: '好的产品经理不只懂技术和市场，更要建立一套高效的认知系统，包括沟通力、领导力等四大底层能力。',
    category: 'communication',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7532314305057587739/',
    cover_image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'intermediate',
    tags: JSON.stringify(['沟通能力', '领导力', '自我提升']),
    is_featured: 1,
    sort_order: 8,
  },
  {
    id: 4,
    title: 'PRD之外的战争：产品经理的向上管理与横向沟通',
    description: '产品经理的战场从来不止PRD，在需求之外是向上管理的博弈和横向协同的拉锯。',
    category: 'communication',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7563877446014042665/',
    cover_image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'advanced',
    tags: JSON.stringify(['向上管理', '横向沟通', '职场生存']),
    is_featured: 0,
    sort_order: 3,
  },

  // 高效工作
  {
    id: 5,
    title: '产品经理进行时间管理的6个核心点',
    description: '时间管理是产品经理的核心能力，本文介绍6个核心要点，帮助你提升职场影响力。',
    category: 'productivity',
    resource_type: 'article',
    url: 'https://www.woshipm.com/pmd/1076513.html',
    cover_image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'beginner',
    tags: JSON.stringify(['时间管理', '核心能力', '职场影响力']),
    is_featured: 1,
    sort_order: 10,
  },
  {
    id: 6,
    title: '技巧篇：产品经理时间管理',
    description: '深入探讨产品经理时间管理的各种技巧和方法，帮助你更好地安排工作和生活。',
    category: 'productivity',
    resource_type: 'article',
    url: 'https://www.woshipm.com/pmd/836262.html',
    cover_image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop',
    author: '人人都是产品经理',
    difficulty: 'intermediate',
    tags: JSON.stringify(['时间管理', '工作技巧', '效率提升']),
    is_featured: 0,
    sort_order: 6,
  },
  {
    id: 7,
    title: '从事产品经理3年，我用这8款应用打造高效产品工作流',
    description: '从初入职场到独当一面，分享8款应用如何串联起完整的产品工作流。',
    category: 'productivity',
    resource_type: 'article',
    url: 'https://sspai.com/post/41918',
    cover_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
    author: '少数派',
    difficulty: 'beginner',
    tags: JSON.stringify(['效率工具', '工作流', '产品工具']),
    is_featured: 1,
    sort_order: 8,
  },
  {
    id: 8,
    title: '2024年10大好用的项目管理软件',
    description: '盘点2024年10大好用的项目管理软件，包括禅道等专为项目管理设计的工具。',
    category: 'productivity',
    resource_type: 'article',
    url: 'https://sspai.com/post/90205',
    cover_image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
    author: '少数派',
    difficulty: 'intermediate',
    tags: JSON.stringify(['项目管理', '效率工具', '软件推荐']),
    is_featured: 0,
    sort_order: 4,
  },

  // 团队协作
  {
    id: 9,
    title: '如何建立跨部门沟通协作机制',
    description: '跨部门沟通协作机制的建立至关重要，本文分享如何建立有效的协作机制。',
    category: 'teamwork',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7501676844240962075/',
    cover_image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'intermediate',
    tags: JSON.stringify(['跨部门协作', '沟通机制', '团队协作']),
    is_featured: 1,
    sort_order: 10,
  },
  {
    id: 10,
    title: '职场跨部门协作，最令人舒服的沟通方式',
    description: '职场中免不了需要和其他部门协作，有效的沟通可以更好地推进工作，实现共赢。',
    category: 'teamwork',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7249181334848029184/',
    cover_image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'beginner',
    tags: JSON.stringify(['跨部门协作', '沟通方式', '职场技巧']),
    is_featured: 0,
    sort_order: 5,
  },
  {
    id: 11,
    title: '六年产品经理实战心得：给职场新人一些分享',
    description: '六年产品经理的经验总结，希望能帮助到新入行的产品经理们。',
    category: 'teamwork',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7507925498572423743/',
    cover_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'beginner',
    tags: JSON.stringify(['实战经验', '职场新人', '产品心得']),
    is_featured: 0,
    sort_order: 4,
  },
  {
    id: 12,
    title: '产品经理团队管理心得',
    description: '从执行者转变为团队管理者的挑战，分享组织架构设计、文化建设等心得。',
    category: 'teamwork',
    resource_type: 'article',
    url: 'http://m.toutiao.com/group/7518236299422138930/',
    cover_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    author: '今日头条',
    difficulty: 'advanced',
    tags: JSON.stringify(['团队管理', '组织架构', '文化建设']),
    is_featured: 1,
    sort_order: 7,
  },

  // 领导力
  {
    id: 13,
    title: '数据时代，产品经理如何构建核心竞争力',
    description: '产品经理需要对数据敏感，具备数据观+全局观，才能构建核心竞争力。',
    category: 'leadership',
    resource_type: 'article',
    url: 'https://m.36kr.com/p/1159203524889603',
    cover_image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['核心竞争力', '数据敏感', '全局观']),
    is_featured: 1,
    sort_order: 10,
  },
  {
    id: 14,
    title: '如何成为一名优秀的产品经理：只需要这几种能力',
    description: '领导力和影响力是产品经理的核心，丰富的人格魅力可以影响团队成员的向心力。',
    category: 'leadership',
    resource_type: 'article',
    url: 'https://m.36kr.com/p/1974389638578944',
    cover_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'intermediate',
    tags: JSON.stringify(['领导力', '影响力', '人格魅力']),
    is_featured: 1,
    sort_order: 9,
  },
  {
    id: 15,
    title: '管理者≠领导者，领导与管理的区别是什么',
    description: '团队领导、经理和其他掌握权力的人，经常要在有效领导与管理之间切换。',
    category: 'leadership',
    resource_type: 'article',
    url: 'https://m.36kr.com/p/1518612546628354',
    cover_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'intermediate',
    tags: JSON.stringify(['领导力', '管理', '区别']),
    is_featured: 0,
    sort_order: 5,
  },
  {
    id: 16,
    title: 'Facebook产品设计副总裁：设计师如何与产品经理一起工作',
    description: '执行力、领导力+驱动力、产品感觉，是优秀产品经理的核心素质。',
    category: 'leadership',
    resource_type: 'article',
    url: 'https://m.36kr.com/p/1721853886465',
    cover_image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
    author: '36氪',
    difficulty: 'advanced',
    tags: JSON.stringify(['执行力', '驱动力', '产品感觉']),
    is_featured: 0,
    sort_order: 6,
  },
];

console.log('开始更新资源数据...\n');

// 清空现有数据
sqlite.prepare('DELETE FROM resources').run();
console.log('已清空现有资源数据');

// 插入新数据
const insert = sqlite.prepare(`
  INSERT INTO resources (
    id, title, description, category, resource_type, url, cover_image, author,
    difficulty, tags, is_featured, sort_order, published_at
  ) VALUES (
    @id, @title, @description, @category, @resource_type, @url, @cover_image, @author,
    @difficulty, @tags, @is_featured, @sort_order, @published_at
  )
`);

let successCount = 0;

for (const resource of validResources) {
  try {
    insert.run({
      ...resource,
      published_at: Math.floor(Date.now() / 1000),
    });
    console.log(`✓ 插入资源: ${resource.title.slice(0, 50)}...`);
    successCount++;
  } catch (error) {
    console.error(`✗ 插入失败: ${resource.title}`, error);
  }
}

console.log(`\n========================================`);
console.log(`资源数据更新完成！`);
console.log(`成功插入: ${successCount} 条资源`);
console.log(`========================================\n`);

sqlite.close();
