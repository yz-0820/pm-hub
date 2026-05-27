import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { careerContents, contentSources } from '@/lib/db/schema';
import { and, desc, eq, notLike, sql } from 'drizzle-orm';

function getChannelType(sourceId: string, platform: string, url: string): string {
  const lowerId = sourceId.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (platform === 'bilibili' || platform === 'douyin') return 'video';
  if (platform === 'xiaohongshu') return 'community';
  if (platform === 'wechat') return 'wechat';
  if (platform === 'zhihu') return 'qa';

  if (lowerId.startsWith('woshipm-') || lowerUrl.includes('woshipm.com')) return 'industry-community';
  if (lowerUrl.includes('sspai.com')) return 'productivity-media';
  if (lowerUrl.includes('36kr.com')) return 'business-media';
  if (lowerUrl.includes('huxiu.com')) return 'business-analysis';
  if (lowerUrl.includes('tmtpost.com')) return 'industry-media';
  if (lowerUrl.includes('ifanr.com')) return 'tech-media';

  return 'website';
}

export async function GET() {
  try {
    const now = Date.now();

    const sources = await db.query.contentSources.findMany({
      where: eq(contentSources.enabled, true),
      orderBy: [desc(contentSources.updatedAt)],
    });

    const sourceStatus = sources.map(s => {
      const lastFetchAtMs = s.lastFetchAt ? s.lastFetchAt.getTime() : null;
      const fetchIntervalMs = Math.max(0, (s.fetchInterval || 0) * 1000);
      const lagMs = lastFetchAtMs ? now - lastFetchAtMs : null;
      const isStale =
        !lastFetchAtMs || (fetchIntervalMs > 0 && lagMs !== null && lagMs > fetchIntervalMs * 2 + 5 * 60_000);

      return {
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
        platform: s.platform,
        category: s.category,
        url: s.url,
        fetchIntervalSeconds: s.fetchInterval || 0,
        lastFetchAt: s.lastFetchAt ? s.lastFetchAt.toISOString() : null,
        lastFetchCount: s.lastFetchCount || 0,
        lastError: s.lastError || null,
        isHealthy: !!s.isHealthy,
        isStale,
        channelType: getChannelType(s.sourceId, s.platform, s.url),
      };
    });

    const enabledChannelTypes = Array.from(new Set(sourceStatus.map(s => s.channelType)));
    const meetsChannelDiversity = enabledChannelTypes.length >= 5;

    const activeConditions = and(
      eq(careerContents.status, 'active'),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%')
    );

    const latestContent = await db.query.careerContents.findFirst({
      where: activeConditions,
      orderBy: [desc(careerContents.publishedAt)],
      columns: { publishedAt: true },
    });

    const totalActive = await db
      .select({ count: sql<number>`count(*)` })
      .from(careerContents)
      .where(activeConditions);

    const latestPublishedAtMs = latestContent?.publishedAt?.getTime() || 0;
    const isContentStale = !latestPublishedAtMs || now - latestPublishedAtMs > 72 * 60 * 60_000;

    return NextResponse.json({
      success: true,
      data: {
        sources: sourceStatus,
        channelDiversity: {
          enabledChannelTypes,
          meetsRequirement: meetsChannelDiversity,
          requiredTypes: 5,
        },
        contentFreshness: {
          latestPublishedAt: latestContent?.publishedAt?.toISOString() || null,
          stale: isContentStale,
          thresholdHours: 72,
        },
        totals: {
          activeContents: totalActive[0]?.count || 0,
          enabledSources: sourceStatus.length,
        },
        timestamp: now,
      },
    });
  } catch (error) {
    console.error('Error fetching career health:', error);
    return NextResponse.json(
      { success: false, error: '获取职业发展健康状态失败', timestamp: Date.now() },
      { status: 500 }
    );
  }
}

