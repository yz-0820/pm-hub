const IFANR_SOURCE_ID = 'ifanr';
const IFANR_PROMO =
  '#欢迎关注爱范儿官方微信公众号：爱范儿（微信号：ifanr），更多精彩内容第一时间为您奉上。';

const TRAILING_MARKUP = /^(?:\s|&nbsp;|<\/?(?:p|span|strong|em|b|i)\b[^>]*>)*$/i;
const OPENING_MARKUP_BEFORE_PROMO =
  /(?:\s|&nbsp;)*(?:<p\b[^>]*>\s*)?(?:<(?:span|strong|em|b|i)\b[^>]*>\s*)*$/i;

export function stripSourceBoilerplate(
  sourceId: string,
  value: string | undefined
): string | undefined {
  if (sourceId !== IFANR_SOURCE_ID || !value) return value;

  const promoIndex = value.lastIndexOf(IFANR_PROMO);
  if (promoIndex < 0) return value;

  const trailing = value.slice(promoIndex + IFANR_PROMO.length);
  if (!TRAILING_MARKUP.test(trailing)) return value;

  return value
    .slice(0, promoIndex)
    .replace(OPENING_MARKUP_BEFORE_PROMO, '')
    .trimEnd();
}
