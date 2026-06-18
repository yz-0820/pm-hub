import { decode } from 'he';

const MAX_DECODE_PASSES = 3;

export function decodeHtmlEntities(value: string): string {
  let current = value;

  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    const decoded = decode(current, { strict: false });
    if (decoded === current) break;
    current = decoded;
  }

  return current;
}

export function decodePlainText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
}
