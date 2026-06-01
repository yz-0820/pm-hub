import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

type VideoLink = {
  platform: 'bilibili' | 'douyin' | 'xiaohongshu';
  category?: string;
  title: string;
  url: string;
  publishedAt?: string;
};

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function guessPlatform(url: string): VideoLink['platform'] | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('bilibili.com')) return 'bilibili';
    if (host.includes('douyin.com') || host.includes('iesdouyin.com')) return 'douyin';
    if (host.includes('xiaohongshu.com')) return 'xiaohongshu';
    return null;
  } catch {
    return null;
  }
}

function getCategoryHint(category?: string): string {
  switch (category) {
    case 'communication':
      return '职场沟通 沟通技巧 汇报 表达 向上管理 跨部门';
    case 'productivity':
      return '高效工作 时间管理 优先级 复盘 工作方法 效率';
    case 'teamwork':
      return '团队协作 协同 会议 共识 推进 项目管理';
    case 'leadership':
      return '领导力 管理 带团队 激励 目标 绩效';
    default:
      return '职业发展 职场成长';
  }
}

function getSiteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}`;
  }

  return `http://localhost:${process.env.PORT || '3000'}`;
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const platform = u.searchParams.get('platform');
  const siteUrl = getSiteUrl();

  const filePath = path.join(process.cwd(), 'data', 'career-video-links.json');
  const raw = await readFile(filePath, 'utf8');
  const list = JSON.parse(raw) as VideoLink[];

  const filtered = list.filter((item) => {
    const p = item.platform || guessPlatform(item.url);
    if (!p) return false;
    if (platform && platform !== 'all' && p !== platform) return false;
    return true;
  });

  const now = new Date().toUTCString();
  const fallbackPubDate = new Date(0).toUTCString();
  const itemsXml = filtered
    .map((item) => {
      const pubDate = item.publishedAt ? new Date(item.publishedAt).toUTCString() : fallbackPubDate;
      const hint = getCategoryHint(item.category);
      const desc = hint;
      return [
        '<item>',
        `<title>${esc(item.title || '')}</title>`,
        `<description><![CDATA[${desc}]]></description>`,
        item.category ? `<category>${esc(item.category)}</category>` : '',
        `<link>${esc(item.url)}</link>`,
        `<guid isPermaLink="true">${esc(item.url)}</guid>`,
        `<pubDate>${esc(pubDate)}</pubDate>`,
        '</item>',
      ].join('');
    })
    .join('');

  const channelTitle = platform ? `PM Hub 视频精选 - ${platform}` : 'PM Hub 视频精选';
  const channelLink = `${siteUrl}/career`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0">` +
    `<channel>` +
    `<title>${esc(channelTitle)}</title>` +
    `<link>${esc(channelLink)}</link>` +
    `<description>${esc('视频链接聚合')}</description>` +
    `<lastBuildDate>${esc(now)}</lastBuildDate>` +
    itemsXml +
    `</channel>` +
    `</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
