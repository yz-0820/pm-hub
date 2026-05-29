import { initContentSources, fetchAllCareerContents } from '../lib/career/fetcher';
import { invalidateContentCache, cleanExpiredCache, getCacheStats } from '../lib/career/cache';

let running = true;
process.on('SIGINT', () => { console.log('\n[Shutdown] Stopping...'); running = false; });
process.on('SIGTERM', () => { console.log('\n[Shutdown] Stopping...'); running = false; });

const intervalMs = (() => {
  const idx = process.argv.indexOf('--interval');
  if (idx >= 0) return parseInt(process.argv[idx + 1] || '300', 10) * 1000;
  const envMinutes = process.env.CAREER_FETCH_INTERVAL_MINUTES?.trim();
  if (envMinutes) {
    const minutes = parseInt(envMinutes, 10);
    if (Number.isFinite(minutes) && minutes > 0) return minutes * 60_000;
  }
  return 300_000;
})();

console.log('[Scheduler] Career content fetch scheduler started');
console.log(`[Scheduler] Interval: ${intervalMs / 1000}s (${intervalMs / 60000}min)`);

async function runOnce() {
  console.log(`\n[Fetch] Starting at ${new Date().toISOString()}`);
  const startTime = Date.now();

  try {
    await initContentSources();
    const results = await fetchAllCareerContents();

    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newContents, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedContents, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`[Fetch] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`[Fetch] Sources: ${results.length}, Fetched: ${totalFetched}, New: ${totalNew}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);

    if (totalNew > 0 || totalUpdated > 0) {
      await invalidateContentCache();
      console.log('[Cache] Invalidated due to new/updated content');
    }

    if (Math.random() < 0.17) {
      const cleaned = await cleanExpiredCache();
      if (cleaned > 0) console.log(`[Cache] Cleaned ${cleaned} expired cache entries`);
    }

    const stats = getCacheStats();
    console.log(`[Cache] Memory: ${stats.memory.size}/${stats.memory.maxSize}`);
  } catch (error) {
    console.error('[Fetch] Error:', error);
  }
}

async function main() {
  await runOnce();

  while (running) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, intervalMs);
      const checkRunning = setInterval(() => {
        if (!running) {
          clearTimeout(timer);
          clearInterval(checkRunning);
          resolve(undefined);
        }
      }, 1000);
    });
    if (running) await runOnce();
  }

  console.log('[Scheduler] Stopped');
}

main().catch(console.error);
