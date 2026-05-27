'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const getPageUrl = (page: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  const pages: number[] = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {canPrev ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </Link>
      ) : (
        <span className="inline-flex h-8 cursor-not-allowed items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs opacity-50">
          <ChevronLeft className="h-4 w-4" />
          上一页
        </span>
      )}

      {start > 1 && (
        <>
          <Link
            href={getPageUrl(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
        </>
      )}

      {pages.map((page) =>
        page === currentPage ? (
          <span
            key={page}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={getPageUrl(page)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {page}
          </Link>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
          <Link
            href={getPageUrl(totalPages)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {totalPages}
          </Link>
        </>
      )}

      {canNext ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          下一页
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-8 cursor-not-allowed items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-background px-3 text-xs opacity-50">
          下一页
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

