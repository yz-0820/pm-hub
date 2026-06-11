/**
 * 基于内存的 IP 限流器
 * 用于限制 AI 工具 API 的请求频率
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// 每 10 分钟清理一次过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 时间窗口内最大请求数 */
  maxRequests: number;
}

export interface RateLimitResult {
  /** 是否允许请求 */
  allowed: boolean;
  /** 剩余请求数 */
  remaining: number;
  /** 重置时间戳（毫秒） */
  resetAt: number;
}

/**
 * 检查 IP 是否超过限流阈值
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新窗口或窗口已过期
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 从请求中获取客户端标识（优先 X-Forwarded-For， fallback 到直接 IP）
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // NextRequest 可能有 ip 属性
  const ip = (request as unknown as { ip?: string }).ip;
  if (ip) return ip;
  return 'unknown';
}
