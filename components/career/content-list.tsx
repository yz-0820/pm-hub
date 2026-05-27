/**
 * 职业发展内容列表组件
 * 支持单列布局和加载状态
 */

import { CareerContent } from '@/lib/db/schema';
import { ContentCard } from './content-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentListProps {
  contents: CareerContent[];
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  columns?: 1 | 2;
}

export function ContentList({
  contents,
  isLoading = false,
  variant = 'default',
  columns = 1,
}: ContentListProps) {
  // 加载状态 - 水平布局骨架屏
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Image skeleton */}
              <div className="relative w-full sm:w-64 md:w-72 shrink-0 aspect-[16/10]">
                <Skeleton className="absolute inset-0" />
              </div>
              {/* Content skeleton */}
              <div className="p-5 md:p-6 flex-1 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 空状态
  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-gray-50/50 py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">暂无内容</h3>
        <p className="mt-1 text-sm text-gray-500">该分类下暂时没有内容，请稍后再来查看</p>
      </div>
    );
  }

  // 特色布局（首条大图）
  if (variant === 'featured' && contents.length > 0) {
    const [featured, ...rest] = contents;
    return (
      <div className="space-y-6">
        {/* 特色内容 */}
        <ContentCard content={featured} variant="featured" />

        {/* 剩余内容 - 水平布局单列 */}
        {rest.length > 0 && (
          <div className="space-y-4">
            {rest.map((content) => (
              <ContentCard key={content.id} content={content} variant="default" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 默认单列布局 - 水平卡片
  return (
    <div className={`space-y-4 ${columns === 2 ? 'sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0' : ''}`}>
      {contents.map((content) => (
        <ContentCard key={content.id} content={content} variant={variant} />
      ))}
    </div>
  );
}
