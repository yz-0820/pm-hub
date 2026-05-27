/**
 * 清理数据库中早于2026年1月1日的文章
 */
import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { lt, sql } from 'drizzle-orm';

const MIN_DATE = new Date('2026-01-01T00:00:00.000Z');

async function cleanup() {
  console.log('开始清理早于2026年的文章...');
  console.log(`截止日期: ${MIN_DATE.toISOString()}`);

  // 先统计要删除的文章数量
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(lt(articles.publishedAt, MIN_DATE));

  const count = countResult[0]?.count || 0;
  console.log(`找到 ${count} 篇需要删除的文章`);

  if (count > 0) {
    // 执行删除
    const result = await db
      .delete(articles)
      .where(lt(articles.publishedAt, MIN_DATE))
      .returning({ id: articles.id });

    console.log(`成功删除 ${result.length} 篇文章`);
  } else {
    console.log('没有需要删除的文章');
  }

  // 统计剩余文章
  const remainingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles);

  console.log(`数据库中剩余文章: ${remainingResult[0]?.count || 0} 篇`);
  console.log('清理完成!');
}

cleanup().catch(console.error);
