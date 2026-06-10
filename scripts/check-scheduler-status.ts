import { db } from '../lib/db/client';
import { contentSources, contentFetchLogs } from '../lib/db/schema';
import { desc, gte, sql } from 'drizzle-orm';

async function check() {
  console.log('检查调度器运行状态...\n');

  // 获取最近一次的抓取日志
  const latestLog = await db
    .select()
    .from(contentFetchLogs)
    .orderBy(desc(contentFetchLogs.startedAt))
    .limit(1);

  if (latestLog.length > 0) {
    const log = latestLog[0];
    console.log('最近一次抓取:');
    console.log(`  时间: ${log.startedAt?.toISOString()}`);
    console.log(`  源: ${log.sourceId}`);
    console.log(`  新内容: ${log.newCount}`);
    console.log(`  错误数: ${log.errorCount}`);
  } else {
    console.log('没有找到抓取日志');
  }

  // 获取所有源的最近抓取时间
  const sources = await db.select().from(contentSources);
  
  console.log('\n各源最近抓取时间:');
  const now = Date.now();
  for (const source of sources) {
    if (source.lastFetchAt) {
      const hoursAgo = Math.round((now - source.lastFetchAt.getTime()) / (1000 * 60 * 60) * 10) / 10;
      console.log(`  [${source.sourceId}] ${hoursAgo}小时前 - ${source.lastFetchAt.toISOString()}`);
    } else {
      console.log(`  [${source.sourceId}] 从未抓取`);
    }
  }

  // 检查环境变量
  console.log('\n环境变量:');
  console.log(`  ENABLE_LOCAL_RSS_SCHEDULER: ${process.env.ENABLE_LOCAL_RSS_SCHEDULER || '未设置'}`);
  console.log(`  ENABLE_LOCAL_CAREER_SCHEDULER: ${process.env.ENABLE_LOCAL_CAREER_SCHEDULER || '未设置'}`);
  console.log(`  LOCAL_RSS_INTERVAL_MINUTES: ${process.env.LOCAL_RSS_INTERVAL_MINUTES || '未设置'}`);
  console.log(`  LOCAL_CAREER_INTERVAL_MINUTES: ${process.env.LOCAL_CAREER_INTERVAL_MINUTES || '未设置'}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
