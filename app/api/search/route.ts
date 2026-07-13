import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike, inArray, notIlike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { articles, careerContents } from '@/lib/db/schema';
import { searchArticles } from '@/lib/search/client';
import { parseSearchParams } from '@/lib/search/params';
import { mergeSearchHits, normalizeSearchTimestamp, type SearchHit } from '@/lib/search/results';
import { logger } from '@/lib/utils/logger';

const ARTICLE_CATEGORIES = ['product-management', 'tech', 'ai', 'finance'];

class EmptyMeilisearchResult extends Error {}

export async function GET(request: NextRequest) {
  try {
    const { query, page, limit, offset } = parseSearchParams(request.nextUrl.searchParams);

    if (!query) {
      return NextResponse.json({ hits: [], totalHits: 0, page: 1, totalPages: 0 });
    }

    const pattern = `%${query}%`;
    const windowSize = offset + limit;
    const articlesWhere = and(
      inArray(articles.category, ARTICLE_CATEGORIES),
      or(
        ilike(articles.title, pattern),
        ilike(articles.summary, pattern),
        ilike(articles.content, pattern),
        ilike(articles.sourceName, pattern)
      )
    );
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
        limit: windowSize,
      }),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(careerContents).where(careerWhere),
    ]);
    const careerHits: SearchHit[] = careerRows.map((career) => ({
      kind: 'career',
      id: career.id,
      title: career.title,
      summary: career.description || '',
      category: career.category,
      sourceName: career.sourceName,
      publishedAt: career.publishedAt.toISOString(),
      originalUrl: career.originalUrl,
      imageUrl: career.coverImage || null,
      contentType: career.contentType,
    }));
    const careerTotal = careerCountRes[0]?.count || 0;

    try {
      const meiliResult = await searchArticles(query, { limit: windowSize, offset: 0 });
      if ((meiliResult.estimatedTotalHits ?? 0) === 0) {
        throw new EmptyMeilisearchResult();
      }
      const documentIds = meiliResult.hits
        .map((document) => Number(document.id))
        .filter(Number.isInteger);
      const rows = documentIds.length
        ? await db.query.articles.findMany({ where: (table, operators) => operators.inArray(table.id, documentIds) })
        : [];
      const articleMap = new Map(rows.map((row) => [row.id, row]));
      const articleHits: SearchHit[] = meiliResult.hits.flatMap((document) => {
        const row = articleMap.get(Number(document.id));
        if (!row) return [];

        return [{
          kind: 'article' as const,
          id: row.id,
          title: row.title,
          summary: row.summary || '',
          category: row.category,
          sourceName: row.sourceName,
          publishedAt: normalizeSearchTimestamp(document.publishedAt),
          originalUrl: row.originalUrl,
          imageUrl: row.imageUrl || null,
        }];
      });
      const totalHits = (meiliResult.estimatedTotalHits ?? 0) + careerTotal;

      return NextResponse.json({
        hits: mergeSearchHits(articleHits, careerHits, offset, limit),
        totalHits,
        page,
        totalPages: Math.ceil(totalHits / limit),
      });
    } catch (error) {
      if (!(error instanceof EmptyMeilisearchResult)) {
        logger.warn('search.meilisearch_fallback', { queryLength: query.length });
      }
    }

    const [articleRows, articleCountRes] = await Promise.all([
      db.query.articles.findMany({
        where: articlesWhere,
        orderBy: [desc(articles.publishedAt)],
        limit: windowSize,
      }),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(articles).where(articlesWhere),
    ]);
    const articleHits: SearchHit[] = articleRows.map((article) => ({
      kind: 'article',
      id: article.id,
      title: article.title,
      summary: article.summary || '',
      category: article.category,
      sourceName: article.sourceName,
      publishedAt: article.publishedAt.toISOString(),
      originalUrl: article.originalUrl,
      imageUrl: article.imageUrl || null,
    }));
    const totalHits = (articleCountRes[0]?.count || 0) + careerTotal;

    return NextResponse.json({
      hits: mergeSearchHits(articleHits, careerHits, offset, limit),
      totalHits,
      page,
      totalPages: Math.ceil(totalHits / limit),
    });
  } catch (error) {
    logger.error('search.request_failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
