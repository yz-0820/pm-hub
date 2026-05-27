function normalizeCandidateUrl(candidate: string, baseUrl: string): string {
  const trimmed = candidate.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return '';
  try {
    const raw = new URL(trimmed, baseUrl).toString();
    if (raw.includes('.hdslb.com/')) {
      const idx = raw.indexOf('@');
      if (idx > 0) {
        const base = raw.slice(0, idx);
        return `${base}@1280w_720h_1c`;
      }
    }
    return raw;
  } catch {
    return '';
  }
}

function pickMeta(html: string, key: string): string {
  const p1 = new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, 'i');
  const m1 = p1.exec(html);
  if (m1?.[1]) return m1[1];
  const m2 = p2.exec(html);
  if (m2?.[1]) return m2[1];
  return '';
}

function pickNameMeta(html: string, key: string): string {
  const p1 = new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, 'i');
  const m1 = p1.exec(html);
  if (m1?.[1]) return m1[1];
  const m2 = p2.exec(html);
  if (m2?.[1]) return m2[1];
  return '';
}

function pickLinkRel(html: string, rel: string): string {
  const p1 = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["'][^>]*>`, 'i');
  const p2 = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["'][^>]*>`, 'i');
  const m1 = p1.exec(html);
  if (m1?.[1]) return m1[1];
  const m2 = p2.exec(html);
  if (m2?.[1]) return m2[1];
  return '';
}

function pickFirstImg(html: string): string {
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return m?.[1] || '';
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    const text = await res.text();
    return text || '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function pickItemProp(html: string, key: string): string {
  const p1 = new RegExp(`<meta[^>]+itemprop=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']${key}["'][^>]*>`, 'i');
  const m1 = p1.exec(html);
  if (m1?.[1]) return m1[1];
  const m2 = p2.exec(html);
  if (m2?.[1]) return m2[1];
  return '';
}

function parsePublishedAtFromHtml(html: string): Date | undefined {
  const uploadDate = pickItemProp(html, 'uploadDate') || pickItemProp(html, 'datePublished') || pickMeta(html, 'article:published_time');
  if (uploadDate) {
    const d = new Date(uploadDate);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const m1 = /"pubdate"\s*:\s*(\d{9,13})/i.exec(html);
  if (m1?.[1]) {
    const n = Number(m1[1]);
    if (Number.isFinite(n)) {
      const ms = n < 10_000_000_000 ? n * 1000 : n;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  return undefined;
}

export async function extractMetaFromUrl(url: string): Promise<{ cover: string; publishedAt?: Date }> {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { cover: '' };
  } catch {
    return { cover: '' };
  }

  const html = await fetchHtml(url);
  if (!html) return { cover: '' };

  const candidates = [
    pickMeta(html, 'og:image'),
    pickMeta(html, 'og:image:url'),
    pickNameMeta(html, 'twitter:image'),
    pickNameMeta(html, 'twitter:image:src'),
    pickLinkRel(html, 'image_src'),
    pickFirstImg(html),
  ]
    .map((c) => normalizeCandidateUrl(c, url))
    .filter(Boolean);

  const filtered = candidates.filter((c) => {
    const l = c.toLowerCase();
    if (l.includes('logo') || l.includes('avatar') || l.includes('icon') || l.includes('favicon')) return false;
    return true;
  });

  const cover = filtered[0] || candidates[0] || '';
  const publishedAt = parsePublishedAtFromHtml(html);
  return { cover, publishedAt };
}

export async function extractCoverFromUrl(url: string): Promise<string> {
  const meta = await extractMetaFromUrl(url);
  return meta.cover;
}
