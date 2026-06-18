/**
 * RSS 内容质量审查模块
 * 在入库前对文章内容进行统一质量门检查
 */

export type ContentProfile = 'article' | 'newsflash';

export interface QualityResult {
  passed: boolean;
  reason: string | null;
  profile: ContentProfile;
  meaningfulChars: number;
  enriched: boolean;
  titleRepeated: boolean;
}

const NEWSFLASH_MIN_CHARS = 120;
const ARTICLE_MIN_CHARS = 180;
const ENRICHED_MIN_PARAGRAPHS = 3;
const ENRICHED_MIN_CHARS = 600;
const ENRICHED_MAX_CONTENT_LENGTH = 2000;
const ENRICHED_MAX_SUMMARY_LENGTH = 300;

const BOILERPLATE_PATTERNS = [
  /^查看全文[。.]?$/,
  /^点击阅读[。.]?$/,
  /^阅读更多[。.]?$/,
  /^展开全文[。.]?$/,
  /^本文来自[：:]/,
  /^本文来源[：:]/,
  /^责任编辑[：:]/,
  /^免责声明[：:]/,
  /^本文仅供参考/,
  /^风险提示[：:]/,
];

/**
 * 统计有效字符：仅 Unicode 字母和数字
 * 忽略 HTML 标签、空白、标点符号
 */
export function countMeaningfulChars(text: string): number {
  if (!text) return 0;
  // 先去除 HTML 标签
  const noHtml = text.replace(/<[^>]+>/g, ' ');
  // 统计字母和数字
  let count = 0;
  for (const char of noHtml) {
    const code = char.codePointAt(0) ?? 0;
    // Unicode 字母范围（含中文 CJK）
    const isLetter =
      (code >= 0x0041 && code <= 0x005a) || // A-Z
      (code >= 0x0061 && code <= 0x007a) || // a-z
      (code >= 0x00c0 && code <= 0x024f) || // 拉丁扩展
      (code >= 0x0400 && code <= 0x04ff) || // 西里尔
      (code >= 0x2e80 && code <= 0x9fff) || // CJK 统一表意符号
      (code >= 0xf900 && code <= 0xfaff) || // CJK 兼容
      (code >= 0xfe30 && code <= 0xfe4f) || // CJK 兼容形式
      (code >= 0x20000 && code <= 0x2a6df) || // CJK 扩展 B
      (code >= 0x2a700 && code <= 0x2b73f) || // CJK 扩展 C
      (code >= 0x2b740 && code <= 0x2b81f) || // CJK 扩展 D
      (code >= 0xac00 && code <= 0xd7af); // 韩文
    // 数字
    const isDigit = code >= 0x0030 && code <= 0x0039;
    if (isLetter || isDigit) {
      count++;
    }
  }
  return count;
}

/**
 * 检测正文是否与标题重复（正文仅比标题多不超过 10 个有效字符）
 */
export function isTitleRepeated(title: string, content: string): boolean {
  const titleChars = countMeaningfulChars(title);
  const contentChars = countMeaningfulChars(content);
  if (titleChars === 0) return false;
  // 正文有效字符 <= 标题有效字符 + 10，视为重复
  return contentChars <= titleChars + 10;
}

/**
 * 检测是否为样板文本（如"查看全文"等）
 */
export function isBoilerplateText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * 内容质量审查主入口
 * @param title 文章标题
 * @param content 文章内容/摘要
 * @param profile 内容类型：article（长文）或 newsflash（快讯）
 */
export function evaluateContentQuality(
  title: string,
  content: string,
  profile: ContentProfile = 'article'
): QualityResult {
  const meaningfulChars = countMeaningfulChars(content);
  const titleRepeated = isTitleRepeated(title, content);

  // 快讯源：硬门槛 120 个有效字符
  if (profile === 'newsflash') {
    if (meaningfulChars < NEWSFLASH_MIN_CHARS) {
      return {
        passed: false,
        reason: `short_newsflash: 有效字符 ${meaningfulChars} < ${NEWSFLASH_MIN_CHARS}`,
        profile,
        meaningfulChars,
        enriched: false,
        titleRepeated,
      };
    }
    if (titleRepeated) {
      return {
        passed: false,
        reason: 'short_newsflash: 正文与标题重复',
        profile,
        meaningfulChars,
        enriched: false,
        titleRepeated,
      };
    }
    return {
      passed: true,
      reason: null,
      profile,
      meaningfulChars,
      enriched: false,
      titleRepeated,
    };
  }

  // 长文源：最低 180 个有效字符
  if (meaningfulChars < ARTICLE_MIN_CHARS) {
    return {
      passed: false,
      reason: `short_article: 有效字符 ${meaningfulChars} < ${ARTICLE_MIN_CHARS}`,
      profile,
      meaningfulChars,
      enriched: false,
      titleRepeated,
    };
  }

  if (titleRepeated) {
    return {
      passed: false,
      reason: 'short_article: 正文与标题重复',
      profile,
      meaningfulChars,
      enriched: false,
      titleRepeated,
    };
  }

  if (isBoilerplateText(content)) {
    return {
      passed: false,
      reason: 'short_article: 仅含样板文本',
      profile,
      meaningfulChars,
      enriched: false,
      titleRepeated,
    };
  }

  return {
    passed: true,
    reason: null,
    profile,
    meaningfulChars,
    enriched: false,
    titleRepeated,
  };
}

/**
 * 轻量 HTML 正文提取
 * 删除脚本、导航、页头页尾等区域，提取有效段落
 * 不依赖 Node 专用 DOM 库，保持 Cloudflare 兼容性
 */
export function extractArticleFromHtml(html: string): { content: string; paragraphs: string[] } | null {
  if (!html || html.length < 100) return null;

  // 删除 script 和 style 标签及其内容
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, ' ');

  // 删除常见导航/页头/页尾/广告区域（基于常见 class/id 模式）
  const junkPatterns = [
    /<nav[^>]*>[\s\S]*?<\/nav>/gi,
    /<header[^>]*>[\s\S]*?<\/header>/gi,
    /<footer[^>]*>[\s\S]*?<\/footer>/gi,
    /<aside[^>]*>[\s\S]*?<\/aside>/gi,
    /<\w+[^>]*\bclass="[^"]*(?:nav|header|footer|sidebar|ad-|advertisement|comment|related|recommend|share|toolbar|menu|breadcrumb|pagination)[^"]*"[^>]*>[\s\S]*?<\/\w+>/gi,
    /<\w+[^>]*\bid="[^"]*(?:nav|header|footer|sidebar|ad-|advertisement|comment|related|recommend|share|toolbar|menu|breadcrumb|pagination)[^"]*"[^>]*>[\s\S]*?<\/\w+>/gi,
  ];

  for (const pattern of junkPatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // 将常见块级标签替换为换行，便于分段
  cleaned = cleaned
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/article>/gi, '\n')
    .replace(/<\/section>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n');

  // 去除剩余 HTML 标签
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // 解码 HTML 实体
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // 规范化空白
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 按段落分割
  const paragraphs = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 20); // 过滤过短段落

  if (paragraphs.length < ENRICHED_MIN_PARAGRAPHS) {
    return null;
  }

  const content = paragraphs.join('\n\n');
  const meaningfulChars = countMeaningfulChars(content);

  if (meaningfulChars < ENRICHED_MIN_CHARS) {
    return null;
  }

  return { content, paragraphs };
}

/**
 * 从原文 URL 抓取并提取正文
 * 限制只允许访问指定主机
 */
export async function enrichContentFromUrl(
  url: string,
  allowedHosts: string[]
): Promise<{ content: string; summary: string } | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const isAllowed = allowedHosts.some((h) => host === h.toLowerCase() || host.endsWith(`.${h.toLowerCase()}`));
  if (!isAllowed) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    // 检查重定向后的主机是否仍在允许列表
    const finalUrl = response.url;
    let finalParsed: URL;
    try {
      finalParsed = new URL(finalUrl);
    } catch {
      return null;
    }
    const finalHost = finalParsed.hostname.toLowerCase();
    const finalAllowed = allowedHosts.some((h) => finalHost === h.toLowerCase() || finalHost.endsWith(`.${h.toLowerCase()}`));
    if (!finalAllowed) {
      return null;
    }

    const html = await response.text();
    const extracted = extractArticleFromHtml(html);
    if (!extracted) {
      return null;
    }

    // 截取内容
    const content = extracted.content.slice(0, ENRICHED_MAX_CONTENT_LENGTH);
    // 生成摘要：取前 2-3 段合成摘要
    const summaryParagraphs = extracted.paragraphs.slice(0, 3);
    let summary = summaryParagraphs.join(' ').slice(0, ENRICHED_MAX_SUMMARY_LENGTH);
    if (summary.length === ENRICHED_MAX_SUMMARY_LENGTH) {
      // 尝试在句子边界截断
      const lastPeriod = summary.lastIndexOf('。');
      const lastSentence = summary.lastIndexOf('. ');
      const cutAt = Math.max(lastPeriod, lastSentence);
      if (cutAt > ENRICHED_MAX_SUMMARY_LENGTH * 0.7) {
        summary = summary.slice(0, cutAt + 1);
      }
    }

    return { content, summary };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    console.error(`Content enrichment failed for ${url}:`, msg);
    return null;
  }
}
