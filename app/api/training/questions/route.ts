import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { trainingQuestions } from '@/lib/db/schema';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { ensureTrainingSchema } from '@/lib/training/ensure-schema';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.API_KEY;
  if (!apiKey) return false;
  return authHeader === `Bearer ${apiKey}`;
}

const createSchema = z.object({
  questionKey: z.string().min(1),
  title: z.string().min(1),
  logoUrl: z.string().url(),
  prompt: z.string().min(1),
  industry: z.string().min(1),
  productType: z.string().min(1),
  difficulty: z.string().optional(),
  referencePoints: z.unknown().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    ensureTrainingSchema();
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || undefined;
    const productType = searchParams.get('productType') || undefined;
    const q = searchParams.get('q') || undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true' && isAdmin(request);

    const conditions = [];
    if (industry) conditions.push(eq(trainingQuestions.industry, industry));
    if (productType) conditions.push(eq(trainingQuestions.productType, productType));
    if (!includeInactive) conditions.push(eq(trainingQuestions.isActive, true));
    if (q) conditions.push(ilike(trainingQuestions.title, `%${q}%`));

    const where = conditions.length ? and(...conditions) : undefined;

    const baseQuery = db.select().from(trainingQuestions);
    const rows = await (where ? baseQuery.where(where) : baseQuery).orderBy(desc(trainingQuestions.id)).limit(100);

    return NextResponse.json({ success: true, data: rows, timestamp: Date.now() });
  } catch (error) {
    console.error('Error fetching training questions:', error);
    return NextResponse.json(
      { success: false, error: '获取题目失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureTrainingSchema();
    if (!isAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const referencePoints =
      parsed.data.referencePoints === undefined ? null : JSON.stringify(parsed.data.referencePoints);

    const inserted = await db
      .insert(trainingQuestions)
      .values({
        questionKey: parsed.data.questionKey,
        title: parsed.data.title,
        logoUrl: parsed.data.logoUrl,
        prompt: parsed.data.prompt,
        industry: parsed.data.industry,
        productType: parsed.data.productType,
        difficulty: parsed.data.difficulty || 'intermediate',
        referencePoints: referencePoints || undefined,
        isActive: parsed.data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: trainingQuestions.id });

    return NextResponse.json({ success: true, data: inserted[0], timestamp: Date.now() });
  } catch (error) {
    console.error('Error creating training question:', error);
    return NextResponse.json(
      { success: false, error: '创建题目失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}
