import Database from 'better-sqlite3';

type Row = {
  id: number;
  title: string;
  category: string;
  status: string;
  quality_score: number;
  quality_reasons: string | null;
  match_score: number;
  match_keywords: string | null;
  match_core_matched: number;
  match_core_missing: string | null;
  published_at: number;
};

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function main() {
  const db = new Database('./data/sqlite.db');

  const counts = db.prepare(
    `SELECT status, COUNT(*) AS c
     FROM career_contents
     GROUP BY status
     ORDER BY c DESC`
  ).all() as Array<{ status: string; c: number }>;

  console.log('Status counts:');
  for (const r of counts) {
    console.log(`- ${r.status}: ${r.c}`);
  }

  const pick = (status: string) => {
    const rows = db.prepare(
      `SELECT
        id,
        title,
        COALESCE(category, '') AS category,
        COALESCE(status, '') AS status,
        COALESCE(quality_score, 0) AS quality_score,
        quality_reasons,
        COALESCE(match_score, 0) AS match_score,
        match_keywords,
        COALESCE(match_core_matched, 0) AS match_core_matched,
        match_core_missing,
        published_at
       FROM career_contents
       WHERE status = ?
       ORDER BY published_at DESC
       LIMIT 5`
    ).all(status) as Row[];

    console.log(`\nSamples (${status}):`);
    for (const row of rows) {
      const reasons = parseJson(row.quality_reasons);
      const keywords = parseJson(row.match_keywords);
      const coreMissing = parseJson(row.match_core_missing);
      console.log(
        `- #${row.id} [${row.category}] q=${row.quality_score} m=${row.match_score} core=${row.match_core_matched ? 'ok' : 'missing'} title=${row.title.substring(0, 60)}`
      );
      if (reasons) console.log(`  qualityReasons=${JSON.stringify(reasons)}`);
      if (keywords) console.log(`  matchKeywords=${JSON.stringify(keywords)}`);
      if (coreMissing) console.log(`  coreMissing=${JSON.stringify(coreMissing)}`);
    }
  };

  pick('active');
  pick('pending');
  pick('rejected');
  pick('archived');

  db.close();
}

main();

