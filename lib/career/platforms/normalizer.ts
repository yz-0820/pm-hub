import { PlatformRawContent, NormalizedContent } from './types';
import { autoClassify } from '@/config/content-sources';
import crypto from 'crypto';
import { decodePlainText } from '@/lib/utils/html-entities';

// 生成唯一内容ID
export function generateContentId(platform: string, originalId: string): string {
  return crypto.createHash('md5').update(`${platform}:${originalId}`).digest('hex').substring(0, 16);
}

// 判断内容类型
export function inferContentType(raw: PlatformRawContent): NormalizedContent['contentType'] {
  if (raw.media?.videoUrl) {
    const duration = raw.media.videoDuration || 0;
    return duration > 0 && duration <= 120 ? 'short_video' : 'video';
  }
  try {
    const u = new URL(raw.originalUrl);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host.includes('douyin.com') || host.includes('iesdouyin.com') || raw.platform === 'douyin') return 'short_video';
    if (host.includes('xiaohongshu.com') || raw.platform === 'xiaohongshu') return 'short_video';
    if (host.includes('bilibili.com') || raw.platform === 'bilibili') {
      if (path.includes('/video/')) return 'video';
      return 'video';
    }
    if (host.includes('youtube.com') || host === 'youtu.be') return 'video';
    if (/\.(mp4|m3u8|mov|mkv|webm)(\?.*)?$/i.test(raw.originalUrl)) return 'video';
  } catch {}
  return 'article';
}

// 主转换函数：将各平台原始数据转换为统一格式
export function normalizeContent(raw: PlatformRawContent): NormalizedContent {
  const contentType = inferContentType(raw);
  const category = autoClassify(raw.title, raw.description);
  const primaryImage = raw.media?.coverUrl || raw.media?.images?.[0] || '';

  return {
    title: decodePlainText(raw.title),
    description: raw.description || '',
    content: raw.content || raw.description || '',
    sourceId: raw.sourceId,
    sourceName: raw.sourceName,
    platform: raw.platform,
    originalUrl: raw.originalUrl,
    originalId: raw.originalId,
    author: raw.author?.name || '',
    authorId: raw.author?.id || '',
    authorAvatar: raw.author?.avatar || '',
    contentType,
    category,
    tags: raw.tags || [],
    coverImage: primaryImage,
    videoUrl: raw.media?.videoUrl || '',
    videoDuration: raw.media?.videoDuration || 0,
    images: raw.media?.images || [],
    viewCount: raw.stats?.views || 0,
    likeCount: raw.stats?.likes || 0,
    commentCount: raw.stats?.comments || 0,
    shareCount: raw.stats?.shares || 0,
    publishedAt: raw.publishedAt,
  };
}

// 批量转换
export function normalizeAll(raws: PlatformRawContent[]): NormalizedContent[] {
  return raws.map(normalizeContent);
}
