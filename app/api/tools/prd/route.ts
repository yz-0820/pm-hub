import { NextRequest, NextResponse } from 'next/server';
import { generatePrd, prdInputSchema } from '@/lib/tools/prd-generator';
import { checkRateLimit, getClientIdentifier, RateLimitStorageError } from '@/lib/utils/rate-limiter';
import { sanitizePromptInputs } from '@/lib/utils/input-sanitizer';

export const runtime = 'nodejs';

// PRD 生成限流：每 IP 每 10 分钟最多 5 次
const PRD_RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 5 };

export async function POST(request: NextRequest) {
  try {
    // 限流检查
    const clientId = getClientIdentifier(request);
    const limit = await checkRateLimit(`prd:${clientId}`, PRD_RATE_LIMIT);
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

    // 输入安全过滤
    const sanitizeResult = sanitizePromptInputs({
      productName: parsed.data.productName,
      background: parsed.data.background,
      goals: parsed.data.goals,
      users: parsed.data.users,
      features: parsed.data.features,
      constraints: parsed.data.constraints || '',
      metrics: parsed.data.metrics || '',
    });
    if (sanitizeResult.blocked) {
      return NextResponse.json(
        { success: false, error: '输入包含不安全内容' },
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
    if (error instanceof RateLimitStorageError) {
      return NextResponse.json({ success: false, error: '服务暂时不可用，请稍后重试' }, { status: 503 });
    }
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
