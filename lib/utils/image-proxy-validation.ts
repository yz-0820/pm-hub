export type ImageProxyValidationResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

// 允许的图片域名白名单
const ALLOWED_IMAGE_DOMAINS = new Set([
  // 国内平台
  'hdslb.com',
  '.hdslb.com',
  'bilibili.com',
  '.bilibili.com',
  'douyinpic.com',
  '.douyinpic.com',
  'byteimg.com',
  '.byteimg.com',
  'pstatp.com',
  '.pstatp.com',
  'toutiao.com',
  '.toutiao.com',
  'sinaimg.cn',
  '.sinaimg.cn',
  'sinajs.cn',
  '.sinajs.cn',
  'weibo.com',
  '.weibo.com',
  'qpic.cn',
  '.qpic.cn',
  'qlogo.cn',
  '.qlogo.cn',
  'zhimg.com',
  '.zhimg.com',
  'jianshu.io',
  '.jianshu.io',
  'csdnimg.cn',
  '.csdnimg.cn',
  'ithome.com',
  '.ithome.com',
  '36kr.com',
  '.36kr.com',
  'sspai.com',
  '.sspai.com',
  'geekbang.org',
  '.geekbang.org',
  'infoq.cn',
  '.infoq.cn',
  'oschina.net',
  '.oschina.net',
  'cnblogs.com',
  '.cnblogs.com',
  'segmentfault.com',
  '.segmentfault.com',
  'juejin.cn',
  '.juejin.cn',
  'image.woshipm.com',
  'mmbiz.qpic.cn',
  'mp.weixin.qq.com',
  // 国际平台
  'unsplash.com',
  '.unsplash.com',
  'images.unsplash.com',
  'pexels.com',
  '.pexels.com',
  'pixabay.com',
  '.pixabay.com',
  'imgur.com',
  '.imgur.com',
  'i.imgur.com',
  'cloudinary.com',
  '.cloudinary.com',
  'res.cloudinary.com',
  'twimg.com',
  '.twimg.com',
  'pbs.twimg.com',
  'media.licdn.com',
  'cdn-images-1.medium.com',
  'miro.medium.com',
  'dev-to-uploads.s3.amazonaws.com',
  'githubusercontent.com',
  '.githubusercontent.com',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com',
  'user-images.githubusercontent.com',
  // 通用 CDN
  'alicdn.com',
  '.alicdn.com',
  'aliyuncs.com',
  '.aliyuncs.com',
  'qiniudn.com',
  '.qiniudn.com',
  'qiniucdn.com',
  '.qiniucdn.com',
  'clouddn.com',
  '.clouddn.com',
  'tencent-cloud.net',
  '.tencent-cloud.net',
  'myqcloud.com',
  '.myqcloud.com',
  'bcebos.com',
  '.bcebos.com',
  'jd.com',
  '.jd.com',
  '360buyimg.com',
  '.360buyimg.com',
  'meitudata.com',
  '.meitudata.com',
  's3.amazonaws.com',
  '.s3.amazonaws.com',
  'cloudfront.net',
  '.cloudfront.net',
  'fastly.net',
  '.fastly.net',
  'google.com',
  '.google.com',
  'googleusercontent.com',
  '.googleusercontent.com',
  'ggpht.com',
  '.ggpht.com',
  'ytimg.com',
  '.ytimg.com',
  // 新闻/媒体
  'sina.com.cn',
  '.sina.com.cn',
  'sohu.com',
  '.sohu.com',
  '163.com',
  '.163.com',
  'qq.com',
  '.qq.com',
  'ifengimg.com',
  '.ifengimg.com',
  'people.com.cn',
  '.people.com.cn',
  'xinhuanet.com',
  '.xinhuanet.com',
  'chinadaily.com.cn',
  '.chinadaily.com.cn',
  // 其他常见
  'gravatar.com',
  '.gravatar.com',
  'wp.com',
  '.wp.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
]);

function isAllowedDomain(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWED_IMAGE_DOMAINS.has(h)) return true;
  // 检查子域名匹配
  for (const domain of ALLOWED_IMAGE_DOMAINS) {
    if (domain.startsWith('.')) {
      if (h.endsWith(domain)) return true;
    }
  }
  return false;
}

function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export function validateImageProxyUrl(rawUrl: string | null): ImageProxyValidationResult {
  if (!rawUrl) return { ok: false, error: 'Missing url parameter' };

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Invalid protocol' };
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    isPrivateIPv4(hostname)
  ) {
    return { ok: false, error: 'Blocked host' };
  }

  // 域名白名单检查
  if (!isAllowedDomain(hostname)) {
    return { ok: false, error: 'Domain not allowed' };
  }

  return { ok: true, url };
}
