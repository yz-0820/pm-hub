import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyApiAuth } from '@/lib/utils/api-auth';

function request(headers: Record<string, string> = {}) {
  return new NextRequest('https://pmhub.icu/api/admin/test', { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API authentication', () => {
  it('fails closed when the server API key is missing', async () => {
    vi.stubEnv('API_KEY', '');

    const result = verifyApiAuth(request());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(500);
  });

  it('rejects an invalid bearer token', () => {
    vi.stubEnv('API_KEY', 'expected-secret');

    const result = verifyApiAuth(request({ authorization: 'Bearer wrong-secret' }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(401);
  });

  it('enforces the IP allowlist including CIDR ranges', () => {
    vi.stubEnv('API_KEY', 'expected-secret');
    vi.stubEnv('API_ALLOWLIST_IPS', '203.0.113.0/24');
    const headers = { authorization: 'Bearer expected-secret' };

    expect(verifyApiAuth(request({ ...headers, 'x-forwarded-for': '203.0.113.42' })).success).toBe(true);
    const denied = verifyApiAuth(request({ ...headers, 'x-forwarded-for': '198.51.100.1' }));
    expect(denied.success).toBe(false);
    if (!denied.success) expect(denied.response.status).toBe(403);
  });
});
