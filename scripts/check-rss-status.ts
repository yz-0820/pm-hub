import { db } from '../lib/db/client';
import { contentSources, contentFetchLogs } from '../lib/db/schema';
import { desc, gte } from 'drizzle-orm';

async function check() {
  console.log('检查 RSS 抓取任务状态...\n');

  // 获取所有内容源
  const sources = await db.select().from(contentSources);
  console.log(`内容源总数: ${sources.length}`);

  // 获取最近24小时的抓取日志
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentLogs = await db
    .select()
    .from(contentFetchLogs)
    .where(gte(contentFetchLogs.startedAt, oneDayAgo))
    .orderBy(desc(contentFetchLogs.startedAt));

  console.log(`\n最近24小时抓取日志: ${recentLogs.length} 条`);

  // 按源分组统计
  const logsBySource = new Map<string, typeof recentLogs>();
  for (const log of recentLogs) {
    const list = logsBySource.get(log.sourceId) || [];
    list.push(log);
    logsBySource.set(log.sourceId, list);
  }

  console.log('\n各源最近抓取情况:');
  for (const [sourceId, logs] of logsBySource) {
    const source = sources.find(s => s.sourceId === sourceId);
    const lastLog = logs[0];
    console.log(`\n  [${source?.name || sourceId}]`);
    console.log(`    最近抓取: ${lastLog.startedAt?.toISOString()}`);
    console.log(`    状态: ${lastLog.errorCount && lastLog.errorCount > 0 ? '有错误' : '成功'}`);
    console.log(`    新内容: ${lastLog.newCount} 条`);
    console.log(`    错误数: ${lastLog.errorCount || 0}`);
  }

  // 检查是否有从未抓取过的源
  const neverFetched = sources.filter(s => !recentLogs.some(l => l.sourceId === s.sourceId));
  if (neverFetched.length > 0) {
    console.log(`\n⚠️ 最近24小时未抓取的源 (${neverFetched.length} 个):`);
    for (const s of neverFetched) {
      console.log(`  - ${s.name} (${s.sourceId})`);
    }
  }

  // 检查环境变量
  console.log('\n环境变量检查:');
  console.log(`  ENABLE_LOCAL_RSS_SCHEDULER: ${process.env.ENABLE_LOCAL_RSS_SCHEDULER || '未设置'}`);
  console.log(`  LOCAL_RSS_INTERVAL_MINUTES: ${process.env.LOCAL_RSS_INTERVAL_MINUTES || '未设置'}`);
  console.log(`  CRON_SECRET: ${process.env.CRON_SECRET ? '已设置' : '未设置'}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
