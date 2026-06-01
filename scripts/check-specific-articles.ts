/**
 * 检查特定文章是否存在于数据库中
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { like } from 'drizzle-orm';
import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

const targetTitles = [
  '1799元，小米米家即热饮水机 Max 制冰版开启众筹',
  '科大讯飞 Fika 手机造型墨水屏阅读器发布',
  '基普乔格代言：华为 WatchGT Runner 2 赛道传奇款开售',
  '小米米家即热饮水机',
  'Fika 手机造型墨水屏',
  'WatchGT Runner 2',
];

async function checkArticles() {
  console.log('检查特定文章是否存在...\n');

  try {
    for (const keyword of targetTitles) {
      const found = await db
        .select()
        .from(articles)
        .where(like(articles.title, `%${keyword}%`));

      if (found.length > 0) {
        console.log(`\n🔍 找到包含 "${keyword}" 的文章：`);
        for (const article of found) {
          const check = detectITHomeProductLaunch(
            article.title,
            article.content || article.summary || ''
          );
          console.log(`  - [${article.category}] ${article.title}`);
          console.log(`    来源: ${article.sourceName} (${article.sourceId})`);
          console.log(`    检测结果: ${check.isProductLaunch ? '❌ 产品发售' : '✅ 非产品发售'}`);
          if (check.reason) {
            console.log(`    原因: ${check.reason}`);
          }
        }
      } else {
        console.log(`✅ 未找到包含 "${keyword}" 的文章（已删除或从未入库）`);
      }
    }

  } catch (error) {
    console.error('查询出错:', error);
  }

  process.exit(0);
}

checkArticles();
