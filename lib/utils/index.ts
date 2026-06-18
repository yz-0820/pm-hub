import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { decodeHtmlEntities } from './html-entities';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ''));
}
