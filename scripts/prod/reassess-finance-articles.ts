import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import { eq, sql } from 'drizzle-orm';

type Row = {
  id: number;
  title: string;
  summary: string;
  content: string;
  relevanceScore: number;
  relevanceMeta: string | null;
};

async function main() {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      content: articles.content,
      relevanceScore: articles.relevanceScore,
      relevanceMeta: articles.relevanceMeta,
    })
    .from(articles)
    .where(eq(articles.category, 'finance')) as Row[];

  if (rows.length === 0) {
    console.log('No finance articles found.');
    process.exit(0);
  }

  let deleted = 0;
  let updated = 0;

  for (const r of rows) {
    const result = evaluateFinanceRelevance({
      title: r.title,
      summary: r.summary,
      content: r.content,
      link: '',
      pubDate: new Date(),
      author: undefined,
      imageUrl: undefined,
    });

    if (!result.passed) {
      await db.delete(articles).where(eq(articles.id, r.id));
      deleted++;
      continue;
    }

    const nextScore = result.score;
    const nextMeta = JSON.stringify(result.meta);
    if (Number(r.relevanceScore || 0) !== nextScore || String(r.relevanceMeta || '') !== nextMeta) {
      await db
        .update(articles)
        .set({
          relevanceScore: nextScore,
          relevanceMeta: nextMeta,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(articles.id, r.id));
      updated++;
    }
  }

  console.log(`Reassessed ${rows.length} finance articles`);
  console.log(`deleted=${deleted} updated=${updated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

