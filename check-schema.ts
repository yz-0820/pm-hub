import Database from 'better-sqlite3';
const sqlite = new Database('./data/sqlite.db');
const cols = sqlite.prepare("PRAGMA table_info('career_contents')").all();
for (const c of cols) {
  const row = c as any;
  console.log(row.name + ' (' + row.type + ')');
}
sqlite.close();
