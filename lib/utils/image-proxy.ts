export function getProxiedImageUrl(originalUrl: string | undefined | null): string | undefined {
  if (!originalUrl) return undefined;

  const trimmed = originalUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/api/image-proxy')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return undefined;
  }
}
