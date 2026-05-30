import Link from 'next/link';
import { Lightbulb, Code2, ArrowRight } from 'lucide-react';

export const revalidate = 60;

export default function TrainingHomePage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-no-repeat opacity-[0.55] saturate-[0.9] contrast-[1.08] brightness-[1.02]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0)",
              backgroundPosition: 'center',
              backgroundSize: 'clamp(1000px, 120vw, 2200px) auto',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background/85" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,hsl(var(--background))_0%,transparent_62%)] opacity-80" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 top-40 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              题库训练
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              通过结构化题库与 AI 评分报告，持续提升产品拆解与表达能力
            </p>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/training/product-thinking"
              className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">产品思维训练</h2>
                  <p className="text-sm text-muted-foreground">
                    多行业产品案例拆解题，练习用户价值、商业逻辑与功能设计。
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                <span>开始训练</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/training/programming"
              className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">编程知识训练</h2>
                  <p className="text-sm text-muted-foreground">
                    前端、后端、数据库三大领域选择题库，即时反馈与解析，巩固技术基础。
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Code2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">
                <span>开始训练</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
