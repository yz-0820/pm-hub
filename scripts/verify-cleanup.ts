/**
 * 自查验证：检查不知名公司IPO文章是否已删除
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

async function verify() {
  console.log('========================================');
  console.log('自查验证');
  console.log('========================================\n');

  // 检查目标文章是否已删除
  const keywords = ['福贝宠物', '上海福贝'];
  
  for (const kw of keywords) {
    const found = await db.select().from(articles).where(like(articles.title, `%${kw}%`));
    if (found.length > 0) {
      console.log(`❌ 仍然存在: "${kw}" - ${found.length} 篇`);
      found.forEach(a => console.log(`   ${a.title}`));
    } else {
      console.log(`✅ 已删除: "${kw}"`);
    }
  }

  // 检查金融市场文章总数
  const allArticles = await db.select().from(articles);
  const financeArticles = allArticles.filter(a => a.category === 'finance');
  console.log(`\n当前金融市场文章数: ${financeArticles.length}`);
  console.log(`当前总文章数: ${allArticles.length}`);

  process.exit(0);
}

verify();
