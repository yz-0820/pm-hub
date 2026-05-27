'use client';

import { Article } from '@/types';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleListProps {
  articles: Article[];
  isLoading?: boolean;
  featuredId?: number;
}

export function ArticleList({ articles, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl overflow-hidden border flex">
            <Skeleton className="aspect-[16/9] w-64 shrink-0" />
            <div className="p-5 space-y-3 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
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

  return (
    <div className="grid grid-cols-1 gap-5">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
