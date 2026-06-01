/**
 * 恢复误删文章脚本
 * 
 * 从 RSS 源重新抓取被误删的文章（非36氪/IT之家的文章）
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { rssSources } from '@/config/rss';
import { parseRSSFeed, generateSlug } from '@/lib/rss/parser';
import { evaluateAIRelevance } from '@/lib/rss/ai-relevance';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';
import { evaluateTechRelevance } from '@/lib/rss/tech-relevance';
import { detectPromoDeal } from '@/lib/rss/promo-deal';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

// 记录已删除的文章信息（从上次清理日志中提取）
const deletedArticleTitles = [
  // 这里需要填入实际被误删的文章标题
  // 由于无法直接从日志恢复，我们将重新抓取所有非36氪/IT之家的文章
];

async function restoreDeletedArticles() {
  console.log('========================================');
  console.log('恢复误删文章');
  console.log('========================================\n');

  // 获取当前数据库中的文章标题（用于去重）
  const existingArticles = await db.select({ title: articles.title }).from(articles);
  const existingTitles = new Set(existingArticles.map(a => a.title.toLowerCase()));
  
  console.log(`当前数据库已有 ${existingTitles.size} 篇文章\n`);

  let restoredCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // 只处理非36氪/IT之家的源（这些是被误删的）
  const sourcesToRestore = rssSources.filter(
    s => s.enabled && s.id !== '36kr' && s.id !== 'ithome'
  );

  for (const source of sourcesToRestore) {
    console.log(`\n处理源: ${source.name} (${source.id})`);
    
    try {
      const parsedArticles = await parseRSSFeed(source.url);
      console.log(`  获取到 ${parsedArticles.length} 篇文章`);

      for (const article of parsedArticles) {
        // 检查是否已存在
        if (existingTitles.has(article.title.toLowerCase())) {
          skippedCount++;
          continue;
        }

        // 基础过滤
        if (!article.title || article.title.length < 10) {
          skippedCount++;
          continue;
        }

        const fullText = `${article.title} ${article.summary || ''} ${article.content || ''}`;

        // 促销导购检测
        const promoCheck = detectPromoDeal(article.title, fullText);
        if (promoCheck.isPromo) {
          console.log(`  跳过促销: ${article.title.substring(0, 40)}...`);
          skippedCount++;
          continue;
        }

        // IT之家产品发售检测（如果是IT之家）
        if (source.id === 'ithome') {
          const productCheck = detectITHomeProductLaunch(article.title, fullText);
          if (productCheck.isProductLaunch) {
            console.log(`  跳过产品发售: ${article.title.substring(0, 40)}...`);
            skippedCount++;
            continue;
          }
        }

        // 评估分数（用于记录，不影响入库）
        const aiR = evaluateAIRelevance(article);
        const financeR = evaluateFinanceRelevance(article);
        const techR = evaluateTechRelevance(article);

        // 其他来源直接入库（不检查分数）
        try {
          await db.insert(articles).values({
            title: article.title,
            summary: article.summary?.slice(0, 500) || '',
            content: article.content || article.summary || '',
            slug: generateSlug(article.title),
            originalUrl: article.link,
            sourceId: source.id,
            sourceName: source.name,
            category: source.category,
            author: article.author || null,
            imageUrl: article.imageUrl || null,
            publishedAt: article.pubDate,
            fetchedAt: new Date(),
          });

          restoredCount++;
          existingTitles.add(article.title.toLowerCase());
          
          if (restoredCount <= 20) {
            console.log(`  ✅ 恢复: ${article.title.substring(0, 50)}...`);
          }
        } catch (err) {
          // 可能是重复 URL，跳过
          skippedCount++;
        }
      }
    } catch (error) {
      console.error(`  错误: ${error}`);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('恢复完成！');
  console.log('========================================');
  console.log(`恢复文章数: ${restoredCount}`);
  console.log(`跳过/已存在: ${skippedCount}`);
  console.log(`错误: ${errorCount}`);

  process.exit(0);
}

restoreDeletedArticles();
