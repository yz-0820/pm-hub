/**
 * 图片可用性验证工具
 * 通过实际 HTTP 请求验证图片 URL 是否可访问、格式正确、可正常下载
 */

// 支持的图片格式
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
];

// 支持的图片文件后缀
const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.svg',
];

// 图片加载超时时间（毫秒）
const IMAGE_TIMEOUT = 3000;

export interface ImageValidationResult {
  valid: boolean;
  url: string;
  reason?: string;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  responseTime?: number;
}

/**
 * 验证单张图片 URL 的可用性
 * - 发送 HEAD 请求检查状态码和 Content-Type
 * - 验证图片格式是否支持
 * - 超时 3 秒判定为不可用
 */
export async function validateImageUrl(url: string): Promise<ImageValidationResult> {
  const result: ImageValidationResult = { valid: false, url };

  try {
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;
    result.contentType = response.headers.get('content-type') || '';
    result.contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // 检查 HTTP 状态码
    if (response.status < 200 || response.status >= 400) {
      result.reason = `HTTP ${response.status}`;
      return result;
    }

    // 检查 Content-Type 是否为图片
    const contentType = result.contentType.toLowerCase();
    if (contentType && !contentType.startsWith('image/')) {
      result.reason = `非图片类型: ${contentType}`;
      return result;
    }

    // 检查图片格式是否支持
    if (contentType && !SUPPORTED_IMAGE_FORMATS.some(f => contentType.startsWith(f))) {
      result.reason = `不支持的图片格式: ${contentType}`;
      return result;
    }

    // 检查文件大小（小于 1KB 可能是占位图或错误响应）
    if (result.contentLength > 0 && result.contentLength < 1024) {
      result.reason = `文件过小: ${result.contentLength} bytes`;
      return result;
    }

    // 检查 URL 后缀（作为额外验证）
    const urlPath = url.split('?')[0].toLowerCase();
    const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext => urlPath.endsWith(ext));
    // URL 后缀不匹配不一定是错误（很多 CDN URL 没有后缀），仅作为警告
    if (!hasValidExtension && !contentType) {
      result.reason = `无图片后缀且无 Content-Type`;
      return result;
    }

    result.valid = true;
    return result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === 'AbortError') {
      result.reason = `加载超时 (>${IMAGE_TIMEOUT}ms)`;
    } else {
      result.reason = `请求失败: ${error.message || 'Unknown'}`;
    }
    return result;
  }
}

/**
 * 批量验证多张图片，返回第一张有效图片的 URL
 * 用于文章有多张候选图片时选择最优的一张
 */
export async function findFirstValidImage(urls: string[]): Promise<string | undefined> {
  // 并行验证，最多同时 3 个
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(url => validateImageUrl(url)));
    const valid = results.find(r => r.valid);
    if (valid) return valid.url;
  }
  return undefined;
}
