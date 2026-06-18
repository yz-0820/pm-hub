import './load-env';

import { eq, like, or } from 'drizzle-orm';
import { db, postgresClient } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { decodePlainText } from '@/lib/utils/html-entities';

async function main() {
  const apply = process.argv.includes('--apply');

  const [articleRows, careerRows] = await Promise.all([
    db
      .select({ id: articles.id, title: articles.title })
      .from(articles)
      .where(or(like(articles.title, '%&#%'), like(articles.title, '%&amp;%'))),
    db
      .select({ id: careerContents.id, title: careerContents.title })
      .from(careerContents)
      .where(or(like(careerContents.title, '%&#%'), like(careerContents.title, '%&amp;%'))),
  ]);

  const changes = [
    ...articleRows.map((row) => ({ kind: 'article' as const, ...row, decoded: decodePlainText(row.title) })),
    ...careerRows.map((row) => ({ kind: 'career' as const, ...row, decoded: decodePlainText(row.title) })),
  ].filter((row) => row.decoded !== row.title);

  for (const row of changes) {
    console.log(`[${row.kind}] #${row.id}: ${row.title} -> ${row.decoded}`);
    if (!apply) continue;

    if (row.kind === 'article') {
      await db.update(articles).set({ title: row.decoded, updatedAt: new Date() }).where(eq(articles.id, row.id));
    } else {
      await db.update(careerContents).set({ title: row.decoded, updatedAt: new Date() }).where(eq(careerContents.id, row.id));
    }
  }

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', changed: changes.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresClient.end({ timeout: 5 });
  });
