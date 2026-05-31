import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleList } from '@/components/articles/article-list';
import { Pagination } from '@/components/articles/pagination';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';

export const revalidate = 300;

const ARTICLES_PER_PAGE = 12;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategoryData(category: string, page: number) {
  const categoryInfo = categoryLabels[category];
  
  if (!categoryInfo) {
    return null;
  }

  const offset = (page - 1) * ARTICLES_PER_PAGE;

  // 获取该分类的文章
  const articlesList = await db.query.articles.findMany({
    where: eq(articles.category, category),
    orderBy: [desc(articles.publishedAt)],
    limit: ARTICLES_PER_PAGE,
    offset,
  });

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.category, category));

  const totalCount = countResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  return {
    categoryInfo,
    articles: articlesList,
    totalPages,
    totalCount,
  };
}

export default async function CategoryPage({ 
  params, 
  searchParams 
}: CategoryPageProps) {
  const { category } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));

  const data = await getCategoryData(category, currentPage);

  if (!data) {
    notFound();
  }

  const { categoryInfo, articles: articlesList, totalPages, totalCount } = data;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">{categoryInfo.name}</h1>
          <p className="text-muted-foreground max-w-2xl">
            {categoryInfo.description}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            共 {totalCount} 篇文章
          </p>
        </div>

        {/* Articles */}
        <ArticleList articles={articlesList} />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/categories/${category}`}
          />
        )}
      </div>
    </div>
  );
}
