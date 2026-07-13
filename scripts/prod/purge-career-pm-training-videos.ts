import './load-env';
import { and, eq, inArray } from 'drizzle-orm';
import { CAREER_EXCLUDED_VIDEO_PATTERNS } from '../../lib/career/quality';
import { db } from '../../lib/db/client';
import { careerContents } from '../../lib/db/schema';

async function main() {
  const rows = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      description: careerContents.description,
      content: careerContents.content,
    })
    .from(careerContents)
    .where(
      and(
        eq(careerContents.platform, 'bilibili'),
        inArray(careerContents.contentType, ['video', 'short_video'])
      )
    );

  const ids = rows
    .filter((row) => {
      const fullText = `${row.title} ${row.description ?? ''} ${row.content ?? ''}`;
      return CAREER_EXCLUDED_VIDEO_PATTERNS.some((pattern) => pattern.test(fullText));
    })
    .map((row) => row.id);

  if (ids.length > 0) {
    await db.delete(careerContents).where(inArray(careerContents.id, ids));
  }

  console.log(`Purged ${ids.length} bilibili PM training videos.`);
}

main().catch((error) => {
  console.error('Failed to purge bilibili PM training videos:', error);
  process.exit(1);
});
