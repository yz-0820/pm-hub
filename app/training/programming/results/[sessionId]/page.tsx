'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldResultsPage() {
  const router = useRouter();

  useEffect(() => {
    // 旧的结果页重定向到新的 /results/my
    router.push('/training/programming/results/my');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">正在跳转...</p>
      </div>
    </div>
  );
}
