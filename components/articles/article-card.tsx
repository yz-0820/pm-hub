'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Article } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { categoryLabels } from '@/config/rss';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const isFeatured = variant === 'featured';
  const categoryLabel = categoryLabels[article.category]?.name || article.category;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all',
        isFeatured && 'md:col-span-2'
      )}
    >
      <Link href={`/articles/${article.slug || article.id}`} className="block">
        {/* Image */}
        {article.imageUrl && (
          <div className={cn(
            'relative overflow-hidden',
            isFeatured ? 'h-48 md:h-64' : 'h-48'
          )}>
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
            {categoryLabel}
          </span>

          {/* Title */}
          <h3 className={cn(
            'font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2',
            isFeatured ? 'text-xl md:text-2xl' : 'text-lg'
          )}>
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {article.summary}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{article.sourceName}</span>
              {article.author && (
                <>
                  <span>·</span>
                  <span>{article.author}</span>
                </>
              )}
            </div>
            <time>{formatDate(article.publishedAt)}</time>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
