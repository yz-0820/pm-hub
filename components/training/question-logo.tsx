'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';

export function QuestionLogo(props: { logoUrl?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = props.logoUrl ? `/api/image-proxy?url=${encodeURIComponent(props.logoUrl)}` : '';
  const showImage = Boolean(props.logoUrl) && !failed;

  return (
    <div
      className={
        props.className || 'h-10 w-10 rounded-xl bg-muted/60 border flex items-center justify-center overflow-hidden shrink-0'
      }
    >
      {showImage ? (
        <img
          src={src}
          alt={props.alt}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Lightbulb className="h-5 w-5 text-primary" />
      )}
    </div>
  );
}
