/**
 * 手动抓取职业发展内容脚本
 */

import './load-env';

async function main() {
  const { fetchAllCareerContents, initContentSources } = await import('@/lib/career/fetcher');
  const { invalidateContentCache } = await import('@/lib/career/cache');

  console.log('Initializing career content system...\n');

  // 初始化内容源
  await initContentSources();

  console.log('Fetching career contents...\n');

  try {
    const results = await fetchAllCareerContents();

    console.log('\n========================================');
    console.log('Fetch Results:');
    console.log('========================================\n');

    let totalFetched = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalRejected = 0;

    for (const result of results) {
      console.log(`[${result.sourceName}]`);
      console.log(`  Fetched: ${result.fetched}`);
      console.log(`  New: ${result.newContents}`);
      console.log(`  Updated: ${result.updatedContents}`);
      console.log(`  Rejected: ${result.rejectedContents}`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
      console.log('');

      totalFetched += result.fetched;
      totalNew += result.newContents;
      totalUpdated += result.updatedContents;
      totalRejected += result.rejectedContents;
    }

    console.log('========================================');
    console.log(`Total Fetched: ${totalFetched}`);
    console.log(`Total New: ${totalNew}`);
    console.log(`Total Updated: ${totalUpdated}`);
    console.log(`Total Rejected: ${totalRejected}`);
    console.log('========================================\n');

    // 使缓存失效
    if (totalNew > 0 || totalUpdated > 0) {
      await invalidateContentCache();
      console.log('Cache invalidated.\n');
    }

    console.log('Done!');
  } catch (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }
}

main();
