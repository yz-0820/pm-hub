import Link from 'next/link';
import { Brain, Code2, ArrowRight } from 'lucide-react';

export const revalidate = 60;

export default function TrainingHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">题库训练</h1>
          <p className="text-muted-foreground text-lg mb-10">
            通过结构化题库与 AI 评分报告，持续提升产品拆解与表达能力。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/training/product-thinking"
            className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">产品思维训练</h2>
                <p className="text-sm text-muted-foreground">
                  多行业、多产品类型的产品案例拆解题，练习用户价值、商业逻辑、功能设计与竞品分析。
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-primary" />
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
    </div>
  );
}

