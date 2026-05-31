import { NextRequest, NextResponse } from 'next/server';
import { articlesIndex } from '@/lib/search/client';
import { db } from '@/lib/db/client';
import { careerContents } from '@/lib/db/schema';
import { eq, desc, ilike, or, and, not, notIlike, sql } from 'drizzle-orm';

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
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(10, rawLimit) : 10;

    if (!query) {
      return NextResponse.json({ hits: [], totalHits: 0, page: 1, totalPages: 0 });
    }

    const offset = (page - 1) * limit;

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

    // Fallback: 数据库搜索（仅搜索 career 内容）
    const pattern = `%${query}%`;
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

    const [careerRows, careerCountRes] = await Promise.all([
      db.query.careerContents.findMany({
        where: careerWhere,
        orderBy: [desc(careerContents.publishedAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(careerContents).where(careerWhere),
    ]);

    const hits: SearchHit[] = careerRows.map((c) => ({
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

    const totalHits = careerCountRes[0]?.count || 0;

    return NextResponse.json({
      hits,
      totalHits,
      page,
      totalPages: Math.ceil(totalHits / limit),
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
