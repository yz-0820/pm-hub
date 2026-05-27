import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from './parser';
import { validateImageUrl } from './image-validator';
import { evaluateTechRelevance } from './tech-relevance';
import { evaluateFinanceRelevance } from './finance-relevance';
import { evaluateAIRelevance } from './ai-relevance';
import { db } from '@/lib/db/client';
import { articles, rssSourceStatus } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { FetchResult, ParsedArticle } from '@/types';
import crypto from 'crypto';

// 最早允许的文章发布时间：2026年1月1日 00:00:00 UTC
const MIN_PUBLISH_DATE = new Date('2026-01-01T00:00:00.000Z');

// 分类对应的默认图片（使用 Unsplash 的免费图片）
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'product-management': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=400&fit=crop',
  'tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
  'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
  'finance': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
};

// 获取分类对应的默认图片
function getDefaultImageForCategory(category: string): string {
  return CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['tech'];
}

// 检查文章发布时间是否在允许范围内
function isPublishDateValid(pubDate: Date | undefined): boolean {
  if (!pubDate) {
    // 无发布时间的文章，默认允许（可能是最新文章）
    return true;
  }
  return pubDate >= MIN_PUBLISH_DATE;
}

// 生成唯一的 slug，避免不同源的同名文章冲突
function generateUniqueSlug(title: string, sourceId: string): string {
  const baseSlug = generateSlug(title);
  // 如果基础 slug 为空（如纯中文标题被过滤掉），使用 hash
  if (!baseSlug || baseSlug.length < 3) {
    const hash = crypto.createHash('md5').update(`${title}-${sourceId}`).digest('hex').substring(0, 12);
    return `article-${hash}`;
  }
  // 附加 sourceId 的短 hash 确保唯一性
  const suffix = crypto.createHash('md5').update(sourceId).digest('hex').substring(0, 6);
  return `${baseSlug}-${suffix}`;
}

export async function fetchAllRSS(): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  
  for (const source of rssSources.filter(s => s.enabled)) {
    const result: FetchResult = {
      sourceId: source.id,
      sourceName: source.name,
      fetched: 0,
      newArticles: 0,
      errors: [],
    };
    
    try {
      console.log(`Fetching: ${source.name}`);
      const parsedArticles = await parseRSSFeed(source.url);
      result.fetched = parsedArticles.length;
      
      for (const article of parsedArticles) {
        try {
          // 检查是否已存在（按 originalUrl 去重）
          const existing = await db.query.articles.findFirst({
            where: eq(articles.originalUrl, article.link),
          });
          
          if (existing) {
            continue;
          }

          // 时间筛选：拒绝早于2026年1月1日的文章
          if (!isPublishDateValid(article.pubDate)) {
            console.log(`Skipped (old date: ${article.pubDate?.toISOString()}): "${article.title}"`);
            continue;
          }

          let relevanceScore = 0;
          let relevanceMeta: string | null = null;
          
          // 智能分类：根据内容判断最终分类
          let finalCategory = source.category;
          
          // 对于综合类源（如36氪、IT之家），根据内容智能判断分类
          // 优先级：AI > 金融 > 科技
          if (source.id === '36kr' || source.id === 'ithome') {
            const aiR = evaluateAIRelevance(article);
            const financeR = evaluateFinanceRelevance(article);
            const techR = evaluateTechRelevance(article);

            if (aiR.passed && aiR.score >= 35) {
              // AI相关度高，归类到 ai
              finalCategory = 'ai';
              relevanceScore = aiR.score;
              relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as ai (${aiR.score}): "${article.title}"`);
            } else if (financeR.passed && financeR.score >= 60) {
              // 金融相关度高，归类到 finance
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as finance (${financeR.score}): "${article.title}"`);
            } else if (techR.passed) {
              // 科技相关，保持 tech
              finalCategory = 'tech';
              relevanceScore = techR.score;
              relevanceMeta = JSON.stringify({ ...techR.meta, autoCategorized: true, originalCategory: source.category });
            } else {
              // 都不相关，跳过
              console.log(`Skipped (no relevant category): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'tech') {
            const r = evaluateTechRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed) {
              console.log(`Skipped (low tech relevance ${r.score}): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'finance') {
            const r = evaluateFinanceRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed) {
              console.log(`Skipped (low finance relevance ${r.score}): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'ai') {
            const r = evaluateAIRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed) {
              console.log(`Skipped (low AI relevance ${r.score}): "${article.title}"`);
              continue;
            }
          }

          // 处理图片：无图片或图片无效时使用分类默认图片
          let finalImageUrl = article.imageUrl;
          
          if (!finalImageUrl) {
            // 无图片，使用默认图片
            finalImageUrl = getDefaultImageForCategory(source.category);
            console.log(`Using default image for "${article.title}"`);
          } else {
            // 有图片，验证可用性
            const imageCheck = await validateImageUrl(finalImageUrl);
            if (!imageCheck.valid) {
              // 图片无效，使用默认图片
              finalImageUrl = getDefaultImageForCategory(source.category);
              console.log(`Image invalid, using default for "${article.title}"`);
            }
          }

          // 生成唯一 slug
          const slug = generateUniqueSlug(article.title, source.id);
          
          // 检查 slug 是否已存在，若存在则追加随机后缀
          const existingSlug = await db.query.articles.findFirst({
            where: eq(articles.slug, slug),
          });
          
          const finalSlug = existingSlug 
            ? `${slug}-${crypto.randomBytes(4).toString('hex')}` 
            : slug;

          // 检查标题是否已存在（去除空格差异），避免重复插入
          const normalizedTitle = article.title.replace(/\s+/g, ' ').trim();
          const existingArticles = await db
            .select({ id: articles.id })
            .from(articles)
            .where(sql`REPLACE(${articles.title}, ' ', '') = ${normalizedTitle.replace(/\s+/g, '')}`)
            .limit(1);

          if (existingArticles.length > 0) {
            console.log(`Skipped (duplicate title): "${article.title}"`);
            continue;
          }

          // 保存到数据库
          await db.insert(articles).values({
            title: article.title,
            summary: article.summary?.slice(0, 500) || '',
            content: article.content || article.summary || '',
            slug: finalSlug,
            originalUrl: article.link,
            sourceId: source.id,
            sourceName: source.name,
            category: finalCategory,
            author: article.author,
            imageUrl: finalImageUrl,
            publishedAt: article.pubDate,
            fetchedAt: new Date(),
            relevanceScore,
            relevanceMeta,
          });
          
          result.newArticles++;
        } catch (articleError) {
          // 单篇文章插入失败不影响其他文章
          const errMsg = articleError instanceof Error ? articleError.message : 'Unknown error';
          console.error(`Error inserting article "${article.title}":`, errMsg);
          result.errors.push(`Article: ${errMsg}`);
        }
      }
      
      // 更新RSS源状态
      await updateSourceStatus(source.id, source.name, result.fetched, null);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error(`Error fetching ${source.name}:`, error);
      
      // 更新错误状态
      await updateSourceStatus(source.id, source.name, 0, errorMsg);
    }
    
    results.push(result);
  }
  
  return results;
}

async function updateSourceStatus(
  sourceId: string, 
  sourceName: string, 
  fetchCount: number, 
  error: string | null
) {
  const existing = await db.query.rssSourceStatus.findFirst({
    where: eq(rssSourceStatus.sourceId, sourceId),
  });
  
  if (existing) {
    await db.update(rssSourceStatus)
      .set({
        lastFetchAt: new Date(),
        lastFetchCount: fetchCount,
        totalArticles: (existing.totalArticles ?? 0) + fetchCount,
        lastError: error,
        lastErrorAt: error ? new Date() : existing.lastErrorAt,
        isHealthy: !error,
      })
      .where(eq(rssSourceStatus.sourceId, sourceId));
  } else {
    await db.insert(rssSourceStatus).values({
      sourceId,
      sourceName,
      lastFetchAt: new Date(),
      lastFetchCount: fetchCount,
      totalArticles: fetchCount,
      lastError: error,
      lastErrorAt: error ? new Date() : null,
      isHealthy: !error,
    });
  }
}
