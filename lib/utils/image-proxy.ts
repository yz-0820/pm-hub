/**
 * 将原始图片 URL 转换为通过本地代理访问的 URL
 * 用于绕过第三方图片防盗链
 */
export function getProxiedImageUrl(originalUrl: string | undefined | null): string | undefined {
  if (!originalUrl) return undefined;
  try {
    const encoded = encodeURIComponent(originalUrl);
    return `/api/image-proxy?url=${encoded}`;
  } catch {
    return undefined;
  }
}
