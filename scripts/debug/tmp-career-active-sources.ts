import Database from 'better-sqlite3';

function main() {
  const db = new Database('./data/sqlite.db');
  const rows = db
    .prepare(
      `SELECT source_name AS source, platform, content_type AS type, count(1) AS c
       FROM career_contents
       WHERE status='active'
       GROUP BY source, platform, type
       ORDER BY c DESC`
    )
    .all();
  console.log(JSON.stringify(rows, null, 2));
  db.close();
}

main();
