import { db } from '../lib/db/client';
import { careerContents } from '../lib/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';

async function check() {
  console.log('检查职业发展内容的 pending 状态...\n');

  // 统计 pending 数量
  const pendingCount = await db
    .select({ count: count() })
    .from(careerContents)
    .where(eq(careerContents.status, 'pending'));

  console.log(`pending 状态的文章数量: ${pendingCount[0]?.count || 0}`);

  // 统计 active 数量
  const activeCount = await db
    .select({ count: count() })
    .from(careerContents)
    .where(eq(careerContents.status, 'active'));

  console.log(`active 状态的文章数量: ${activeCount[0]?.count || 0}`);

  // 统计 archived 数量
  const archivedCount = await db
    .select({ count: count() })
    .from(careerContents)
    .where(eq(careerContents.status, 'archived'));

  console.log(`archived 状态的文章数量: ${archivedCount[0]?.count || 0}`);

  // 获取最新的 pending 文章
  const latestPending = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      publishedAt: careerContents.publishedAt,
      status: careerContents.status,
    })
    .from(careerContents)
    .where(eq(careerContents.status, 'pending'))
    .orderBy(desc(careerContents.publishedAt))
    .limit(5);

  console.log('\n最新的 5 篇 pending 文章:');
  latestPending.forEach(a => {
    console.log(`  [${a.publishedAt?.toISOString().split('T')[0]}] ${a.title}`);
  });

  // 获取所有文章中最新的日期
  const latestDate = await db
    .select({ latest: sql<Date | null>`max(${careerContents.publishedAt})` })
    .from(careerContents);

  console.log(`\n所有文章中最新日期: ${latestDate[0]?.latest?.toISOString() || '无'}`);

  // 获取 pending 文章中最新的日期
  const latestPendingDate = await db
    .select({ latest: sql<Date | null>`max(${careerContents.publishedAt})` })
    .from(careerContents)
    .where(eq(careerContents.status, 'pending'));

  console.log(`pending 文章中最新的日期: ${latestPendingDate[0]?.latest?.toISOString() || '无'}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
