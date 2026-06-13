import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateImageProxyUrl } from '@/lib/utils/image-proxy-validation';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时缓存

function getCacheDir(): string {
  return path.join(process.cwd(), 'data', 'image-cache');
}

function getCachePath(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const ext = getExtension(url);
  return path.join(getCacheDir(), `${hash}${ext}`);
}

function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.includes('.png')) return '.png';
    if (pathname.includes('.gif')) return '.gif';
    if (pathname.includes('.webp')) return '.webp';
    if (pathname.includes('.avif')) return '.avif';
    if (pathname.includes('.bmp')) return '.bmp';
    if (pathname.includes('.svg')) return '.svg';
  } catch {}
  return '.jpg';
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
  };
  return map[ext] || 'image/jpeg';
}

function normalizeUpstreamImageUrl(url: string): string {
  if (!url.includes('.hdslb.com/')) return url;
  const idx = url.indexOf('@');
  if (idx <= 0) return url;
  const base = url.slice(0, idx);
  return `${base}@1280w_720h_1c`;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');

  const finalUrl = imageUrl ? normalizeUpstreamImageUrl(imageUrl) : null;

  const validation = validateImageProxyUrl(finalUrl);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const parsedUrl = validation.url;
  const normalizedUrl = parsedUrl.toString();

  // 确保缓存目录存在
  const cacheDir = getCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const cachePath = getCachePath(normalizedUrl);
  const ext = path.extname(cachePath);

  // 检查缓存
  if (fs.existsSync(cachePath)) {
    try {
      const stat = fs.statSync(cachePath);
      const age = Date.now() - stat.mtimeMs;
      if (age < CACHE_TTL && stat.size > 100) {
        const contentType = getContentType(ext);
        const buffer = fs.readFileSync(cachePath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    } catch {}
  }

  // 代理请求图片
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': parsedUrl.origin + '/',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || getContentType(ext);
    if (contentType && !contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json({ error: `Upstream content is not an image: ${contentType}` }, { status: 502 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      return NextResponse.json({ error: 'Image too small' }, { status: 502 });
    }

    // 写入缓存
    try {
      fs.writeFileSync(cachePath, buffer);
    } catch {}

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Image fetch timeout' }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : 'Fetch failed';
    console.error('Image proxy error:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
