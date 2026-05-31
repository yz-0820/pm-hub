import { NextRequest, NextResponse } from 'next/server';
import { articlesIndex } from '@/lib/search/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category');

    if (!query.trim()) {
      return NextResponse.json({
        hits: [],
        totalHits: 0,
        page: 1,
        totalPages: 0,
      });
    }

    // 构建过滤条件
    const filter = category ? `category = "${category}"` : '';

    // 执行搜索
    const searchResults = await articlesIndex.search(query, {
      offset: (page - 1) * limit,
      limit,
      filter: filter || undefined,
      sort: ['publishedAt:desc'],
    });

    // 兼容不同版本的 Meilisearch API
    const totalHits = (searchResults as any).totalHits ?? (searchResults as any).total ?? searchResults.hits.length;

    return NextResponse.json({
      hits: searchResults.hits,
      totalHits,
      page,
      totalPages: Math.ceil(totalHits / limit),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
