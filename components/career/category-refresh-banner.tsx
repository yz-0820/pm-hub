'use client';

import { useCareerCategoryRefresh } from '@/lib/hooks/use-career-category-refresh';
import { RefreshCw, X, Sparkles, WifiOff, AlertCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface CategoryRefreshBannerProps {
  category: string;
  checkInterval?: number;
}

export function CategoryRefreshBanner({ category, checkInterval = 60000 }: CategoryRefreshBannerProps) {
  const {
    hasNewContent,
    isChecking,
    newContentCount,
    error,
    networkStatus,
    refresh,
    clearNewContentFlag,
    retry,
  } = useCareerCategoryRefresh({
    category,
    checkInterval,
    enabled: true,
  });

  const [isDismissed, setIsDismissed] = useState(false);
  const isVisible = hasNewContent && !isDismissed;

  const handleDismiss = () => {
    setIsDismissed(true);
    clearNewContentFlag();
  };

  const handleRefresh = () => {
    refresh();
  };

  // 网络断开状态
  if (networkStatus === 'offline') {
    return (
      <div className="fixed top-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
        <div className="animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
              <WifiOff className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-900">网络已断开</p>
              <p className="text-xs text-orange-600 truncate">请检查网络连接后重试</p>
            </div>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
            >
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error && !hasNewContent) {
    return (
      <div className="fixed top-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
        <div className="animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">更新检查失败</p>
              <p className="text-xs text-red-600 truncate">{error}</p>
            </div>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 新内容提示
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <div className="animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              发现新内容
              {newContentCount > 0 && (
                <span className="ml-1 text-primary">({newContentCount}条)</span>
              )}
            </p>
            <p className="text-xs text-gray-500 truncate">
              点击刷新查看最新职业发展内容
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isChecking}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              刷新
            </button>

            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
