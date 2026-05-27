'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/articles/pagination';
import { formatDate } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { resourceCategoryLabels } from '@/config/resource-categories';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';
import { simplifyArticleSourceName } from '@/lib/utils/source-name';

type SearchHit =
  | {
      kind: 'article';
      id: number;
      title: string;
      summary: string;
      category: string;
      sourceName: string;
      publishedAt: string;
      originalUrl: string;
      imageUrl: string | null;
    }
  | {
      kind: 'career';
      id: number;
      title: string;
      summary: string;
      category: string;
      sourceName: string;
      publishedAt: string;
      originalUrl: string;
      imageUrl: string | null;
      contentType: string;
    };

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    setQuery(q);
    setSearchQuery(q);
    setCurrentPage(page);
  }, [searchParams]);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, currentPage);
    } else {
      setHits([]);
      setTotal(0);
      setTotalPages(0);
    }
  }, [searchQuery, currentPage]);

  const performSearch = async (q: string, page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
      const data = await response.json();
      setHits(data.hits || []);
      setTotal(data.totalHits || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Search failed:', error);
      setHits([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const nextQuery = query.trim();
      setSearchQuery(nextQuery);
      setCurrentPage(1);
      const url = new URL(window.location.href);
      url.searchParams.set('q', nextQuery);
      url.searchParams.delete('page');
      window.history.pushState({}, '', url);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              type="search"
              placeholder="输入关键词搜索..."
              className="w-full pl-12 pr-32 py-8 text-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-8 text-lg"
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
            ) : hits.length > 0 ? (
              <>
                <div className="space-y-4">
                  {hits.map((hit) => (
                    <SearchResultCard key={`${hit.kind}-${hit.id}`} hit={hit} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl={`/search?${new URLSearchParams({ q: searchQuery }).toString()}`}
                  />
                )}
              </>
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

function SearchResultCard({ hit }: { hit: SearchHit }) {
  const isCareer = hit.kind === 'career';
  const categoryLabel = isCareer
    ? resourceCategoryLabels[hit.category]?.name || hit.category
    : categoryLabels[hit.category]?.name || hit.category;
  const proxiedImageUrl = getProxiedImageUrl(hit.imageUrl);
  const sourceName = simplifyArticleSourceName(hit.sourceName);
  const scopeLabel = isCareer ? '职业发展' : '专业资讯';

  return (
    <a
      href={hit.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all"
    >
      {proxiedImageUrl && (
        <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={proxiedImageUrl}
            alt={hit.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
            {scopeLabel} · {categoryLabel}
          </span>
          <span className="text-xs text-muted-foreground">{sourceName}</span>
          <span className="text-muted-foreground/40">·</span>
          <time className="text-xs text-muted-foreground">{formatDate(hit.publishedAt)}</time>
        </div>

        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {hit.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {hit.summary}
        </p>
      </div>
    </a>
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
