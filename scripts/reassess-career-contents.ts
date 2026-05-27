import Database from 'better-sqlite3';
import { assessQuality, evaluateBestCategoryMatch } from '../lib/career/quality';
import { isAllowedExternalUrl } from '../lib/career/url-validator';
import { NormalizedContent } from '../lib/career/platforms/types';

function toDate(value: unknown): Date {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return new Date();
  if (n > 1e12) return new Date(n);
  if (n > 1e9) return new Date(n * 1000);
  return new Date();
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(v => String(v)) : [];
  } catch {
    return [];
  }
}

function main() {
  const db = new Database('./data/sqlite.db');

  const rows = db.prepare(
    `SELECT
      id,
      title,
      COALESCE(description, '') AS description,
      COALESCE(content, '') AS content,
      source_id AS sourceId,
      source_name AS sourceName,
      platform,
      original_url AS originalUrl,
      COALESCE(original_id, '') AS originalId,
      COALESCE(author, '') AS author,
      COALESCE(author_id, '') AS authorId,
      COALESCE(author_avatar, '') AS authorAvatar,
      COALESCE(content_type, 'article') AS contentType,
      COALESCE(category, 'all') AS category,
      COALESCE(tags, '') AS tags,
      COALESCE(cover_image, '') AS coverImage,
      COALESCE(video_url, '') AS videoUrl,
      COALESCE(video_duration, 0) AS videoDuration,
      COALESCE(images, '') AS images,
      COALESCE(view_count, 0) AS viewCount,
      COALESCE(like_count, 0) AS likeCount,
      COALESCE(comment_count, 0) AS commentCount,
      COALESCE(share_count, 0) AS shareCount,
      published_at AS publishedAt,
      COALESCE(status, 'pending') AS status
     FROM career_contents`
  ).all() as Array<Record<string, unknown>>;

  const update = db.prepare(
    `UPDATE career_contents
     SET
       status = ?,
       category = ?,
       quality_score = ?,
       quality_reasons = ?,
       match_score = ?,
       match_keywords = ?,
       match_core_matched = ?,
       match_core_missing = ?,
       updated_at = unixepoch()
     WHERE id = ?`
  );

  let updated = 0;
  let active = 0;
  let pending = 0;
  let rejected = 0;

  const tx = db.transaction((items: Array<Record<string, unknown>>) => {
    for (const row of items) {
      const content: NormalizedContent = {
        title: String(row.title || ''),
        description: String(row.description || ''),
        content: String(row.content || ''),
        sourceId: String(row.sourceId || ''),
        sourceName: String(row.sourceName || ''),
        platform: String(row.platform || ''),
        originalUrl: String(row.originalUrl || ''),
        originalId: String(row.originalId || ''),
        author: String(row.author || ''),
        authorId: String(row.authorId || ''),
        authorAvatar: String(row.authorAvatar || ''),
        contentType: String(row.contentType || 'article') as NormalizedContent['contentType'],
        category: String(row.category || 'all'),
        tags: parseJsonArray(row.tags),
        coverImage: String(row.coverImage || ''),
        videoUrl: String(row.videoUrl || ''),
        videoDuration: Number(row.videoDuration || 0) || 0,
        images: parseJsonArray(row.images),
        viewCount: Number(row.viewCount || 0) || 0,
        likeCount: Number(row.likeCount || 0) || 0,
        commentCount: Number(row.commentCount || 0) || 0,
        shareCount: Number(row.shareCount || 0) || 0,
        publishedAt: toDate(row.publishedAt),
      };

      const quality = assessQuality(content);
      const bestMatch = evaluateBestCategoryMatch(content);
      const matchPassed = bestMatch.matched;

      const isHardReject =
        quality.reasons.includes('非中文内容（仅保留中文文章与视频）') ||
        quality.reasons.includes('检测到大量疑似广告/垃圾信息') ||
        quality.reasons.includes('疑似财经/投资内容（非职业发展主题）') ||
        quality.reasons.includes('非职业发展视频（产品技能课程）');

      const urlOk = isHardReject ? true : isAllowedExternalUrl(content.originalUrl);
      const status = (!urlOk || isHardReject) ? 'rejected' : (quality.passed && matchPassed ? 'active' : 'pending');
      const category = matchPassed ? bestMatch.category : 'all';

      const reasons = quality.reasons.length > 0 ? JSON.stringify(quality.reasons) : null;
      const keywords = bestMatch.keywords.length > 0 ? JSON.stringify(bestMatch.keywords) : null;
      const coreMissing = bestMatch.coreMissing.length > 0 ? JSON.stringify(bestMatch.coreMissing) : null;
      const coreMatched = bestMatch.coreMatched ? 1 : 0;

      update.run(
        status,
        category,
        quality.score,
        reasons,
        bestMatch.matchScore,
        keywords,
        coreMatched,
        coreMissing,
        Number(row.id)
      );

      updated++;
      if (status === 'active') active++;
      if (status === 'pending') pending++;
      if (status === 'rejected') rejected++;
    }
  });

  tx(rows);
  db.close();

  console.log(`Reassessed ${updated} career contents`);
  console.log(`active=${active} pending=${pending} rejected=${rejected}`);
}

main();
