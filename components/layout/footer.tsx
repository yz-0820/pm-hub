import Link from 'next/link';
import { Rss } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Rss className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">PM Hub</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              产品经理专业资讯聚合平台，汇聚产品经理、人工智能、科技行业的高质量文章，助力产品人成长。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3">导航</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">首页</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-primary">全部文章</Link>
              </li>
              <li>
                <Link href="/categories/product-management" className="hover:text-primary">产品经理</Link>
              </li>
              <li>
                <Link href="/categories/tech" className="hover:text-primary">科技资讯</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">关于</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary">关于我们</Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary">GitHub</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">Twitter</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PM Hub. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            自动聚合RSS资讯，仅供学习交流使用
          </p>
        </div>
      </div>
    </footer>
  );
}
