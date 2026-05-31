import { db } from './lib/db/client';
import { articles } from './lib/db/schema';
import { like, or, eq } from 'drizzle-orm';
import { detectPromoDeal } from './lib/rss/promo-deal';

async function check() {
  // 查找这两篇文章
  const results = await db.query.articles.findMany({
    where: (articles, { or, like }) => or(
      like(articles.title, '%吸尘器%'),
      like(articles.title, '%炼狱蝰蛇%'),
      like(articles.title, '%雷蛇%'),
    ),
  });

  console.log(`找到 ${results.length} 篇文章:\n`);

  for (const a of results) {
    const promo = detectPromoDeal(a.title, a.summary || '');
    console.log(`[${a.id}] [${a.category}] score=${a.relevanceScore}`);
    console.log(`  标题: ${a.title}`);
    console.log(`  促销检测: isPromo=${promo.isPromo}, reason=${promo.reason}`);
    console.log(`  Meta: ${a.relevanceMeta?.substring(0, 200)}`);
    console.log('');
  }

  // 也检查所有 AI 分类中包含价格的文章
  const aiArticles = await db.query.articles.findMany({
    where: (articles, { eq }) => eq(articles.category, 'ai'),
  });

  console.log(`\n=== AI 分类中所有包含价格箭头的文章 ===`);
  let count = 0;
  for (const a of aiArticles) {
    const fullText = `${a.title} ${a.summary || ''}`;
    if (/\d+[\s]*[→➡]\s*\d+\s*元/.test(fullText) || /以旧换新/.test(fullText) || /预售/.test(fullText)) {
      count++;
      const promo = detectPromoDeal(a.title, a.summary || '');
      console.log(`  [${a.id}] ${a.title.substring(0, 60)}...`);
      console.log(`    促销检测: isPromo=${promo.isPromo}, reason=${promo.reason}`);
    }
  }
  console.log(`\n共 ${count} 篇`);
}

check()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Error:', err); process.exit(1); });
