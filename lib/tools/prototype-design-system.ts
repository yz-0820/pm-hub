import { PrototypeTheme } from './prototype-spec';

export type PrototypeThemeTokens = {
  name: PrototypeTheme;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryText: string;
    accent: string;
    danger: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  shadow: Record<'none' | 'sm' | 'md' | 'lg' | 'glow', string>;
};

export const prototypeThemes: Record<PrototypeTheme, PrototypeThemeTokens> = {
  light: {
    name: 'light',
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceMuted: '#f1f5f9',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      primary: '#2563eb',
      primaryText: '#ffffff',
      accent: '#14b8a6',
      danger: '#ef4444',
    },
    radius: { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
    shadow: {
      none: 'none',
      sm: '0 4px 12px rgba(15,23,42,0.08)',
      md: '0 10px 24px rgba(15,23,42,0.10)',
      lg: '0 18px 42px rgba(15,23,42,0.14)',
      glow: '0 18px 45px rgba(37,99,235,0.22)',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#08111f',
      surface: '#101a2b',
      surfaceMuted: '#17243a',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#22314a',
      primary: '#38bdf8',
      primaryText: '#07111f',
      accent: '#22c55e',
      danger: '#fb7185',
    },
    radius: { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 },
    shadow: {
      none: 'none',
      sm: '0 4px 12px rgba(0,0,0,0.20)',
      md: '0 10px 24px rgba(0,0,0,0.28)',
      lg: '0 18px 42px rgba(0,0,0,0.34)',
      glow: '0 18px 45px rgba(56,189,248,0.25)',
    },
  },
  brand: {
    name: 'brand',
    colors: {
      background: '#effff7',
      surface: '#ffffff',
      surfaceMuted: '#e7fbf2',
      text: '#101820',
      textMuted: '#667085',
      border: '#d9f0e7',
      primary: '#13d78a',
      primaryText: '#052e1f',
      accent: '#1ba5ff',
      danger: '#ff5f57',
    },
    radius: { sm: 8, md: 14, lg: 20, xl: 26, pill: 999 },
    shadow: {
      none: 'none',
      sm: '0 5px 14px rgba(16,24,32,0.08)',
      md: '0 12px 28px rgba(16,24,32,0.10)',
      lg: '0 20px 48px rgba(16,24,32,0.16)',
      glow: '0 18px 45px rgba(19,215,138,0.28)',
    },
  },
};

export const prototypeStyleTokens = {
  'screen.background': { radius: 0, shadow: 'none' },
  'card.elevated': { radius: 22, shadow: 'md' },
  'card.glass': { radius: 24, shadow: 'lg', opacity: 0.92 },
  'button.primary': { radius: 999, shadow: 'glow' },
  'button.secondary': { radius: 999, shadow: 'sm' },
  'nav.bottom': { radius: 28, shadow: 'lg' },
  'image.cover': { radius: 18, shadow: 'md' },
  'hero.media': { radius: 26, shadow: 'glow' },
} as const;

export function getPrototypeTheme(theme?: PrototypeTheme): PrototypeThemeTokens {
  return prototypeThemes[theme || 'brand'];
}

export type PrototypeIconName =
  | 'home'
  | 'search'
  | 'music'
  | 'play'
  | 'pause'
  | 'next'
  | 'heart'
  | 'star'
  | 'user'
  | 'settings'
  | 'chart'
  | 'list'
  | 'image'
  | 'sparkles'
  | 'bell'
  | 'plus';

export const prototypeIconGlyphs: Record<PrototypeIconName, string> = {
  home: '⌂',
  search: '⌕',
  music: '♪',
  play: '▶',
  pause: 'Ⅱ',
  next: '›',
  heart: '♡',
  star: '★',
  user: '◍',
  settings: '⚙',
  chart: '#',
  list: '☰',
  image: '▧',
  sparkles: '✦',
  bell: '◔',
  plus: '+',
};

export function getIconGlyph(icon?: string): string {
  if (!icon) return prototypeIconGlyphs.sparkles;
  return prototypeIconGlyphs[icon as PrototypeIconName] || icon.slice(0, 2);
}
