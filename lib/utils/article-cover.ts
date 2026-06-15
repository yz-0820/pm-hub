import {
  getArticleDefaultCover,
  getCareerDefaultCover,
  isDefaultCoverImage,
} from '@/config/default-covers';

type CoverInput = {
  id?: number | string | null;
  title: string;
  category: string;
  imageUrl?: string | null;
  seed?: string | null;
};

export type ResolvedCover = {
  imageUrl: string;
  fallbackImageUrl: string;
  sourceImageUrl: string | null;
};

export function getCoverSeed(input: Pick<CoverInput, 'id' | 'title' | 'seed'>) {
  const explicitSeed = input.seed?.trim();
  if (explicitSeed) return explicitSeed;

  const title = input.title.trim();
  const id = input.id === null || input.id === undefined ? '' : String(input.id).trim();
  if (id && title) return `${id}-${title}`;
  return title || id || 'cover';
}

function resolveCover(input: CoverInput, getDefaultCover: (category: string, seed?: string) => string): ResolvedCover {
  const seed = getCoverSeed(input);
  const fallbackImageUrl = getDefaultCover(input.category, seed);
  const sourceImageUrl = input.imageUrl && !isDefaultCoverImage(input.imageUrl) ? input.imageUrl : null;

  return {
    imageUrl: sourceImageUrl || fallbackImageUrl,
    fallbackImageUrl,
    sourceImageUrl,
  };
}

export function resolveArticleDisplayImage(input: CoverInput): ResolvedCover {
  return resolveCover(input, getArticleDefaultCover);
}

export function resolveCareerDisplayImage(input: CoverInput): ResolvedCover {
  return resolveCover(input, getCareerDefaultCover);
}
