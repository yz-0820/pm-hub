import { db, postgresClient } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { assessQuality, evaluateBestCategoryMatch, hasCareerRelevance } from '@/lib/career/quality';
import { isAllowedExternalUrl } from '@/lib/career/url-validator';
import { NormalizedContent } from '@/lib/career/platforms/types';
import { eq } from 'drizzle-orm';

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function toNormalized(row: typeof careerContents.$inferSelect): NormalizedContent {
  return {
    title: row.title || '',
    description: row.description || '',
    content: row.content || '',
    sourceId: row.sourceId || '',
    sourceName: row.sourceName || '',
    platform: row.platform || '',
    originalUrl: row.originalUrl || '',
    originalId: row.originalId || '',
    author: row.author || '',
    authorId: row.authorId || '',
    authorAvatar: row.authorAvatar || '',
    contentType: row.contentType as NormalizedContent['contentType'],
    category: row.category || 'all',
    tags: parseJsonArray(row.tags),
    coverImage: row.coverImage || '',
    videoUrl: row.videoUrl || '',
    videoDuration: row.videoDuration || 0,
    images: parseJsonArray(row.images),
    viewCount: row.viewCount || 0,
    likeCount: row.likeCount || 0,
    commentCount: row.commentCount || 0,
    shareCount: row.shareCount || 0,
    publishedAt: row.publishedAt,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const rows = await db.select().from(careerContents);

  let changed = 0;
  const nextCounts: Record<string, number> = { active: 0, pending: 0, rejected: 0 };
  const examples: string[] = [];

  for (const row of rows) {
    const content = toNormalized(row);
    const quality = assessQuality(content);
    const bestMatch = evaluateBestCategoryMatch(content);
    const careerRelevance = hasCareerRelevance(content);
    const isNonRelevant = !careerRelevance.relevant;

    const isHardReject =
      quality.reasons.includes('非中文内容（仅保留中文文章与视频）') ||
      quality.reasons.includes('检测到大量疑似广告/垃圾信息') ||
      quality.reasons.includes('疑似财经/投资内容（非职业发展主题）') ||
      quality.reasons.includes('非职业发展视频（产品技能课程）');

    const urlOk = isHardReject ? true : isAllowedExternalUrl(content.originalUrl);
    const status =
      !urlOk || isHardReject
        ? 'rejected'
        : quality.passed && bestMatch.matched && !isNonRelevant
          ? 'active'
          : isNonRelevant
            ? 'rejected'
            : 'pending';
    const category = bestMatch.matched && !isNonRelevant ? bestMatch.category : 'all';
    nextCounts[status] = (nextCounts[status] || 0) + 1;

    const reasons = [
      ...quality.reasons,
      ...(isNonRelevant ? [careerRelevance.reason] : []),
    ];
    const qualityReasons = reasons.length > 0 ? JSON.stringify(reasons) : null;
    const matchKeywords = bestMatch.keywords.length > 0 ? JSON.stringify(bestMatch.keywords) : null;
    const matchCoreMissing = bestMatch.coreMissing.length > 0 ? JSON.stringify(bestMatch.coreMissing) : null;

    const rowChanged =
      row.status !== status ||
      row.category !== category ||
      row.qualityScore !== quality.score ||
      row.matchScore !== bestMatch.matchScore ||
      row.matchCoreMatched !== bestMatch.coreMatched;

    if (!rowChanged) continue;
    changed++;
    if (examples.length < 10) {
      examples.push(`#${row.id} ${row.status}/${row.category} -> ${status}/${category}: ${row.title}`);
    }

    if (apply) {
      await db
        .update(careerContents)
        .set({
          status,
          category,
          qualityScore: quality.score,
          qualityReasons,
          matchScore: bestMatch.matchScore,
          matchKeywords,
          matchCoreMatched: bestMatch.coreMatched,
          matchCoreMissing,
          updatedAt: new Date(),
        })
        .where(eq(careerContents.id, row.id));
    }
  }

  console.log(`${apply ? 'Applied' : 'Dry run'} career reassessment`);
  console.log(`total=${rows.length} changed=${changed}`);
  console.log(`next active=${nextCounts.active || 0} pending=${nextCounts.pending || 0} rejected=${nextCounts.rejected || 0}`);
  if (examples.length > 0) {
    console.log('examples:');
    for (const item of examples) console.log(`- ${item}`);
  }

  await postgresClient.end();
}

main().catch(async (error) => {
  console.error(error);
  await postgresClient.end();
  process.exit(1);
});
