import './load-env';
import { fetchAllRSS } from '@/lib/rss/fetcher';
import { db } from '@/lib/db/client';
import { fetchLogs } from '@/lib/db/schema';

async function main() {
  console.log('Starting RSS fetch job...');
  const startedAt = new Date();
  
  try {
    const results = await fetchAllRSS();
    
    const totalSources = results.length;
    const successfulSources = results.filter(r => r.errors.length === 0).length;
    const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);
    
    // 记录日志
    await db.insert(fetchLogs).values({
      startedAt,
      completedAt: new Date(),
      totalSources,
      successfulSources,
      totalNewArticles,
      errors: JSON.stringify(results.filter(r => r.errors.length > 0)),
    });
    
    console.log('RSS fetch completed:');
    console.log(`- Total sources: ${totalSources}`);
    console.log(`- Successful: ${successfulSources}`);
    console.log(`- New articles: ${totalNewArticles}`);
    
    results.forEach(r => {
      console.log(`  ${r.sourceName}: ${r.newArticles} new articles`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('RSS fetch failed:', error);
    
    await db.insert(fetchLogs).values({
      startedAt,
      completedAt: new Date(),
      totalSources: 0,
      successfulSources: 0,
      totalNewArticles: 0,
      errors: JSON.stringify([{ error: String(error) }]),
    });
    
    process.exit(1);
  }
}

main();
