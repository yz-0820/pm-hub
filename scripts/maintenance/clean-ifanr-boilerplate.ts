import '../prod/load-env';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { stripSourceBoilerplate } from '@/lib/rss/content-sanitizer';

const EXPECTED_AFFECTED_COUNT = 14;
const applyChanges = process.argv.includes('--apply');

type ArticleRow = typeof articles.$inferSelect;

function cleanRow(row: ArticleRow) {
  const summary = stripSourceBoilerplate(row.sourceId, row.summary) ?? row.summary;
  const content = stripSourceBoilerplate(row.sourceId, row.content) ?? row.content;

  return {
    changed: summary !== row.summary || content !== row.content,
    summary,
    content,
  };
}

async function getIfanrArticles() {
  return db.query.articles.findMany({
    where: eq(articles.sourceId, 'ifanr'),
    orderBy: (table, { desc }) => [desc(table.publishedAt)],
  });
}

async function main() {
  const rows = await getIfanrArticles();
  const affected = rows
    .map((row) => ({ row, cleaned: cleanRow(row) }))
    .filter(({ cleaned }) => cleaned.changed);

  console.log(`爱范儿文章总数: ${rows.length}`);
  console.log(`待清理文章数: ${affected.length}`);

  if (affected.length === 0) {
    console.log('没有需要清理的记录。');
    return;
  }

  if (affected.length !== EXPECTED_AFFECTED_COUNT) {
    throw new Error(
      `安全检查失败：预期 ${EXPECTED_AFFECTED_COUNT} 条，实际 ${affected.length} 条。未写入数据库。`
    );
  }

  for (const { row } of affected) {
    console.log(`- ${row.id}: ${row.title}`);
  }

  if (!applyChanges) {
    console.log('预览完成。使用 --apply 才会写入数据库。');
    return;
  }

  await db.transaction(async (tx) => {
    for (const { row, cleaned } of affected) {
      await tx
        .update(articles)
        .set({
          summary: cleaned.summary,
          content: cleaned.content,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, row.id));
    }
  });

  const remaining = (await getIfanrArticles()).filter((row) => cleanRow(row).changed);
  if (remaining.length > 0) {
    throw new Error(`清理后仍有 ${remaining.length} 条记录包含固定尾注。`);
  }

  console.log(`清理完成：已更新 ${affected.length} 条，剩余 0 条。`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
