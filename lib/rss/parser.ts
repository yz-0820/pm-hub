import Parser from 'rss-parser';
import { ParsedArticle } from '@/types';

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'PM-Website-RSS-Bot/1.0',
  },
});

export async function parseRSSFeed(feedUrl: string): Promise<ParsedArticle[]> {
  try {
    const feed = await rssParser.parseURL(feedUrl);
    
    return feed.items.map((item) => ({
      title: item.title || '无标题',
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      content: item['content:encoded'] || item.content,
      summary: item.summary || item.contentSnippet || '',
      author: item.author || item.creator,
      categories: item.categories || [],
      imageUrl: extractImageUrl(item),
    }));
  } catch (error) {
    console.error(`Failed to parse RSS feed: ${feedUrl}`, error);
    return [];
  }
}

function extractImageUrl(item: any): string | undefined {
  // 尝试从 enclosure 获取
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  
  // 从内容中提取第一张图片
  const content = item['content:encoded'] || item.content;
  if (content) {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1];
  }
  
  // 尝试从 media:content 获取
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }
  
  return undefined;
}

export function generateSlug(title: string): string {
  // 使用 Unicode 属性转义支持中文、日文、韩文等
  return title
    .toLowerCase()
    // 保留字母、数字、中文、日文、韩文、空格和连字符
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    // 将空格替换为连字符
    .replace(/\s+/g, '-')
    // 移除连续的连字符
    .replace(/-+/g, '-')
    // 移除首尾连字符
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
