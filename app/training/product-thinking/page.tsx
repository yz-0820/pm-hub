import Link from 'next/link';
import { db } from '@/lib/db/client';
import { trainingQuestions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { trainingIndustries, trainingProductTypes, trainingDifficulty } from '@/config/training';
import { Brain, ArrowLeft } from 'lucide-react';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';
import { ProductThinkingFilters } from '@/components/training/product-thinking-filters';
import { QuestionLogo } from '@/components/training/question-logo';

export const revalidate = 60;

function labelOf(list: readonly { id: string; name: string }[], id: string): string {
  return list.find((x) => x.id === id)?.name || id;
}

export default async function ProductThinkingTrainingPage(props: {
  searchParams: Promise<{ industry?: string; productType?: string; difficulty?: string }>;
}) {
  ensureTrainingSchema();
  const searchParams = await props.searchParams;
  const industry = searchParams.industry || '';
  const productType = searchParams.productType || '';
  const difficulty = searchParams.difficulty || '';

  const conditions = [eq(trainingQuestions.isActive, true)];
  if (industry) conditions.push(eq(trainingQuestions.industry, industry));
  if (productType) conditions.push(eq(trainingQuestions.productType, productType));
  if (difficulty) conditions.push(eq(trainingQuestions.difficulty, difficulty));

  const questions = await db
    .select()
    .from(trainingQuestions)
    .where(and(...conditions))
    .orderBy(desc(trainingQuestions.id))
    .limit(200);

  const normalizeTitle = (title: string) => title.replace(/^拆解[:：]\s*/, '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/training"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回题库训练
          </Link>
        </div>

        <div className="flex items-start justify-between gap-6 flex-col lg:flex-row mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Brain className="h-4 w-4" />
              <span>产品思维训练</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">产品拆解题库</h1>
            <p className="text-muted-foreground">选择题目开始作答，支持草稿自动保存与 AI 评分报告。</p>
          </div>

          <ProductThinkingFilters industry={industry} productType={productType} difficulty={difficulty} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {questions.map((q) => {
            const title = normalizeTitle(q.title);
            return (
              <Link
                key={q.id}
                href={`/training/product-thinking/${q.id}`}
                className="group rounded-2xl border bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded-md bg-muted/60 border">
                        {labelOf(trainingIndustries, q.industry)}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-muted/60 border">
                        {labelOf(trainingProductTypes, q.productType)}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-muted/60 border">
                        {labelOf(trainingDifficulty, q.difficulty)}
                      </span>
                    </div>
                  </div>
                  <QuestionLogo logoUrl={q.logoUrl} alt={title} />
                </div>
                <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{q.prompt}</p>
              </Link>
            );
          })}
        </div>

        {questions.length === 0 && (
          <div className="rounded-2xl border bg-card/60 p-10 text-center text-muted-foreground">
            暂无题目，请先运行 training:seed 或通过管理 API 添加题目。
          </div>
        )}
      </div>
    </div>
  );
}
