/**
 * 修复券商研报文章分类
 * 将错误分类为科技动态的券商研报重新归类为金融市场
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateFinanceRelevance } from '@/lib/rss/finance-relevance';

// 券商关键词列表
const BROKER_KEYWORDS = [
  '申万宏源', '中信建投', '中信证券', '国泰君安', '海通证券', '华泰证券',
  '招商证券', '广发证券', '银河证券', '东方证券', '光大证券', '平安证券',
  '兴业证券', '长江证券', '国信证券', '中金公司', '中投证券', '安信证券',
  '国金证券', '方正证券', '东吴证券', '浙商证券', '东北证券', '西南证券',
  '国海证券', '西部证券', '山西证券', '国元证券', '华安证券', '第一创业',
  '中原证券', '南京证券', '华林证券', '长城证券', '东莞证券', '国都证券',
  '东海证券', '中银国际', '民生证券', '华创证券', '天风证券', '开源证券',
  '中泰证券', '华西证券', '财通证券', '华福证券', '万联证券', '联储证券',
  '华兴证券', '高盛', '摩根士丹利', '摩根大通', '花旗', '瑞银', '瑞信',
  '野村', '大和', '汇丰', '法巴', '德银', '巴克莱',
];

async function fixBrokerReportCategorization() {
  console.log('========================================');
  console.log('修复券商研报文章分类');
  console.log('========================================\n');

  // 查询所有可能被错误分类的文章
  const allArticles = await db.select().from(articles);
  
  // 筛选标题中包含券商名称的文章
  const potentialBrokerArticles = allArticles.filter(a => {
    const title = a.title.toLowerCase();
    return BROKER_KEYWORDS.some(keyword => 
      title.includes(keyword.toLowerCase()) || 
      title.includes(keyword.toLowerCase().replace(/证券|投行/g, ''))
    );
  });

  console.log(`找到 ${potentialBrokerArticles.length} 篇可能为券商研报的文章\n`);

  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let notFinanceCount = 0;

  for (const article of potentialBrokerArticles) {
    const body = article.content || article.summary || '';
    const r = evaluateFinanceRelevance({ 
      title: article.title, 
      content: body, 
      link: '', 
      pubDate: new Date() 
    });

    if (r.passed) {
      if (article.category !== 'finance') {
        // 需要修复分类
        await db.update(articles)
          .set({ 
            category: 'finance',
            relevanceScore: r.score 
          })
          .where(eq(articles.id, article.id));
        
        fixedCount++;
        console.log(`✅ 修复: [${article.category} → finance] ${article.title.substring(0, 50)}...`);
        console.log(`   分数: ${r.score}`);
      } else {
        // 已经是正确分类，更新分数
        await db.update(articles)
          .set({ relevanceScore: r.score })
          .where(eq(articles.id, article.id));
        
        alreadyCorrectCount++;
      }
    } else {
      notFinanceCount++;
      console.log(`❌ 非金融: ${article.title.substring(0, 50)}...`);
      console.log(`   分数: ${r.score}, 原因: ${r.meta.rejectedBy || '未通过评估'}`);
    }
  }

  console.log('\n========================================');
  console.log('修复完成！');
  console.log('========================================');
  console.log(`已修复分类: ${fixedCount} 篇`);
  console.log(`已是正确分类: ${alreadyCorrectCount} 篇`);
  console.log(`非金融文章: ${notFinanceCount} 篇`);
  console.log(`总计处理: ${potentialBrokerArticles.length} 篇`);

  process.exit(0);
}

fixBrokerReportCategorization();
