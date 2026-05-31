'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={getPageUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一页
          </Link>
        ) : (
          <>
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一页
          </>
        )}
      </Button>

      {start > 1 && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={getPageUrl(1)}>1</Link>
          </Button>
          {start > 2 && <span className="px-2">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          asChild={page !== currentPage}
          className={cn(page === currentPage && 'pointer-events-none')}
        >
          {page !== currentPage ? (
            <Link href={getPageUrl(page)}>{page}</Link>
          ) : (
            page
          )}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2">...</span>}
          <Button variant="outline" size="sm" asChild>
            <Link href={getPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={getPageUrl(currentPage + 1)}>
            下一页
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        ) : (
          <>
            下一页
            <ChevronRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
}
