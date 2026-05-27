'use client';

import { useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useCareerAutoRefresh } from '@/lib/hooks/use-career-auto-refresh';

interface CareerAutoRefreshBannerProps {
  /** 检查间隔（毫秒），默认 60000 (1分钟) */
  checkInterval?: number;
  /** 是否启用自动检查 */
  enabled?: boolean;
}

export function CareerAutoRefreshBanner({ checkInterval = 60000, enabled = true }: CareerAutoRefreshBannerProps) {
  const {
    hasNewContent,
    isChecking,
    error,
    refresh,
    clearNewContentFlag,
  } = useCareerAutoRefresh({
    checkInterval,
    enabled,
    minRefreshInterval: 30000,
    maxRetries: 3,
    onlyWhenVisible: true,
  });

  useEffect(() => {
    if (hasNewContent) {
      console.log('检测到新职业发展内容，点击刷新按钮查看');
    }
  }, [hasNewContent]);

  if (!hasNewContent && !error) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="mx-4 my-2 pointer-events-auto animate-in slide-in-from-top duration-300">
        {hasNewContent && (
          <div className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
            <span className="text-sm font-medium">有新内容发布</span>
            <button
              onClick={refresh}
              disabled={isChecking}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              刷新查看
            </button>
            <button
              onClick={clearNewContentFlag}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearNewContentFlag}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
