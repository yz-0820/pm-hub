'use client';

import { Article } from '@/types';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleListProps {
  articles: Article[];
  isLoading?: boolean;
  featuredId?: number;
}

export function ArticleList({ articles, isLoading, featuredId }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl overflow-hidden border">
            <Skeleton className="h-48 w-full" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无文章</p>
      </div>
    );
  }

  // 找到精选文章
  const featuredArticle = featuredId 
    ? articles.find(a => a.id === featuredId)
    : articles[0];
  
  const otherArticles = featuredArticle
    ? articles.filter(a => a.id !== featuredArticle.id)
    : articles;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredArticle && (
        <ArticleCard article={featuredArticle} variant="featured" />
      )}
      {otherArticles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
