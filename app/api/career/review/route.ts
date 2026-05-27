import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { invalidateContentCache } from '@/lib/career/cache';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.API_KEY || 'your-secret-api-key';

    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids : (typeof body.id === 'number' ? [body.id] : []);
    const status = typeof body.status === 'string' ? body.status : undefined;
    const category = typeof body.category === 'string' ? body.category : undefined;

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing id(s)' }, { status: 400 });
    }

    const allowedStatus = new Set(['pending', 'active', 'archived', 'rejected']);
    const allowedCategory = new Set(['communication', 'productivity', 'teamwork', 'leadership', 'all']);

    if (status && !allowedStatus.has(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }
    if (category && !allowedCategory.has(category)) {
      return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
    }
    if (!status && !category) {
      return NextResponse.json({ success: false, error: 'No changes specified' }, { status: 400 });
    }

    if (ids.length === 1) {
      await db.update(careerContents)
        .set({
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
          updatedAt: new Date(),
        })
        .where(eq(careerContents.id, ids[0]));
    } else {
      await db.update(careerContents)
        .set({
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
          updatedAt: new Date(),
        })
        .where(inArray(careerContents.id, ids));
    }

    await invalidateContentCache();
    revalidatePath('/career', 'layout');

    return NextResponse.json({
      success: true,
      data: { ids, status: status || null, category: category || null },
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

