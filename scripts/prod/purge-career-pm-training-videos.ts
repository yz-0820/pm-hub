import Database from 'better-sqlite3';
import { CAREER_EXCLUDED_VIDEO_PATTERNS } from '../../lib/career/quality';

function main() {
  const db = new Database('./data/sqlite.db');
  const likeTokens = [
    '%产品经理%',
    '%产品运营%',
    '%Axure%',
    '%axure%',
    '%Figma%',
    '%figma%',
    '%墨刀%',
    '%Sketch%',
    '%sketch%',
    '%PRD%',
    '%prd%',
    '%需求%',
    '%原型%',
    '%交互%',
    '%竞品%',
    '%用户研究%',
    '%增长%',
    '%埋点%',
  ];

  const whereAny = likeTokens.map(() => `title LIKE ? OR description LIKE ? OR content LIKE ?`).join(' OR ');
  const args = likeTokens.flatMap((t) => [t, t, t]);

  const rows = db
    .prepare(
      `SELECT id, title,
              COALESCE(description, '') AS description,
              COALESCE(content, '') AS content
       FROM career_contents
       WHERE platform='bilibili'
         AND content_type IN ('video','short_video')
         AND (${whereAny})`
    )
    .all(...args) as Array<{ id: number; title: string; description: string; content: string }>;

  const ids = rows
    .filter((r) => {
      const fullText = `${r.title} ${r.description} ${r.content}`;
      return CAREER_EXCLUDED_VIDEO_PATTERNS.some((p) => p.test(fullText));
    })
    .map((r) => r.id);

  if (ids.length === 0) {
    console.log('No bilibili PM training videos to purge.');
    db.close();
    return;
  }

  const del = db.prepare(`DELETE FROM career_contents WHERE id = ?`);
  const tx = db.transaction((list: number[]) => {
    for (const id of list) del.run(id);
  });
  tx(ids);

  console.log(`Purged ${ids.length} bilibili PM training videos.`);
  db.close();
}

main();
