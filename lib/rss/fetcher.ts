import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from './parser';
import { validateImageUrl } from './image-validator';
import { evaluateTechRelevance } from './tech-relevance';
import { evaluateFinanceRelevance } from './finance-relevance';
import { evaluateAIRelevance } from './ai-relevance';
import { detectPromoDeal } from './promo-deal';
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

          // ========== 统一促销导购预检（最高优先级，所有来源生效） ==========
          // 在任何分类评估之前，先检查是否为促销导购文章
          const promoPreCheck = detectPromoDeal(
            article.title || '',
            `${article.summary || ''} ${article.content || ''}`
          );
          if (promoPreCheck.isPromo) {
            console.log(`Skipped (promo/deal - universal block): "${article.title}"`);
            continue;
          }

          // ========== 统一游戏/娱乐预检（第二优先级，所有来源生效） ==========
          // 游戏/娱乐新闻即使提及 AI，也不是 AI 技术新闻
          const fullText = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
          const GAMING_KEYWORDS = [
            'steam', 'epic', 'playstation', 'xbox', 'switch', '任天堂',
            '使命召唤', 'cod', 'call of duty', '黑色行动', '现代战争',
            '原神', '王者荣耀', '和平精英', '英雄联盟', 'lol',
            '游戏发售', '游戏发布', '游戏上线', '游戏更新', 'dlc',
            '电竞', '职业联赛', '游戏比赛',
            'netflix', '迪士尼', '漫威', 'dc',
          ];
          const gamingHits = GAMING_KEYWORDS.filter(k => fullText.includes(k.toLowerCase()));
          if (gamingHits.length >= 2) {
            console.log(`Skipped (gaming/entertainment - universal block): "${article.title}"`);
            continue;
          }

          let relevanceScore = 0;
          let relevanceMeta: string | null = null;
          
          // 智能分类：根据内容判断最终分类
          let finalCategory = source.category;
          
          // 对于综合类源（如36氪、IT之家），根据内容智能判断分类
          // 优先级调整：金融 > AI > 科技
          // 理由：标题中出现"涨超"、"港股"、"概念股"等强金融信号时，
          //       即使文章包含 AI 关键词（如"大模型"），也应归为金融而非 AI
          if (source.id === '36kr' || source.id === 'ithome') {
            const aiR = evaluateAIRelevance(article);
            const financeR = evaluateFinanceRelevance(article);
            const techR = evaluateTechRelevance(article);

            // 最高优先级：促销导购检测 - 任何分类命中都跳过
            if (aiR.meta.rejectedBy?.startsWith('promo_deal') || 
                financeR.meta.rejectedBy?.startsWith('promo_deal') || 
                techR.meta.rejectedBy === 'promo_deal') {
              console.log(`Skipped (promo/deal article): "${article.title}"`);
              continue;
            }

            // 高优先级：游戏/娱乐行业检测 - 不是 AI 技术新闻
            if (aiR.meta.rejectedBy === 'gaming_entertainment') {
              console.log(`Skipped (gaming/entertainment news, not AI tech): "${article.title}"`);
              continue;
            }

            // 优先检查：强金融信号（分数 >= 70 表示命中强信号词）
            if (financeR.passed && financeR.score >= 70) {
              // 强金融信号：归类到 finance
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as finance (strong signal ${financeR.score}): "${article.title}"`);
            } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= 35) {
              // AI相关度高（且无金融冲突）：归类到 ai
              finalCategory = 'ai';
              relevanceScore = aiR.score;
              relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as ai (${aiR.score}): "${article.title}"`);
            } else if (financeR.passed && financeR.score >= 45) {
              // 常规金融信号：归类到 finance
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as finance (${financeR.score}): "${article.title}"`);
            } else if (techR.passed) {
              // 科技相关：保持 tech
              finalCategory = 'tech';
              relevanceScore = techR.score;
              relevanceMeta = JSON.stringify({ ...techR.meta, autoCategorized: true, originalCategory: source.category });
            } else {
              // 都不相关：
              // - 如果 AI 有一定相关性（分数 >= 15），可以考虑保留到 AI
              // - 否则保持源分类（tech），但不应该是无意义的 fallback
              if (aiR.score >= 15 && !aiR.meta.financeConflict) {
                finalCategory = 'ai';
                relevanceScore = Math.max(aiR.score, 20);
                relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true, originalCategory: source.category, fallback: true });
                console.log(`Fallback to ai (aiR.score=${aiR.score}): "${article.title}"`);
              } else {
                // 真的不相关，跳过这篇文章
                // 原因：不是科技新闻，不是金融新闻，也不真正与 AI 相关
                console.log(`Skipped (no relevant category - aiR.score=${aiR.score}, techR.passed=${techR.passed}): "${article.title}"`);
                continue;
              }
            }
          } else if (source.category === 'tech') {
            const r = evaluateTechRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            // 如果有金融冲突、产品发布或促销导购，应该跳过
            if (!r.passed || r.meta.rejectedBy === 'finance' || r.meta.rejectedBy === 'product_release' || r.meta.rejectedBy === 'promo_deal') {
              if (r.meta.rejectedBy === 'finance') {
                console.log(`Skipped (tech article with strong finance signal): "${article.title}"`);
              } else if (r.meta.rejectedBy === 'product_release') {
                console.log(`Skipped (product release news): "${article.title}"`);
              } else if (r.meta.rejectedBy === 'promo_deal') {
                console.log(`Skipped (promo/deal article): "${article.title}"`);
              } else {
                console.log(`Skipped (low tech relevance ${r.score}): "${article.title}"`);
              }
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
            // 对于 AI 分类的源，也需要检查是否有强金融信号
            const r = evaluateAIRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            // 如果有金融冲突，应该跳过而不是保留为 AI
            if (!r.passed || r.meta.financeConflict) {
              if (r.meta.financeConflict) {
                console.log(`Skipped (AI article with strong finance signal): "${article.title}"`);
              } else {
                console.log(`Skipped (low AI relevance ${r.score}): "${article.title}"`);
              }
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
