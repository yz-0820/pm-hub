import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getArticleDefaultCover } from '@/config/default-covers';

export interface CarouselItem {
  id: number;
  title: string;
  href: string;
  imageUrl: string;
  category: string;
}

/**
 * 获取专业资讯最新文章（用于轮播）
 */
export async function getLatestArticles(limit: number = 5): Promise<CarouselItem[]> {
  const articleCategories = ['product-management', 'tech', 'ai', 'finance'];
  
  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      category: articles.category,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(inArray(articles.category, articleCategories))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.slug ? `/articles/${item.slug}` : `/articles/${item.id}`,
    imageUrl: item.imageUrl || getArticleDefaultCover(item.category, `${item.id}-${item.title}`),
    category: item.category,
  }));
}

/**
 * 获取职业发展最新内容（用于轮播）
 */
export async function getLatestCareerContents(limit: number = 5): Promise<CarouselItem[]> {
  const results = await db
    .select({
      id: careerContents.id,
      title: careerContents.title,
      category: careerContents.category,
      coverImage: careerContents.coverImage,
    })
    .from(careerContents)
    .orderBy(desc(careerContents.createdAt))
    .limit(limit);

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    href: `/career/${item.id}`,
    imageUrl: item.coverImage || getArticleDefaultCover('product-management', `${item.id}-${item.title}`),
    category: item.category,
  }));
}

// 辅助函数：inArray 条件
function inArray(column: any, values: string[]) {
  return {
    in: values,
  };
}
