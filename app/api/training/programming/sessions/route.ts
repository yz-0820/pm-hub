import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { programmingQuestions, programmingSessions } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

const VALID_DOMAINS = ['frontend', 'backend', 'database'] as const;
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

// 解析 links 字段：支持字符串URL和JSON数组两种格式
function parseLinks(links: string | null | undefined): string[] {
  if (!links) return [];
  if (typeof links === 'string') {
    // 如果是空字符串
    if (!links.trim()) return [];
    // 如果是 URL 字符串（直接以 http 开头）
    if (links.trim().startsWith('http')) {
      return [links.trim()];
    }
    // 否则尝试解析为 JSON 数组
    try {
      const parsed = JSON.parse(links);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      // JSON 解析失败，返回原字符串作为单个链接
      return [links];
    }
  }
  return [];
}

const createSessionSchema = z.object({
  domains: z.array(z.enum(VALID_DOMAINS)).min(1).max(3),
  count: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(VALID_DIFFICULTIES).optional(),
});

/**
 * 创建答题会话API
 * POST /api/training/programming/sessions
 *
 * 请求体:
 * - domains: 领域数组 ['frontend', 'backend', 'database']
 * - count: 抽取数量 (1-50, 默认10)
 * - difficulty: 难度筛选 (可选)
 *
 * 返回: sessionId 和题目列表
 */
export async function POST(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

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

    const { domains, count, difficulty } = parsed.data;

    // 构建查询条件
    const conditions = [eq(programmingQuestions.isActive, true), inArray(programmingQuestions.domain, domains)];

    if (difficulty) {
      conditions.push(eq(programmingQuestions.difficulty, difficulty));
    }

    // 随机抽取题目
    const selectedQuestions = await db
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
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '未找到符合条件的题目',
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    const questionIds = selectedQuestions.map((q) => q.id);

    // 创建会话记录
    const inserted = await db
      .insert(programmingSessions)
      .values({
        userKey,
        domains: JSON.stringify(domains),
        questionIds: JSON.stringify(questionIds),
        currentIndex: 0,
        answers: JSON.stringify([]),
        status: 'in_progress',
      })
      .returning({ id: programmingSessions.id });

    const sessionId = inserted[0]?.id;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '创建会话失败',
          timestamp: Date.now(),
        },
        { status: 500 }
      );
    }

    // 格式化题目数据
    const formattedQuestions = selectedQuestions.map((q) => ({
      id: q.id,
      questionKey: q.questionKey,
      domain: q.domain,
      category: q.category,
      stem: q.stem,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation,
      links: parseLinks(q.links),
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        questions: formattedQuestions,
        totalQuestions: formattedQuestions.length,
        domains,
        difficulty: difficulty || 'all',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error creating programming session:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建答题会话失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的会话列表
 * GET /api/training/programming/sessions
 */
export async function GET(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit') || '20';
    const limit = Math.min(parseInt(limitParam, 10) || 20, 50);

    let whereClause = eq(programmingSessions.userKey, userKey);

    if (statusParam && ['in_progress', 'completed', 'paused'].includes(statusParam)) {
      whereClause = and(whereClause, eq(programmingSessions.status, statusParam)) as typeof whereClause;
    }

    const sessions = await db
      .select({
        id: programmingSessions.id,
        domains: programmingSessions.domains,
        questionIds: programmingSessions.questionIds,
        currentIndex: programmingSessions.currentIndex,
        status: programmingSessions.status,
        createdAt: programmingSessions.createdAt,
        updatedAt: programmingSessions.updatedAt,
      })
      .from(programmingSessions)
      .where(whereClause)
      .orderBy(sql`${programmingSessions.createdAt} DESC`)
      .limit(limit);

    // 解析JSON字段
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      domains: JSON.parse(s.domains || '[]'),
      totalQuestions: JSON.parse(s.questionIds || '[]').length,
      currentIndex: s.currentIndex,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching programming sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取会话列表失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
