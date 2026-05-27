export function simplifyArticleSourceName(sourceName: string): string {
  const raw = String(sourceName || '').trim();
  if (!raw) return '';
  if (raw.startsWith('36氪')) return '36氪';
  return raw;
}

