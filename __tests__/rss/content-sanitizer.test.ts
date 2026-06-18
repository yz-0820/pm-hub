import { describe, expect, it } from 'vitest';
import { stripSourceBoilerplate } from '@/lib/rss/content-sanitizer';

const IFANR_PROMO =
  '#欢迎关注爱范儿官方微信公众号：爱范儿（微信号：ifanr），更多精彩内容第一时间为您奉上。';

describe('stripSourceBoilerplate', () => {
  it('removes the exact ifanr promo suffix from plain-text summaries', () => {
    expect(stripSourceBoilerplate('ifanr', `正文摘要\n${IFANR_PROMO}`)).toBe('正文摘要');
  });

  it('removes the trailing HTML paragraph without changing preceding content', () => {
    const content = `<p>正文中正常提到微信生态。</p>\n<p>${IFANR_PROMO}</p>`;

    expect(stripSourceBoilerplate('ifanr', content)).toBe('<p>正文中正常提到微信生态。</p>');
  });

  it('keeps ordinary WeChat references', () => {
    const content = '产品支持通过微信公众号接收通知，也可以绑定微信号。';

    expect(stripSourceBoilerplate('ifanr', content)).toBe(content);
  });

  it('keeps the template when it is not at the end', () => {
    const content = `${IFANR_PROMO}\n后续正文仍然存在。`;

    expect(stripSourceBoilerplate('ifanr', content)).toBe(content);
  });

  it('does not clean other sources', () => {
    const content = `正文摘要\n${IFANR_PROMO}`;

    expect(stripSourceBoilerplate('other-source', content)).toBe(content);
  });

  it('is idempotent', () => {
    const content = `正文摘要\n${IFANR_PROMO}`;
    const cleaned = stripSourceBoilerplate('ifanr', content);

    expect(stripSourceBoilerplate('ifanr', cleaned)).toBe(cleaned);
  });

  it('preserves undefined values', () => {
    expect(stripSourceBoilerplate('ifanr', undefined)).toBeUndefined();
  });
});
