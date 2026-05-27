// 各平台原始数据格式
export interface PlatformRawContent {
  platform: 'xiaohongshu' | 'douyin' | 'bilibili' | 'zhihu' | 'wechat' | 'rss' | 'weibo';
  sourceId: string;
  sourceName: string;
  originalId: string;
  originalUrl: string;
  title: string;
  description?: string;
  content?: string;
  author: { name?: string; id?: string; avatar?: string };
  media: { coverUrl?: string; videoUrl?: string; videoDuration?: number; images?: string[] };
  stats: { views?: number; likes?: number; comments?: number; shares?: number };
  tags?: string[];
  publishedAt: Date;
  rawData?: unknown;
}

// 统一化后的标准内容格式（映射到career_contents表）
export interface NormalizedContent {
  title: string;
  description: string;
  content: string;
  sourceId: string;
  sourceName: string;
  platform: string;
  originalUrl: string;
  originalId: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  contentType: 'article' | 'video' | 'short_video' | 'live' | 'audio';
  category: string; // 由autoClassify填充
  tags: string[];
  coverImage: string;
  videoUrl: string;
  videoDuration: number;
  images: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: Date;
}
