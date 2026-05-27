import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { programmingQuestions, programmingSessions } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

const VALID_STATUSES = ['in_progress', 'completed', 'paused'] as const;

// 解析 links 字段：支持字符串URL和JSON数组两种格式
function parseLinks(links: string | null | undefined): string[] {
  if (!links) return [];
  if (typeof links === 'string') {
    if (!links.trim()) return [];
    if (links.trim().startsWith('http')) {
      return [links.trim()];
    }
    try {
      const parsed = JSON.parse(links);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      return [links];
    }
  }
  return [];
}

const submitAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.enum(['A', 'B', 'C', 'D']),
});

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

interface AnswerRecord {
  questionId: number;
  answer: 'A' | 'B' | 'C' | 'D';
  answeredAt: string;
}

/**
 * 获取会话详情和当前题目
 * GET /api/training/programming/sessions/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的会话ID',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // 获取会话信息
    const session = await db.query.programmingSessions.findFirst({
      where: and(eq(programmingSessions.id, sessionId), eq(programmingSessions.userKey, userKey)),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在或无权访问',
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    const questionIds: number[] = JSON.parse(session.questionIds || '[]');
    const answers: AnswerRecord[] = JSON.parse(session.answers || '[]');

    // 获取所有题目
    let questions = [];
    if (questionIds.length > 0) {
      const dbQuestions = await db
        .select({
          id: programmingQuestions.id,
          questionKey: programmingQuestions.questionKey,
          domain: programmingQuestions.domain,
          category: programmingQuestions.category,
          stem: programmingQuestions.stem,
          optionA: programmingQuestions.optionA,
          optionB: programmingQuestions.optionB,
          optionC: programmingQuestions.optionC,
          optionD: programmingQuestions.optionD,
          correctOption: programmingQuestions.correctOption,
          explanation: programmingQuestions.explanation,
          links: programmingQuestions.links,
          difficulty: programmingQuestions.difficulty,
        })
        .from(programmingQuestions)
        .where(inArray(programmingQuestions.id, questionIds));

      // 按照 questionIds 的顺序排列
      const questionMap = new Map(dbQuestions.map((q) => [q.id, q]));
      questions = questionIds
        .map((id) => questionMap.get(id))
        .filter(Boolean)
        .map((q) => ({
          id: q!.id,
          questionKey: q!.questionKey,
          domain: q!.domain,
          category: q!.category,
          stem: q!.stem,
          optionA: q!.optionA,
          optionB: q!.optionB,
          optionC: q!.optionC,
          optionD: q!.optionD,
          correctOption: q!.correctOption,
          explanation: q!.explanation,
          links: parseLinks(q!.links),
          difficulty: q!.difficulty,
        }));
    }

    const progress = {
      total: questionIds.length,
      answered: answers.length,
      remaining: questionIds.length - answers.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          domains: JSON.parse(session.domains || '[]'),
          status: session.status,
          progress,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        questions,
        answers: answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
        })),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching programming session:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取会话详情失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 提交当前题目答案，更新进度
 * POST /api/training/programming/sessions/[id]
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的会话ID',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = submitAnswerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: '参数错误',
          details: parsed.error.format(),
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const { questionId, answer } = parsed.data;

    // 获取会话信息
    const session = await db.query.programmingSessions.findFirst({
      where: and(eq(programmingSessions.id, sessionId), eq(programmingSessions.userKey, userKey)),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在或无权访问',
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: '会话已完成，无法提交答案',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const questionIds: number[] = JSON.parse(session.questionIds || '[]');
    const currentIndex = session.currentIndex || 0;

    // 验证题目ID是否匹配当前题目
    if (questionIds[currentIndex] !== questionId) {
      return NextResponse.json(
        {
          success: false,
          error: '题目ID不匹配当前进度',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // 获取现有答案
    const answers: AnswerRecord[] = JSON.parse(session.answers || '[]');

    // 检查是否已经回答过该题目
    const existingAnswerIndex = answers.findIndex((a) => a.questionId === questionId);
    const now = new Date().toISOString();

    if (existingAnswerIndex >= 0) {
      // 更新已有答案
      answers[existingAnswerIndex] = { questionId, answer, answeredAt: now };
    } else {
      // 添加新答案
      answers.push({ questionId, answer, answeredAt: now });
    }

    // 更新会话
    const newIndex = Math.min(currentIndex + 1, questionIds.length);
    const isCompleted = newIndex >= questionIds.length;

    await db
      .update(programmingSessions)
      .set({
        currentIndex: newIndex,
        answers: JSON.stringify(answers),
        status: isCompleted ? 'completed' : session.status,
      })
      .where(eq(programmingSessions.id, sessionId));

    // 获取下一题
    let nextQuestion = null;
    if (newIndex < questionIds.length) {
      const question = await db.query.programmingQuestions.findFirst({
        where: eq(programmingQuestions.id, questionIds[newIndex]),
      });

      if (question) {
        nextQuestion = {
          id: question.id,
          questionKey: question.questionKey,
          domain: question.domain,
          category: question.category,
          stem: question.stem,
          options: {
            A: question.optionA,
            B: question.optionB,
            C: question.optionC,
            D: question.optionD,
          },
          difficulty: question.difficulty,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        submitted: {
          questionId,
          answer,
        },
        progress: {
          total: questionIds.length,
          current: newIndex + 1,
          answered: answers.length,
          remaining: questionIds.length - answers.length,
        },
        isCompleted,
        nextQuestion,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      {
        success: false,
        error: '提交答案失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 暂停/恢复会话
 * PATCH /api/training/programming/sessions/[id]
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const { id } = await params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的会话ID',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: '参数错误',
          details: parsed.error.format(),
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // 获取会话信息
    const session = await db.query.programmingSessions.findFirst({
      where: and(eq(programmingSessions.id, sessionId), eq(programmingSessions.userKey, userKey)),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在或无权访问',
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: '已完成的会话无法修改状态',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // 更新会话状态
    await db
      .update(programmingSessions)
      .set({
        status,
      })
      .where(eq(programmingSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status,
        message: status === 'paused' ? '会话已暂停' : '会话已恢复',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新会话状态失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
