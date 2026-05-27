/**
 * 职业发展内容抓取服务
 * 支持RSS、API等多种内容源的统一抓取
 */

import { XMLParser } from 'fast-xml-parser';
import { contentSources, getEnabledSources, defaultCoverImages, getDefaultCover } from '@/config/content-sources';
import { db } from '@/lib/db/client';
import { careerContents, contentSources as contentSourcesTable, contentFetchLogs } from '@/lib/db/schema';
import { eq, notInArray } from 'drizzle-orm';
import crypto from 'crypto';
import { normalizeAll } from './platforms/normalizer';
import { assessQuality, evaluateBestCategoryMatch } from './quality';
import { PlatformRawContent, NormalizedContent } from './platforms/types';
import { fetchXiaohongshuFeed, fetchDouyinFeed, fetchBilibiliFeed } from './platforms/rsshub';
import { validateExternalUrl } from './url-validator';
import { extractMetaFromUrl } from './cover-extractor';

const DEFAULT_COVERS = new Set(Object.values(defaultCoverImages));

function isDefaultCoverUrl(url?: string | null): boolean {
  if (!url) return false;
  return DEFAULT_COVERS.has(url);
}

function upscaleCoverUrl(url: string): string {
  if (!url.includes('.hdslb.com/')) return url;
  const idx = url.indexOf('@');
  if (idx <= 0) return url;
  const base = url.slice(0, idx);
  return `${base}@1280w_720h_1c`;
}

function shouldTryExtractCover(originalUrl: string): boolean {
  try {
    const u = new URL(originalUrl);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) return false;
    if (host === 'example.com' || host.endsWith('.example.com')) return false;
    if (host === 'rsshub.app' || host.endsWith('.rsshub.app')) return false;
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// 抓取结果类型
export interface FetchResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  newContents: number;
  updatedContents: number;
  errors: string[];
}

// 解析后的内容类型
export interface ParsedContent {
  title: string;
  description?: string;
  content?: string;
  originalUrl: string;
  originalId?: string;
  tags?: string[];
  author?: string;
  authorId?: string;
  authorAvatar?: string;
  coverImage?: string;
  videoUrl?: string;
  videoDuration?: number;
  images?: string[];
  publishedAt: Date;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

// 生成内容唯一ID
function generateContentId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRSSHubCandidates(url: string): string[] {
  const candidates: string[] = [];
  if (url) candidates.push(url);

  try {
    const parsed = new URL(url);
    const base = process.env.RSSHUB_BASE_URL?.trim();
    if (base) {
      const baseUrl = new URL(base);
      const rewritten = new URL(url);
      rewritten.protocol = baseUrl.protocol;
      rewritten.host = baseUrl.host;
      candidates.push(rewritten.toString());
    }

    if (parsed.hostname === 'rsshub.app' || parsed.hostname.endsWith('.rsshub.app')) {
      const mirrors = [
        'https://rsshub.rssforever.com',
        'https://i.scnu.edu.cn/sub',
        'https://rss.qiuyuair.com',
        'https://rss.feiyuyu.net',
        'https://rsshub.anyant.xyz',
      ];
      for (const m of mirrors) {
        const baseUrl = new URL(m);
        const rewritten = new URL(url);
        rewritten.protocol = baseUrl.protocol;
        rewritten.host = baseUrl.host;
        candidates.push(rewritten.toString());
      }
    }
  } catch {}

  return Array.from(new Set(candidates));
}

function resolveRsshubUrl(url: string): string {
  const base = process.env.RSSHUB_BASE_URL?.trim();
  if (!base) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'rsshub.app' && !parsed.hostname.endsWith('.rsshub.app')) return url;
    const baseUrl = new URL(base);
    parsed.protocol = baseUrl.protocol;
    parsed.host = baseUrl.host;
    return parsed.toString();
  } catch {
    return url;
  }
}

// 带重试的fetch
async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          ...options?.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${i + 1} failed for ${url}:`, lastError.message);
      
      if (i < maxRetries - 1) {
        await delay(1000 * (i + 1)); // 指数退避
      }
    }
  }
  
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

// RSS内容解析器
async function parseRSSFeed(url: string): Promise<ParsedContent[]> {
  const response = await fetchWithRetry(url);
  const xmlText = await response.text();
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
  });
  
  const parsed = parser.parse(xmlText);
  const channel = parsed.rss?.channel || parsed.feed;
  
  if (!channel) {
    throw new Error('Invalid RSS feed structure');
  }
  
  const items = channel.item || channel.entry || [];
  const itemArray = Array.isArray(items) ? items : [items];
  
  return itemArray.map((item: Record<string, unknown>) => {
    const pickUrl = (v: unknown): string => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const candidates = [o['@_url'], o.url, o['#text'], o.href, o['@_href']].map(x => (x == null ? '' : String(x)));
        return candidates.find(Boolean) || '';
      }
      return '';
    };
    const pickText = (v: unknown): string => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      if (typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const candidates = [o['#text'], o.text, o.value].map(x => (x == null ? '' : String(x)));
        return candidates.find(Boolean) || '';
      }
      return '';
    };

    const pickCategoryTexts = (v: unknown): string[] => {
      if (!v) return [];
      const asText = (x: unknown) => pickText(x).trim();
      const list = Array.isArray(v) ? v : [v];
      const values: string[] = [];
      for (const item of list) {
        if (!item) continue;
        if (typeof item === 'string') {
          const t = item.trim();
          if (t) values.push(t);
          continue;
        }
        if (typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const t = asText(o['#text'] ?? o.text ?? o.value ?? o.term ?? o.label ?? o);
          if (t) values.push(t);
          continue;
        }
        const t = asText(item);
        if (t) values.push(t);
      }
      return Array.from(new Set(values));
    };

    // 提取图片
    let coverImage: string | undefined;
    const images: string[] = [];
    const mediaContent = item['media:content'] || item['media:thumbnail'];
    if (mediaContent) {
      const list = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
      const url = list.map(pickUrl).find(Boolean) || '';
      if (url) coverImage = url;
    }

    const itunesImage = item['itunes:image'];
    if (!coverImage && itunesImage) {
      const list = Array.isArray(itunesImage) ? itunesImage : [itunesImage];
      const url = list.map(pickUrl).find(Boolean) || '';
      if (url) coverImage = url;
    }

    const image = item.image;
    if (!coverImage && image) {
      const list = Array.isArray(image) ? image : [image];
      const url = list.map(pickUrl).find(Boolean) || '';
      if (url) coverImage = url;
    }

    const enclosure = item.enclosure;
    if (!coverImage && enclosure && typeof enclosure === 'object') {
      const list = Array.isArray(enclosure) ? enclosure : [enclosure];
      const url = list.map(pickUrl).find(Boolean) || '';
      if (url) coverImage = url;
    }
    
    // 从描述中提取图片
    if (!coverImage && item.description) {
      const html = String(item.description);
      const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]).filter(Boolean);
      for (const u of matches) {
        if (!images.includes(u)) images.push(u);
      }
      if (matches[0]) coverImage = matches[0];
    }

    const encoded = item['content:encoded'];
    if (encoded) {
      const html = typeof encoded === 'object' ? String((encoded as Record<string, unknown>)['#text'] || '') : String(encoded);
      const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]).filter(Boolean);
      for (const u of matches) {
        if (!images.includes(u)) images.push(u);
      }
      if (!coverImage && matches[0]) coverImage = matches[0];
    }
    
    // 解析发布时间
    let publishedAt = new Date();
    const pubDate = item.pubDate || item.published || item.updated;
    if (pubDate) {
      try {
        publishedAt = new Date(String(pubDate));
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } catch {
        publishedAt = new Date();
      }
    }
    
    const link = item.link || item.id || '';
    const linkUrl = typeof link === 'string' ? link : (link as Record<string, string>)['@_href'] || String(link);
    const guidText = pickText(item.guid);
    const guidUrl = pickUrl(guidText) || pickUrl(item.guid);
    const originalUrl = (() => {
      const fallback = linkUrl || guidUrl || '';
      try {
        const parsed = new URL(fallback);
        if (parsed.hostname === 'rsshub.app' || parsed.hostname.endsWith('.rsshub.app')) {
          if (guidUrl) {
            const u = new URL(guidUrl);
            if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
          }
        }
      } catch {}
      return fallback;
    })();

    const authorNode = item.author;
    const authorName =
      authorNode && typeof authorNode === 'object'
        ? String((authorNode as Record<string, unknown>).name || '')
        : String(authorNode || '');
    
    const tags = pickCategoryTexts(item.category);

    return {
      title: String(item.title || '').trim(),
      description: String(item.description || item.summary || '').replace(/<[^>]+>/g, '').substring(0, 500),
      content: String(item['content:encoded'] || item.content || item.description || ''),
      originalUrl,
      originalId: generateContentId(originalUrl),
      tags,
      author: String(authorName || item.creator || ''),
      coverImage,
      images,
      publishedAt,
    };
  }).filter(item => item.title && item.originalUrl);
}

// 内容去重检查
async function isContentExists(originalUrl: string): Promise<boolean> {
  const existing = await db.query.careerContents.findFirst({
    where: eq(careerContents.originalUrl, originalUrl),
  });
  return !!existing;
}

// 保存内容到数据库
async function saveContent(
  content: NormalizedContent,
  sourceId: string,
  sourceName: string,
  platform: string,
  category: string
): Promise<{ isNew: boolean; isUpdated: boolean }> {
  const bestMatch = evaluateBestCategoryMatch(content);
  const matchPassed = bestMatch.matched;
  const quality = assessQuality(content);

  const isHardReject =
    quality.reasons.includes('非中文内容（仅保留中文文章与视频）') ||
    quality.reasons.includes('检测到大量疑似广告/垃圾信息') ||
    quality.reasons.includes('疑似财经/投资内容（非职业发展主题）') ||
    quality.reasons.includes('非职业发展视频（产品技能课程）');

  const isVideoPlatform = platform === 'bilibili' || platform === 'douyin' || platform === 'xiaohongshu';
  const urlValidation =
    isHardReject || isVideoPlatform
      ? { ok: true, finalUrl: content.originalUrl }
      : await validateExternalUrl(content.originalUrl);
  if (!isHardReject && urlValidation.ok && urlValidation.finalUrl) {
    content.originalUrl = urlValidation.finalUrl;
    content.originalId = generateContentId(content.originalUrl);
  }

  content.category = matchPassed ? bestMatch.category : 'all';

  if (content.coverImage) {
    content.coverImage = upscaleCoverUrl(content.coverImage);
  }

  const shouldEnrichVideoMeta = sourceId === 'bilibili-video-curation';
  if (
    (shouldEnrichVideoMeta || !content.coverImage) &&
    urlValidation.ok &&
    shouldTryExtractCover(content.originalUrl)
  ) {
    const meta = await extractMetaFromUrl(content.originalUrl);
    if (meta.cover) content.coverImage = meta.cover;
    if (shouldEnrichVideoMeta && meta.publishedAt) content.publishedAt = meta.publishedAt;
  }

  const yearStart = new Date('2026-01-01T00:00:00.000Z');
  const yearEnd = new Date('2027-01-01T00:00:00.000Z');

  const isEvergreen =
    content.contentType === 'video' || content.contentType === 'short_video' || content.contentType === 'live' || content.contentType === 'audio';

  if (!isEvergreen && (content.publishedAt.getTime() < yearStart.getTime() || content.publishedAt.getTime() >= yearEnd.getTime())) {
    const existing = await db.query.careerContents.findFirst({
      where: eq(careerContents.originalUrl, content.originalUrl),
    });

    if (existing && existing.status === 'active') {
      await db.update(careerContents)
        .set({
          status: 'archived',
          updatedAt: new Date(),
        })
        .where(eq(careerContents.id, existing.id));

      return { isNew: false, isUpdated: true };
    }

    return { isNew: false, isUpdated: false };
  }

  const contentStatus =
    (!urlValidation.ok || isHardReject) ? 'rejected' : (quality.passed && matchPassed ? 'active' : 'pending');

  const desiredCover = content.coverImage || getDefaultCover(content.category);

  const existing = await db.query.careerContents.findFirst({
    where: eq(careerContents.originalUrl, content.originalUrl),
  });
  
  if (existing) {
    const nextCover = (() => {
      if (content.coverImage && !isDefaultCoverUrl(content.coverImage)) return content.coverImage;
      const old = existing.coverImage;
      if (old && !isDefaultCoverUrl(old)) return old;
      return desiredCover;
    })();

    // 更新互动数据与状态信息
    await db.update(careerContents)
      .set({
        title: content.title,
        description: content.description,
        content: content.content,
        sourceName,
        coverImage: nextCover,
        videoUrl: content.videoUrl,
        videoDuration: content.videoDuration,
        images: content.images.length > 0 ? JSON.stringify(content.images) : null,
        viewCount: content.viewCount ?? existing.viewCount,
        likeCount: content.likeCount ?? existing.likeCount,
        commentCount: content.commentCount ?? existing.commentCount,
        shareCount: content.shareCount ?? existing.shareCount,
        status: contentStatus,
        category: content.category,
        qualityScore: quality.score,
        qualityReasons: quality.reasons.length > 0 ? JSON.stringify(quality.reasons) : null,
        matchScore: bestMatch.matchScore,
        matchKeywords: bestMatch.keywords.length > 0 ? JSON.stringify(bestMatch.keywords) : null,
        matchCoreMatched: bestMatch.coreMatched,
        matchCoreMissing: bestMatch.coreMissing.length > 0 ? JSON.stringify(bestMatch.coreMissing) : null,
        originalId: content.originalId ?? existing.originalId,
        publishedAt: content.publishedAt ?? existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(careerContents.id, existing.id));
    
    return { isNew: false, isUpdated: true };
  }
  
  // 插入新内容（NormalizedContent 已包含分类、封面和内容类型）
  await db.insert(careerContents).values({
    title: content.title,
    description: content.description,
    content: content.content,
    sourceId,
    sourceName,
    platform,
    originalUrl: content.originalUrl,
    originalId: content.originalId,
    author: content.author || sourceName,
    authorId: content.authorId,
    authorAvatar: content.authorAvatar,
    contentType: content.contentType,
    category: content.category,
    coverImage: desiredCover,
    videoUrl: content.videoUrl,
    videoDuration: content.videoDuration,
    images: content.images.length > 0 ? JSON.stringify(content.images) : null,
    viewCount: content.viewCount,
    likeCount: content.likeCount,
    commentCount: content.commentCount,
    shareCount: content.shareCount,
    status: contentStatus,
    qualityScore: quality.score,
    qualityReasons: quality.reasons.length > 0 ? JSON.stringify(quality.reasons) : null,
    matchScore: bestMatch.matchScore,
    matchKeywords: bestMatch.keywords.length > 0 ? JSON.stringify(bestMatch.keywords) : null,
    matchCoreMatched: bestMatch.coreMatched,
    matchCoreMissing: bestMatch.coreMissing.length > 0 ? JSON.stringify(bestMatch.coreMissing) : null,
    publishedAt: content.publishedAt,
    fetchedAt: new Date(),
  });
  
  return { isNew: true, isUpdated: false };
}

// 更新内容源状态
async function updateSourceStatus(
  sourceId: string,
  fetchedCount: number,
  error: string | null
) {
  const existing = await db.query.contentSources.findFirst({
    where: eq(contentSourcesTable.sourceId, sourceId),
  });
  
  if (existing) {
    await db.update(contentSourcesTable)
      .set({
        lastFetchAt: new Date(),
        lastFetchCount: fetchedCount,
        totalContents: (existing.totalContents || 0) + fetchedCount,
        lastError: error,
        lastErrorAt: error ? new Date() : existing.lastErrorAt,
        isHealthy: !error,
        updatedAt: new Date(),
      })
      .where(eq(contentSourcesTable.id, existing.id));
  }
}

// 记录抓取日志
async function logFetch(
  sourceId: string,
  startedAt: Date,
  fetchedCount: number,
  newCount: number,
  updatedCount: number,
  errors: string[]
) {
  await db.insert(contentFetchLogs).values({
    sourceId,
    startedAt,
    completedAt: new Date(),
    fetchedCount,
    newCount,
    updatedCount,
    errorCount: errors.length,
    errors: errors.length > 0 ? JSON.stringify(errors) : null,
  });
}

// 抓取单个内容源
async function fetchSource(source: typeof contentSources[0]): Promise<FetchResult> {
  const result: FetchResult = {
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    fetched: 0,
    newContents: 0,
    updatedContents: 0,
    errors: [],
  };
  
  const startedAt = new Date();
  
  try {
    console.log(`[${source.sourceName}] Starting fetch...`);
    const sourceUrl = resolveRsshubUrl(source.url);
    
    // 根据平台类型选择解析器
    let rawContents: PlatformRawContent[];
    const isRSSHubPlatform = (() => {
      if (!['xiaohongshu', 'douyin', 'bilibili'].includes(source.platform)) return false;
      try {
        const host = new URL(sourceUrl).hostname.toLowerCase();
        if (host === 'rsshub.app' || host.endsWith('.rsshub.app')) return true;
        const base = process.env.RSSHUB_BASE_URL?.trim();
        if (base) {
          const baseHost = new URL(base).hostname.toLowerCase();
          if (host === baseHost) return true;
        }
        if (host === 'rsshub.rssforever.com') return true;
        if (host === 'i.scnu.edu.cn') return true;
        if (host === 'rss.qiuyuair.com') return true;
        if (host === 'rss.feiyuyu.net') return true;
        if (host === 'rsshub.anyant.xyz') return true;
        return false;
      } catch {
        return false;
      }
    })();

    if (isRSSHubPlatform) {
      const candidates = getRSSHubCandidates(sourceUrl);
      let lastError: unknown = null;
      rawContents = [];

      for (const url of candidates) {
        try {
          switch (source.platform) {
            case 'xiaohongshu':
              rawContents = await fetchXiaohongshuFeed(source.sourceId, source.sourceName, url);
              break;
            case 'douyin':
              rawContents = await fetchDouyinFeed(source.sourceId, source.sourceName, url);
              break;
            case 'bilibili':
              rawContents = await fetchBilibiliFeed(source.sourceId, source.sourceName, url);
              break;
            default:
              rawContents = [];
          }
          if (rawContents.length > 0) break;
        } catch (e) {
          lastError = e;
        }
      }

      if (rawContents.length === 0 && lastError) {
        throw lastError;
      }
    } else {
      // 传统RSS解析
      const candidates = (() => {
        try {
          const host = new URL(sourceUrl).hostname.toLowerCase();
          if (host === 'rsshub.app' || host.endsWith('.rsshub.app')) return getRSSHubCandidates(sourceUrl);
        } catch {}
        return [sourceUrl];
      })();

      let parsed: Awaited<ReturnType<typeof parseRSSFeed>> = [];
      let lastError: unknown = null;
      for (const url of candidates) {
        try {
          parsed = await parseRSSFeed(url);
          if (parsed.length > 0) break;
        } catch (e) {
          lastError = e;
        }
      }
      if (parsed.length === 0 && lastError) throw lastError;

      rawContents = parsed.map((item) => ({
        platform: (source.platform as PlatformRawContent['platform']) || 'rss',
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        originalId: item.originalId || generateContentId(item.originalUrl),
        originalUrl: item.originalUrl,
        title: item.title,
        description: item.description || '',
        content: item.content || item.description || '',
        author: { name: item.author || '' },
        media: { coverUrl: item.coverImage || '', images: item.images || [] },
        stats: {},
        tags: item.tags || [],
        publishedAt: item.publishedAt,
        rawData: item,
      }));
    }

    // 格式转换：将各平台原始数据统一映射至标准模型
    const normalized = normalizeAll(rawContents);
    
    result.fetched = rawContents.length;
    console.log(`[${source.sourceName}] Fetched ${rawContents.length} items`);
    
    // 保存内容
    for (const content of normalized) {
      try {
        const filters = source.config?.filters || [];
        if (filters.length > 0) {
          const fullText = `${content.title || ''} ${content.description || ''} ${content.content || ''}`.toLowerCase();
          const passed = filters.some((f) => fullText.includes(String(f).toLowerCase()));
          if (!passed) continue;
        }

        const { isNew, isUpdated } = await saveContent(
          content,
          source.sourceId,
          source.sourceName,
          source.platform,
          source.category
        );
        
        if (isNew) result.newContents++;
        if (isUpdated) result.updatedContents++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[${source.sourceName}] Error saving content:`, errorMsg);
        result.errors.push(`Save error: ${errorMsg}`);
      }
    }
    
    // 更新源状态
    await updateSourceStatus(source.sourceId, result.fetched, null);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${source.sourceName}] Fetch failed:`, errorMsg);
    result.errors.push(errorMsg);
    
    // 更新源状态为错误
    await updateSourceStatus(source.sourceId, 0, errorMsg);
  }
  
  // 记录日志
  await logFetch(
    source.sourceId,
    startedAt,
    result.fetched,
    result.newContents,
    result.updatedContents,
    result.errors
  );
  
  return result;
}

// 主抓取函数 - 抓取所有启用的内容源
export async function fetchAllCareerContents(): Promise<FetchResult[]> {
  await initContentSources();
  const sources = getEnabledSources();
  const results: FetchResult[] = [];
  
  console.log(`Starting fetch for ${sources.length} content sources...`);
  
  for (const source of sources) {
    // 检查是否需要抓取（根据抓取间隔）
    const existingSource = await db.query.contentSources.findFirst({
      where: eq(contentSourcesTable.sourceId, source.sourceId),
    });
    
    if (existingSource?.lastFetchAt) {
      const elapsed = Date.now() - existingSource.lastFetchAt.getTime();
      const interval = source.fetchInterval * 1000;
      const effectiveInterval = existingSource.lastError ? Math.min(interval, 5 * 60 * 1000) : interval;
      
      if (elapsed < effectiveInterval) {
        console.log(`[${source.sourceName}] Skipped (interval not reached)`);
        continue;
      }
    }
    
    const result = await fetchSource(source);
    results.push(result);
    
    // 添加延迟，避免请求过于频繁
    await delay(1000);
  }
  
  console.log('Fetch completed:', results);
  return results;
}

// 抓取指定内容源
export async function fetchCareerContentsBySource(sourceId: string): Promise<FetchResult | null> {
  await initContentSources();
  const source = contentSources.find(s => s.sourceId === sourceId);
  if (!source || !source.enabled) {
    console.log(`Source ${sourceId} not found or disabled`);
    return null;
  }
  
  return fetchSource(source);
}

// 抓取指定分类的内容
export async function fetchCareerContentsByCategory(category: string): Promise<FetchResult[]> {
  await initContentSources();
  const sources = contentSources.filter(
    s => s.enabled && (s.category === category || s.category === 'all')
  );
  
  const results: FetchResult[] = [];
  
  for (const source of sources) {
    const result = await fetchSource(source);
    results.push(result);
    await delay(1000);
  }
  
  return results;
}

// 初始化内容源到数据库
export async function initContentSources(): Promise<void> {
  const activeSourceIds = contentSources.map(s => s.sourceId);
  for (const source of contentSources) {
    const existing = await db.query.contentSources.findFirst({
      where: eq(contentSourcesTable.sourceId, source.sourceId),
    });
    
    if (!existing) {
      await db.insert(contentSourcesTable).values({
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        platform: source.platform,
        category: source.category,
        url: source.url,
        enabled: source.enabled,
        weight: source.weight,
        fetchInterval: source.fetchInterval,
        config: source.config ? JSON.stringify(source.config) : null,
        totalContents: 0,
        isHealthy: true,
      });
      console.log(`Initialized content source: ${source.sourceName}`);
    } else {
      await db.update(contentSourcesTable)
        .set({
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          platform: source.platform,
          category: source.category,
          url: source.url,
          enabled: source.enabled,
          weight: source.weight,
          fetchInterval: source.fetchInterval,
          config: source.config ? JSON.stringify(source.config) : null,
          updatedAt: new Date(),
        })
        .where(eq(contentSourcesTable.id, existing.id));
    }
  }

  await db.update(contentSourcesTable)
    .set({ enabled: false, updatedAt: new Date() })
    .where(notInArray(contentSourcesTable.sourceId, activeSourceIds));
}
