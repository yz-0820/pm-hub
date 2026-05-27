import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { categoryLabels } from '@/config/rss';
import { FINANCE_THRESHOLD } from '@/lib/rss/finance-relevance';
import { TECH_THRESHOLD } from '@/lib/rss/tech-relevance';
import { and, desc, eq, gte, inArray, like, ne, notLike, or, sql } from 'drizzle-orm';

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
      return NextResponse.json({
        hits: [],
        totalHits: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const offset = (page - 1) * limit;
    const fetchSize = offset + limit;

    const pattern = `%${query}%`;

    const allowedCategories = Object.keys(categoryLabels);
    const articleWhere = and(
      inArray(articles.category, allowedCategories),
      like(articles.title, pattern),
      and(
        or(ne(articles.category, 'tech'), gte(articles.relevanceScore, TECH_THRESHOLD)),
        or(ne(articles.category, 'finance'), gte(articles.relevanceScore, FINANCE_THRESHOLD))
      )
    );

    const careerWhere = and(
      eq(careerContents.status, 'active'),
      like(careerContents.title, pattern),
      notLike(careerContents.originalUrl, '%example.com/%'),
      notLike(careerContents.originalUrl, '%rsshub.app/%'),
      notLike(careerContents.originalUrl, '%localhost%'),
      notLike(careerContents.originalUrl, '%127.0.0.1%')
    );

    const [articleRows, careerRows, articleCountRes, careerCountRes] = await Promise.all([
      db.query.articles.findMany({
        where: articleWhere,
        orderBy: [desc(articles.publishedAt)],
        limit: fetchSize,
        offset: 0,
      }),
      db.query.careerContents.findMany({
        where: careerWhere,
        orderBy: [desc(careerContents.publishedAt)],
        limit: fetchSize,
        offset: 0,
      }),
      db.select({ count: sql<number>`count(*)` }).from(articles).where(articleWhere),
      db.select({ count: sql<number>`count(*)` }).from(careerContents).where(careerWhere),
    ]);

    const hits: SearchHit[] = [
      ...articleRows.map((a) => ({
        kind: 'article' as const,
        id: a.id,
        title: a.title,
        summary: a.summary,
        category: a.category,
        sourceName: a.sourceName,
        publishedAt: a.publishedAt.toISOString(),
        originalUrl: a.originalUrl,
        imageUrl: a.imageUrl,
      })),
      ...careerRows.map((c) => ({
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
      })),
    ];

    hits.sort((x, y) => {
      const tx = Date.parse(x.publishedAt) || 0;
      const ty = Date.parse(y.publishedAt) || 0;
      return ty - tx;
    });

    const totalHits = (articleCountRes[0]?.count || 0) + (careerCountRes[0]?.count || 0);
    const pageHits = hits.slice(offset, offset + limit);

    return NextResponse.json({
      hits: pageHits,
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
