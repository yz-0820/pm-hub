import { NextRequest, NextResponse } from 'next/server';
import { validateImageProxyUrl } from '@/lib/utils/image-proxy-validation';

const CACHE_TTL_SECONDS = 24 * 60 * 60;

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

function getRuntimeCache(): Cache | null {
  const runtimeCaches = globalThis.caches as (CacheStorage & { default?: Cache }) | undefined;
  return runtimeCaches?.default ?? null;
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');
  const finalUrl = imageUrl ? normalizeUpstreamImageUrl(imageUrl) : null;

  const validation = validateImageProxyUrl(finalUrl);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const parsedUrl = validation.url;
  const normalizedUrl = parsedUrl.toString();
  const ext = getExtension(normalizedUrl);
  const cache = getRuntimeCache();
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set('url', normalizedUrl);
  const cacheRequest = new Request(cacheUrl.toString(), { method: 'GET' });

  if (cache) {
    const cached = await cache.match(cacheRequest);
    if (cached) return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
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
    if (arrayBuffer.byteLength < 100) {
      return NextResponse.json({ error: 'Image too small' }, { status: 502 });
    }

    const proxied = new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });

    if (cache) {
      await cache.put(cacheRequest, proxied.clone());
    }

    return proxied;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Image fetch timeout' }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : 'Fetch failed';
    console.error('Image proxy error:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
