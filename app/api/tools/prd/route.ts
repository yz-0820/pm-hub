import { NextRequest, NextResponse } from 'next/server';
import { generatePrd, prdInputSchema } from '@/lib/tools/prd-generator';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = prdInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || '参数错误',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await generatePrd(parsed.data);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error generating PRD:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PRD 生成失败',
        details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
