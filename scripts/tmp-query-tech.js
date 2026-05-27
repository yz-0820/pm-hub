const Database = require('better-sqlite3');

const db = new Database('./data/sqlite.db');

const rows = db
  .prepare(
    "select id,title,source_name,original_url,published_at,relevance_score,relevance_meta from articles where category='tech' and (lower(title) like '%gta%' or lower(summary) like '%gta%' or lower(content) like '%gta%') order by published_at desc limit 20"
  )
  .all();

console.log(JSON.stringify(rows, null, 2));

