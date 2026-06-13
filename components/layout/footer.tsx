'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, User, Mail } from 'lucide-react';
import { PmHubLogo } from '@/components/brand/pm-hub-logo';

export function Footer() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <PmHubLogo className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">PM Hub</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm">
                汇聚专业资讯、职业发展、题库训练、实用工具等多种功能，助力产品人持续成长
              </p>
              <button
                onClick={() => setShowAbout(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors mt-4 cursor-pointer"
              >
                关于我们
              </button>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-3">
                <Link href="/articles" className="hover:text-primary transition-colors">专业资讯</Link>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/articles?category=product-management" className="hover:text-primary">产品经理</Link>
                </li>
                <li>
                  <Link href="/articles?category=tech" className="hover:text-primary">科技动态</Link>
                </li>
                <li>
                  <Link href="/articles?category=ai" className="hover:text-primary">人工智能</Link>
                </li>
                <li>
                  <Link href="/articles?category=finance" className="hover:text-primary">金融市场</Link>
                </li>
              </ul>
            </div>

            {/* Career Links */}
            <div>
              <h3 className="font-semibold mb-3">
                <Link href="/career" className="hover:text-primary transition-colors">职业发展</Link>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/career?category=communication" className="hover:text-primary">职场沟通</Link>
                </li>
                <li>
                  <Link href="/career?category=productivity" className="hover:text-primary">高效工作</Link>
                </li>
                <li>
                  <Link href="/career?category=teamwork" className="hover:text-primary">团队协作</Link>
                </li>
                <li>
                  <Link href="/career?category=leadership" className="hover:text-primary">领导力</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">
                <Link href="/training" className="hover:text-primary transition-colors">题库训练</Link>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/training/product-thinking" className="hover:text-primary">产品思维训练</Link>
                </li>
                <li>
                  <Link href="/training/programming" className="hover:text-primary">编程知识训练</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">
                <Link href="/tools" className="hover:text-primary transition-colors">实用工具</Link>
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/tools/prd" className="hover:text-primary">PRD 生成</Link>
                </li>
                <li>
                  <Link href="/tools/prototype" className="hover:text-primary">原型生成</Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PM Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 关于我们弹窗 */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl border p-8 max-w-sm w-full mx-4 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <PmHubLogo className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">PM Hub</h2>
              <p className="text-sm text-muted-foreground mt-1">产品经理专业资讯平台</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">制作者</p>
                  <p className="text-sm font-medium">多情龙井</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">联系方式</p>
                  <a
                    href="mailto:simmons.yzoom@gmail.com"
                    className="text-sm font-medium text-primary hover:underline break-all"
                  >
                    simmons.yzoom@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
