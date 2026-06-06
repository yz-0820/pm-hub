import { db } from '../lib/db/client';
import { careerContents } from '../lib/db/schema';
import { or, like } from 'drizzle-orm';

async function check() {
  const articles = await db.select().from(careerContents).where(
    or(
      like(careerContents.title, '%领导力%'),
      like(careerContents.title, '%团队管理%'),
      like(careerContents.title, '%向上管理%')
    )
  );
  
  console.log('找到文章:', articles.length);
  articles.forEach(a => {
    console.log('---');
    console.log('ID:', a.id);
    console.log('标题:', a.title);
    console.log('分类:', a.category);
    console.log('内容类型:', a.contentType);
    console.log('发布时间:', a.publishedAt);
    console.log('状态:', a.status);
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
