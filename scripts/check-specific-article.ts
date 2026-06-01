/**
 * 检查特定文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like } from 'drizzle-orm';

async function check() {
  const keyword = '华为WATCH GT Runner 2';
  const found = await db.select().from(articles).where(like(articles.title, `%${keyword}%`));
  
  if (found.length > 0) {
    found.forEach(a => {
      console.log('找到文章:');
      console.log(`  标题: ${a.title}`);
      console.log(`  分类: ${a.category}`);
      console.log(`  来源: ${a.sourceName} (${a.sourceId})`);
      console.log(`  分数: ${a.relevanceScore}`);
      console.log(`  抓取时间: ${a.fetchedAt}`);
      if (a.relevanceMeta) {
        try {
          const meta = JSON.parse(a.relevanceMeta);
          console.log(`  元数据: ${JSON.stringify(meta, null, 2)}`);
        } catch {
          console.log(`  元数据: ${a.relevanceMeta}`);
        }
      }
    });
  } else {
    console.log('未找到文章');
  }
  
  process.exit(0);
}

check();
