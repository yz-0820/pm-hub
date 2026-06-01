/**
 * 职业发展实时内容页面
 * 聚合多平台内容，支持自动刷新
 */

import { db } from '@/lib/db/client';
import { careerContents, contentSources as contentSourcesTable } from '@/lib/db/schema';
import { ContentList } from '@/components/career/content-list';
import { Pagination } from '@/components/ui/pagination';
import { resourceCategories } from '@/config/resource-categories';
import { 
  TrendingUp,
  Clock,
  Rss
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { and, desc, eq, gte, inArray, lt, notLike, or, sql, SQLWrapper } from 'drizzle-orm';

export const revalidate = 0;

const CONTENTS_PER_PAGE = 10;

function normalizeTimestamp(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // PostgreSQL 返回字符串格式的时间戳，如 "2026-05-29 10:27:41+00"
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const ms = n < 10_000_000_000 ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

interface CareerPageProps {
  searchParams: Promise<{
    category?: string;
    page?: string;
  }>;
}

async function getCareerData(
  category: string,
  page: number
) {
  const offset = (page - 1) * CONTENTS_PER_PAGE;
  const yearStart = new Date('2026-01-01T00:00:00.000Z');
  const yearEnd = new Date('2027-01-01T00:00:00.000Z');

  const conditions: SQLWrapper[] = [
    eq(careerContents.status, 'active'),
    notLike(careerContents.originalUrl, '%example.com/%'),
    notLike(careerContents.originalUrl, '%rsshub.app/%'),
    notLike(careerContents.originalUrl, '%localhost%'),
    notLike(careerContents.originalUrl, '%127.0.0.1%'),
    or(
      inArray(careerContents.contentType, ['video', 'short_video']),
      and(gte(careerContents.publishedAt, yearStart), lt(careerContents.publishedAt, yearEnd))
    )!,
  ];
  if (category !== 'all') conditions.push(eq(careerContents.category, category));

  const whereClause = and(...conditions);

  // 先获取所有符合条件的文章ID（按标题去重）
  const allContents = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      publishedAt: careerContents.publishedAt,
    })
    .from(careerContents)
    .where(whereClause)
    .orderBy(desc(careerContents.publishedAt));

  // 按标题去重（去除空格后比较）
  const seenTitles = new Set<string>();
  const uniqueIds: number[] = [];
  for (const content of allContents) {
    const normalizedTitle = content.title.replace(/\s/g, '');
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueIds.push(content.id);
    }
  }

  const totalCount = uniqueIds.length;
  const totalPages = Math.ceil(totalCount / CONTENTS_PER_PAGE);

  // 分页获取实际内容
  const paginatedIds = uniqueIds.slice(offset, offset + CONTENTS_PER_PAGE);
  
  let contents: typeof careerContents.$inferSelect[] = [];
  if (paginatedIds.length > 0) {
    contents = await db
      .select()
      .from(careerContents)
      .where(inArray(careerContents.id, paginatedIds))
      .orderBy(desc(careerContents.publishedAt));
  }

  const latestPublishedResult = await db
    .select({ latest: sql<Date | null>`max(${careerContents.publishedAt})` })
    .from(careerContents)
    .where(whereClause);

  const latestFetchResult = await db
    .select({ latest: sql<Date | null>`max(${contentSourcesTable.lastFetchAt})` })
    .from(contentSourcesTable);

  const stats = {
    totalContents: totalCount,
    latestPublishedAt: normalizeTimestamp(latestPublishedResult[0]?.latest ?? null),
    latestFetchedAt: normalizeTimestamp(latestFetchResult[0]?.latest ?? null),
  };

  return {
    contents,
    totalCount,
    totalPages,
    currentPage: page,
    stats,
  };
}

export default async function CareerPage({ searchParams }: CareerPageProps) {
  const params = await searchParams;
  const category = params.category || 'all';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const { 
    contents, 
    totalCount, 
    totalPages, 
    currentPage,
    stats 
  } = await getCareerData(category, page);

  const paginationBaseUrl =
    category === 'all'
      ? '/career'
      : `/career?${new URLSearchParams({ category }).toString()}`;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-no-repeat opacity-[0.55] saturate-[0.85] contrast-[1.08] brightness-[1.02]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1507679799987-c73779587ccf?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0)",
              backgroundPosition: 'center',
              backgroundSize: 'clamp(1000px, 120vw, 2200px) auto',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background/85" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,hsl(var(--background))_0%,transparent_62%)] opacity-80" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 top-40 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              职业发展
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              聚合多平台职场内容，获取最新的职业发展知识与技能分享
            </p>
            
            {/* 统计信息 */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-primary" />
                {stats.latestPublishedAt
                  ? `最新发布: ${new Date(stats.latestPublishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                  : '暂无发布'}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm">
                <Rss className="h-4 w-4 text-primary" />
                {stats.latestFetchedAt 
                  ? `最近抓取: ${new Date(stats.latestFetchedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                  : '暂无更新'
                }
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* 头部信息 */}
          <div className="mb-8">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link
                href="/career"
                className={`rounded-full border px-4 py-1.5 text-base transition-colors ${
                  category === 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                全部
              </Link>
              {resourceCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/career?${new URLSearchParams({ category: cat.id }).toString()}`}
                  className={`rounded-full border px-4 py-1.5 text-base transition-colors ${
                    category === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <p className="text-muted-foreground">共 {totalCount} 条内容</p>
          </div>

          {/* 内容列表 */}
          <Suspense fallback={<ContentList contents={[]} isLoading />}>
            <ContentList contents={contents} columns={1} />
          </Suspense>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={paginationBaseUrl}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
