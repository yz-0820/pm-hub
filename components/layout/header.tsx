'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, ChevronDown, Briefcase, Home, Newspaper, BookOpen, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PmHubLogo } from '@/components/brand/pm-hub-logo';

const subCategories = [
  { href: '/articles?category=product-management', label: '产品经理' },
  { href: '/articles?category=tech', label: '科技动态' },
  { href: '/articles?category=ai', label: '人工智能' },
  { href: '/articles?category=finance', label: '金融市场' },
];

const careerCategories = [
  { href: '/career?category=communication', label: '职场沟通' },
  { href: '/career?category=productivity', label: '高效工作' },
  { href: '/career?category=teamwork', label: '团队协作' },
  { href: '/career?category=leadership', label: '领导力' },
];

const trainingModules = [
  { href: '/training/product-thinking', label: '产品思维训练' },
  { href: '/training/programming', label: '编程知识训练' },
];

const toolModules = [
  { href: '/tools/prd', label: 'PRD 生成' },
  { href: '/tools/prototype', label: '原型生成' },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewsDropdownOpen, setIsNewsDropdownOpen] = useState(false);
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const [isTrainingDropdownOpen, setIsTrainingDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <PmHubLogo className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PM Hub</span>
            </Link>

            <nav className="flex items-center gap-6 lg:gap-8">
              <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9">
                <Home className="h-4 w-4" />
                <span className="leading-none">首页</span>
              </Link>

              <div className="relative" onMouseEnter={() => setIsNewsDropdownOpen(true)} onMouseLeave={() => setIsNewsDropdownOpen(false)}>
                <Link href="/articles" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9">
                  <Newspaper className="h-4 w-4" />
                  <span className="leading-none">专业资讯</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isNewsDropdownOpen && "rotate-180")} />
                </Link>
                <div className={cn("absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200", isNewsDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1")}>
                  <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                    {subCategories.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary">{item.label}</Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative" onMouseEnter={() => setIsCareerDropdownOpen(true)} onMouseLeave={() => setIsCareerDropdownOpen(false)}>
                <Link href="/career" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9">
                  <Briefcase className="h-4 w-4" />
                  <span className="leading-none">职业发展</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isCareerDropdownOpen && "rotate-180")} />
                </Link>
                <div className={cn("absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200", isCareerDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1")}>
                  <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                    {careerCategories.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary">{item.label}</Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative" onMouseEnter={() => setIsTrainingDropdownOpen(true)} onMouseLeave={() => setIsTrainingDropdownOpen(false)}>
                <Link href="/training" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9">
                  <BookOpen className="h-4 w-4" />
                  <span className="leading-none">题库训练</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isTrainingDropdownOpen && "rotate-180")} />
                </Link>
                <div className={cn("absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200", isTrainingDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1")}>
                  <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                    {trainingModules.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary">{item.label}</Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative" onMouseEnter={() => setIsToolsDropdownOpen(true)} onMouseLeave={() => setIsToolsDropdownOpen(false)}>
                <Link href="/tools" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9">
                  <Wrench className="h-4 w-4" />
                  <span className="leading-none">实用工具</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isToolsDropdownOpen && "rotate-180")} />
                </Link>
                <div className={cn("absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200", isToolsDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1")}>
                  <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                    {toolModules.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary">{item.label}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="搜索" className="w-64 pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Header - 仅 Logo，无菜单按钮 */}
      <header className="sticky top-0 z-40 w-full border-b bg-background md:hidden">
        <div className="flex h-12 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <PmHubLogo className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">PM Hub</span>
          </Link>
        </div>
      </header>
    </>
  );
}
