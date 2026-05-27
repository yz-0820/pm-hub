import { notFound, redirect } from 'next/navigation';
import { categoryLabels } from '@/config/rss';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ 
  params, 
  searchParams 
}: CategoryPageProps) {
  const { category } = await params;
  if (!categoryLabels[category]) notFound();
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));

  const qs = new URLSearchParams({ category });
  if (currentPage > 1) qs.set('page', String(currentPage));

  redirect(`/articles?${qs.toString()}`);
}
