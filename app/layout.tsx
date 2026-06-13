import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { SITE_NAME, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_URL } from "@/lib/site-meta";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - 产品经理专业资讯平台`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 产品经理专业资讯平台`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} - 产品经理专业资讯平台`,
    description: SITE_DESCRIPTION,
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
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background font-sans">
        <Header />
        <main className="flex-1 pb-14 md:pb-0">{children}</main>
        <BottomNav />
        <Footer />
      </body>
    </html>
  );
}
