import '../prod/load-env';
import { inArray, ne } from 'drizzle-orm';
import { db } from '../../lib/db/client';
import { careerContents } from '../../lib/db/schema';

function countCjk(text: string): number {
  return (text.match(/[\u3400-\u9FFF]/g) || []).length;
}

export function isChineseCareerContent(title: string, description = '', content = ''): boolean {
  return countCjk(`${title} ${description} ${content}`) >= 4;
}

async function main() {
  const rows = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      description: careerContents.description,
      content: careerContents.content,
    })
    .from(careerContents)
    .where(ne(careerContents.status, 'archived'));

  const ids = rows
    .filter((row) => !isChineseCareerContent(row.title, row.description ?? '', row.content ?? ''))
    .map((row) => row.id);

  if (ids.length > 0) {
    await db
      .update(careerContents)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(inArray(careerContents.id, ids));
  }

  console.log(`Archived ${ids.length} non-Chinese career contents.`);
}

main().catch((error) => {
  console.error('Failed to archive non-Chinese career content:', error);
  process.exit(1);
});
