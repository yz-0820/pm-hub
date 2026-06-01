import Database from 'better-sqlite3';
const sqlite = new Database('./data/sqlite.db');

// 查看所有"团队协作"分类的内容
const items = sqlite.prepare(`
  SELECT id, title, platform, category, summary, quality_score, source_type
  FROM career_contents
  WHERE category = 'teamwork'
  ORDER BY id DESC
  LIMIT 30
`).all() as Array<{id: number; title: string; platform: string; category: string; summary: string; quality_score: number; source_type: string}>;

console.log(`团队协作分类共 ${items.length} 条内容\n`);

for (const item of items) {
  console.log(`[${item.id}] ${item.title?.substring(0,60)}`);
  console.log(`  platform=${item.platform} | score=${item.quality_score} | source_type=${item.source_type}`);
  console.log(`  summary=${(item.summary || '').substring(0,150)}`);
  console.log('');
}

sqlite.close();
