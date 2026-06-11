import { NextRequest, NextResponse } from 'next/server';
import { getStoredPrototypeByImportCode } from '@/lib/tools/prototype-store';

export const runtime = 'nodejs';

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim();
  if (!code) {
    return withCors(NextResponse.json({ success: false, error: '缺少导入码' }, { status: 400 }));
  }

  const stored = await getStoredPrototypeByImportCode(code);
  if (!stored) {
    return withCors(NextResponse.json({ success: false, error: '导入码无效或已过期' }, { status: 404 }));
  }

  if (Date.now() > stored.expiresAt) {
    return withCors(NextResponse.json({ success: false, error: '导入码已过期' }, { status: 410 }));
  }

  return withCors(
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
