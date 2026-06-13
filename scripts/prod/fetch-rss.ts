import './load-env';

async function main() {
  const { fetchAllRSS } = await import('@/lib/rss/fetcher');
  const { db } = await import('@/lib/db/client');
  const { fetchLogs } = await import('@/lib/db/schema');
  const { createRSSFetchLogPayload } = await import('@/lib/rss/fetch-summary');

  console.log('Starting RSS fetch job...');
  const startedAt = new Date();
  
  try {
    const results = await fetchAllRSS();
    
    const totalSources = results.length;
    const successfulSources = results.filter(r => r.errors.length === 0).length;
    const totalNewArticles = results.reduce((sum, r) => sum + r.newArticles, 0);
    const totalRejectedArticles = results.reduce((sum, r) => sum + r.rejectedArticles, 0);
    const logPayload = createRSSFetchLogPayload(results);
    
    // 记录日志
    await db.insert(fetchLogs).values({
      startedAt,
      completedAt: new Date(),
      totalSources,
      successfulSources,
      totalNewArticles,
      errors: JSON.stringify(logPayload),
    });
    
    console.log('RSS fetch completed:');
    console.log(`- Total sources: ${totalSources}`);
    console.log(`- Successful: ${successfulSources}`);
    console.log(`- New articles: ${totalNewArticles}`);
    console.log(`- Rejected articles: ${totalRejectedArticles}`);
    
    results.forEach(r => {
      console.log(`  ${r.sourceName}: ${r.newArticles} new, ${r.rejectedArticles} rejected`);
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
