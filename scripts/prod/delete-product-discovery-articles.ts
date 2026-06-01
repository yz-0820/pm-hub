import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.category, 'product-discovery'));

  const toDelete = countRows[0]?.count || 0;
  if (toDelete <= 0) {
    console.log('No product-discovery articles found.');
    process.exit(0);
  }

  const result = await db.delete(articles).where(eq(articles.category, 'product-discovery'));
  const deleted =
    typeof result === 'object' && result && 'changes' in result ? Number((result as { changes: number }).changes) : toDelete;

  console.log(`Deleted ${deleted} product-discovery articles.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
