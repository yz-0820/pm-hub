import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { trainingDrafts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getOrCreateUserKey } from '@/lib/training/user-key';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

const putSchema = z.object({
  questionId: z.number().int().positive(),
  content: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const { searchParams } = new URL(request.url);
    const questionId = Number(searchParams.get('questionId') || '');
    if (!Number.isFinite(questionId) || questionId <= 0) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const userKey = await getOrCreateUserKey();

    const row = await db.query.trainingDrafts.findFirst({
      where: and(eq(trainingDrafts.userKey, userKey), eq(trainingDrafts.questionId, questionId)),
    });

    return NextResponse.json({
      success: true,
      data: row ? { content: row.content, updatedAt: row.updatedAt } : { content: '', updatedAt: null },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching training draft:', error);
    return NextResponse.json(
      { success: false, error: '获取草稿失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const userKey = await getOrCreateUserKey();
    const body = await request.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const now = new Date();

    await db
      .insert(trainingDrafts)
      .values({
        userKey,
        questionId: parsed.data.questionId,
        content: parsed.data.content,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [trainingDrafts.userKey, trainingDrafts.questionId],
        set: { content: parsed.data.content, updatedAt: now },
      });

    return NextResponse.json({ success: true, data: { ok: true }, timestamp: Date.now() });
  } catch (error) {
    console.error('Error saving training draft:', error);
    return NextResponse.json(
      { success: false, error: '保存草稿失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}
