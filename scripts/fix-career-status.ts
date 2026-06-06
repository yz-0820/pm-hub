import { db } from '../lib/db/client';
import { careerContents } from '../lib/db/schema';
import { eq, or, like, and, gte, lt } from 'drizzle-orm';

async function fix() {
  console.log('开始修复领导力文章状态...');

  // 查找分类为 leadership 但状态不是 active 的文章
  const articles = await db
    .select()
    .from(careerContents)
    .where(
      and(
        eq(careerContents.category, 'leadership'),
        or(
          eq(careerContents.status, 'pending'),
          eq(careerContents.status, 'archived')
        )
      )
    );

  console.log(`找到 ${articles.length} 篇需要修复的文章`);

  for (const article of articles) {
    console.log(`\n修复: ${article.title}`);
    console.log(`  当前状态: ${article.status}`);
    console.log(`  当前发布时间: ${article.publishedAt}`);

    // 更新状态为 active，发布时间改为 2026 年
    const newDate = new Date('2026-01-01T00:00:00.000Z');
    
    await db
      .update(careerContents)
      .set({ 
        status: 'active',
        publishedAt: newDate
      })
      .where(eq(careerContents.id, article.id));

    console.log(`  ✅ 已更新为 active，发布时间: ${newDate.toISOString()}`);
  }

  console.log('\n修复完成！');
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
