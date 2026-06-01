import { readFile } from 'node:fs/promises';
import path from 'node:path';

const validCategories = new Set(['communication', 'productivity', 'teamwork', 'leadership']);

type VideoLink = {
  platform?: string;
  category?: string;
  title?: string;
  url?: string;
  publishedAt?: string;
};

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  return parsed.toString().toLowerCase();
}

function isBilibiliUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' && (host === 'www.bilibili.com' || host.endsWith('.bilibili.com'));
  } catch {
    return false;
  }
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'career-video-links.json');
  const raw = await readFile(filePath, 'utf8');
  const data = JSON.parse(raw) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('data/career-video-links.json must be an array');
  }

  const errors: string[] = [];
  const seenUrls = new Map<string, number>();
  const counts = new Map<string, number>();

  data.forEach((item: VideoLink, index: number) => {
    const label = `#${index + 1}`;

    if (item.platform !== 'bilibili') {
      errors.push(`${label}: platform must be "bilibili"`);
    }

    if (!item.category || !validCategories.has(item.category)) {
      errors.push(`${label}: category must be one of ${Array.from(validCategories).join(', ')}`);
    } else {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }

    if (!item.title?.trim()) {
      errors.push(`${label}: title is required`);
    }

    if (!item.url?.trim()) {
      errors.push(`${label}: url is required`);
    } else if (!isBilibiliUrl(item.url)) {
      errors.push(`${label}: url must be a https bilibili.com link`);
    } else {
      const normalized = normalizeUrl(item.url);
      const previous = seenUrls.get(normalized);
      if (previous) {
        errors.push(`${label}: duplicate url with #${previous}`);
      } else {
        seenUrls.set(normalized, index + 1);
      }
    }

    if (item.publishedAt) {
      const parsed = new Date(item.publishedAt);
      if (Number.isNaN(parsed.getTime())) {
        errors.push(`${label}: publishedAt must be a valid date`);
      }
    }
  });

  if (errors.length > 0) {
    console.error('Career video link validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Validated ${data.length} Bilibili video links.`);
  for (const category of validCategories) {
    console.log(`- ${category}: ${counts.get(category) || 0}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
