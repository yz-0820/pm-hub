import { PlatformRawContent } from './types';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

interface RSSHubItem {
  title?: string;
  link?: string;
  description?: string | { '#text'?: string };
  'content:encoded'?: string | { '#text'?: string };
  enclosure?: { '@_url'?: string; '@_type'?: string };
  guid?: string | { '#text'?: string };
  'dc:creator'?: string;
  author?: string;
  category?: string | Array<string | { '#text'?: string }> | { '#text'?: string };
  pubDate?: string;
  'dc:date'?: string;
}

function pickUrl(text: unknown): string {
  const s = String(text || '');
  const m = /(https?:\/\/[^\s"'<>]+)/i.exec(s);
  return m?.[1] || '';
}

function normalizeTags(category: RSSHubItem['category']): string[] {
  if (!category) return [];
  const values = Array.isArray(category) ? category : [category];
  return values
    .map((item) => (typeof item === 'string' ? item : item['#text']))
    .filter((item): item is string => Boolean(item));
}

function textValue(value: string | { '#text'?: string } | undefined): string {
  return typeof value === 'string' ? value : value?.['#text'] || '';
}

export async function fetchWithRetry(url: string, maxRetries = 3, timeout = 30000): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (e) {
      lastError = e as Error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

// 通用RSSHub解析器
export async function parseRSSHubFeed(
  url: string,
  platform: PlatformRawContent['platform'],
  sourceId: string,
  sourceName: string
): Promise<PlatformRawContent[]> {
  const res = await fetchWithRetry(url);
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);

  const items = parsed?.rss?.channel?.item || [];
  if (!Array.isArray(items)) return [];

  return (items as RSSHubItem[]).map((item) => {
    const description = typeof item.description === 'object' ? item.description['#text'] || '' : item.description || '';
    const content = typeof item['content:encoded'] === 'object' ? item['content:encoded']['#text'] || '' : item['content:encoded'] || '';

    const images: string[] = [];
    for (const html of [description, content]) {
      if (!html) continue;
      const matches = Array.from(String(html).matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]).filter(Boolean);
      for (const u of matches) {
        if (!images.includes(u)) images.push(u);
      }
    }

    const enclosureUrl = item.enclosure?.['@_url'] || '';
    const enclosureType = item.enclosure?.['@_type'] || '';
    const videoUrl = isVideoResource(enclosureUrl, enclosureType) ? enclosureUrl : '';

    const coverUrl = !videoUrl && enclosureUrl ? enclosureUrl : (images[0] || extractImage(description));

    const guid = textValue(item.guid);
    const link = item.link || '';
    const guidUrl = pickUrl(guid);
    const originalUrl = (() => {
      const fallback = String(link || guidUrl || '');
      try {
        const u = new URL(fallback);
        if (u.hostname === 'rsshub.app' || u.hostname.endsWith('.rsshub.app')) {
          if (guidUrl) return guidUrl;
        }
      } catch {}
      return fallback;
    })();

    return {
      platform,
      sourceId,
      sourceName,
      originalId: String(guid || link || ''),
      originalUrl,
      title: item.title || '',
      description,
      content,
      author: { name: item['dc:creator'] || item.author || '' },
      media: {
        coverUrl,
        videoUrl,
        images,
      },
      stats: {},
      tags: normalizeTags(item.category),
      publishedAt: new Date(item.pubDate || item['dc:date'] || Date.now()),
    };
  });
}

function extractImage(html: string): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || '';
}

function isVideoResource(url: string, type: string): boolean {
  if (!url) return false;
  const t = String(type || '').toLowerCase();
  if (t.startsWith('video/')) return true;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.mp4') || pathname.endsWith('.m3u8') || pathname.endsWith('.mov') || pathname.endsWith('.mkv') || pathname.endsWith('.webm');
  } catch {
    const u = url.toLowerCase();
    return u.includes('.mp4') || u.includes('.m3u8') || u.includes('.mov') || u.includes('.mkv') || u.includes('.webm');
  }
}

// 小红书RSSHub
export async function fetchXiaohongshuFeed(sourceId: string, sourceName: string, url: string): Promise<PlatformRawContent[]> {
  return parseRSSHubFeed(url, 'xiaohongshu', sourceId, sourceName);
}

// 抖音RSSHub
export async function fetchDouyinFeed(sourceId: string, sourceName: string, url: string): Promise<PlatformRawContent[]> {
  return parseRSSHubFeed(url, 'douyin', sourceId, sourceName);
}

// B站RSSHub
export async function fetchBilibiliFeed(sourceId: string, sourceName: string, url: string): Promise<PlatformRawContent[]> {
  return parseRSSHubFeed(url, 'bilibili', sourceId, sourceName);
}
