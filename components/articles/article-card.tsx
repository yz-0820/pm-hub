'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Article } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { ImageIcon } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils/image-proxy';
import { simplifyArticleSourceName } from '@/lib/utils/source-name';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryLabel = categoryLabels[article.category]?.name || article.category;
  const proxiedImageUrl = getProxiedImageUrl(article.imageUrl);
  const sourceName = simplifyArticleSourceName(article.sourceName);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <a 
        href={article.originalUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image - 左侧 */}
          <div className="relative overflow-hidden bg-muted w-full sm:w-64 md:w-72 shrink-0 aspect-[16/10]">
            {proxiedImageUrl ? (
              <Image
                src={proxiedImageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 640px) 100vw, 288px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                <span className="text-xs opacity-50">暂无配图</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content - 右侧 */}
          <div className="p-5 md:p-6 flex flex-col justify-center min-w-0 flex-1 gap-3">
            {/* Meta row */}
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {categoryLabel}
              </span>
              <span className="text-xs text-muted-foreground">{sourceName}</span>
              <span className="text-muted-foreground/40">·</span>
              <time className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</time>
            </div>

            {/* Title */}
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-lg md:text-xl leading-snug">
              {article.title}
            </h3>

            {/* Summary */}
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {article.summary}
            </p>
          </div>
        </div>
      </a>
    </motion.article>
  );
}
