import { NextRequest, NextResponse } from 'next/server';
import { isFigmaImportOriginAllowed } from '@/lib/tools/figma-cors';
import { getStoredPrototypeByImportCode } from '@/lib/tools/prototype-store';

export const runtime = 'nodejs';

function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  if (origin && isFigmaImportOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', new URL(origin).origin);
    response.headers.set('Vary', 'Origin');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

function forbiddenOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (isFigmaImportOriginAllowed(origin)) return null;
  return NextResponse.json({ success: false, error: '不允许的跨域来源' }, { status: 403 });
}

export async function OPTIONS(request: NextRequest) {
  const forbidden = forbiddenOrigin(request);
  return forbidden || withCors(request, new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  const forbidden = forbiddenOrigin(request);
  if (forbidden) return forbidden;

  const code = request.nextUrl.searchParams.get('code')?.trim();
  if (!code) {
    return withCors(request, NextResponse.json({ success: false, error: '缺少导入码' }, { status: 400 }));
  }

  const stored = await getStoredPrototypeByImportCode(code);
  if (!stored) {
    return withCors(request, NextResponse.json({ success: false, error: '导入码无效或已过期' }, { status: 404 }));
  }

  if (Date.now() > stored.expiresAt) {
    return withCors(request, NextResponse.json({ success: false, error: '导入码已过期' }, { status: 410 }));
  }

  return withCors(
    request,
    NextResponse.json({
      success: true,
      data: {
        specId: stored.specId,
        version: stored.version,
        summary: stored.summary,
        prototypeSpec: stored.prototypeSpec,
      },
      timestamp: Date.now(),
    })
  );
}
