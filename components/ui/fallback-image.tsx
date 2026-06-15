'use client';

import Image, { type ImageProps } from 'next/image';
import { type ReactNode, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';

type FallbackImageProps = Omit<ImageProps, 'src' | 'alt' | 'onError'> & {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  fallback?: ReactNode;
  fallbackClassName?: string;
};

const FINAL_FALLBACK_SRC = '/covers/fallback.jpg';

function toDisplaySrc(value?: string | null) {
  return getProxiedImageUrl(value);
}

export function FallbackImage({
  src,
  fallbackSrc,
  alt,
  fallback,
  fallbackClassName,
  ...props
}: FallbackImageProps) {
  const primary = toDisplaySrc(src);
  const fallbackImage = toDisplaySrc(fallbackSrc);
  const imageKey = `${primary || ''}\n${fallbackImage || ''}`;
  const [failedState, setFailedState] = useState<{ key: string; srcs: Set<string> }>(() => ({
    key: imageKey,
    srcs: new Set(),
  }));
  const failedSrcs = failedState.key === imageKey ? failedState.srcs : new Set<string>();
  const candidates = Array.from(new Set([primary, fallbackImage, FINAL_FALLBACK_SRC].filter((value): value is string => !!value)));
  const activeSrc = candidates.find((candidate) => !failedSrcs.has(candidate));

  if (!activeSrc) {
    return (
      fallback || (
        <div className={fallbackClassName || 'absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground'}>
          <ImageIcon className="h-8 w-8 opacity-30" />
        </div>
      )
    );
  }

  return (
    <Image
      {...props}
      src={activeSrc}
      alt={alt}
      onError={() => {
        setFailedState((current) => {
          const nextSrcs = current.key === imageKey ? new Set(current.srcs) : new Set<string>();
          nextSrcs.add(activeSrc);
          return { key: imageKey, srcs: nextSrcs };
        });
      }}
    />
  );
}
