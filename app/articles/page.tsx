import { Suspense } from 'react';
import { ArticleList } from '@/components/articles/article-list';
import { Pagination } from '@/components/articles/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db/client';
import { articles, rssSourceStatus } from '@/lib/db/schema';
import { desc, sql, eq, and, gte, or, ne, inArray } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';
import Link from 'next/link';
import { TECH_THRESHOLD } from '@/lib/rss/tech-relevance';
import { FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { PM_THRESHOLD } from '@/lib/rss/pm-relevance';
import { Clock, Rss } from 'lucide-react';

export const revalidate = 0;

const ARTICLES_PER_PAGE = 10;

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

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

async function getArticles(page: number, category?: string) {
  const offset = (page - 1) * ARTICLES_PER_PAGE;
  
  const allowedCategories = Object.keys(categoryLabels);
  if (category && !allowedCategories.includes(category)) {
    return { articles: [], totalPages: 0, totalCount: 0, latestPublishedAt: null as Date | null, latestFetchedAt: null as Date | null };
  }

  const whereClause = category
    ? category === 'tech'
      ? and(eq(articles.category, category), gte(articles.relevanceScore, TECH_THRESHOLD))
      : category === 'finance'
        ? and(eq(articles.category, category), gte(articles.relevanceScore, FINANCE_THRESHOLD))
        : category === 'product-management'
          ? and(eq(articles.category, category), gte(articles.relevanceScore, PM_THRESHOLD))
          : eq(articles.category, category)
    : and(
        inArray(articles.category, allowedCategories),
        and(
          or(ne(articles.category, 'tech'), gte(articles.relevanceScore, TECH_THRESHOLD)),
          or(ne(articles.category, 'finance'), gte(articles.relevanceScore, FINANCE_THRESHOLD)),
          or(ne(articles.category, 'product-management'), gte(articles.relevanceScore, PM_THRESHOLD))
        )
      );

  // 先按标题去重：对每个title只保留一条记录（取最小id）
  // 使用规范化标题（去除空格差异）作为分组依据
  // 再按发布时间排序分页
  const dedupResults = await db
    .select({
      id: sql<number>`MIN(${articles.id})`.as('id'),
    })
    .from(articles)
    .where(whereClause)
    .groupBy(sql`REPLACE(${articles.title}, ' ', '')`)
    .orderBy(desc(sql`MAX(${articles.publishedAt})`));

  const totalCount = dedupResults.length;
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  // 分页取 ID
  const paginatedIds = dedupResults.slice(offset, offset + ARTICLES_PER_PAGE).map((r) => r.id);

  // 根据 ID 获取完整文章数据
  const articlesList =
    paginatedIds.length > 0
      ? await db
          .select()
          .from(articles)
          .where(inArray(articles.id, paginatedIds))
          .orderBy(desc(articles.publishedAt))
      : [];

  const latestPublishedResult = await db
    .select({ latest: sql<Date | null>`max(${articles.publishedAt})` })
    .from(articles)
    .where(whereClause);

  const latestFetchResult = await db
    .select({ latest: sql<Date | null>`max(${rssSourceStatus.lastFetchAt})` })
    .from(rssSourceStatus);

  return {
    articles: articlesList,
    totalPages,
    totalCount,
    latestPublishedAt: normalizeTimestamp(latestPublishedResult[0]?.latest ?? null),
    latestFetchedAt: normalizeTimestamp(latestFetchResult[0]?.latest ?? null),
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const category = params.category;
  
  const { articles: articlesList, totalPages, totalCount, latestPublishedAt, latestFetchedAt } = await getArticles(
    currentPage,
    category
  );

  const filters = [
    { id: 'product-management', name: '产品经理' },
    { id: 'tech', name: '科技动态' },
    { id: 'ai', name: '人工智能' },
    { id: 'finance', name: '金融市场' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-no-repeat opacity-[0.55] saturate-[0.9] contrast-[1.08] brightness-[1.02]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1518770660439-4636190af475?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0)",
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
              专业资讯
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              探索产品、科技、AI、金融领域的最新资讯
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-primary" />
                {latestPublishedAt
                  ? `最新发布: ${latestPublishedAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                  : '暂无发布'}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm">
                <Rss className="h-4 w-4 text-primary" />
                {latestFetchedAt
                  ? `最近抓取: ${latestFetchedAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                  : '暂无更新'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Link
                href="/articles"
                className={`rounded-full border px-4 py-1.5 text-base transition-colors ${
                  !category
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                全部
              </Link>
              {filters.map((f) => (
                <Link
                  key={f.id}
                  href={`/articles?${new URLSearchParams({ category: f.id }).toString()}`}
                  className={`rounded-full border px-4 py-1.5 text-base transition-colors ${
                    category === f.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.name}
                </Link>
              ))}
          </div>
            <p className="text-muted-foreground">共收录 {totalCount} 篇文章</p>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          }>
            <ArticleList articles={articlesList} />
          </Suspense>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={category ? `/articles?category=${category}` : '/articles'}
            />
          )}
        </div>
      </section>
    </div>
  );
}
