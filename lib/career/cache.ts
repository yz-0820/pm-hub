import { db } from '@/lib/db/client';
import { contentCache, careerContents } from '@/lib/db/schema';
import { eq, and, lt, gte, desc, notLike, SQLWrapper, sql } from 'drizzle-orm';
import { CareerContent } from '@/lib/db/schema';
import { getUtcYearRange } from './year-range';

// ============================================================
// Level 1: 内存缓存 (热点内容，访问最快)
// ============================================================
class MemoryCache {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 200, defaultTTL = 60_000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // LRU: 移到最后
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    // 淘汰最旧条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// 全局内存缓存实例
const memCache = new MemoryCache(300, 120_000);

// ============================================================
// Level 2: 数据库缓存 (持久化，跨进程共享)
// ============================================================
export async function getDBCache<T>(cacheKey: string): Promise<T | null> {
  const row = await db.query.contentCache.findFirst({
    where: and(
      eq(contentCache.cacheKey, cacheKey),
      gte(contentCache.expiresAt, new Date())
    ),
  });
  if (!row) return null;
  return JSON.parse(row.data) as T;
}

export async function setDBCache<T>(cacheKey: string, cacheType: string, data: T, ttlSeconds = 300): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await db.insert(contentCache).values({
    cacheKey,
    cacheType,
    data: JSON.stringify(data),
    expiresAt,
  }).onConflictDoUpdate({
    target: contentCache.cacheKey,
    set: { data: JSON.stringify(data), expiresAt, createdAt: new Date() },
  });
}

// ============================================================
// Level 3: 原始查询（无可缓存时直接查DB）
// ============================================================

// ============================================================
// 统一缓存接口：L1 -> L2 -> L3
// ============================================================
export async function getCache<T>(
  cacheKey: string,
  options?: { memTTL?: number; dbTTL?: number }
): Promise<T | null> {
  // L1: 内存缓存
  const memResult = memCache.get<T>(cacheKey);
  if (memResult !== null) return memResult;

  // L2: 数据库缓存
  const dbResult = await getDBCache<T>(cacheKey);
  if (dbResult !== null) {
    // 回填 L1
    memCache.set(cacheKey, dbResult, options?.memTTL || 120_000);
    return dbResult;
  }

  return null;
}

/**
 * 设置缓存（同时写入 L1 内存和 L2 数据库）
 * 兼容旧版调用：第4参数可传 number（dbTTL 秒数）或 options 对象
 */
export async function setCache<T>(
  cacheKey: string,
  cacheType: string,
  data: T,
  options?: number | { memTTL?: number; dbTTL?: number }
): Promise<void> {
  let dbTTL: number;
  let memTTL: number;

  if (typeof options === 'number') {
    // 旧版兼容：直接传 dbTTL 秒数
    dbTTL = options;
    memTTL = 120_000;
  } else {
    dbTTL = options?.dbTTL || 300;
    memTTL = options?.memTTL || 120_000;
  }

  // 同时写入两级
  memCache.set(cacheKey, data, memTTL);
  await setDBCache(cacheKey, cacheType, data, dbTTL);
}

export async function deleteCache(cacheKey: string): Promise<void> {
  memCache.delete(cacheKey);
  await db.delete(contentCache).where(eq(contentCache.cacheKey, cacheKey));
}

export async function cleanExpiredCache(): Promise<number> {
  const deleted = await db
    .delete(contentCache)
    .where(lt(contentCache.expiresAt, new Date()))
    .returning({ id: contentCache.id });
  return deleted.length;
}

// 按类型清除
export async function invalidateCache(type?: string): Promise<void> {
  if (type) {
    // 内存键含 "career:" 前缀，补齐前缀以正确匹配
    const memPrefix = type.startsWith('career:') ? type : `career:${type}`;
    memCache.deleteByPrefix(memPrefix);
    await db.delete(contentCache).where(eq(contentCache.cacheType, type));
  } else {
    memCache.clear();
    await db.delete(contentCache);
  }
}

// 内容相关缓存清除（单条或多条）
export async function invalidateContentCache(contentId?: number): Promise<void> {
  memCache.deleteByPrefix('career:list');
  memCache.deleteByPrefix('career:feed');
  memCache.deleteByPrefix('career:stats');
  memCache.deleteByPrefix('career:category');
  if (contentId) {
    memCache.delete(`career:detail:${contentId}`);
  } else {
    memCache.deleteByPrefix('career:detail');
  }
  await db.delete(contentCache).where(
    contentId
      ? eq(contentCache.cacheKey, `career:detail:${contentId}`)
      : undefined
  );
}

export function generateCacheKey(type: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `career:${type}:v2:${sorted}`;
}

// ============================================================
// 缓存统计（供调试/监控）
// ============================================================
export function getCacheStats() {
  return {
    memory: { size: memCache.size, maxSize: 300 },
  };
}

// ============================================================
// 业务查询方法（保持原有逻辑，适配新的多级缓存接口）
// ============================================================

// 缓存配置（TTL 秒数，供业务方法传递给 setCache）
const CACHE_CONFIG = {
  TTL: {
    list: 300,      // 列表缓存5分钟
    detail: 600,    // 详情缓存10分钟
    feed: 180,      // 动态流缓存3分钟
    stats: 60,      // 统计数据缓存1分钟
  },
};

export interface ContentListParams {
  category?: string;
  platform?: string;
  contentType?: string;
  status?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  orderBy?: 'newest' | 'popular' | 'featured';
}

export interface ContentListResult {
  contents: CareerContent[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getContentList(params: ContentListParams): Promise<ContentListResult> {
  const { start: yearStart, end: yearEnd } = getUtcYearRange();
  const cacheKey = generateCacheKey('list', {
    ...params,
    year: yearStart.getUTCFullYear(),
  } as Record<string, unknown>);

  // 尝试从多级缓存获取
  const cached = await getCache<ContentListResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // L3: 从数据库查询
  const {
    category,
    platform,
    contentType,
    status = 'active',
    isFeatured,
    page = 1,
    limit = 10,
    orderBy = 'newest',
  } = params;

  const offset = (page - 1) * limit;

  // 构建查询条件
  const conditions: (SQLWrapper | undefined)[] = [];

  if (status) {
    conditions.push(eq(careerContents.status, status));
  }
  conditions.push(notLike(careerContents.originalUrl, '%example.com/%'));
  conditions.push(notLike(careerContents.originalUrl, '%rsshub.app/%'));
  conditions.push(notLike(careerContents.originalUrl, '%localhost%'));
  conditions.push(notLike(careerContents.originalUrl, '%127.0.0.1%'));
  conditions.push(gte(careerContents.publishedAt, yearStart));
  conditions.push(lt(careerContents.publishedAt, yearEnd));
  if (category && category !== 'all') {
    conditions.push(eq(careerContents.category, category));
  }
  if (platform && platform !== 'all') {
    conditions.push(eq(careerContents.platform, platform));
  }
  if (contentType && contentType !== 'all') {
    conditions.push(eq(careerContents.contentType, contentType));
  }
  if (isFeatured !== undefined) {
    conditions.push(eq(careerContents.isFeatured, isFeatured));
  }

  // 构建排序
  let orderByClause;
  switch (orderBy) {
    case 'popular':
      orderByClause = desc(careerContents.viewCount);
      break;
    case 'featured':
      orderByClause = desc(careerContents.isFeatured);
      break;
    case 'newest':
    default:
      orderByClause = desc(careerContents.publishedAt);
  }

  // 查询数据
  const contents = await db.query.careerContents.findMany({
    where: conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined,
    orderBy: [orderByClause, desc(careerContents.publishedAt)],
    limit,
    offset,
  });

  // 查询总数
  const allContents = await db.query.careerContents.findMany({
    where: conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined,
  });
  const total = allContents.length;

  const result: ContentListResult = {
    contents,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };

  // 写入两级缓存（兼容旧调用：第4参数传 number 作为 dbTTL）
  await setCache(cacheKey, 'list', result, CACHE_CONFIG.TTL.list);

  return result;
}

// 获取内容详情（带缓存）
export async function getContentDetail(id: number): Promise<CareerContent | null> {
  const cacheKey = generateCacheKey('detail', { id });

  // 尝试从多级缓存获取
  const cached = await getCache<CareerContent>(cacheKey);
  if (cached) {
    return cached;
  }

  // L3: 从数据库查询
  const content = await db.query.careerContents.findFirst({
    where: eq(careerContents.id, id),
  });

  if (content) {
    // 写入两级缓存
    await setCache(cacheKey, 'detail', content, CACHE_CONFIG.TTL.detail);
  }

  return content || null;
}

// 获取内容流（带缓存）- 用于实时更新
export async function getContentFeed(
  lastId?: number,
  limit: number = 10
): Promise<CareerContent[]> {
  const { start: yearStart, end: yearEnd } = getUtcYearRange();
  const cacheKey = generateCacheKey('feed', {
    lastId: lastId || 'latest',
    limit,
    year: yearStart.getUTCFullYear(),
  });

  // 尝试从多级缓存获取
  const cached = await getCache<CareerContent[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // L3: 从数据库查询
  let contents: CareerContent[];

  if (lastId) {
    const lastContent = await db.query.careerContents.findFirst({
      where: eq(careerContents.id, lastId),
    });

    if (lastContent) {
      contents = await db.query.careerContents.findMany({
        where: and(
          eq(careerContents.status, 'active'),
          notLike(careerContents.originalUrl, '%example.com/%'),
          notLike(careerContents.originalUrl, '%rsshub.app/%'),
          notLike(careerContents.originalUrl, '%localhost%'),
          notLike(careerContents.originalUrl, '%127.0.0.1%'),
          gte(careerContents.publishedAt, yearStart),
          lt(careerContents.publishedAt, yearEnd),
          lt(careerContents.publishedAt, lastContent.publishedAt)
        ),
        orderBy: [desc(careerContents.publishedAt)],
        limit,
      });
    } else {
      contents = [];
    }
  } else {
    contents = await db.query.careerContents.findMany({
      where: and(
        eq(careerContents.status, 'active'),
        notLike(careerContents.originalUrl, '%example.com/%'),
        notLike(careerContents.originalUrl, '%rsshub.app/%'),
        notLike(careerContents.originalUrl, '%localhost%'),
        notLike(careerContents.originalUrl, '%127.0.0.1%'),
        gte(careerContents.publishedAt, yearStart),
        lt(careerContents.publishedAt, yearEnd)
      ),
      orderBy: [desc(careerContents.publishedAt)],
      limit,
    });
  }

  // 写入两级缓存
  await setCache(cacheKey, 'feed', contents, CACHE_CONFIG.TTL.feed);

  return contents;
}

// 获取统计数据（带缓存）
export interface ContentStats {
  totalContents: number;
  totalByCategory: Record<string, number>;
  totalByPlatform: Record<string, number>;
  latestPublishedAt: Date | null;
  version: string;
}

export async function getContentStats(): Promise<ContentStats> {
  const { start: yearStart, end: yearEnd } = getUtcYearRange();
  const cacheKey = `career:stats:${yearStart.getUTCFullYear()}`;

  // 尝试从多级缓存获取
  const cached = await getCache<ContentStats>(cacheKey);
  if (cached) {
    return cached;
  }

  // L3: 从数据库查询
  const allContents = await db.query.careerContents.findMany({
    where: and(
      eq(careerContents.status, 'active'),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%'),
      gte(careerContents.publishedAt, yearStart),
      lt(careerContents.publishedAt, yearEnd)
    ),
  });

  const totalContents = allContents.length;

  // 按分类统计
  const totalByCategory: Record<string, number> = {};
  for (const content of allContents) {
    totalByCategory[content.category] = (totalByCategory[content.category] || 0) + 1;
  }

  // 按平台统计
  const totalByPlatform: Record<string, number> = {};
  for (const content of allContents) {
    totalByPlatform[content.platform] = (totalByPlatform[content.platform] || 0) + 1;
  }

  // 最新发布时间
  const latestContent = await db.query.careerContents.findFirst({
    where: and(
      eq(careerContents.status, 'active'),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%'),
      gte(careerContents.publishedAt, yearStart),
      lt(careerContents.publishedAt, yearEnd)
    ),
    orderBy: [desc(careerContents.publishedAt)],
  });

  const stats: ContentStats = {
    totalContents,
    totalByCategory,
    totalByPlatform,
    latestPublishedAt: latestContent?.publishedAt || null,
    version: `${totalContents}-${latestContent?.id || 0}-${latestContent?.publishedAt?.getTime() || 0}`,
  };

  // 写入两级缓存
  await setCache(cacheKey, 'stats', stats, CACHE_CONFIG.TTL.stats);

  return stats;
}
