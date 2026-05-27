import Database from 'better-sqlite3';

function countCjk(text: string): number {
  return (text.match(/[\u3400-\u9FFF]/g) || []).length;
}

function isChineseContent(title: string, description: string, content: string): boolean {
  const text = `${title || ''} ${description || ''} ${content || ''}`;
  return countCjk(text) >= 4;
}

function main() {
  const db = new Database('./data/sqlite.db');

  const rows = db.prepare(
    `SELECT id, title, COALESCE(description, '') AS description, COALESCE(content, '') AS content, status
     FROM career_contents`
  ).all() as Array<{ id: number; title: string; description: string; content: string; status: string }>;

  const toArchive: number[] = [];
  for (const row of rows) {
    if (!isChineseContent(row.title, row.description, row.content)) {
      toArchive.push(row.id);
    }
  }

  const update = db.prepare(
    `UPDATE career_contents
     SET status = 'archived', updated_at = unixepoch()
     WHERE id = ? AND status != 'archived'`
  );

  const tx = db.transaction((ids: number[]) => {
    for (const id of ids) update.run(id);
  });

  tx(toArchive);
  db.close();

  console.log(`Archived ${toArchive.length} non-Chinese career contents`);
}

main();

