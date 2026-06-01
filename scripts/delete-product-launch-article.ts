/**
 * 删除产品发售文章
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like, eq } from 'drizzle-orm';

async function deleteArticle() {
  const keyword = '华为WATCH GT Runner 2';
  const found = await db.select().from(articles).where(like(articles.title, `%${keyword}%`));
  
  if (found.length > 0) {
    for (const article of found) {
      await db.delete(articles).where(eq(articles.id, article.id));
      console.log(`已删除: ${article.title}`);
    }
  } else {
    console.log('未找到文章');
  }
  
  process.exit(0);
}

deleteArticle();
