'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, ChevronDown, Briefcase, Home, Newspaper, BookOpen, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { href: '/tools/prototype', label: '原型绘制' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <PmHubLogo className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PM Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9"
            >
              <Home className="h-4 w-4" />
              <span className="leading-none">首页</span>
            </Link>

            {/* 专业资讯 - 下拉菜单 */}
            <div
              className="relative"
              onMouseEnter={() => setIsNewsDropdownOpen(true)}
              onMouseLeave={() => setIsNewsDropdownOpen(false)}
            >
              <Link
                href="/articles"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9"
              >
                <Newspaper className="h-4 w-4" />
                <span className="leading-none">专业资讯</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isNewsDropdownOpen && "rotate-180"
                )} />
              </Link>

              {/* 下拉面板 */}
              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                  isNewsDropdownOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1"
                )}
              >
                <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                  {subCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 职业发展 - 下拉菜单 */}
            <div
              className="relative"
              onMouseEnter={() => setIsCareerDropdownOpen(true)}
              onMouseLeave={() => setIsCareerDropdownOpen(false)}
            >
              <Link
                href="/career"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9"
              >
                <Briefcase className="h-4 w-4" />
                <span className="leading-none">职业发展</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isCareerDropdownOpen && "rotate-180"
                )} />
              </Link>

              {/* 下拉面板 */}
              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                  isCareerDropdownOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1"
                )}
              >
                <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                  {careerCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 题库训练 - 下拉菜单 */}
            <div
              className="relative"
              onMouseEnter={() => setIsTrainingDropdownOpen(true)}
              onMouseLeave={() => setIsTrainingDropdownOpen(false)}
            >
              <Link
                href="/training"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9"
              >
                <BookOpen className="h-4 w-4" />
                <span className="leading-none">题库训练</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isTrainingDropdownOpen && "rotate-180"
                )} />
              </Link>

              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                  isTrainingDropdownOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1"
                )}
              >
                <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                  {trainingModules.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsToolsDropdownOpen(true)}
              onMouseLeave={() => setIsToolsDropdownOpen(false)}
            >
              <Link
                href="/tools"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary h-9"
              >
                <Wrench className="h-4 w-4" />
                <span className="leading-none">实用工具</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isToolsDropdownOpen && "rotate-180"
                )} />
              </Link>

              <div
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                  isToolsDropdownOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-1"
                )}
              >
                <div className="w-48 rounded-xl border bg-popover p-2 shadow-lg">
                  {toolModules.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索"
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-4 space-y-4">
            <form onSubmit={handleSearch} className="px-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索"
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                href="/articles"
                className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                专业资讯
              </Link>
              {subCategories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pl-6 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/career"
                className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                职业发展
              </Link>
              {careerCategories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pl-6 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/training"
                className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                题库训练
              </Link>
              {trainingModules.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pl-6 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/tools"
                className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                实用工具
              </Link>
              {toolModules.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pl-6 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
