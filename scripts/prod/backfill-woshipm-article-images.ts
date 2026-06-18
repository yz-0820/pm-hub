import './load-env';

import { and, eq, isNull, or } from 'drizzle-orm';
import { db, postgresClient } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { validateImageUrl } from '@/lib/rss/image-validator';
import { decodePlainText } from '@/lib/utils/html-entities';

const SOURCE_ID = 'woshipm';
const REQUEST_TIMEOUT_MS = 15_000;

function getArgValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function extractOgImage(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const candidate = pattern.exec(html)?.[1];
    if (!candidate) continue;

    try {
      return new URL(decodePlainText(candidate), pageUrl).toString();
    } catch {
      return null;
    }
  }

  return null;
}

async function fetchArticleImage(pageUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.woshipm.com') return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(parsed, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'error',
    });

    if (!response.ok) return null;
    return extractOgImage(await response.text(), parsed.toString());
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limitValue = Number.parseInt(getArgValue('limit') || '0', 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 100_000;
  const emptyImage = or(isNull(articles.imageUrl), eq(articles.imageUrl, ''));

  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      originalUrl: articles.originalUrl,
    })
    .from(articles)
    .where(and(eq(articles.sourceId, SOURCE_ID), emptyImage))
    .orderBy(articles.id)
    .limit(limit);

  let found = 0;
  let valid = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    const candidate = await fetchArticleImage(row.originalUrl);
    if (!candidate) {
      failed += 1;
      console.log(`[missing] #${row.id} ${row.title}`);
      continue;
    }

    found += 1;
    const validation = await validateImageUrl(candidate);
    if (!validation.valid) {
      failed += 1;
      console.log(`[invalid] #${row.id} ${row.title}: ${validation.reason || 'unknown'}`);
      continue;
    }

    valid += 1;
    console.log(`[${apply ? 'apply' : 'candidate'}] #${row.id} ${row.title}: ${validation.url}`);
    if (!apply) continue;

    const changed = await db
      .update(articles)
      .set({ imageUrl: validation.url, updatedAt: new Date() })
      .where(
        and(
          eq(articles.id, row.id),
          eq(articles.sourceId, SOURCE_ID),
          or(isNull(articles.imageUrl), eq(articles.imageUrl, ''))
        )
      )
      .returning({ id: articles.id });
    updated += changed.length;
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    checked: rows.length,
    found,
    valid,
    failed,
    updated,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresClient.end({ timeout: 5 });
  });
