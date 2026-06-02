import Image from 'next/image';
import Link from 'next/link';
import { Lightbulb, Cpu, LineChart, Bot, Newspaper, Code2, FileText, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { and, desc, eq, gte, lt, notLike, sql } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';
import { resourceCategories } from '@/config/resource-categories';
import { getArticleDefaultCover, getCareerDefaultCover } from '@/config/default-covers';
import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { PM_THRESHOLD } from '@/lib/rss/pm-relevance';
import { TECH_THRESHOLD } from '@/lib/rss/tech-relevance';

export const revalidate = 60; // 1分钟ISR

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const todayArticleCategories = ['product-management', 'tech', 'ai', 'finance'] as const;

type TodayPick = {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  kind: 'article' | 'career';
};

function getBeijingTodayRange(now = new Date()) {
  const beijingDate = new Date(now.getTime() + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
  const start = new Date(`${beijingDate}T00:00:00+08:00`);
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
}

function getArticleCategoryThreshold(category: string) {
  if (category === 'product-management') return PM_THRESHOLD;
  if (category === 'tech') return TECH_THRESHOLD;
  if (category === 'finance') return FINANCE_THRESHOLD;
  return null;
}

async function getTodayPicks(): Promise<TodayPick[]> {
  const { start, end } = getBeijingTodayRange();

  try {
    const articlePromises = todayArticleCategories.map(async (category) => {
      const threshold = getArticleCategoryThreshold(category);
      const conditions = [
        eq(articles.category, category),
        gte(articles.publishedAt, start),
        lt(articles.publishedAt, end),
      ];

      if (threshold !== null) {
        conditions.push(gte(articles.relevanceScore, threshold));
      }

      const rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          href: articles.originalUrl,
          imageUrl: articles.imageUrl,
        })
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.relevanceScore), desc(articles.publishedAt), desc(articles.id))
        .limit(1);

      const item = rows[0];
      return item ? ({
        id: item.id,
        title: item.title,
        href: item.href,
        imageUrl: item.imageUrl || getArticleDefaultCover(category, `${item.id}-${item.title}`),
        kind: 'article' as const,
      }) : null;
    });

    const careerPromise = db
      .select({
        id: careerContents.id,
        title: careerContents.title,
        href: careerContents.originalUrl,
        category: careerContents.category,
        coverImage: careerContents.coverImage,
        originalId: careerContents.originalId,
      })
      .from(careerContents)
      .where(and(
        eq(careerContents.status, 'active'),
        gte(careerContents.publishedAt, start),
        lt(careerContents.publishedAt, end),
        notLike(careerContents.originalUrl, '%example.com/%'),
        notLike(careerContents.originalUrl, '%rsshub.app/%'),
        notLike(careerContents.originalUrl, '%localhost%'),
        notLike(careerContents.originalUrl, '%127.0.0.1%')
      ))
      .orderBy(
        desc(sql`${careerContents.qualityScore} * 0.5 + ${careerContents.matchScore} * 0.5`),
        desc(careerContents.publishedAt),
        desc(careerContents.id)
      )
      .limit(1)
      .then((rows) => {
        const item = rows[0];
        return item ? ({
          id: item.id,
          title: item.title,
          href: item.href,
          imageUrl: item.coverImage || getCareerDefaultCover(
            item.category,
            item.originalId || item.href || item.title || String(item.id)
          ),
          kind: 'career' as const,
        }) : null;
      });

    const [articlePicks, careerPick] = await Promise.all([
      Promise.all(articlePromises),
      careerPromise,
    ]);

    const picks: Array<TodayPick | null> = [...articlePicks, careerPick];
    return picks.filter(
      (item): item is TodayPick => item !== null
    );
  } catch (error) {
    console.error('Failed to load today picks:', error);
    return [];
  }
}

// 分类图标和颜色配置
const categoryConfig: Record<string, { icon: React.ElementType; color: string; gradient: string; iconBg: string }> = {
  'product-management': {
    icon: LayoutGrid,
    color: 'text-amber-600',
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'bg-amber-500/10',
  },
  'tech': {
    icon: Cpu,
    color: 'text-blue-600',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    iconBg: 'bg-blue-500/10',
  },
  'ai': {
    icon: Bot,
    color: 'text-purple-600',
    gradient: 'from-purple-500/10 to-pink-500/5',
    iconBg: 'bg-purple-500/10',
  },
  'finance': {
    icon: LineChart,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    iconBg: 'bg-emerald-500/10',
  },
};

export default async function HomePage() {
  const todayPicks = await getTodayPicks();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/3 py-10 lg:py-16">
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 to-transparent rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Newspaper className="h-4 w-4" />
              <span>每日精选优质内容</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              属于PM的
              <span className="text-primary">专业学习平台</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed [text-wrap:balance]">
              汇聚专业资讯、职业发展、题库训练、PRD生成等多种功能，助力产品人持续成长
            </p>
          </div>
        </div>
      </section>

      {/* Content & Picks Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-muted/20 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="space-y-10 sm:space-y-12">
              <div>
                <div className="flex items-center justify-between mb-5 sm:mb-6 relative z-10">
                  <Link href="/articles" className="block group cursor-pointer">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">专业资讯</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">探索你感兴趣领域的最新内容</p>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  {Object.entries(categoryLabels).map(([key, { name, description }]) => {
                    const config = categoryConfig[key] || {
                      icon: Newspaper,
                      color: 'text-gray-600',
                      gradient: 'from-gray-500/10 to-gray-500/5',
                      iconBg: 'bg-gray-500/10',
                    };
                    const Icon = config.icon;

                    return (
                      <Link
                        key={key}
                        href={`/articles?${new URLSearchParams({ category: key }).toString()}`}
                        className="group relative overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                        <div className="relative p-4 sm:p-5 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${config.iconBg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.color}`} />
                          </div>
                          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                            {name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground flex-1">{description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6 relative z-10 gap-4 sm:gap-0">
                  <a href="/career" className="block group cursor-pointer">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">职业发展</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">系统整合职场发展内容，助力你的职业成长</p>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  {resourceCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/career?category=${cat.id}`}
                      className="group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                      <div className="relative p-4 sm:p-5 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full flex flex-col">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${cat.iconBg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <cat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${cat.color}`} />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground flex-1">{cat.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:self-start">
              <div className="rounded-2xl border bg-card/80 p-5 sm:p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-xl font-bold">每日精选</h2>
                </div>

                {todayPicks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {todayPicks.map((item, index) => (
                      <a
                        key={`${item.kind}-${item.id}`}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-[88px] items-center gap-3 rounded-xl border bg-background/70 p-3 text-sm font-medium leading-6 text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="line-clamp-2 min-w-0 flex-1">{item.title}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center text-sm text-muted-foreground">
                    今日暂无精选
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Training & Tools Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 relative z-10 gap-4">
                <Link href="/training" className="block group cursor-pointer">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">题库训练</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">用结构化题库与 AI 评分报告提升产品拆解能力</p>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                <Link href="/training/product-thinking" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-primary transition-colors">产品思维训练</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                      多行业产品案例拆解题，练习用户价值、商业逻辑与功能设计。
                    </p>
                  </div>
                </Link>
                <Link href="/training/programming" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 h-full flex flex-col">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-emerald-600 transition-colors">编程知识训练</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                      前端、后端、数据库三大领域选择题库，即时反馈与解析，巩固技术基础。
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 relative z-10 gap-4">
                <Link href="/tools" className="block group cursor-pointer">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">实用工具</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">把常见产品工作流沉淀成可直接使用的工具</p>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                <Link href="/tools/prd" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-sky-200 transition-all duration-300 h-full flex flex-col">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-sky-600 transition-colors">PRD 生成</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                      输入需求背景与功能点，AI 自动生成结构化产品需求文档。
                    </p>
                  </div>
                </Link>
                <Link href="/tools/prototype" className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300 h-full flex flex-col">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-violet-600 transition-colors">原型生成</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">
                      上传界面截图并描述修改需求，AI 生成编辑后的原型图。
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
