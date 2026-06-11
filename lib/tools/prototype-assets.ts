import { PrototypeIconName } from './prototype-design-system';

export type PrototypeAsset = {
  id: string;
  kind: 'cover' | 'avatar' | 'illustration';
  label: string;
  gradient: {
    from: string;
    to: string;
    via?: string;
  };
  icon: PrototypeIconName;
};

export const prototypeAssets: Record<string, PrototypeAsset> = {
  'cover.green-wave': {
    id: 'cover.green-wave',
    kind: 'cover',
    label: 'Green wave cover',
    gradient: { from: '#13d78a', via: '#28f0b2', to: '#1ba5ff' },
    icon: 'music',
  },
  'cover.night-radio': {
    id: 'cover.night-radio',
    kind: 'cover',
    label: 'Night radio cover',
    gradient: { from: '#101820', via: '#3146ff', to: '#7c3aed' },
    icon: 'sparkles',
  },
  'cover.sunset': {
    id: 'cover.sunset',
    kind: 'cover',
    label: 'Sunset cover',
    gradient: { from: '#ff7a59', via: '#ffb84d', to: '#ffe071' },
    icon: 'star',
  },
  'cover.blueprint': {
    id: 'cover.blueprint',
    kind: 'cover',
    label: 'Product blueprint cover',
    gradient: { from: '#2563eb', via: '#06b6d4', to: '#14b8a6' },
    icon: 'chart',
  },
  'avatar.member': {
    id: 'avatar.member',
    kind: 'avatar',
    label: 'Member avatar',
    gradient: { from: '#0f172a', to: '#475569' },
    icon: 'user',
  },
  'illustration.empty-state': {
    id: 'illustration.empty-state',
    kind: 'illustration',
    label: 'Empty state illustration',
    gradient: { from: '#e0f2fe', via: '#ccfbf1', to: '#dcfce7' },
    icon: 'image',
  },
};

export function getPrototypeAsset(assetRef?: string): PrototypeAsset {
  if (assetRef && prototypeAssets[assetRef]) return prototypeAssets[assetRef];
  return prototypeAssets['cover.green-wave'];
}

export function isPrototypeAssetRef(value?: string): boolean {
  return Boolean(value && prototypeAssets[value]);
}
