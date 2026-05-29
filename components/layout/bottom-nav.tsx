'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Briefcase, BookOpen, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/articles', label: '资讯', icon: Newspaper },
  { href: '/career', label: '职业', icon: Briefcase },
  { href: '/training', label: '题库', icon: BookOpen },
  { href: '/tools', label: '工具', icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(tabHref: string) {
    if (tabHref === '/') return pathname === '/';
    return pathname.startsWith(tabHref);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
