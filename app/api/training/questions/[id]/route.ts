import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { trainingQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  prompt: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  productType: z.string().min(1).optional(),
  difficulty: z.string().optional(),
  referencePoints: z.unknown().optional(),
  isActive: z.boolean().optional(),
});

function parseIdOrKey(idOrKey: string): { type: 'id'; id: number } | { type: 'key'; key: string } {
  if (/^\d+$/.test(idOrKey)) return { type: 'id', id: Number(idOrKey) };
  return { type: 'key', key: idOrKey };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    const { id } = await context.params;
    const parsed = parseIdOrKey(id);

    const row =
      parsed.type === 'id'
        ? await db.query.trainingQuestions.findFirst({ where: eq(trainingQuestions.id, parsed.id) })
        : await db.query.trainingQuestions.findFirst({
            where: eq(trainingQuestions.questionKey, parsed.key),
          });

    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: row, timestamp: Date.now() });
  } catch (error) {
    console.error('Error fetching training question:', error);
    return NextResponse.json(
      { success: false, error: '获取题目失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedId = parseIdOrKey(id);
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.title !== undefined) set.title = parsed.data.title;
    if (parsed.data.logoUrl !== undefined) set.logoUrl = parsed.data.logoUrl;
    if (parsed.data.prompt !== undefined) set.prompt = parsed.data.prompt;
    if (parsed.data.industry !== undefined) set.industry = parsed.data.industry;
    if (parsed.data.productType !== undefined) set.productType = parsed.data.productType;
    if (parsed.data.difficulty !== undefined) set.difficulty = parsed.data.difficulty;
    if (parsed.data.isActive !== undefined) set.isActive = parsed.data.isActive;
    if (parsed.data.referencePoints !== undefined) {
      set.referencePoints = JSON.stringify(parsed.data.referencePoints);
    }

    const where =
      parsedId.type === 'id'
        ? eq(trainingQuestions.id, parsedId.id)
        : eq(trainingQuestions.questionKey, parsedId.key);

    const updated = await db.update(trainingQuestions).set(set).where(where).returning();
    if (!updated[0]) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated[0], timestamp: Date.now() });
  } catch (error) {
    console.error('Error updating training question:', error);
    return NextResponse.json(
      { success: false, error: '更新题目失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    ensureTrainingSchema();
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedId = parseIdOrKey(id);
    const where =
      parsedId.type === 'id'
        ? eq(trainingQuestions.id, parsedId.id)
        : eq(trainingQuestions.questionKey, parsedId.key);

    const deleted = await db.delete(trainingQuestions).where(where).returning({ id: trainingQuestions.id });
    if (!deleted[0]) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted[0], timestamp: Date.now() });
  } catch (error) {
    console.error('Error deleting training question:', error);
    return NextResponse.json(
      { success: false, error: '删除题目失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}
