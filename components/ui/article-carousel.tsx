'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { FallbackImage } from '@/components/ui/fallback-image';

interface CarouselItem {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  category?: string;
}

interface ArticleCarouselProps {
  items: CarouselItem[];
  autoplayDelay?: number;
}

// 判断是否为外部链接
function isExternalLink(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

export function ArticleCarousel({ items, autoplayDelay = 3500 }: ArticleCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (items.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-5">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((item) => {
            const isExternal = isExternalLink(item.href);
            const LinkComponent = isExternal ? 'a' : 'a';
            const linkProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            
            return (
            <div key={item.id} className="flex-[0_0_100%] min-w-0">
              <LinkComponent 
                href={item.href} 
                {...linkProps}
                className="group relative block aspect-[21/9] overflow-hidden cursor-pointer">
                {/* 背景图片 */}
                <FallbackImage
                  src={item.imageUrl}
                  fallbackSrc={item.fallbackImageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* 标题 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1 leading-snug">
                    {item.title}
                  </h3>
                </div>
              </LinkComponent>
            </div>
          )})}
        </div>
      </div>

      {/* 圆点指示器 */}
      <div className="absolute bottom-3 right-3 flex gap-1">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'bg-white w-3'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
