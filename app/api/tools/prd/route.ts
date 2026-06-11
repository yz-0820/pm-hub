import { NextRequest, NextResponse } from 'next/server';
import { generatePrd, prdInputSchema } from '@/lib/tools/prd-generator';
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

// PRD 生成限流：每 IP 每 10 分钟最多 5 次
const PRD_RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 5 };

export async function POST(request: NextRequest) {
  try {
    // 限流检查
    const clientId = getClientIdentifier(request);
    const limit = checkRateLimit(`prd:${clientId}`, PRD_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(PRD_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
          },
        }
      );
    }

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
