import Link from 'next/link';
import { ArrowRight, TrendingUp, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleList } from '@/components/articles/article-list';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';

export const revalidate = 300; // 5分钟ISR

async function getHomeData() {
  // 获取精选文章
  const featuredArticles = await db.query.articles.findMany({
    where: (articles, { eq }) => eq(articles.isFeatured, true),
    orderBy: [desc(articles.publishedAt)],
    limit: 1,
  });

  // 获取最新文章
  const latestArticles = await db.query.articles.findMany({
    orderBy: [desc(articles.publishedAt)],
    limit: 7,
  });

  // 获取统计数据
  const stats = await db.select({
    total: sql<number>`count(*)`,
  }).from(articles);

  return {
    featured: featuredArticles[0] || null,
    latest: latestArticles,
    totalArticles: stats[0]?.total || 0,
  };
}

export default async function HomePage() {
  const { featured, latest, totalArticles } = await getHomeData();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              产品经理的
              <span className="text-primary">专业资讯平台</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              汇聚产品经理、人工智能、科技行业的高质量文章，每日自动更新，助力产品人持续成长。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/articles">
                  浏览文章
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/categories/product-management">
                  探索分类
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalArticles}+</div>
                <div className="text-sm text-muted-foreground">收录文章</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">每2小时</div>
                <div className="text-sm text-muted-foreground">自动更新</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">8+</div>
                <div className="text-sm text-muted-foreground">优质信源</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 text-center">内容分类</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryLabels).map(([key, { name, description }]) => (
              <Link
                key={key}
                href={`/categories/${key}`}
                className="group p-6 rounded-xl border bg-card hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {name}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">最新文章</h2>
            <Button variant="ghost" asChild>
              <Link href="/articles">
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ArticleList 
            articles={latest} 
            featuredId={featured?.id}
          />
        </div>
      </section>
    </div>
  );
}
