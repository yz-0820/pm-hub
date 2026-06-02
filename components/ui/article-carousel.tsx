'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';

interface CarouselItem {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  category?: string;
}

interface ArticleCarouselProps {
  items: CarouselItem[];
  autoplayDelay?: number;
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
    <div className="relative overflow-hidden rounded-[28px] mb-6">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="flex-[0_0_100%] min-w-0">
              <Link href={item.href} className="group relative block aspect-[16/9] overflow-hidden">
                {/* 背景图片 */}
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* 标题 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <h3 className="text-white font-semibold text-base sm:text-lg line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 圆点指示器 */}
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
