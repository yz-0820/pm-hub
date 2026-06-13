import './load-env';

import { eq, sql } from 'drizzle-orm';
import { db, postgresClient } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { validateImageUrl } from '@/lib/rss/image-validator';

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limitValue = Number.parseInt(getArgValue('limit') || '0', 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : undefined;

  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(sql`${articles.imageUrl} is not null and ${articles.imageUrl} <> ''`)
    .limit(limit || 100000);

  let checked = 0;
  let invalid = 0;
  let updated = 0;

  for (const row of rows) {
    if (!row.imageUrl) continue;
    checked += 1;
    const result = await validateImageUrl(row.imageUrl);
    if (result.valid) continue;

    invalid += 1;
    console.log(`[invalid] #${row.id} ${row.title}: ${result.reason || 'unknown'}`);

    if (apply) {
      await db
        .update(articles)
        .set({
          imageUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, row.id));
      updated += 1;
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    checked,
    invalid,
    updated,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresClient.end({ timeout: 5 });
  });
