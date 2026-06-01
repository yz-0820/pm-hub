/**
 * 批量验证数据库中已有文章的图片可用性，删除图片不可用的文章
 */
import { validateImageUrl } from '../../lib/rss/image-validator';
import Database from 'better-sqlite3';

const db = new Database('./data/sqlite.db');

async function main() {
  const articles = db.prepare("SELECT id, title, image_url FROM articles WHERE image_url IS NOT NULL AND image_url != ''").all() as any[];
  console.log(`Total articles with images: ${articles.length}`);

  let valid = 0;
  let invalid = 0;
  const invalidIds: number[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const result = await validateImageUrl(article.image_url);
    
    if (result.valid) {
      valid++;
    } else {
      invalid++;
      invalidIds.push(article.id);
      console.log(`[${invalid}] Invalid: "${article.title.substring(0, 40)}" - ${result.reason}`);
    }

    // 进度显示
    if ((i + 1) % 20 === 0) {
      console.log(`  Progress: ${i + 1}/${articles.length} (valid: ${valid}, invalid: ${invalid})`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Valid images: ${valid}`);
  console.log(`Invalid images: ${invalid}`);

  if (invalidIds.length > 0) {
    const placeholders = invalidIds.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM articles WHERE id IN (${placeholders})`).run(...invalidIds);
    console.log(`Deleted ${result.changes} articles with invalid images`);
    
    const remaining = db.prepare('SELECT COUNT(*) as count FROM articles').get() as any;
    console.log(`Remaining articles: ${remaining.count}`);
  }
}

main().catch(console.error);
