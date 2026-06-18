import { describe, expect, it } from 'vitest';
import { validateImageProxyUrl } from '@/lib/utils/image-proxy-validation';

describe('image proxy url validation', () => {
  it('accepts allowlisted public image URLs', () => {
    expect(validateImageProxyUrl('https://images.unsplash.com/photo.jpg').ok).toBe(true);
    expect(validateImageProxyUrl('https://image.woshipm.com/2026/06/17/cover.png').ok).toBe(true);
  });

  it('rejects hosts outside the allowlist, including lookalikes', () => {
    expect(validateImageProxyUrl('http://cdn.example.org/a.png').ok).toBe(false);
    expect(validateImageProxyUrl('https://image.woshipm.com.evil.test/cover.png').ok).toBe(false);
  });

  it('rejects unsupported protocols and invalid URLs', () => {
    expect(validateImageProxyUrl('file:///etc/passwd').ok).toBe(false);
    expect(validateImageProxyUrl('not-a-url').ok).toBe(false);
  });

  it('blocks localhost and private network hosts', () => {
    expect(validateImageProxyUrl('http://localhost:3000/a.png').ok).toBe(false);
    expect(validateImageProxyUrl('http://127.0.0.1/a.png').ok).toBe(false);
    expect(validateImageProxyUrl('http://192.168.1.2/a.png').ok).toBe(false);
    expect(validateImageProxyUrl('http://169.254.169.254/latest/meta-data').ok).toBe(false);
  });
});
