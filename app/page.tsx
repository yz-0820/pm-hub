import Image from 'next/image';
import Link from 'next/link';
import { Lightbulb, Cpu, LineChart, Bot, Newspaper, Code2, FileText, Image as ImageIcon, LayoutGrid, Sparkles, Briefcase, BookOpen, Wrench } from 'lucide-react';
import { and, desc, eq, gte, lt, notLike, sql, inArray } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';
import { resourceCategories } from '@/config/resource-categories';
import { getArticleDefaultCover, getCareerDefaultCover, isDefaultCoverImage } from '@/config/default-covers';
import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { PM_THRESHOLD } from '@/lib/rss/pm-relevance';
import { TECH_THRESHOLD } from '@/lib/rss/tech-relevance';
import { ArticleCarousel } from '@/components/ui/article-carousel';
import { HotEvents } from '@/components/ui/hot-events';

export const revalidate = 60; // 1分钟ISR

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const todayArticleCategories = ['product-management', 'tech', 'ai', 'finance'] as const;

type TodayPick = {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  score: number;
  kind: 'article' | 'career';
};

function getBeijingTodayRange(now = new Date()) {
  const beijingDate = new Date(now.getTime() + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
  const start = new Date(`${beijingDate}T00:00:00+08:00`);
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end, beijingDate };
}

function getStableHash(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getStableDailyRank(pick: TodayPick, beijingDate: string) {
  return getStableHash(`${beijingDate}:${pick.kind}:${pick.id}`);
}

function getStableIndex(seed: string, size: number) {
  if (size <= 1) return 0;
  return getStableHash(seed) % size;
}

function getArticleCategoryThreshold(category: string) {
  if (category === 'product-management') return PM_THRESHOLD;
  if (category === 'tech') return TECH_THRESHOLD;
  if (category === 'finance') return FINANCE_THRESHOLD;
  return null;
}

function resolveArticleCover(category: string, seed: string, imageUrl?: string | null) {
  return imageUrl && !isDefaultCoverImage(imageUrl)
    ? imageUrl
    : getArticleDefaultCover(category, seed);
}

function resolveCareerCover(category: string, seed: string, imageUrl?: string | null) {
  return imageUrl && !isDefaultCoverImage(imageUrl)
    ? imageUrl
    : getCareerDefaultCover(category, seed);
}

async function getTodayPicks(): Promise<TodayPick[]> {
  const { start, end, beijingDate } = getBeijingTodayRange();

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
          score: articles.relevanceScore,
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
        imageUrl: resolveArticleCover(category, `${item.id}-${item.title}`, item.imageUrl),
        score: item.score,
        kind: 'article' as const,
      }) : null;
    });

    const careerScore = sql<number>`${careerContents.qualityScore} * 0.5 + ${careerContents.matchScore} * 0.5`;
    const careerPromise = db
      .select({
        id: careerContents.id,
        title: careerContents.title,
        href: careerContents.originalUrl,
        category: careerContents.category,
        coverImage: careerContents.coverImage,
        originalId: careerContents.originalId,
        score: careerScore,
      })
      .from(careerContents)
      .where(and(
        eq(careerContents.status, 'active'),
        gte(careerScore, 80),
        notLike(careerContents.originalUrl, '%example.com/%'),
        notLike(careerContents.originalUrl, '%rsshub.app/%'),
        notLike(careerContents.originalUrl, '%localhost%'),
        notLike(careerContents.originalUrl, '%127.0.0.1%')
      ))
      .orderBy(
        desc(careerScore),
        desc(careerContents.publishedAt),
        desc(careerContents.id)
      )
      .then((rows) => {
        const item = rows[getStableIndex(`${beijingDate}:career`, rows.length)];
        return item ? ({
          id: item.id,
          title: item.title,
          href: item.href,
          imageUrl: resolveCareerCover(
            item.category,
            item.originalId || item.href || item.title || String(item.id),
            item.coverImage
          ),
          score: item.score,
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
    ).sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      const rankDiff = getStableDailyRank(a, beijingDate) - getStableDailyRank(b, beijingDate);
      if (rankDiff !== 0) return rankDiff;

      return b.id - a.id;
    });
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

async function getLatestArticlesForCarousel(limit: number = 5) {
  const articleCategories = ['product-management', 'tech', 'ai', 'finance'];
  
  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      originalUrl: articles.originalUrl,
      category: articles.category,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(inArray(articles.category, articleCategories))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.originalUrl, // 使用外部链接
    imageUrl: resolveArticleCover(item.category, `${item.id}-${item.title}`, item.imageUrl),
    category: item.category,
  }));
}

async function getLatestCareerForCarousel(limit: number = 5) {
  // 从 careerContents 获取最新的职业发展内容（与 /career 页面一致）
  const results = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      originalUrl: careerContents.originalUrl,
      category: careerContents.category,
      coverImage: careerContents.coverImage,
    })
    .from(careerContents)
    .where(eq(careerContents.status, 'active'))
    .orderBy(desc(careerContents.publishedAt))
    .limit(limit);

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.originalUrl, // 使用外部链接
    imageUrl: resolveCareerCover(item.category, `${item.id}-${item.title}`, item.coverImage),
  }));
}

async function getHotEvents(limit: number = 5) {
  // 严格只保留知名公司新闻 - 扩大查询范围到30天确保有足够结果
  const keywords = ['发布会', '大会', '峰会', '论坛', '财报', '营收', '季报', '年报',
    '上线', '发布', '推出', '开测', '公测', '融资', '收购', '并购', 
    'IPO', '上市', '监管', '政策', '法规', '禁令', '批准'];
  
  // 知名公司/品牌列表
  const companies = ['苹果', 'Apple', '谷歌', 'Google', '微软', 'Microsoft', '亚马逊', 'Amazon',
    'Meta', 'Facebook', '特斯拉', 'Tesla', '英伟达', 'NVIDIA', 'AMD', '英特尔', 'Intel',
    'OpenAI', 'ChatGPT', '字节跳动', '抖音', 'TikTok', '腾讯', '微信', 'QQ', '阿里巴巴', '淘宝', '天猫',
    '百度', '美团', '滴滴', '小米', '华为', 'OPPO', 'vivo', '京东', '拼多多', '网易',
    '快手', 'B站', '哔哩哔哩', '知乎', '小红书', '微博', '携程', '饿了么',
    'Salesforce', 'Oracle', 'IBM', 'SAP', 'Adobe', 'Zoom', 'Slack', 'Shopify',
    'Netflix', 'Spotify', 'Uber', 'Airbnb', 'PayPal', 'Stripe', 'Square'];
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const articleCategories = ['product-management', 'tech', 'ai', 'finance'];
  
  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      originalUrl: articles.originalUrl,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        gte(articles.publishedAt, thirtyDaysAgo),
        inArray(articles.category, articleCategories),
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(200);

  // 关键词过滤
  const filtered = results.filter(item => 
    keywords.some(kw => item.title.includes(kw))
  );

  // 严格知名公司过滤 - 只保留包含知名公司的文章
  const companyFiltered = filtered.filter(item =>
    companies.some(company => item.title.includes(company))
  );

  // 去重（完全相同的标题）
  const seen = new Set<string>();
  const unique = companyFiltered.filter(item => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  return unique.slice(0, limit).map((item) => ({
    id: item.id,
    title: item.title,
    href: item.originalUrl,
    publishedAt: item.publishedAt,
  }));
}

export default async function HomePage() {
  const [todayPicks, latestArticles, latestCareer, hotEvents] = await Promise.all([
    getTodayPicks(),
    getLatestArticlesForCarousel(5),
    getLatestCareerForCarousel(5),
    getHotEvents(5),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/3 py-3 lg:py-4">
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 to-transparent rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              属于PM的
              <span className="text-primary">专业学习平台</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed [text-wrap:balance]">
              汇聚专业资讯、职业发展、题库训练、PRD生成等多种功能，助力产品人持续成长
            </p>
          </div>
        </div>
      </section>

      {/* Content & Picks Section */}
      <section className="py-6 sm:py-10 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-muted/20 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="flex flex-col gap-6">
              <div className="rounded-[28px] border bg-card/35 p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
                  <Link href="/articles" className="block group cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                      <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">专业资讯</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">探索你感兴趣领域的最新内容</p>
                  </Link>
                  <Link
                    href="/articles"
                    className="shrink-0 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    查看全部
                  </Link>
                </div>

                <ArticleCarousel items={latestArticles} autoplayDelay={3500} />

                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(categoryLabels).map(([key, { name }]) => {
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
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px]`} />
                        <div className="relative flex min-h-[88px] flex-col items-center justify-center rounded-[28px] p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:min-h-[96px] sm:p-3">
                          <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${config.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <h3 className="text-base font-normal leading-tight tracking-normal sm:text-lg group-hover:text-primary transition-colors">
                            {name}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border bg-card/35 p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
                  <a href="/career" className="block group cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                      <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-blue-600 transition-colors">职业发展</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">系统整合职场发展内容，助力你的职业成长</p>
                  </a>
                  <Link
                    href="/career"
                    className="shrink-0 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-blue-600"
                  >
                    查看全部
                  </Link>
                </div>

                <ArticleCarousel items={latestCareer} autoplayDelay={3500} />

                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {resourceCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/career?category=${cat.id}`}
                      className="group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px]`} />
                      <div className="relative flex min-h-[88px] flex-col items-center justify-center rounded-[28px] p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:min-h-[96px] sm:p-3">
                        <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${cat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                          <cat.icon className={`h-5 w-5 ${cat.color}`} />
                        </div>
                        <h3 className="text-base font-normal leading-tight tracking-normal sm:text-lg group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <aside className="flex flex-col lg:h-full">
              <div className="flex flex-col rounded-[28px] border bg-card/45 p-5 backdrop-blur-sm sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold sm:text-2xl">每日精选</h2>
                </div>

                {todayPicks.length > 0 ? (
                  <div className="flex flex-1 flex-col gap-3">
                    {todayPicks.map((item, index) => (
                      <a
                        key={`${item.kind}-${item.id}`}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-[92px] items-center gap-4 rounded-2xl p-2.5 text-sm font-normal leading-6 text-foreground transition-colors hover:bg-primary/5 hover:text-primary sm:min-h-[104px] sm:text-base sm:leading-7"
                      >
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-32">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-sm font-bold text-primary shadow-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="line-clamp-2 min-w-0 flex-1">{item.title}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-background/50 px-4 py-10 text-center text-base text-muted-foreground">
                    今日暂无精选
                  </div>
                )}
              </div>
              
              <HotEvents events={hotEvents} />
            </aside>
          </div>
        </div>
      </section>

      {/* Training & Tools Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* 题库训练模块 */}
          <div className="mb-10">
            <Link href="/training" className="block group cursor-pointer mb-6">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">题库训练</h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">用结构化题库与 AI 评分报告提升产品拆解能力</p>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Link href="/training/product-thinking" className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative p-5 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-primary transition-colors">产品思维训练</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    多行业产品案例拆解题，练习用户价值、商业逻辑与功能设计。
                  </p>
                  <span className="text-sm font-medium text-primary group-hover:underline">开始训练 →</span>
                </div>
              </Link>
              <Link href="/training/programming" className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative p-5 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 h-full flex flex-col">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-emerald-600 transition-colors">编程知识训练</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    前端、后端、数据库三大领域选择题库，即时反馈与解析，巩固技术基础。
                  </p>
                  <span className="text-sm font-medium text-emerald-600 group-hover:underline">开始训练 →</span>
                </div>
              </Link>
            </div>
          </div>

          {/* 实用工具模块 */}
          <div>
            <Link href="/tools" className="block group cursor-pointer mb-6">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">实用工具</h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">把常见产品工作流沉淀成可直接使用的工具</p>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Link href="/tools/prd" className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative p-5 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-sky-200 transition-all duration-300 h-full flex flex-col">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-sky-600 transition-colors">PRD 生成</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    输入需求背景与功能点，AI 自动生成结构化产品需求文档。
                  </p>
                  <span className="text-sm font-medium text-sky-600 group-hover:underline">打开工具 →</span>
                </div>
              </Link>
              <Link href="/tools/prototype" className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative p-5 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300 h-full flex flex-col">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-violet-600 transition-colors">原型生成</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    上传界面截图并描述修改需求，AI 生成编辑后的原型图。
                  </p>
                  <span className="text-sm font-medium text-violet-600 group-hover:underline">打开工具 →</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
