import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageLoader } from "@/components/ui/page-loader";

export const metadata: Metadata = {
  title: "PM Hub - 产品经理专业资讯平台",
  description: "汇聚产品经理、人工智能、科技行业的高质量文章，助力产品人成长。",
  keywords: ["产品经理", "PM", "人工智能", "科技动态", "产品设计"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background font-sans">
        <PageLoader />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
