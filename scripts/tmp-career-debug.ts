import Database from 'better-sqlite3';

function main() {
  const db = new Database('./data/sqlite.db');

  const activeCounts = db
    .prepare(
      `SELECT platform, content_type AS type, COUNT(*) AS c
       FROM career_contents
       WHERE status='active'
       GROUP BY platform, type
       ORDER BY platform, type`
    )
    .all();

  const activeVideos = db
    .prepare(
      `SELECT id, title, source_name AS source, platform, content_type AS type, category, status, original_url AS url, published_at AS publishedAt
       FROM career_contents
       WHERE status='active' AND content_type IN ('video','short_video')
       ORDER BY published_at DESC
       LIMIT 30`
    )
    .all();

  const activeGold = db
    .prepare(
      `SELECT id, title, source_name AS source, platform, content_type AS type, category, status, original_url AS url, published_at AS publishedAt
       FROM career_contents
       WHERE status='active' AND (title LIKE '%黄金%' OR title LIKE '%Gold%' OR title LIKE '%gold%')
       ORDER BY published_at DESC
       LIMIT 30`
    )
    .all();

  const activeTeamworkGold = db
    .prepare(
      `SELECT id, title, source_name AS source, platform, content_type AS type, category, status, match_score AS matchScore, match_keywords AS matchKeywords, match_core_matched AS coreMatched, match_core_missing AS coreMissing, original_url AS url
       FROM career_contents
       WHERE status='active' AND category='teamwork' AND (title LIKE '%黄金%' OR title LIKE '%Gold%' OR title LIKE '%gold%')
       ORDER BY published_at DESC
       LIMIT 30`
    )
    .all();

  console.log(
    JSON.stringify(
      {
        activeCounts,
        activeVideosCount: activeVideos.length,
        activeVideos,
        activeGoldCount: activeGold.length,
        activeGold,
        activeTeamworkGoldCount: activeTeamworkGold.length,
        activeTeamworkGold,
      },
      null,
      2
    )
  );

  db.close();
}

main();

