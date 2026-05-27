import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { trainingQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { ProductThinkingAnswer } from '@/components/training/product-thinking-answer';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

export const revalidate = 60;

export default async function ProductThinkingQuestionPage(props: { params: Promise<{ id: string }> }) {
  ensureTrainingSchema();
  const { id } = await props.params;
  const questionId = Number(id);
  if (!Number.isFinite(questionId) || questionId <= 0) notFound();

  const question = await db.query.trainingQuestions.findFirst({
    where: eq(trainingQuestions.id, questionId),
  });
  if (!question) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/training/product-thinking"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回题库
          </Link>
        </div>

        <ProductThinkingAnswer question={question} />
      </div>
    </div>
  );
}
