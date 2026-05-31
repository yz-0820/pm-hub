import { Suspense } from 'react';
import { ArticleList } from '@/components/articles/article-list';
import { Pagination } from '@/components/articles/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';

export const revalidate = 300;

const ARTICLES_PER_PAGE = 12;

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

async function getArticles(page: number, category?: string) {
  const offset = (page - 1) * ARTICLES_PER_PAGE;
  
  // 构建查询条件
  const whereClause = category 
    ? eq(articles.category, category)
    : undefined;

  // 获取文章列表
  const articlesList = await db.query.articles.findMany({
    where: whereClause,
    orderBy: [desc(articles.publishedAt)],
    limit: ARTICLES_PER_PAGE,
    offset,
  });

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(whereClause);

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  return {
    articles: articlesList,
    totalPages,
    totalCount,
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const category = params.category;
  
  const { articles: articlesList, totalPages, totalCount } = await getArticles(
    currentPage,
    category
  );

  const categoryName = category ? categoryLabels[category]?.name : null;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {categoryName ? `${categoryName}文章` : '全部文章'}
          </h1>
          <p className="text-muted-foreground">
            共收录 {totalCount} 篇文章
            {categoryName && (
              <span className="ml-2">
                · <a href="/articles" className="text-primary hover:underline">查看全部</a>
              </span>
            )}
          </p>
        </div>

        {/* Articles Grid */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        }>
          <ArticleList articles={articlesList} />
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={category ? `/articles?category=${category}` : '/articles'}
          />
        )}
      </div>
    </div>
  );
}
