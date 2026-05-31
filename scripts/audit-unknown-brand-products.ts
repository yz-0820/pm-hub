/**
 * 非顶尖公司产品发布文章自检脚本
 * 定期扫描数据库，检测并清理不知名公司的产品发布文章
 * 
 * 运行方式：npx tsx scripts/audit-unknown-brand-products.ts
 */

import { db } from '../lib/db/client';
import { articles } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// 顶尖公司白名单（与 tech-relevance.ts / ai-relevance.ts 保持一致）
const TOP_TIER_BRANDS = [
  '苹果', 'apple', 'iphone', 'ipad', 'mac', 'vision pro',
  '谷歌', 'google', 'pixel',
  '微软', 'microsoft', 'surface', 'xbox',
  '三星', 'samsung', 'galaxy',
  '索尼', 'sony', 'playstation', 'ps5',
  'meta', 'quest',
  '亚马逊', 'amazon',
  '英伟达', 'nvidia', 'rtx', 'geforce',
  'amd', '锐龙', 'ryzen', 'radeon',
  '特斯拉', 'tesla',
  '华为', 'huawei', '鸿蒙', 'harmonyos', 'mate', 'pura',
  '小米', 'xiaomi', '红米', 'redmi', '澎湃', 'su7',
  'oppo', '一加', 'oneplus', '真我', 'realme',
  'vivo', 'iqoo',
  '荣耀', 'honor',
  '魅族', 'meizu',
  '联想', 'lenovo', 'thinkpad', '拯救者', 'legion',
  '华硕', 'asus', 'rog', '玩家国度',
  '戴尔', 'dell', '外星人', 'alienware',
  '惠普', 'hp',
  '大疆', 'dji', 'mavic', 'pocket', 'osmo',
  '比亚迪', 'byd', '仰望', '方程豹', '腾势',
  '蔚来', 'nio', '小鹏', 'xpeng', '理想', 'li auto',
  '任天堂', 'nintendo', 'switch',
  'steam', 'valve',
  '罗技', 'logitech',
  '雷蛇', 'razer',
];

// 芯片/组件供应商 - 不能单独作为品牌通过的依据
const CHIP_SUPPLIERS = [
  '英特尔', 'intel', '酷睿', 'core',
  '高通', 'qualcomm', '骁龙', 'snapdragon',
  '天玑', 'mediatek',
];

// 产品发布信号
const productReleaseSignals = ['发布', '发售', '开售', '上市', '推出', '亮相', '开卖', '首销'];
const productPriceSignals = ['元', '售价', '首发价', '起价', '限时价', '优惠价', '定价'];
const productSpecSignals = ['配置', '参数', '规格', '处理器', '内存', '屏幕', '电池', '英寸', '刷新率'];

function isUnknownBrandProduct(title: string, body: string): boolean {
  const fullText = `${title} ${body}`.toLowerCase();

  // 检查是否包含顶尖品牌
  const hasTopTierBrand = TOP_TIER_BRANDS.some(brand =>
    fullText.includes(brand.toLowerCase())
  );

  // 检查是否包含芯片供应商
  const hasChipSupplier = CHIP_SUPPLIERS.some(chip =>
    fullText.includes(chip.toLowerCase())
  );

  // 只有芯片供应商没有产品品牌 → 视为未知品牌
  if (!hasTopTierBrand && hasChipSupplier) {
    // 继续检查是否为产品发布
  } else if (hasTopTierBrand) {
    return false;
  }

  // 检查是否为产品发布
  const hasProductRelease = productReleaseSignals.some(s => title.includes(s));
  const hasProductPrice = productPriceSignals.some(s => title.includes(s));
  const specCount = productSpecSignals.filter(s => title.includes(s)).length;

  // 产品发布特征：发布信号 + (价格信号 或 多个规格信号)
  const isProductRelease = hasProductRelease && (hasProductPrice || specCount >= 2);

  return isProductRelease;
}

async function auditUnknownBrandProducts() {
  console.log('=== 非顶尖公司产品发布文章自检 ===\n');
  console.log(`开始时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);

  // 获取所有文章
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      summary: articles.summary,
      category: articles.category,
      sourceName: articles.sourceName,
    })
    .from(articles);

  console.log(`总文章数: ${allArticles.length}\n`);

  const toDelete: Array<{ id: number; title: string; category: string }> = [];

  for (const article of allArticles) {
    const title = article.title || '';
    const body = article.summary || '';

    if (isUnknownBrandProduct(title, body)) {
      toDelete.push({
        id: article.id,
        title,
        category: article.category,
      });
    }
  }

  console.log(`发现 ${toDelete.length} 篇非顶尖公司产品发布文章:\n`);

  // 按分类统计
  const byCategory: Record<string, number> = {};
  for (const a of toDelete) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    console.log(`  [${a.category}] ${a.title.substring(0, 60)}...`);
  }

  console.log(`\n分类统计:`);
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count} 篇`);
  }

  if (toDelete.length > 0) {
    console.log(`\n正在删除...`);
    for (const a of toDelete) {
      await db.delete(articles).where(eq(articles.id, a.id));
    }
    console.log(`✅ 已删除 ${toDelete.length} 篇非顶尖公司产品发布文章`);
  } else {
    console.log('\n✅ 未发现非顶尖公司产品发布文章');
  }

  console.log(`\n完成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
}

auditUnknownBrandProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
