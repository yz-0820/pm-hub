/**
 * Archive duplicate Career contents with the same normalized title.
 *
 * Dry-run:
 *   npm run career:dedupe
 *
 * Apply:
 *   npm run career:dedupe -- --apply
 */

import './load-env';

import { db, postgresClient } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import {
  canUseCareerTitleFingerprint,
  compareCareerDuplicateCandidates,
  normalizeCareerTitle,
} from '@/lib/career/title-fingerprint';
import { eq, inArray } from 'drizzle-orm';

type CareerRow = Pick<
  typeof careerContents.$inferSelect,
  | 'id'
  | 'title'
  | 'status'
  | 'category'
  | 'sourceName'
  | 'originalUrl'
  | 'qualityScore'
  | 'matchScore'
  | 'publishedAt'
>;

const apply = process.argv.includes('--apply');
const QUERY_TIMEOUT_MS = 60_000;

function selectKeeper(rows: CareerRow[]): CareerRow {
  return [...rows].sort((a, b) => compareCareerDuplicateCandidates(b, a))[0];
}

function formatRow(row: CareerRow): string {
  const score = (row.qualityScore || 0) + (row.matchScore || 0);
  return `#${row.id} score=${score} status=${row.status} category=${row.category} source=${row.sourceName} title=${row.title}`;
}

async function main() {
  console.log(`Mode: ${apply ? 'apply' : 'dry-run'}`);
  console.log('Scanning active/pending Career contents...');

  const rows = await Promise.race([
    db
      .select({
        id: careerContents.id,
        title: careerContents.title,
        status: careerContents.status,
        category: careerContents.category,
        sourceName: careerContents.sourceName,
        originalUrl: careerContents.originalUrl,
        qualityScore: careerContents.qualityScore,
        matchScore: careerContents.matchScore,
        publishedAt: careerContents.publishedAt,
      })
      .from(careerContents)
      .where(inArray(careerContents.status, ['active', 'pending'])),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Career duplicate scan timed out after ${QUERY_TIMEOUT_MS / 1000}s`)), QUERY_TIMEOUT_MS);
    }),
  ]);

  const groups = new Map<string, CareerRow[]>();
  for (const row of rows) {
    if (!canUseCareerTitleFingerprint(row.title)) continue;
    const fingerprint = normalizeCareerTitle(row.title);
    const group = groups.get(fingerprint) || [];
    group.push(row);
    groups.set(fingerprint, group);
  }

  const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);
  const archiveIds: number[] = [];

  console.log(`Scanned active/pending rows: ${rows.length}`);
  console.log(`Duplicate title groups: ${duplicateGroups.length}\n`);

  for (const group of duplicateGroups) {
    const keeper = selectKeeper(group);
    const archived = group.filter((row) => row.id !== keeper.id);
    archiveIds.push(...archived.map((row) => row.id));

    console.log(`Fingerprint: ${normalizeCareerTitle(keeper.title)}`);
    console.log(`  KEEP    ${formatRow(keeper)}`);
    for (const row of archived) {
      console.log(`  ARCHIVE ${formatRow(row)}`);
    }
    console.log('');
  }

  if (!apply) {
    console.log(`Dry-run only. Would archive ${archiveIds.length} rows.`);
    return;
  }

  if (archiveIds.length === 0) {
    console.log('No duplicate rows to archive.');
    return;
  }

  for (const id of archiveIds) {
    await db.update(careerContents)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(careerContents.id, id));
  }

  const { invalidateContentCache } = await import('@/lib/career/cache');
  await invalidateContentCache();

  console.log(`Archived ${archiveIds.length} duplicate rows and invalidated Career cache.`);
}

main()
  .then(async () => {
    await postgresClient.end({ timeout: 5 });
  })
  .catch(async (error) => {
    console.error('Career title de-duplication failed:', error);
    await postgresClient.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  });
