import Database from 'better-sqlite3';
const db = new Database('./data/sqlite.db');

const articles = db.prepare("SELECT id, title, image_url, source_name FROM articles WHERE image_url IS NOT NULL AND image_url != '' ORDER BY id DESC").all() as any[];

console.log(`Total: ${articles.length} articles\n`);

// 按域名分组统计
const domains: Record<string, number> = {};
for (const a of articles) {
  try {
    const url = new URL(a.image_url);
    const domain = url.hostname;
    domains[domain] = (domains[domain] || 0) + 1;
  } catch {}
}

console.log('Image domains:');
Object.entries(domains).sort((a,b) => b[1] - a[1]).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// 列出所有图片URL供检查
console.log('\nAll image URLs:');
articles.slice(0, 10).forEach(a => console.log(`  [${a.source_name}] ${a.image_url}`));
