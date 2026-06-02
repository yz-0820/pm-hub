import { NextRequest, NextResponse } from 'next/server';
import { articlesIndex } from '@/lib/search/client';
import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { eq, desc, ilike, or, and, notIlike, sql, inArray } from 'drizzle-orm';
import { parseSearchParams } from '@/lib/search/params';

type SearchHit =
  | {
      kind: 'article';
      id: number;
      title: string;
      summary: string;
      category: string;
      sourceName: string;
      publishedAt: string;
      originalUrl: string;
      imageUrl: string | null;
    }
  | {
      kind: 'career';
      id: number;
      title: string;
      summary: string;
      category: string;
      sourceName: string;
      publishedAt: string;
      originalUrl: string;
      imageUrl: string | null;
      contentType: string;
    };

export async function GET(request: NextRequest) {
  try {
    const { query, page, limit, offset } = parseSearchParams(request.nextUrl.searchParams);

    if (!query) {
      return NextResponse.json({ hits: [], totalHits: 0, page: 1, totalPages: 0 });
    }

    // 优先使用 MeiliSearch
    try {
      const meiliResult = await articlesIndex.search(query, {
        limit,
        offset,
        attributesToRetrieve: ['id', 'title', 'summary', 'category', 'sourceName', 'publishedAt', 'imageUrl'],
      });

      if (meiliResult.estimatedTotalHits > 0) {
        const hits: SearchHit[] = meiliResult.hits.map((doc: Record<string, unknown>) => ({
          kind: 'article' as const,
          id: doc.id as number,
          title: doc.title as string,
          summary: (doc.summary as string) || '',
          category: (doc.category as string) || 'tech',
          sourceName: (doc.sourceName as string) || '',
          publishedAt: new Date((doc.publishedAt as number) * 1000).toISOString(),
          originalUrl: '',
          imageUrl: (doc.imageUrl as string) || null,
        }));

        // 补充 originalUrl
        if (hits.length > 0) {
          const ids = hits.map(h => h.id);
          const rows = await db.query.articles.findMany({
            where: (articles, { inArray }) => inArray(articles.id, ids),
          });
          const urlMap = new Map(rows.map(r => [r.id, r.originalUrl]));
          for (const hit of hits) {
            hit.originalUrl = urlMap.get(hit.id) || '';
          }
        }

        return NextResponse.json({
          hits,
          totalHits: meiliResult.estimatedTotalHits,
          page,
          totalPages: Math.ceil(meiliResult.estimatedTotalHits / limit),
        });
      }
    } catch {
      // MeiliSearch 不可用，fallback 到数据库搜索
      console.log('MeiliSearch unavailable, falling back to database search');
    }

    // Fallback: 数据库搜索（搜索 articles 和 career 内容）
    const pattern = `%${query}%`;
    const articleCategories = ['product-management', 'tech', 'ai', 'finance'];
    
    // Articles 搜索条件
    const articlesWhere = and(
      inArray(articles.category, articleCategories),
      or(
        ilike(articles.title, pattern),
        ilike(articles.summary, pattern),
        ilike(articles.content, pattern),
        ilike(articles.sourceName, pattern)
      )
    );

    // Career 搜索条件
    const careerWhere = and(
      eq(careerContents.status, 'active'),
      or(
        ilike(careerContents.title, pattern),
        ilike(careerContents.description, pattern),
        ilike(careerContents.content, pattern),
        ilike(careerContents.sourceName, pattern)
      ),
      notIlike(careerContents.originalUrl, '%example.com/%'),
      notIlike(careerContents.originalUrl, '%rsshub.app/%'),
      notIlike(careerContents.originalUrl, '%localhost%'),
      notIlike(careerContents.originalUrl, '%127.0.0.1%')
    );

    // 并行搜索 articles 和 career
    const [articleRows, careerRows] = await Promise.all([
      db.query.articles.findMany({
        where: articlesWhere,
        orderBy: [desc(articles.publishedAt)],
        limit: limit,
        offset: offset,
      }),
      db.query.careerContents.findMany({
        where: careerWhere,
        orderBy: [desc(careerContents.publishedAt)],
        limit: limit,
        offset: offset,
      }),
    ]);

    // 合并结果
    const articleHits: SearchHit[] = articleRows.map((a) => ({
      kind: 'article' as const,
      id: a.id,
      title: a.title,
      summary: a.summary || '',
      category: a.category,
      sourceName: a.sourceName,
      publishedAt: a.publishedAt.toISOString(),
      originalUrl: a.originalUrl,
      imageUrl: a.imageUrl || null,
    }));

    const careerHits: SearchHit[] = careerRows.map((c) => ({
      kind: 'career' as const,
      id: c.id,
      title: c.title,
      summary: c.description || '',
      category: c.category,
      sourceName: c.sourceName,
      publishedAt: c.publishedAt.toISOString(),
      originalUrl: c.originalUrl,
      imageUrl: c.coverImage || null,
      contentType: c.contentType,
    }));

    // 合并并按时间排序
    const allHits = [...articleHits, ...careerHits]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);

    // 计算总数
    const [articleCountRes, careerCountRes] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(articles).where(articlesWhere),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(careerContents).where(careerWhere),
    ]);

    const totalHits = (articleCountRes[0]?.count || 0) + (careerCountRes[0]?.count || 0);

    return NextResponse.json({
      hits: allHits,
      totalHits,
      page,
      totalPages: Math.ceil(totalHits / limit),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
