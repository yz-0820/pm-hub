/**
 * 处理图片 URL
 * 在 Vercel 环境中直接使用原始 URL，避免本地文件系统缓存问题
 */
export function getProxiedImageUrl(originalUrl: string | undefined | null): string | undefined {
  if (!originalUrl) return undefined;
  
  // 直接返回原始 URL，让浏览器处理
  // 对于防盗链问题，使用 img 标签的 referrerPolicy 属性处理
  return originalUrl;
}
