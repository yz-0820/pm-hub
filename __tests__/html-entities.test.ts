import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, decodePlainText } from '@/lib/utils/html-entities';

describe('HTML entity decoding', () => {
  it('decodes decimal, hexadecimal, and named entities', () => {
    expect(decodePlainText('跨部门沟通的&#8221;破壁&#8221;指南')).toBe('跨部门沟通的”破壁”指南');
    expect(decodePlainText('iQOO15T &#038; Pad6 Pro')).toBe('iQOO15T & Pad6 Pro');
    expect(decodePlainText('第一行&#xA;第二行')).toBe('第一行 第二行');
    expect(decodePlainText('&quot;产品&quot;')).toBe('"产品"');
  });

  it('handles entities that were encoded more than once', () => {
    expect(decodePlainText('&amp;#8221;破壁&amp;#8221;')).toBe('”破壁”');
  });

  it('preserves HTML when only entity decoding is requested', () => {
    expect(decodeHtmlEntities('<p>A &amp; B</p>')).toBe('<p>A & B</p>');
  });
});
