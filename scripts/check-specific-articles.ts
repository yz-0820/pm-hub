/**
 * 检查特定文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

async function check() {
  const keywords = ['狼蛛', 'SC580EVO', '韩华航空', '宏碁非凡'];
  
  for (const kw of keywords) {
    const found = await db.select().from(articles).where(like(articles.title, `%${kw}%`));
    if (found.length > 0) {
      found.forEach(a => {
        console.log(`\n标题: ${a.title}`);
        console.log(`来源: ${a.sourceName} (${a.sourceId})`);
        console.log(`分类: ${a.category}`);
        console.log(`分数: ${a.relevanceScore}`);
        console.log(`抓取时间: ${a.fetchedAt}`);
      });
    }
  }
  
  process.exit(0);
}

check();
