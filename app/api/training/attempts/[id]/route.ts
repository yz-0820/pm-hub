import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { trainingAttempts, trainingEvaluations, trainingQuestions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const { id } = await context.params;
    const attemptId = Number(id);
    if (!Number.isFinite(attemptId) || attemptId <= 0) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const attempt = await db.query.trainingAttempts.findFirst({
      where: and(eq(trainingAttempts.id, attemptId), eq(trainingAttempts.userKey, userKey)),
    });
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const evaluation = await db.query.trainingEvaluations.findFirst({
      where: eq(trainingEvaluations.attemptId, attemptId),
    });

    const question = await db.query.trainingQuestions.findFirst({
      where: eq(trainingQuestions.id, attempt.questionId),
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        evaluation: evaluation
          ? { ...evaluation, report: JSON.parse(evaluation.report) as unknown }
          : null,
        question,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching training attempt detail:', error);
    return NextResponse.json(
      { success: false, error: '获取报告失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}
