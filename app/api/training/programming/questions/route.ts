import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { programmingQuestions } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

const VALID_DOMAINS = ['frontend', 'backend', 'database', 'all'] as const;
type Domain = (typeof VALID_DOMAINS)[number];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
type Difficulty = (typeof VALID_DIFFICULTIES)[number];

function isValidDomain(domain: string): domain is Domain {
  return VALID_DOMAINS.includes(domain as Domain);
}

function isValidDifficulty(difficulty: string): difficulty is Difficulty {
  return VALID_DIFFICULTIES.includes(difficulty as Difficulty);
}

/**
 * 获取题目列表API
 * GET /api/training/programming/questions
 *
 * 查询参数:
 * - domain: 领域筛选 (frontend/backend/database/all)
 * - count: 抽取数量 (1-50)
 * - difficulty: 难度筛选 (beginner/intermediate/advanced)
 */
export async function GET(request: NextRequest) {
  try {
    ensureTrainingSchema();

    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get('domain') || 'all';
    const countParam = searchParams.get('count');
    const difficultyParam = searchParams.get('difficulty');

    // 验证domain参数
    const domain = isValidDomain(domainParam) ? domainParam : 'all';

    // 验证count参数
    let count: number | undefined;
    if (countParam) {
      const parsedCount = parseInt(countParam, 10);
      if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 50) {
        count = parsedCount;
      }
    }

    // 验证difficulty参数
    const difficulty = difficultyParam && isValidDifficulty(difficultyParam) ? difficultyParam : undefined;

    // 构建查询条件
    const conditions = [eq(programmingQuestions.isActive, true)];

    if (domain !== 'all') {
      conditions.push(eq(programmingQuestions.domain, domain));
    }

    if (difficulty) {
      conditions.push(eq(programmingQuestions.difficulty, difficulty));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // 查询符合条件的题目
    let questions;

    if (count) {
      // SQLite中使用RANDOM()函数随机抽取
      questions = await db
        .select()
        .from(programmingQuestions)
        .where(whereClause)
        .orderBy(sql`RANDOM()`)
        .limit(count);
    } else {
      questions = await db
        .select()
        .from(programmingQuestions)
        .where(whereClause)
        .orderBy(programmingQuestions.id);
    }

    // 格式化返回数据，隐藏正确答案
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      questionKey: q.questionKey,
      domain: q.domain,
      category: q.category,
      stem: q.stem,
      options: {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      },
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      success: true,
      data: {
        questions: formattedQuestions,
        total: formattedQuestions.length,
        domain,
        difficulty: difficulty || 'all',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching programming questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取题目列表失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
