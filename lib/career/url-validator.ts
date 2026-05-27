const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const DISALLOWED_HOSTS = new Set([
  'example.com',
  'localhost',
  '127.0.0.1',
  'rsshub.app',
]);

export function isAllowedExternalUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (DISALLOWED_HOSTS.has(host)) return false;
    if (host.endsWith('.example.com') || host.endsWith('.localhost') || host.endsWith('.rsshub.app')) return false;
    return true;
  } catch {
    return false;
  }
}

export interface ExternalUrlValidationResult {
  ok: boolean;
  status?: number;
  finalUrl?: string;
  reason?: string;
}

export async function validateExternalUrl(url: string, timeoutMs: number = 5000): Promise<ExternalUrlValidationResult> {
  if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'disallowed_url' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const tryRequest = async (method: 'HEAD' | 'GET') => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
      },
    });
    return res;
  };

  try {
    let res = await tryRequest('HEAD');
    if (res.status === 405 || res.status === 501) {
      res = await tryRequest('GET');
    }
    const status = res.status;
    if (status < 200 || status >= 400) {
      clearTimeout(timer);
      return { ok: false, status, reason: `http_${status}` };
    }
    const finalUrl = res.url || url;
    clearTimeout(timer);
    if (!isAllowedExternalUrl(finalUrl)) return { ok: false, status, reason: 'redirect_to_disallowed' };
    return { ok: true, status, finalUrl };
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof Error && e.name === 'AbortError') return { ok: false, reason: 'timeout' };
    if (e instanceof Error) return { ok: false, reason: e.message || 'request_failed' };
    return { ok: false, reason: 'request_failed' };
  }
}
