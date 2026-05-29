'use client';

import { CareerContent } from '@/lib/db/schema';
import { getDefaultCover, isDefaultCoverImage, platformLabels } from '@/config/content-sources';
import { 
  FileText, 
  Video, 
  Smartphone, 
  Eye, 
  Heart, 
  Play,
  Rss,
  BookOpen,
  MessageSquare,
  MessageCircle,
  AtSign,
  ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { formatCareerDate } from '@/lib/utils/date';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';

interface ContentCardProps {
  content: CareerContent;
  variant?: 'default' | 'compact' | 'featured';
}

// 平台图标映射
const platformIcons: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  xiaohongshu: BookOpen,
  douyin: Video,
  bilibili: Play,
  zhihu: MessageCircle,
  wechat: MessageSquare,
  rss: Rss,
  weibo: AtSign,
};

// 内容类型图标映射
const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  article: FileText,
  video: Video,
  short_video: Smartphone,
  live: Video,
  audio: Video,
};

// 分类标签映射
const categoryLabels: Record<string, string> = {
  communication: '职场沟通',
  productivity: '高效工作',
  teamwork: '团队协作',
  leadership: '领导力',
};

// 分类颜色映射
const categoryColors: Record<string, string> = {
  communication: 'bg-blue-50 text-blue-600 border-blue-100',
  productivity: 'bg-green-50 text-green-600 border-green-100',
  teamwork: 'bg-purple-50 text-purple-600 border-purple-100',
  leadership: 'bg-amber-50 text-amber-600 border-amber-100',
};

function getSafeExternalHref(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'example.com' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.localhost') ||
      host.endsWith('.example.com') ||
      host === 'rsshub.app' ||
      host.endsWith('.rsshub.app')
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function simplifySourceName(sourceName: string, platform: string): string {
  const raw = sourceName.trim();
  if (!raw) return '';
  if (raw.startsWith('人人都是产品经理')) return '人人都是产品经理';
  if (raw.startsWith('36氪')) return '36氪';
  if (raw.startsWith('少数派')) return '少数派';
  if (raw.startsWith('虎嗅')) return '虎嗅';
  if (raw.startsWith('钛媒体')) return '钛媒体';
  if (raw.startsWith('爱范儿')) return '爱范儿';
  if (raw.startsWith('哔哩哔哩')) return '哔哩哔哩';
  if (raw.startsWith('B站')) return '哔哩哔哩';
  if (raw.includes('-')) {
    const base = raw.split('-')[0]?.trim() || '';
    if (base === 'B站') return '哔哩哔哩';
    if (base) return base;
  }
  if (platform === 'bilibili') return '哔哩哔哩';
  return raw;
}

export function ContentCard({ content, variant = 'default' }: ContentCardProps) {
  const displaySourceName =
    (content.sourceName ? simplifySourceName(content.sourceName, content.platform) : '') ||
    (platformLabels[content.platform]?.name) ||
    content.platform;
  const platform = platformLabels[content.platform] || { name: displaySourceName, color: '#666', icon: 'Rss' };
  const displayTitle = content.title;
  
  const PlatformIcon = platformIcons[content.platform] || Rss;
  const TypeIcon = contentTypeIcons[content.contentType] || FileText;
  
  const categoryLabel = categoryLabels[content.category] || '';
  const safeHref = getSafeExternalHref(content.originalUrl);
  if (!safeHref) return null;
  const coverImage =
    content.coverImage && !isDefaultCoverImage(content.coverImage)
      ? content.coverImage
      : getDefaultCover(content.category, content.originalId || content.originalUrl || content.title || String(content.id));
  const proxyCover = getProxiedImageUrl(coverImage);
  const hideSubtitle = content.contentType === 'video' || content.contentType === 'short_video';

  const formatNumber = (num: number): string => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3 rounded-xl border bg-white p-3 transition-all hover:shadow-md"
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
          {proxyCover ? (
            <Image
              src={proxyCover}
              alt={displayTitle}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="64px"
              quality={90}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <TypeIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary">
            {displayTitle}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <PlatformIcon className="h-3 w-3" color={platform.color} />
              {displaySourceName}
            </span>
            <span>·</span>
            <span>{formatCareerDate(content.publishedAt)}</span>
          </div>
        </div>
      </a>
    );
  }

  // 特色模式
  if (variant === 'featured') {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {proxyCover ? (
            <Image
              src={proxyCover}
              alt={displayTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={90}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <TypeIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {(content.contentType === 'video' || content.contentType === 'short_video') && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          )}
          
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span 
              className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
              style={{ color: platform.color }}
            >
              <PlatformIcon className="h-3 w-3" />
              {displaySourceName}
            </span>
            {categoryLabel && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600`}>
                {categoryLabel}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-primary">
            {displayTitle}
          </h3>
          
          {!hideSubtitle && content.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {content.description}
            </p>
          )}
          
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {content.author && <span>{content.author}</span>}
              <span>{formatCareerDate(content.publishedAt)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {(content.viewCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatNumber(content.viewCount ?? 0)}
                </span>
              )}
              {(content.likeCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {formatNumber(content.likeCount ?? 0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </a>
    );
  }

  // 默认模式 - 移动端适配
  return (
    <article className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300">
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image - 移动端全宽，桌面端左侧 */}
          <div className="relative overflow-hidden bg-muted w-full sm:w-48 md:w-64 lg:w-72 shrink-0 aspect-[16/9] sm:aspect-[4/3]">
            {proxyCover ? (
              <Image
                src={proxyCover}
                alt={displayTitle}
                fill
                sizes="(max-width: 640px) 100vw, 256px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                quality={90}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mb-2 opacity-30" />
                <span className="text-xs opacity-50">暂无配图</span>
              </div>
            )}
            
            {/* 视频播放按钮 */}
            {(content.contentType === 'video' || content.contentType === 'short_video') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-primary ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content - 右侧 */}
          <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-center min-w-0 flex-1 gap-2 sm:gap-3">
            {/* Meta row */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {categoryLabel && (
                <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full shrink-0">
                  {categoryLabel}
                </span>
              )}
              <span 
                className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 max-w-[120px] sm:max-w-none truncate"
                title={displaySourceName}
              >
                <PlatformIcon className="h-3 w-3 shrink-0" color={platform.color} />
                <span className="truncate">{displaySourceName}</span>
              </span>
              <span className="text-muted-foreground/40">·</span>
              <time className="text-xs text-muted-foreground shrink-0">{formatCareerDate(content.publishedAt)}</time>
            </div>

            {/* Title */}
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 text-base sm:text-lg md:text-xl leading-snug">
              {displayTitle}
            </h3>

            {/* Summary/Description - 移动端隐藏 */}
            {!hideSubtitle && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 hidden sm:block">
                {content.description || ''}
              </p>
            )}
            
            {/* 互动数据 */}
            {((content.viewCount ?? 0) > 0 || (content.likeCount ?? 0) > 0) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {(content.viewCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(content.viewCount ?? 0)}
                  </span>
                )}
                {(content.likeCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(content.likeCount ?? 0)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}
