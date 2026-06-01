import { describe, expect, it } from 'vitest';
import { validateImageProxyUrl } from '@/lib/utils/image-proxy-validation';

describe('image proxy url validation', () => {
  it('accepts public http and https image URLs', () => {
    expect(validateImageProxyUrl('https://images.unsplash.com/photo.jpg').ok).toBe(true);
    expect(validateImageProxyUrl('http://cdn.example.org/a.png').ok).toBe(true);
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
