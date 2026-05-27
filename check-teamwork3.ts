import Database from 'better-sqlite3';
const sqlite = new Database('./data/sqlite.db');

const items = sqlite.prepare(`
  SELECT id, title, platform, category, description, quality_score, match_score, match_keywords, match_core_matched
  FROM career_contents
  WHERE category = 'teamwork'
  ORDER BY id DESC
  LIMIT 40
`).all() as Array<{id: number; title: string; platform: string; category: string; description: string; quality_score: number; match_score: number; match_keywords: string; match_core_matched: number}>;

console.log(`团队协作分类共 ${items.length} 条内容\n`);

for (const row of items) {
  const desc = (row.description || '').substring(0, 100);
  console.log(`[${row.id}] ${(row.title || '').substring(0,55)}`);
  console.log(`  platform=${row.platform} | quality=${row.quality_score} | match=${row.match_score} | core=${row.match_core_matched}`);
  console.log(`  keywords=${(row.match_keywords || '').substring(0,80)}`);
  console.log(`  desc=${desc}`);
  console.log('');
}

sqlite.close();
