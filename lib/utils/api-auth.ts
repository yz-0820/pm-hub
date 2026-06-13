import { NextRequest, NextResponse } from 'next/server';

/**
 * 统一 API 认证验证
 * 验证 Authorization Header 中的 Bearer Token
 * 可选验证调用方 IP 是否在白名单内
 */
export function verifyApiAuth(request: NextRequest): { success: true } | { success: false; response: NextResponse } {
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }

  if (authHeader !== `Bearer ${apiKey}`) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // IP 白名单验证（可选）
  const allowlist = process.env.API_ALLOWLIST_IPS;
  if (allowlist && allowlist.trim().length > 0) {
    const clientIp = getClientIp(request);
    const allowedIps = allowlist.split(',').map((ip) => ip.trim()).filter(Boolean);

    const isAllowed = allowedIps.some((allowed) => isIpAllowed(clientIp, allowed));
    if (!isAllowed) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Forbidden: IP not allowed' },
          { status: 403 }
        ),
      };
    }
  }

  return { success: true };
}

/**
 * 从请求中获取客户端 IP
 * 优先检查 X-Forwarded-For（Vercel 等代理），然后 X-Real-IP，最后直接连接 IP
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // NextRequest 没有直接暴露 socket remoteAddress
  // 在 Vercel 等边缘环境中，x-forwarded-for 通常可用
  return 'unknown';
}

/**
 * 检查客户端 IP 是否匹配允许的 IP 或 CIDR 网段
 */
function isIpAllowed(clientIp: string, allowed: string): boolean {
  if (clientIp === allowed) {
    return true;
  }

  // 支持 CIDR 格式（如 192.168.1.0/24）
  if (allowed.includes('/')) {
    return isIpInCidr(clientIp, allowed);
  }

  return false;
}

/**
 * 检查 IP 是否在 CIDR 网段内
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [subnet, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);

    const ipNum = ipToNumber(ip);
    const subnetNum = ipToNumber(subnet);
    const mask = -1 << (32 - prefix);

    return (ipNum & mask) === (subnetNum & mask);
  } catch {
    return false;
  }
}

/**
 * 将 IPv4 地址转换为数字
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 address');
  }
  return parts.reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
}
