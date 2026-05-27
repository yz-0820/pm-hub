import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Eye, Calendar } from 'lucide-react';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatDateFull } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { stripHtml } from '@/lib/utils';
import { TECH_THRESHOLD } from '@/lib/rss/tech-relevance';
import { FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { simplifyArticleSourceName } from '@/lib/utils/source-name';

export const revalidate = 0;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  // 尝试通过slug查找
  let article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
  });

  // 如果没找到，尝试通过ID查找
  if (!article) {
    const id = parseInt(slug, 10);
    if (!isNaN(id)) {
      article = await db.query.articles.findFirst({
        where: eq(articles.id, id),
      });
    }
  }

  return article;
}

async function getRelatedArticles(category: string, currentId: number, limit: number = 3) {
  return db.query.articles.findMany({
    where: (articles, { eq, and, ne, gte }) => {
      const base = and(eq(articles.category, category), ne(articles.id, currentId));
      if (category === 'tech') {
        return and(base, gte(articles.relevanceScore, TECH_THRESHOLD));
      }
      if (category === 'finance') {
        return and(base, gte(articles.relevanceScore, FINANCE_THRESHOLD));
      }
      return base;
    },
    orderBy: [desc(articles.publishedAt)],
    limit,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.category, article.id);
  const categoryLabel = categoryLabels[article.category]?.name || article.category;
  const sourceName = simplifyArticleSourceName(article.sourceName);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                {categoryLabel}
              </span>
              <span className="text-sm text-muted-foreground">{sourceName}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.author && (
                <span>作者: {article.author}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateFull(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount} 阅读
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="relative h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <article className="prose prose-slate max-w-none mb-12">
            <div 
              className="text-lg leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </article>

          {/* Original Link */}
          <div className="flex items-center justify-between py-6 border-t">
            <p className="text-sm text-muted-foreground">
              文章来源: {article.sourceName}
            </p>
            <a 
              href={article.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md hover:bg-accent"
            >
              阅读原文
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-12 pt-8 border-t">
              <h2 className="text-xl font-bold mb-6">相关文章</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/articles/${related.slug || related.id}`}
                    className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {stripHtml(related.summary)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
