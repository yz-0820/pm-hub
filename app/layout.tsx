import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";

const SITE_URL = process.env.SITE_URL || 'https://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'PM Hub - 产品经理专业资讯平台',
    template: '%s | PM Hub',
  },
  description: '汇聚产品经理、人工智能、科技行业的高质量文章，助力产品人成长。',
  keywords: ['产品经理', 'PM', '人工智能', '科技动态', '产品设计', '职场发展'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'PM Hub',
    title: 'PM Hub - 产品经理专业资讯平台',
    description: '汇聚产品经理、人工智能、科技行业的高质量文章，助力产品人成长。',
  },
  twitter: {
    card: 'summary',
    title: 'PM Hub - 产品经理专业资讯平台',
    description: '汇聚产品经理、人工智能、科技行业的高质量文章，助力产品人成长。',
  },
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background font-sans">
        <Header />
        <main className="flex-1 pb-14 md:pb-0">{children}</main>
        <BottomNav />
        <Footer />
      </body>
    </html>
  );
}
