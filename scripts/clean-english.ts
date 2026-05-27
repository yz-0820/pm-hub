import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';
const sqlite = new Database(dbPath);

console.log('=== 清除英文文章 ===');

// 删除英文源的文章
const enSources = ['producthunt', 'mindtheproduct', 'techcrunch', 'theverge'];

for (const sourceId of enSources) {
  const result = sqlite.prepare('DELETE FROM articles WHERE source_id = ?').run(sourceId);
  console.log(`  删除 ${sourceId}: ${result.changes} 篇`);
}

// 统计剩余文章
const remaining = sqlite.prepare('SELECT source_id, COUNT(*) as count FROM articles GROUP BY source_id').all();
console.log('\n剩余文章统计:');
for (const row of remaining as any[]) {
  console.log(`  ${row.source_id}: ${row.count} 篇`);
}

const total = sqlite.prepare('SELECT COUNT(*) as count FROM articles').get();
console.log(`\n总计剩余: ${(total as any).count} 篇`);

sqlite.close();
console.log('完成！');
