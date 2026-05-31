import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL || 'https://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = ['tech', 'ai', 'finance', 'product-management'];

  const categoryUrls = categories.map((cat) => ({
    url: `${SITE_URL}/categories/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/career`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/training`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...categoryUrls,
  ];
}
