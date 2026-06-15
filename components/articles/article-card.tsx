'use client';

import { Article } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { ImageIcon } from 'lucide-react';
import { simplifyArticleSourceName } from '@/lib/utils/source-name';
import { FallbackImage } from '@/components/ui/fallback-image';
import { resolveArticleDisplayImage } from '@/lib/utils/article-cover';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryLabel = categoryLabels[article.category]?.name || article.category;
  const { imageUrl: displayImageUrl, fallbackImageUrl } = resolveArticleDisplayImage(article);
  const sourceName = simplifyArticleSourceName(article.sourceName);

  return (
    <article className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300">
      <a
        href={article.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative overflow-hidden bg-muted w-full sm:w-48 md:w-64 lg:w-72 shrink-0 aspect-[16/9] sm:aspect-[4/3]">
            {displayImageUrl ? (
              <FallbackImage
                src={displayImageUrl}
                fallbackSrc={fallbackImageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, 256px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority={false}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mb-2 opacity-30" />
                <span className="text-xs opacity-50">暂无配图</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-center min-w-0 flex-1 gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {categoryLabel}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{sourceName}</span>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <time className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</time>
            </div>

            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 text-base sm:text-lg md:text-xl leading-snug">
              {article.title}
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 hidden sm:block">
              {article.summary}
            </p>
          </div>
        </div>
      </a>
    </article>
  );
}
