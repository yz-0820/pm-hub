import Parser from 'rss-parser';
import { ParsedArticle } from '@/types';
import { decodePlainText } from '@/lib/utils/html-entities';

interface RSSParserItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  'content:encoded'?: string;
  summary?: string;
  contentSnippet?: string;
  author?: string;
  creator?: string;
  categories?: string[];
  enclosure?: { url?: string; type?: string };
  'media:content'?: RSSMediaItem | RSSMediaItem[];
  'media:thumbnail'?: RSSMediaItem | RSSMediaItem[];
  description?: string;
}

interface RSSMediaItem {
  $?: { url?: string };
  url?: string;
}

const rssParser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
  },
});

// 不合法的图片 URL 黑名单关键词
const INVALID_IMAGE_PATTERNS = [
  /data:image\//i,         // base64 内嵌图片
  /tracking|pixel|beacon/i, // 追踪像素
  /spacer|blank|empty/i,    // 占位图
  /logo.*\.(svg|png|gif)$/i, // 站点 logo（小尺寸）
  /icon.*\.(svg|png|ico)$/i, // 图标
  /avatar.*\.(png|jpg|jpeg)$/i, // 头像
];

// 判断图片 URL 是否合法
function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  // 必须是 http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  // 排除黑名单
  for (const pattern of INVALID_IMAGE_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  return true;
}

export async function parseRSSFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    
    return feed.items.map((item) => ({
      title: decodePlainText(item.title || '无标题'),
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      content: item['content:encoded'] || item.content,
      summary: item.summary || item.contentSnippet || '',
      author: item.author || item.creator ? decodePlainText(item.author || item.creator || '') : undefined,
      categories: (item.categories || []).map(decodePlainText),
      imageUrl: extractImageUrl(item),
    }));
  } catch (error) {
    console.error(`Failed to parse RSS feed: ${feedUrl}`, error);
    return [];
  }
}

/**
 * 多策略提取文章配图，优先级从高到低：
 * 1. enclosure（RSS 标准附件，通常是文章主图）
 * 2. media:content / media:thumbnail（媒体标签）
 * 3. content:encoded 中的 <img> 标签（取第一张有效图片）
 * 4. summary / description 中的 <img> 标签
 * 5. og:image 从 link 中提取（部分 RSS 不含但原文有）
 */
function extractImageUrl(item: RSSParserItem): string | undefined {
  // 策略 1: enclosure（RSS 标准附件）
  if (item.enclosure?.url) {
    const url = item.enclosure.url;
    if (isValidImageUrl(url) && isLikelyContentImage(url, item.enclosure)) {
      return url;
    }
  }

  // 策略 2: media:content / media:thumbnail
  const mediaContent = item['media:content'];
  if (mediaContent) {
    // media:content 可能是数组或单个对象
    const items = Array.isArray(mediaContent) ? mediaContent : [mediaContent];
    for (const mc of items) {
      const url = mc.$?.url || mc.url;
      if (url && isValidImageUrl(url)) {
        return url;
      }
    }
  }

  const mediaThumbnail = item['media:thumbnail'];
  if (mediaThumbnail) {
    const items = Array.isArray(mediaThumbnail) ? mediaThumbnail : [mediaThumbnail];
    for (const mt of items) {
      const url = mt.$?.url || mt.url;
      if (url && isValidImageUrl(url)) {
        return url;
      }
    }
  }

  // 策略 3: 从 content:encoded / content 中提取第一张有效图片
  const content = item['content:encoded'] || item.content;
  if (content) {
    const img = extractFirstValidImage(content);
    if (img) return img;
  }

  // 策略 4: 从 summary / description 中提取
  const summary = item.summary || item.description || '';
  if (summary && summary !== content) {
    const img = extractFirstValidImage(summary);
    if (img) return img;
  }

  return undefined;
}

// 从 HTML 内容中提取第一张有效图片
function extractFirstValidImage(html: string): string | undefined {
  // 匹配所有 <img> 标签的 src
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    if (isValidImageUrl(url)) {
      return url;
    }
  }

  // 尝试匹配 srcset 属性
  const srcsetRegex = /srcset=["']([^"']+)["']/i;
  const srcsetMatch = srcsetRegex.exec(html);
  if (srcsetMatch) {
    const candidates = srcsetMatch[1].split(',');
    for (const candidate of candidates) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url && isValidImageUrl(url)) {
        return url;
      }
    }
  }

  return undefined;
}

// 判断 enclosure 是否为内容图片（而非音频/视频）
function isLikelyContentImage(url: string, enclosure: { type?: string }): boolean {
  const type = enclosure.type || '';
  if (type.startsWith('image/')) return true;
  if (type.startsWith('audio/') || type.startsWith('video/')) return false;
  // 根据 URL 后缀判断
  return /\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?.*)?$/i.test(url);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}
