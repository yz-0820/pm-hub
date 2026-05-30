import Link from 'next/link';
import { ArrowRight, Lightbulb, Cpu, LineChart, Sparkles, Zap, Target, Briefcase, MessageSquare, Users, Crown, Newspaper, Code2, FileText, Image as ImageIcon, Wrench } from 'lucide-react';
import { db } from '@/lib/db/client';
import { articles, resources } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { categoryLabels } from '@/config/rss';
import { resourceCategories } from '@/config/resource-categories';

export const revalidate = 60; // 1分钟ISR

// 分类图标和颜色配置
const categoryConfig: Record<string, { icon: React.ElementType; color: string; gradient: string; iconBg: string }> = {
  'product-management': {
    icon: Lightbulb,
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
    icon: Sparkles,
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

async function getHomeData() {
  // 获取统计数据
  const stats = await db.select({
    total: sql<number>`cast(count(*) as int)`,
  }).from(articles);

  return {
    totalArticles: stats[0]?.total || 0,
  };
}

export default async function HomePage() {
  const { totalArticles } = await getHomeData();

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
              <Sparkles className="h-4 w-4" />
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

      {/* Categories Section */}
      <section className="py-20 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <Link href="/articles" className="block group cursor-pointer">
              <h2 className="text-3xl font-bold mb-2 group-hover:text-primary transition-colors">专业资讯</h2>
              <p className="text-muted-foreground">探索你感兴趣领域的最新内容</p>
            </Link>
            <Link
              href="/articles"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
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
                  <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col">
                    {/* 图标 */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${config.iconBg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.color}`} />
                    </div>
                    
                    {/* 标题 */}
                    <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    
                    {/* 描述 */}
                    <p className="text-xs sm:text-sm text-muted-foreground flex-1">{description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Career Resources Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 relative z-10 gap-4 sm:gap-0">
            <a href="/career" className="block group cursor-pointer">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">职业发展</h2>
              <p className="text-sm sm:text-base text-muted-foreground">系统整合职场发展内容，助力你的职业成长</p>
            </a>
            <Link
              href="/career"
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {resourceCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/career?category=${cat.id}`}
                className="group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="relative p-4 sm:p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full flex flex-col">
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
      </section>

      {/* Training Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 relative z-10 gap-4 sm:gap-0">
            <a href="/training" className="block group cursor-pointer">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">题库训练</h2>
              <p className="text-sm sm:text-base text-muted-foreground">用结构化题库与 AI 评分报告提升产品拆解能力</p>
            </a>
            <Link
              href="/training"
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  <span>开始训练</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
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
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-emerald-600 transition-colors">
                  <span>开始训练</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 relative z-10 gap-4 sm:gap-0">
            <a href="/tools" className="block group cursor-pointer">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">实用工具</h2>
              <p className="text-sm sm:text-base text-muted-foreground">把常见产品工作流沉淀成可直接使用的工具</p>
            </a>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
            >
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-sky-600 transition-colors">
                  <span>打开工具</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
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
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-violet-600 transition-colors">
                  <span>打开工具</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
