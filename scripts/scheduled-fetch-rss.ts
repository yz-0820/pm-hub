import { fetchAllRSS } from '../lib/rss/fetcher';

let running = true;
process.on('SIGINT', () => { console.log('\n[Shutdown] Stopping...'); running = false; });
process.on('SIGTERM', () => { console.log('\n[Shutdown] Stopping...'); running = false; });

const intervalMs = (() => {
  const idx = process.argv.indexOf('--interval');
  const minutes = idx >= 0 ? parseInt(process.argv[idx + 1] || '60', 10) : parseInt(process.env.LOCAL_RSS_INTERVAL_MINUTES || '60', 10);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.max(10, Math.min(24 * 60, Math.floor(minutes))) : 60;
  return safeMinutes * 60 * 1000;
})();

console.log(`[Scheduler] RSS fetch scheduler started`);
console.log(`[Scheduler] Interval: ${intervalMs / 60000}min`);

async function runOnce() {
  console.log(`\n[Fetch] Starting at ${new Date().toISOString()}`);
  const startedAt = Date.now();

  try {
    const results = await fetchAllRSS();
    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    console.log(`[Fetch] Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    console.log(`[Fetch] Sources: ${results.length}, Fetched: ${totalFetched}, New: ${totalNew}, Errors: ${totalErrors}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Fetch] Error: ${msg}`);
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
