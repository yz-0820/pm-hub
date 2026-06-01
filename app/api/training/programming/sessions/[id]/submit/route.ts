import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { programmingQuestions, programmingSessions } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

interface AnswerRecord {
  questionId: number;
  answer: 'A' | 'B' | 'C' | 'D';
  answeredAt: string;
}

interface QuestionResult {
  questionId: number;
  questionKey: string;
  domain: string;
  category: string;
  stem: string;
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  explanation: string;
  links?: Array<{ title: string; url: string }>;
}

interface DomainStats {
  domain: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface DifficultyStats {
  difficulty: string;
  total: number;
  correct: number;
  accuracy: number;
}

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        answer: z.enum(['A', 'B', 'C', 'D']),
      })
    )
    .optional(),
});

/**
 * 提交整份答卷并获取结果
 * POST /api/training/programming/sessions/[id]/submit
 *
 * 请求体:
 * - answers: 可选，补充提交的答案数组 [{ questionId, answer }]
 *
 * 返回: 答题统计和解析
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
    const parsed = submitSchema.safeParse(body);

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
    const existingAnswers: AnswerRecord[] = JSON.parse(session.answers || '[]');

    // 如果有补充提交的答案，合并到现有答案中
    if (parsed.data.answers && parsed.data.answers.length > 0) {
      const now = new Date().toISOString();
      for (const newAnswer of parsed.data.answers) {
        const existingIndex = existingAnswers.findIndex((a) => a.questionId === newAnswer.questionId);
        if (existingIndex >= 0) {
          existingAnswers[existingIndex] = {
            questionId: newAnswer.questionId,
            answer: newAnswer.answer,
            answeredAt: now,
          };
        } else {
          existingAnswers.push({
            questionId: newAnswer.questionId,
            answer: newAnswer.answer,
            answeredAt: now,
          });
        }
      }
    }

    // 获取所有题目详情
    const questions = await db
      .select()
      .from(programmingQuestions)
      .where(inArray(programmingQuestions.id, questionIds));

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // 计算得分和统计
    let correctCount = 0;
    const results: QuestionResult[] = [];
    const domainStats: Record<string, { total: number; correct: number }> = {};
    const difficultyStats: Record<string, { total: number; correct: number }> = {};

    for (const questionId of questionIds) {
      const question = questionMap.get(questionId);
      const userAnswerRecord = existingAnswers.find((a) => a.questionId === questionId);

      if (!question) continue;

      const userAnswer = userAnswerRecord?.answer || null;
      const correctAnswer = question.correctOption as 'A' | 'B' | 'C' | 'D';
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      // 领域统计
      if (!domainStats[question.domain]) {
        domainStats[question.domain] = { total: 0, correct: 0 };
      }
      domainStats[question.domain].total++;
      if (isCorrect) {
        domainStats[question.domain].correct++;
      }

      // 难度统计
      if (!difficultyStats[question.difficulty]) {
        difficultyStats[question.difficulty] = { total: 0, correct: 0 };
      }
      difficultyStats[question.difficulty].total++;
      if (isCorrect) {
        difficultyStats[question.difficulty].correct++;
      }

      results.push({
        questionId: question.id,
        questionKey: question.questionKey,
        domain: question.domain,
        category: question.category,
        stem: question.stem,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: question.explanation,
        links: question.links ? JSON.parse(question.links) : undefined,
      });
    }

    const totalQuestions = questionIds.length;
    const answeredQuestions = existingAnswers.length;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // 格式化领域统计
    const formattedDomainStats: DomainStats[] = Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

    // 格式化难度统计
    const formattedDifficultyStats: DifficultyStats[] = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

    // 更新会话为完成状态
    await db
      .update(programmingSessions)
      .set({
        status: 'completed',
        answers: JSON.stringify(existingAnswers),
        currentIndex: totalQuestions,
        updatedAt: new Date(),
      })
      .where(eq(programmingSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        summary: {
          totalQuestions,
          answeredQuestions,
          unansweredQuestions,
          correctCount,
          wrongCount: answeredQuestions - correctCount,
          score,
          passed: score >= 60,
        },
        stats: {
          byDomain: formattedDomainStats,
          byDifficulty: formattedDifficultyStats,
        },
        results,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error submitting programming session:', error);
    return NextResponse.json(
      {
        success: false,
        error: '提交答卷失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
