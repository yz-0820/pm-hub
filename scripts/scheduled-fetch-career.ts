/**
 * 职业发展内容定时抓取器
 * 用法: tsx scripts/scheduled-fetch-career.ts [--interval 300]
 * 默认每5分钟抓取一次
 */

import { initContentSources, fetchAllCareerContents } from '../lib/career/fetcher';
import { invalidateContentCache, cleanExpiredCache, getCacheStats } from '../lib/career/cache';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data/sqlite.db');

// 信号处理：优雅退出
let running = true;
process.on('SIGINT', () => { console.log('\n[Shutdown] Stopping...'); running = false; });
process.on('SIGTERM', () => { console.log('\n[Shutdown] Stopping...'); running = false; });

// 获取抓取间隔
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

console.log(`[Scheduler] Career content fetch scheduler started`);
console.log(`[Scheduler] Interval: ${intervalMs / 1000}s (${intervalMs / 60000}min)`);
console.log(`[Scheduler] DB: ${DB_PATH}`);

async function runOnce() {
  // 确保DB目录存在
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  console.log(`\n[Fetch] Starting at ${new Date().toISOString()}`);
  const startTime = Date.now();

  try {
    // 初始化内容源（将配置同步到数据库）
    await initContentSources();

    // 抓取所有源
    const results = await fetchAllCareerContents();

    // 统计
    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newContents, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedContents, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`[Fetch] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`[Fetch] Sources: ${results.length}, Fetched: ${totalFetched}, New: ${totalNew}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);

    if (totalNew > 0 || totalUpdated > 0) {
      // 有新内容或更新，清除缓存
      await invalidateContentCache();
      console.log(`[Cache] Invalidated due to new/updated content`);
    }

    // 定期清理过期缓存（每6次抓取清理一次）
    if (Math.random() < 0.17) {
      const cleaned = await cleanExpiredCache();
      if (cleaned > 0) console.log(`[Cache] Cleaned ${cleaned} expired cache entries`);
    }

    // 缓存统计
    const stats = getCacheStats();
    console.log(`[Cache] Memory: ${stats.memory.size}/${stats.memory.maxSize}`);

  } catch (error) {
    console.error(`[Fetch] Error:`, error);
  }
}

async function main() {
  // 首次立即执行
  await runOnce();

  // 定时循环
  while (running) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, intervalMs);
      // 允许被SIGINT中断
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
