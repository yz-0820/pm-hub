import Database from 'better-sqlite3';
const sqlite = new Database('./data/sqlite.db');

// 查看所有 team work 分类的内容
const items = sqlite.prepare(`
  SELECT id, title, platform, category, description, quality_score, match_score, source_type
  FROM career_contents
  WHERE category = 'teamwork'
  ORDER BY quality_score DESC
  LIMIT 40
`).all();

console.log(`团队协作分类共 ${items.length} 条内容\n`);

for (const item of items) {
  const row = item as any;
  const desc = (row.description || '').substring(0, 120);
  console.log(`[${row.id}] ${(row.title || '').substring(0,55)}`);
  console.log(`  platform=${row.platform} | quality=${row.quality_score} | match=${row.match_score}`);
  console.log(`  desc=${desc}`);
  console.log('');
}

sqlite.close();
