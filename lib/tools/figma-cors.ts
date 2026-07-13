const DEFAULT_FIGMA_ORIGIN = 'https://www.figma.com';

function normalizedOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getFigmaImportAllowedOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const configured = (env.FIGMA_IMPORT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => normalizedOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
  const siteOrigin = normalizedOrigin(env.SITE_URL);

  return new Set([
    DEFAULT_FIGMA_ORIGIN,
    ...(siteOrigin ? [siteOrigin] : []),
    ...(env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
    ...configured,
  ]);
}

export function isFigmaImportOriginAllowed(
  origin: string | null,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!origin) return true;
  const normalized = normalizedOrigin(origin);
  return normalized !== null && getFigmaImportAllowedOrigins(env).has(normalized);
}
