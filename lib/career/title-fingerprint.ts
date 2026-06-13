export const MIN_CAREER_TITLE_FINGERPRINT_LENGTH = 8;

export interface CareerDuplicateCandidate {
  id?: number | null;
  qualityScore?: number | null;
  matchScore?: number | null;
  originalUrl?: string | null;
  description?: string | null;
  content?: string | null;
  publishedAt?: Date | null;
}

const TITLE_PUNCTUATION_RE = /[\s\p{P}\p{S}]+/gu;

export function normalizeCareerTitle(title: string): string {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(TITLE_PUNCTUATION_RE, '')
    .trim();
}

export function canUseCareerTitleFingerprint(title: string): boolean {
  return normalizeCareerTitle(title).length >= MIN_CAREER_TITLE_FINGERPRINT_LENGTH;
}

function stableUrlScore(url?: string | null): number {
  if (!url) return 0;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) return 0;
    if (host === 'example.com' || host.endsWith('.example.com')) return 0;
    if (host === 'rsshub.app' || host.endsWith('.rsshub.app')) return 0;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 0;
    return 1;
  } catch {
    return 0;
  }
}

function textCompletenessScore(candidate: CareerDuplicateCandidate): number {
  return (candidate.description?.length || 0) + Math.min(candidate.content?.length || 0, 1000);
}

export function compareCareerDuplicateCandidates(
  a: CareerDuplicateCandidate,
  b: CareerDuplicateCandidate
): number {
  const scoreDelta = (a.qualityScore || 0) + (a.matchScore || 0) - ((b.qualityScore || 0) + (b.matchScore || 0));
  if (scoreDelta !== 0) return scoreDelta;

  const urlDelta = stableUrlScore(a.originalUrl) - stableUrlScore(b.originalUrl);
  if (urlDelta !== 0) return urlDelta;

  const completenessDelta = textCompletenessScore(a) - textCompletenessScore(b);
  if (completenessDelta !== 0) return completenessDelta;

  const publishedDelta = (a.publishedAt?.getTime() || 0) - (b.publishedAt?.getTime() || 0);
  if (publishedDelta !== 0) return publishedDelta;

  return (a.id || 0) - (b.id || 0);
}

