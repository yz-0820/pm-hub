import { config } from 'dotenv';
import { resolve } from 'path';
import Database from 'better-sqlite3';

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') });

import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from '@/lib/rss/parser';
import { validateImageUrl } from '@/lib/rss/image-validator';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';
import crypto from 'crypto';

const db = new Database(process.env.DATABASE_URL || './data/sqlite.db');

// 最早允许的文章发布时间：2026年1月1日 00:00:00 UTC
const MIN_PUBLISH_DATE = new Date('2026-01-01T00:00:00.000Z');

// 分类对应的默认图片
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'product-management': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=400&fit=crop',
  'tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
  'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
  'finance': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
};

function getDefaultImageForCategory(category: string): string {
  return CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['tech'];
}

function isPublishDateValid(pubDate: Date | undefined): boolean {
  if (!pubDate) return true;
  return pubDate >= MIN_PUBLISH_DATE;
}

function generateUniqueSlug(title: string, sourceId: string): string {
  const baseSlug = generateSlug(title);
  if (!baseSlug || baseSlug.length < 3) {
    const hash = crypto.createHash('md5').update(`${title}-${sourceId}`).digest('hex').substring(0, 12);
    return `article-${hash}`;
  }
  const suffix = crypto.createHash('md5').update(sourceId).digest('hex').substring(0, 6);
  return `${baseSlug}-${suffix}`;
}

async function main() {
  console.log('Starting RSS fetch job...');
  const startedAt = Math.floor(Date.now() / 1000);
  
  const results: any[] = [];
  
  for (const source of rssSources.filter(s => s.enabled)) {
    const result = {
      sourceId: source.id,
      sourceName: source.name,
      fetched: 0,
      newArticles: 0,
      errors: [] as string[],
    };
    
    try {
      console.log(`Fetching: ${source.name}`);
      const parsedArticles = await parseRSSFeed(source.url);
      result.fetched = parsedArticles.length;
      
      for (const article of parsedArticles) {
        try {
          // 检查是否已存在
          const existing = db.prepare('SELECT id FROM articles WHERE original_url = ?').get(article.link);
          if (existing) continue;

          // 时间筛选
          if (!isPublishDateValid(article.pubDate)) {
            console.log(`Skipped (old date): "${article.title}"`);
            continue;
          }

          let relevanceScore = 0;
          let relevanceMeta: string | null = null;
          let finalCategory = source.category;
          
          // 智能分类逻辑
          if (source.id === '36kr' || source.id === 'ithome') {
            const aiR = evaluateAIRelevance(article);
            const financeR = evaluateFinanceRelevance(article);
            const techR = evaluateTechRelevance(article);

            if (financeR.passed && financeR.score >= 70) {
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true });
            } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= 35) {
              finalCategory = 'ai';
              relevanceScore = aiR.score;
              relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true });
            } else if (financeR.passed && financeR.score >= 45) {
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true });
            } else if (techR.passed) {
              finalCategory = 'tech';
              relevanceScore = techR.score;
              relevanceMeta = JSON.stringify({ ...techR.meta, autoCategorized: true });
            } else {
              if (aiR.score >= 15 && !aiR.meta.financeConflict) {
                finalCategory = 'ai';
                relevanceScore = Math.max(aiR.score, 20);
                relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true, fallback: true });
              } else {
                console.log(`Skipped (no relevant category): "${article.title}"`);
                continue;
              }
            }
          } else if (source.category === 'tech') {
            const r = evaluateTechRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed || r.meta.rejectedBy === 'finance' || r.meta.rejectedBy === 'product_release') {
              console.log(`Skipped (tech filter): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'finance') {
            const r = evaluateFinanceRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed) {
              console.log(`Skipped (finance filter): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'ai') {
            const r = evaluateAIRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed || r.meta.financeConflict) {
              console.log(`Skipped (AI filter): "${article.title}"`);
              continue;
            }
          }

          // 处理图片
          let finalImageUrl = article.imageUrl;
          if (!finalImageUrl) {
            finalImageUrl = getDefaultImageForCategory(source.category);
          } else {
            const imageCheck = await validateImageUrl(finalImageUrl);
            if (!imageCheck.valid) {
              finalImageUrl = getDefaultImageForCategory(source.category);
            }
          }

          // 生成唯一 slug
          const slug = generateUniqueSlug(article.title, source.id);
          const existingSlug = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
          const finalSlug = existingSlug ? `${slug}-${crypto.randomBytes(4).toString('hex')}` : slug;

          // 检查标题是否已存在（使用参数化查询避免 SQL 注入）
          const normalizedTitle = article.title.replace(/\s+/g, ' ').trim();
          const normalizedTitleNoSpace = normalizedTitle.replace(/\s+/g, '');
          const existingTitle = db.prepare("SELECT id FROM articles WHERE REPLACE(title, ' ', '') = ?").get(normalizedTitleNoSpace);
          if (existingTitle) {
            console.log(`Skipped (duplicate title): "${article.title}"`);
            continue;
          }

          // 保存到数据库
          const now = Math.floor(Date.now() / 1000);
          const pubDate = article.pubDate ? Math.floor(article.pubDate.getTime() / 1000) : now;
          
          db.prepare(`
            INSERT INTO articles (
              title, summary, content, slug, original_url, source_id, source_name, 
              category, author, image_url, published_at, fetched_at, 
              created_at, updated_at, read_time, view_count, is_featured, status,
              relevance_score, relevance_meta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            article.title,
            article.summary?.slice(0, 500) || '',
            article.content || article.summary || '',
            finalSlug,
            article.link,
            source.id,
            source.name,
            finalCategory,
            article.author || null,
            finalImageUrl,
            pubDate,
            now,
            now,
            now,
            5,
            0,
            0,
            'published',
            relevanceScore,
            relevanceMeta
          );
          
          result.newArticles++;
          console.log(`Added: "${article.title}"`);
        } catch (articleError) {
          const errMsg = articleError instanceof Error ? articleError.message : 'Unknown error';
          console.error(`Error inserting article "${article.title}":`, errMsg);
          result.errors.push(`Article: ${errMsg}`);
        }
      }
      
      // 更新RSS源状态
      updateSourceStatus(source.id, source.name, source.category, source.url, result.fetched, null);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error(`Error fetching ${source.name}:`, error);
      updateSourceStatus(source.id, source.name, source.category, source.url, 0, errorMsg);
    }
    
    results.push(result);
  }
  
  // 记录日志
  const completedAt = Math.floor(Date.now() / 1000);
  const totalSources = results.length;
  const successfulSources = results.filter(r => r.errors.length === 0).length;
  const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);
  
  db.prepare(`
    INSERT INTO fetch_logs (started_at, completed_at, total_sources, successful_sources, total_new_articles, errors, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    startedAt,
    completedAt,
    totalSources,
    successfulSources,
    totalNewArticles,
    JSON.stringify(results.filter(r => r.errors.length > 0)),
    completedAt,
    completedAt
  );
  
  console.log('RSS fetch completed:');
  console.log(`- Total sources: ${totalSources}`);
  console.log(`- Successful: ${successfulSources}`);
  console.log(`- New articles: ${totalNewArticles}`);
  
  results.forEach(r => {
    console.log(`  ${r.sourceName}: ${r.newArticles} new articles`);
  });
  
  db.close();
  process.exit(0);
}

function updateSourceStatus(
  sourceId: string, 
  sourceName: string, 
  category: string,
  url: string,
  fetchCount: number, 
  error: string | null
) {
  const now = Math.floor(Date.now() / 1000);
  const existing = db.prepare('SELECT * FROM rss_source_status WHERE source_id = ?').get(sourceId) as
    | { last_error_at: number | null }
    | undefined;
  
  if (existing) {
    db.prepare(`
      UPDATE rss_source_status SET
        last_fetched_at = ?,
        total_fetched = total_fetched + ?,
        last_error = ?,
        last_error_at = ?,
        updated_at = ?
      WHERE source_id = ?
    `).run(
      now,
      fetchCount,
      error,
      error ? now : existing.last_error_at,
      now,
      sourceId
    );
  } else {
    db.prepare(`
      INSERT INTO rss_source_status (
        source_id, source_name, category, url, status, last_fetched_at, 
        total_fetched, last_error, last_error_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sourceId,
      sourceName,
      category,
      url,
      'active',
      now,
      fetchCount,
      error,
      error ? now : null,
      now,
      now
    );
  }
}

main().catch(error => {
  console.error('RSS fetch failed:', error);
  db.close();
  process.exit(1);
});
