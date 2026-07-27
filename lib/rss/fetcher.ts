import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from './parser';
import { validateImageUrl } from './image-validator';
import { evaluateTechRelevance, TECH_THRESHOLD } from './tech-relevance';
import { evaluateFinanceRelevance, FINANCE_THRESHOLD } from './finance-relevance';
import { evaluateAIRelevance, AI_THRESHOLD } from './ai-relevance';
import { evaluatePMRelevance } from './pm-relevance';
import { detectPromoDeal } from './promo-deal';
import { detectITHomeProductLaunch } from './product-launch';
import { stripSourceBoilerplate } from './content-sanitizer';
import {
  evaluateContentQuality,
  enrichContentFromUrl,
} from './content-quality';
import { db } from '@/lib/db/client';
import { articles, rssSourceStatus } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { FetchResult, ParsedArticle } from '@/types';
import crypto from 'crypto';

// RSS 抓取并发控制
const CONCURRENT_LIMIT = 3;
const REQUEST_DELAY_MS = 500; // 源之间的请求间隔

export async function withConcurrencyLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const task = fn(items[i], i);
    executing.add(task);
    void task.then(
      () => executing.delete(task),
      () => executing.delete(task)
    );

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 最早允许的文章发布时间：2026年1月1日 00:00:00 UTC
const MIN_PUBLISH_DATE = new Date('2026-01-01T00:00:00.000Z');

// 分类对应的默认图片（使用 Unsplash 的免费图片）
const CATEGORY_DEFAULT_IMAGES: Record<string, null> = {
  'product-management': null,
  tech: null,
  ai: null,
  finance: null,
};

// 获取分类对应的默认图片
function getDefaultImageForCategory(category: string): null {
  return CATEGORY_DEFAULT_IMAGES[category] ?? null;
}

// 检查文章发布时间是否在允许范围内
function isPublishDateValid(pubDate: Date | undefined): boolean {
  if (!pubDate) {
    // 无发布时间的文章，默认允许（可能是最新文章）
    return true;
  }
  return pubDate >= MIN_PUBLISH_DATE;
}

function normalizeForKeywordMatch(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function articleMatchesIncludeKeywords(article: ParsedArticle, includeKeywords?: string[]): boolean {
  if (!includeKeywords || includeKeywords.length === 0) return true;

  const text = normalizeForKeywordMatch(
    `${article.title || ''} ${article.summary || ''} ${article.content || ''}`
  );

  return includeKeywords.some((keyword) => {
    const normalizedKeyword = normalizeForKeywordMatch(keyword);
    return normalizedKeyword.length > 0 && text.includes(normalizedKeyword);
  });
}

// 生成唯一的 slug，避免不同源的同名文章冲突
function recordRejection(result: FetchResult, reason: string) {
  result.rejectedArticles++;
  result.rejectionReasons[reason] = (result.rejectionReasons[reason] || 0) + 1;
}

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
  const enabledSources = rssSources.filter((s) => s.enabled);

  await withConcurrencyLimit(enabledSources, CONCURRENT_LIMIT, async (source, index) => {
    // 源之间添加间隔，避免同时发出大量请求
    if (index > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    const result: FetchResult = {
      sourceId: source.id,
      sourceName: source.name,
      fetched: 0,
      newArticles: 0,
      rejectedArticles: 0,
      rejectionReasons: {},
      errors: [],
    };

    try {
      console.log(`Fetching: ${source.name}`);
      const parsedArticles = await parseRSSFeed(source.url);
      result.fetched = parsedArticles.length;

      for (const article of parsedArticles) {
        try {
          article.summary = stripSourceBoilerplate(source.id, article.summary);
          article.content = stripSourceBoilerplate(source.id, article.content);

          // 检查是否已存在（按 originalUrl 去重）
          const existing = await db.query.articles.findFirst({
            where: eq(articles.originalUrl, article.link),
          });
          
          if (existing) {
            continue;
          }

          let relevanceScore = 0;
          let relevanceMeta: string | null = null;

          // 时间筛选：拒绝早于2026年1月1日的文章
          if (!isPublishDateValid(article.pubDate)) {
            recordRejection(result, 'old_publish_date');
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
            recordRejection(result, promoPreCheck.reason || 'promo_deal');
            console.log(`Skipped (promo/deal - universal block): "${article.title}"`);
            continue;
          }

          if (!articleMatchesIncludeKeywords(article, source.includeKeywords)) {
            recordRejection(result, 'source_keyword_prefilter');
            console.log(`Skipped (source keyword prefilter): "${article.title}"`);
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
            recordRejection(result, 'gaming_entertainment');
            console.log(`Skipped (gaming/entertainment - universal block): "${article.title}"`);
            continue;
          }

          // ========== IT之家 产品介绍/发售检测 ==========
          // IT之家 大量发布产品发售、上市类文章，需要单独过滤
          if (source.id === 'ithome') {
            const productLaunchCheck = detectITHomeProductLaunch(
              article.title || '',
              `${article.summary || ''} ${article.content || ''}`
            );
            if (productLaunchCheck.isProductLaunch) {
              recordRejection(result, productLaunchCheck.reason || 'ithome_product_launch');
              console.log(`Skipped (IT之家 product launch: ${productLaunchCheck.reason}): "${article.title}"`);
              continue;
            }
          } else if (source.category === 'product-management') {
            const r = evaluatePMRelevance(article);
            relevanceScore = r.score;
            relevanceMeta = JSON.stringify(r.meta);
            if (!r.passed) {
              recordRejection(result, r.meta.rejectedBy || 'low_pm_relevance');
              console.log(`Skipped (low PM relevance ${r.score}): "${article.title}"`);
              continue;
            }
          }

          // ========== 统一非顶尖品牌产品发布预检（第三优先级，所有来源生效） ==========
          // 产品发布新闻（带价格/规格）如果不是顶尖品牌，直接拒绝
          const PRODUCT_RELEASE_SIGNALS = ['发布', '发售', '开售', '上市', '推出', '亮相', '开卖', '首销', '展示', '公布', '曝光', '开启预约', '开启预售'];
          const PRODUCT_PRICE_SIGNALS = ['元', '售价', '首发价', '起价', '限时价', '优惠价', '美元', '定价', '到手价'];
          const PRODUCT_SPEC_SIGNALS = ['配置', '参数', '规格', '处理器', '内存', '屏幕', '电池', '英寸', '刷新率', '芯片', '核心', 'mAh', 'GB', 'TB'];
          const TOP_TIER_BRANDS_FETCHER = [
            '苹果', 'apple', 'iphone', 'ipad', 'mac', 'vision pro',
            '谷歌', 'google', 'pixel',
            '微软', 'microsoft', 'surface', 'xbox',
            '三星', 'samsung', 'galaxy',
            '索尼', 'sony', 'playstation', 'ps5',
            'meta', 'quest',
            '亚马逊', 'amazon',
            '英伟达', 'nvidia', 'rtx', 'geforce',
            'amd', '锐龙', 'ryzen', 'radeon',
            '特斯拉', 'tesla',
            '华为', 'huawei', '鸿蒙', 'harmonyos', 'mate', 'pura',
            '小米', 'xiaomi', '红米', 'redmi', '澎湃', 'su7',
            'oppo', '一加', 'oneplus', '真我', 'realme',
            'vivo', 'iqoo',
            '荣耀', 'honor',
            '联想', 'lenovo', 'thinkpad', '拯救者', 'legion',
            '华硕', 'asus', 'rog', '玩家国度',
            '戴尔', 'dell', '外星人', 'alienware',
            '惠普', 'hp',
            '大疆', 'dji', 'mavic', 'pocket', 'osmo',
            '比亚迪', 'byd', '仰望', '方程豹', '腾势',
            '蔚来', 'nio', '小鹏', 'xpeng', '理想', 'li auto',
            '问界', 'aito', '赛力斯', 'seres',
            '任天堂', 'nintendo', 'switch',
            'steam', 'valve',
            '罗技', 'logitech',
            '雷蛇', 'razer',
          ];
          const titleForProductCheck = article.title || '';
          const hasReleaseSignal = PRODUCT_RELEASE_SIGNALS.some(s => titleForProductCheck.includes(s));
          const hasPriceSignal = PRODUCT_PRICE_SIGNALS.some(s => titleForProductCheck.includes(s));
          const specHitCount = PRODUCT_SPEC_SIGNALS.filter(s => titleForProductCheck.includes(s)).length;
          const isProductRelease = hasReleaseSignal && (hasPriceSignal || specHitCount >= 2);
          if (isProductRelease) {
            const isTopTier = TOP_TIER_BRANDS_FETCHER.some(b => fullText.includes(b.toLowerCase()));
            if (!isTopTier) {
              recordRejection(result, 'non_top_tier_product_release');
              console.log(`Skipped (non-top-tier product release - universal block): "${article.title}"`);
              continue;
            }
          }

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
              recordRejection(result, 'promo_deal');
              console.log(`Skipped (promo/deal article): "${article.title}"`);
              continue;
            }

            // 高优先级：游戏/娱乐行业检测 - 不是 AI 技术新闻
            if (aiR.meta.rejectedBy === 'gaming_entertainment') {
              recordRejection(result, 'gaming_entertainment');
              console.log(`Skipped (gaming/entertainment news, not AI tech): "${article.title}"`);
              continue;
            }

            // 优先检查：强金融信号（分数 >= 阈值 表示命中强信号词）
            if (financeR.passed && financeR.score >= FINANCE_THRESHOLD) {
              // 强金融信号：归类到 finance
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as finance (strong signal ${financeR.score}): "${article.title}"`);
            } else if (aiR.passed && !aiR.meta.financeConflict && aiR.score >= AI_THRESHOLD) {
              // AI相关度高（且无金融冲突）：归类到 ai
              finalCategory = 'ai';
              relevanceScore = aiR.score;
              relevanceMeta = JSON.stringify({ ...aiR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as ai (${aiR.score}): "${article.title}"`);
            } else if (financeR.passed && financeR.score >= FINANCE_THRESHOLD) {
              // 常规金融信号：归类到 finance
              finalCategory = 'finance';
              relevanceScore = financeR.score;
              relevanceMeta = JSON.stringify({ ...financeR.meta, autoCategorized: true, originalCategory: source.category });
              console.log(`Auto-categorized as finance (${financeR.score}): "${article.title}"`);
            } else if (techR.passed && techR.score >= TECH_THRESHOLD) {
              // 科技相关：保持 tech
              finalCategory = 'tech';
              relevanceScore = techR.score;
              relevanceMeta = JSON.stringify({ ...techR.meta, autoCategorized: true, originalCategory: source.category });
            } else {
              // 都不相关：直接跳过，不入库
              console.log(`Skipped (no relevant category - aiR.score=${aiR.score}, techR.passed=${techR.passed}, financeR.passed=${financeR.passed}): "${article.title}"`);
              continue;
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

          // ========== 内容质量审查门 ==========
          const profile = source.contentProfile || 'article';
          const rawContent = `${article.summary || ''} ${article.content || ''}`.trim();
          let qualityCheck = evaluateContentQuality(article.title || '', rawContent, profile);

          // 长文源短摘要：尝试原文补全
          if (!qualityCheck.passed && profile === 'article' && source.enrichmentHosts && source.enrichmentHosts.length > 0) {
            const enrichmentResult = await enrichContentFromUrl(article.link, source.enrichmentHosts);
            if (enrichmentResult) {
              // 使用补全后的内容重新评估
              article.content = enrichmentResult.content;
              article.summary = enrichmentResult.summary;
              qualityCheck = evaluateContentQuality(article.title || '', enrichmentResult.content, profile);
              if (qualityCheck.passed) {
                qualityCheck.enriched = true;
              } else {
                qualityCheck.reason = `content_enrichment_failed: ${qualityCheck.reason}`;
              }
            } else {
              qualityCheck.reason = `content_enrichment_failed: ${qualityCheck.reason}`;
            }
          }

          if (!qualityCheck.passed) {
            recordRejection(result, qualityCheck.reason || 'content_quality_failed');
            console.log(`Skipped (content quality: ${qualityCheck.reason}): "${article.title}"`);
            continue;
          }

          // 处理图片：无图片或图片无效时使用分类默认图片
          let finalImageUrl: string | null = article.imageUrl || null;
          
          if (!finalImageUrl) {
            // 无图片，使用默认图片
            finalImageUrl = getDefaultImageForCategory(source.category);
            console.log(`No image found for "${article.title}", display layer will use category fallback`);
          } else {
            // 有图片，验证可用性
            const imageCheck = await validateImageUrl(finalImageUrl);
            if (!imageCheck.valid) {
              // 图片无效，使用默认图片
              finalImageUrl = getDefaultImageForCategory(source.category);
              console.log(`Image invalid for "${article.title}", display layer will use category fallback`);
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
  });

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
