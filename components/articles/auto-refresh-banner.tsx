'use client';

import { useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAutoRefresh } from '@/lib/hooks/use-auto-refresh';

interface AutoRefreshBannerProps {
  /** 检查间隔（毫秒），默认 60000 (1分钟) */
  checkInterval?: number;
  /** 是否启用自动检查 */
  enabled?: boolean;
}

export function AutoRefreshBanner({ checkInterval = 60000, enabled = true }: AutoRefreshBannerProps) {
  const {
    hasNewContent,
    isChecking,
    error,
    refresh,
    clearNewContentFlag,
  } = useAutoRefresh({
    checkInterval,
    enabled,
    minRefreshInterval: 30000,
    maxRetries: 3,
    onlyWhenVisible: true,
  });

  // 如果有新内容，自动显示提示
  useEffect(() => {
    if (hasNewContent) {
      // 可以在这里添加通知提示
      console.log('检测到新文章，点击刷新按钮查看');
    }
  }, [hasNewContent]);

  // 不显示任何内容时返回 null
  if (!hasNewContent && !error) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="mx-4 my-2 pointer-events-auto animate-in slide-in-from-top duration-300">
        {hasNewContent && (
          <div className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
            <span className="text-sm font-medium">有新文章发布</span>
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
