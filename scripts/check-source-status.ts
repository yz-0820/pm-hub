import { db } from '../lib/db/client';
import { contentSources } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function check() {
  console.log('检查内容源状态...\n');

  const sources = await db.select().from(contentSources).orderBy(contentSources.sourceId);

  console.log(`数据库中的源总数: ${sources.length}\n`);

  console.log('各源状态:');
  for (const source of sources) {
    const lastFetch = source.lastFetchAt ? new Date(source.lastFetchAt).toISOString() : '从未抓取';
    const nextFetch = source.lastFetchAt && source.fetchInterval
      ? new Date(source.lastFetchAt.getTime() + source.fetchInterval * 1000).toISOString()
      : '未知';

    console.log(`\n  [${source.sourceId}] ${source.sourceName}`);
    console.log(`    启用: ${source.enabled}`);
    console.log(`    健康: ${source.isHealthy}`);
    console.log(`    抓取间隔: ${source.fetchInterval}秒`);
    console.log(`    上次抓取: ${lastFetch}`);
    console.log(`    下次抓取: ${nextFetch}`);
    console.log(`    总内容: ${source.totalContents}`);
    console.log(`    最后错误: ${source.lastError || '无'}`);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
