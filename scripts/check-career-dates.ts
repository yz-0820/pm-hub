import { db } from '../lib/db/client';
import { careerContents } from '../lib/db/schema';
import { desc, sql, eq, and, gte, inArray, lt } from 'drizzle-orm';

async function check() {
  console.log('检查职业发展内容的发布时间分布...\n');

  // 获取所有文章按年份分组
  const yearDistribution = await db
    .select({
      year: sql<string>`EXTRACT(YEAR FROM ${careerContents.publishedAt})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(careerContents)
    .where(eq(careerContents.status, 'active'))
    .groupBy(sql`EXTRACT(YEAR FROM ${careerContents.publishedAt})`)
    .orderBy(sql`EXTRACT(YEAR FROM ${careerContents.publishedAt})`);

  console.log('按年份分布：');
  yearDistribution.forEach(row => {
    console.log(`  ${row.year}年: ${row.count} 篇`);
  });

  // 获取最新的10篇文章
  console.log('\n最新的10篇文章：');
  const latest = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      publishedAt: careerContents.publishedAt,
      contentType: careerContents.contentType,
      category: careerContents.category,
    })
    .from(careerContents)
    .where(eq(careerContents.status, 'active'))
    .orderBy(desc(careerContents.publishedAt))
    .limit(10);

  latest.forEach(a => {
    console.log(`  [${a.publishedAt?.toISOString().split('T')[0]}] ${a.title.substring(0, 50)}... (${a.contentType})`);
  });

  // 统计2026年的文章数量
  const year2026Count = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(careerContents)
    .where(
      and(
        eq(careerContents.status, 'active'),
        gte(careerContents.publishedAt, new Date('2026-01-01')),
        lt(careerContents.publishedAt, new Date('2027-01-01'))
      )
    );

  console.log(`\n2026年的文章总数: ${year2026Count[0]?.count || 0}`);

  // 统计视频数量
  const videoCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(careerContents)
    .where(
      and(
        eq(careerContents.status, 'active'),
        inArray(careerContents.contentType, ['video', 'short_video'])
      )
    );

  console.log(`视频/短视频总数: ${videoCount[0]?.count || 0}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
