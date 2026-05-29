'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 页面加载指示器
 * 在页面刷新或导航时显示
 */
export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleLoad = () => setIsLoading(false);
    const handleBeforeUnload = () => setIsLoading(true);

    window.addEventListener('load', handleLoad);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 不可见时不阻挡点击
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在加载最新内容...</p>
      </div>
    </div>
  );
}
