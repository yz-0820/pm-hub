import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { trainingAttempts, trainingDrafts, trainingEvaluations, trainingQuestions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { evaluateWithAI } from '@/lib/training/evaluator';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

function validateAnswer(answer: string): string | null {
  const trimmed = answer.trim();
  if (trimmed.length < 80) return '答案过短，请按题目要求写出完整分析后再提交';
  const compact = trimmed.replace(/\s+/g, '');
  const letters = (compact.match(/[\p{Script=Han}A-Za-z]/gu) || []).length;
  const digits = (compact.match(/[0-9]/g) || []).length;
  if (letters < 60) return '答案缺少有效文字内容，请避免仅输入数字或无意义字符';
  if (digits >= 40 && digits > letters * 2) return '检测到大量数字内容，请输入结构化分析后再提交';
  return null;
}

function parseReferencePoints(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

const postSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const { searchParams } = new URL(request.url);
    const questionIdParam = searchParams.get('questionId');
    const limitRaw = Number(searchParams.get('limit') || '20');
    const limit = Number.isFinite(limitRaw) ? Math.min(limitRaw, 50) : 20;

    const questionId = questionIdParam ? Number(questionIdParam) : null;
    const where =
      questionId && Number.isFinite(questionId) && questionId > 0
        ? and(eq(trainingAttempts.userKey, userKey), eq(trainingAttempts.questionId, questionId))
        : eq(trainingAttempts.userKey, userKey);

    const rows = await db
      .select()
      .from(trainingAttempts)
      .where(where)
      .orderBy(desc(trainingAttempts.id))
      .limit(limit);

    return NextResponse.json({ success: true, data: rows, timestamp: Date.now() });
  } catch (error) {
    console.error('Error fetching training attempts:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取答题记录失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }
    const answerError = validateAnswer(parsed.data.answer);
    if (answerError) {
      return NextResponse.json({ success: false, error: answerError }, { status: 400 });
    }

    const question = await db.query.trainingQuestions.findFirst({
      where: eq(trainingQuestions.id, parsed.data.questionId),
    });
    if (!question) {
      return NextResponse.json({ success: false, error: '题目不存在' }, { status: 404 });
    }

    const now = new Date();
    const inserted = await db
      .insert(trainingAttempts)
      .values({
        userKey,
        questionId: parsed.data.questionId,
        answer: parsed.data.answer,
        submittedAt: now,
        createdAt: now,
      })
      .returning({ id: trainingAttempts.id });

    const attemptId = inserted[0]?.id;
    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: '创建答题记录失败', timestamp: Date.now() },
        { status: 500 }
      );
    }

    const evaluation = await evaluateWithAI({
      questionTitle: question.title,
      questionPrompt: question.prompt,
      questionReferencePoints: parseReferencePoints(question.referencePoints),
      answer: parsed.data.answer,
    });

    await db.insert(trainingEvaluations).values({
      attemptId,
      totalScore: evaluation.totalScore,
      valueScore: evaluation.valueScore,
      businessScore: evaluation.businessScore,
      designScore: evaluation.designScore,
      competitionScore: evaluation.competitionScore,
      report: JSON.stringify({
        usedAI: evaluation.usedAI,
        weights: { userValue: 30, businessLogic: 25, featureDesign: 25, competition: 20 },
        ...evaluation.report,
      }),
      model: evaluation.model,
      createdAt: new Date(),
    });

    await db
      .delete(trainingDrafts)
      .where(and(eq(trainingDrafts.userKey, userKey), eq(trainingDrafts.questionId, parsed.data.questionId)));

    return NextResponse.json({
      success: true,
      data: { attemptId, evaluation },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error submitting training attempt:', error);
    return NextResponse.json(
      {
        success: false,
        error: '提交失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
