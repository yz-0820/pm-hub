import { NextRequest, NextResponse } from 'next/server';
import {
  createPrototypeInputSchema,
  revisePrototypeInputSchema,
} from '@/lib/tools/prototype-spec';
import {
  generatePrototypeFromInput,
  revisePrototypeFromInput,
  summarizePrototypeReferenceImage,
} from '@/lib/tools/prototype-generator-v2';
import {
  getStoredPrototype,
  savePrototypeVersion,
} from '@/lib/tools/prototype-store';
import { checkRateLimit, getClientIdentifier, RateLimitStorageError } from '@/lib/utils/rate-limiter';
import { sanitizePromptInputs } from '@/lib/utils/input-sanitizer';

export const runtime = 'nodejs';

// 原型生成限流：每 IP 每 10 分钟最多 5 次
const PROTOTYPE_RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 5 };

const MAX_REFERENCE_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_REFERENCE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function validateReferenceImage(file: FormDataEntryValue | null): string | null {
  if (!file) return null;
  if (!(file instanceof File)) return '参考图格式不正确';
  if (file.size <= 0) return null;
  if (!SUPPORTED_REFERENCE_TYPES.has(file.type)) return '参考图仅支持 PNG、JPG、JPEG、WEBP';
  if (file.size > MAX_REFERENCE_IMAGE_SIZE) return '参考图不能超过 10MB';
  return null;
}

async function parseRequest(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const referenceImage = formData.get('referenceImage');
    const imageError = validateReferenceImage(referenceImage);
    if (imageError) throw new Error(imageError);

    const mode = getString(formData, 'mode') || 'create';
    if (mode === 'revise') {
      return {
        mode,
        baseSpecId: getString(formData, 'baseSpecId'),
        revisionInstruction: getString(formData, 'revisionInstruction'),
      };
    }

    const referenceImageSummary =
      referenceImage instanceof File && referenceImage.size > 0
        ? await summarizePrototypeReferenceImage(referenceImage)
        : null;

    return {
      mode: 'create',
      name: getString(formData, 'name'),
      platform: getString(formData, 'platform'),
      pageType: getString(formData, 'pageType'),
      productContext: getString(formData, 'productContext'),
      targetUser: getString(formData, 'targetUser'),
      pageGoal: getString(formData, 'pageGoal'),
      keyContent: getString(formData, 'keyContent'),
      instructions: getString(formData, 'instructions'),
      hasReferenceImage: referenceImage instanceof File && referenceImage.size > 0,
      referenceImageSummary: referenceImageSummary || undefined,
    };
  }

  return request.json();
}

export async function POST(request: NextRequest) {
  try {
    // 限流检查
    const clientId = getClientIdentifier(request);
    const limit = await checkRateLimit(`prototype:${clientId}`, PROTOTYPE_RATE_LIMIT);
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
            'X-RateLimit-Limit': String(PROTOTYPE_RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(limit.resetAt / 1000)),
          },
        }
      );
    }

    const body = await parseRequest(request);
    const mode = (body as { mode?: unknown })?.mode;

    if (mode === 'revise') {
      const parsed = revisePrototypeInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || '参数错误', issues: parsed.error.issues },
          { status: 400 }
        );
      }

      const base = await getStoredPrototype(parsed.data.baseSpecId);
      if (!base) {
        return NextResponse.json(
          { success: false, error: '上一版原型不存在或已过期，请重新生成' },
          { status: 404 }
        );
      }

      // 输入安全过滤
      const reviseSanitize = sanitizePromptInputs({
        revisionInstruction: parsed.data.revisionInstruction,
      });
      if (reviseSanitize.blocked) {
        return NextResponse.json(
          { success: false, error: '输入包含不安全内容' },
          { status: 400 }
        );
      }

      const generated = await revisePrototypeFromInput(base.prototypeSpec, parsed.data);
      const stored = await savePrototypeVersion({
        parentSpecId: base.specId,
        version: base.version + 1,
        summary: generated.summary,
        model: generated.model,
        usedAI: generated.usedAI,
        prototypeSpec: generated.prototypeSpec,
      });

      return NextResponse.json({
        success: true,
        data: stored,
        timestamp: Date.now(),
      });
    }

    const parsed = createPrototypeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || '参数错误', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // 输入安全过滤
    const createSanitize = sanitizePromptInputs({
      name: parsed.data.name,
      productContext: parsed.data.productContext,
      targetUser: parsed.data.targetUser,
      pageGoal: parsed.data.pageGoal,
      keyContent: parsed.data.keyContent,
      instructions: parsed.data.instructions || '',
    });
    if (createSanitize.blocked) {
      return NextResponse.json(
        { success: false, error: '输入包含不安全内容' },
        { status: 400 }
      );
    }

    const generated = await generatePrototypeFromInput(parsed.data);
    const stored = await savePrototypeVersion({
      parentSpecId: null,
      version: 1,
      summary: generated.summary,
      model: generated.model,
      usedAI: generated.usedAI,
      prototypeSpec: generated.prototypeSpec,
    });

    return NextResponse.json({
      success: true,
      data: stored,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof RateLimitStorageError) {
      return NextResponse.json({ success: false, error: '服务暂时不可用，请稍后重试' }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : '原型生成失败';
    console.error('Error generating prototype spec:', message);
    return NextResponse.json(
      {
        success: false,
        error: message || '原型生成失败',
        details: process.env.NODE_ENV !== 'production' ? message : undefined,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
