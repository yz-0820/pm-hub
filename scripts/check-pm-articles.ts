import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { PM_THRESHOLD } from '@/lib/rss/pm-relevance';

async function check() {
  const all = await db.select().from(articles);
  const pm = all.filter(a => a.category === 'product-management');
  
  console.log('PM文章总数:', pm.length);
  console.log('PM_THRESHOLD:', PM_THRESHOLD);
  
  const withScore = pm.filter(a => a.relevanceScore && Number(a.relevanceScore) >= PM_THRESHOLD);
  console.log('分数 >= 95:', withScore.length);
  
  const noScore = pm.filter(a => !a.relevanceScore || Number(a.relevanceScore) === 0);
  console.log('无分数或分数=0:', noScore.length);
  
  const lowScore = pm.filter(a => a.relevanceScore && Number(a.relevanceScore) > 0 && Number(a.relevanceScore) < PM_THRESHOLD);
  console.log('分数 < 95:', lowScore.length);
  
  if (pm.length > 0) {
    console.log('\n示例文章（前10条）:');
    pm.slice(0, 10).forEach(a => {
      console.log(`- 分数=${a.relevanceScore} | ${a.title.substring(0, 40)}`);
    });
  }
  
  process.exit(0);
}

check();
