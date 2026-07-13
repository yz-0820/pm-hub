import { describe, expect, it } from 'vitest';
import { getFigmaImportAllowedOrigins, isFigmaImportOriginAllowed } from '@/lib/tools/figma-cors';

describe('Figma import CORS', () => {
  const productionEnv = {
    NODE_ENV: 'production',
    SITE_URL: 'https://pmhub.icu/tools',
    FIGMA_IMPORT_ALLOWED_ORIGINS: 'https://design.example.com',
  } as NodeJS.ProcessEnv;

  it('allows the configured site, Figma, explicit origins, and requests without Origin', () => {
    const origins = getFigmaImportAllowedOrigins(productionEnv);

    expect(origins).toEqual(new Set(['https://www.figma.com', 'https://pmhub.icu', 'https://design.example.com']));
    expect(isFigmaImportOriginAllowed(null, productionEnv)).toBe(true);
  });

  it('rejects unknown browser origins and production localhost', () => {
    expect(isFigmaImportOriginAllowed('https://attacker.example', productionEnv)).toBe(false);
    expect(isFigmaImportOriginAllowed('http://localhost:3000', productionEnv)).toBe(false);
    expect(isFigmaImportOriginAllowed('null', productionEnv)).toBe(false);
  });
});
