'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { Article } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  const performSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      setArticles(data.hits || []);
      setTotal(data.totalHits || 0);
    } catch (error) {
      console.error('Search failed:', error);
      setArticles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      // 更新URL
      const url = new URL(window.location.href);
      url.searchParams.set('q', query.trim());
      window.history.pushState({}, '', url);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold mb-6">搜索文章</h1>
          
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="输入关键词搜索..."
              className="w-full pl-10 pr-24 py-6 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={isLoading}
            >
              {isLoading ? '搜索中...' : '搜索'}
            </Button>
          </form>
        </div>

        {/* Results */}
        {searchQuery && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 text-sm text-muted-foreground">
              {isLoading ? '搜索中...' : `找到 ${total} 个结果`}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <SearchResultCard key={article.id} article={article} />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">未找到相关文章</p>
                <p className="text-sm text-muted-foreground mt-2">
                  尝试使用其他关键词搜索
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ article }: { article: Article }) {
  const categoryLabel = categoryLabels[article.category]?.name || article.category;

  return (
    <Link
      href={`/articles/${article.slug || article.id}`}
      className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all"
    >
      {article.imageUrl && (
        <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
            {categoryLabel}
          </span>
          <span className="text-xs text-muted-foreground">{article.sourceName}</span>
        </div>
        
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {article.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {article.summary}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time>{formatDate(article.publishedAt)}</time>
          {article.author && (
            <>
              <span>·</span>
              <span>{article.author}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-12 w-full mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
