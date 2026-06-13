import { validateImageProxyUrl } from '@/lib/utils/image-proxy-validation';

const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
];

const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.bmp',
  '.svg',
];

const IMAGE_TIMEOUT = 5000;
const MIN_IMAGE_BYTES = 1024;

export interface ImageValidationResult {
  valid: boolean;
  url: string;
  reason?: string;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  responseTime?: number;
}

function hasSupportedExtension(url: string) {
  const urlPath = url.split('?')[0].toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => urlPath.endsWith(ext));
}

function validateImageMetadata(result: ImageValidationResult) {
  const contentType = (result.contentType || '').toLowerCase();

  if (result.statusCode && (result.statusCode < 200 || result.statusCode >= 400)) {
    result.reason = `HTTP ${result.statusCode}`;
    return result;
  }

  if (contentType && !contentType.startsWith('image/')) {
    result.reason = `non-image content-type: ${contentType}`;
    return result;
  }

  if (contentType && !SUPPORTED_IMAGE_FORMATS.some((format) => contentType.startsWith(format))) {
    result.reason = `unsupported image type: ${contentType}`;
    return result;
  }

  if (result.contentLength && result.contentLength > 0 && result.contentLength < MIN_IMAGE_BYTES) {
    result.reason = `image too small: ${result.contentLength} bytes`;
    return result;
  }

  if (!contentType && !hasSupportedExtension(result.url)) {
    result.reason = 'missing image content-type and extension';
    return result;
  }

  result.valid = true;
  return result;
}

async function fetchWithTimeout(url: string, method: 'HEAD' | 'GET') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT);

  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function validateImageUrl(url: string): Promise<ImageValidationResult> {
  const validation = validateImageProxyUrl(url);
  const result: ImageValidationResult = {
    valid: false,
    url,
  };

  if (!validation.ok) {
    result.reason = validation.error;
    return result;
  }

  const normalizedUrl = validation.url.toString();
  result.url = normalizedUrl;

  try {
    const startTime = Date.now();
    let response = await fetchWithTimeout(normalizedUrl, 'HEAD');

    if (response.status === 405 || response.status === 403 || response.status === 404) {
      response = await fetchWithTimeout(normalizedUrl, 'GET');
    }

    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;
    result.contentType = response.headers.get('content-type') || '';
    result.contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10);

    if (!result.contentLength && response.status >= 200 && response.status < 400 && response.body) {
      const buffer = await response.arrayBuffer();
      result.contentLength = buffer.byteLength;
    }

    return validateImageMetadata(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      result.reason = `timeout > ${IMAGE_TIMEOUT}ms`;
    } else {
      result.reason = error instanceof Error ? error.message : 'request failed';
    }
    return result;
  }
}

export async function findFirstValidImage(urls: string[]): Promise<string | undefined> {
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((url) => validateImageUrl(url)));
    const valid = results.find((item) => item.valid);
    if (valid) return valid.url;
  }
  return undefined;
}
