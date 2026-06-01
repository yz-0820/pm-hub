/**
 * 产品发售检测自我验证脚本
 * 用于验证 detectITHomeProductLaunch 函数是否能正确识别产品发售文章
 */

import { detectITHomeProductLaunch } from '@/lib/rss/product-launch';

// 测试用例
const testCases = [
  // ========== 应该被识别为产品发售的文章 ==========
  {
    title: '1799元，小米米家即热饮水机 Max 制冰版开启众筹',
    body: 'IT之家 6 月 1 日消息，小米米家即热饮水机 Max 制冰版今日开启众筹，建议零售价 1999 元，众筹价 1799 元...',
    expected: true,
    description: '价格开头 + 众筹',
  },
  {
    title: '2026款宏碁非凡 GO 27英寸一体机新增"淡雅白"配色版本：配 2K 面板、i5-12450H 处理器，3899元起',
    body: 'IT之家 6 月 1 日消息，宏碁现已在京东为旗下非凡 GO 一体机新增"淡雅白"配色版本...',
    expected: true,
    description: '新增配色 + 价格',
  },
  {
    title: '文石 Note X6 墨水屏读写办公本首销：10.3 英寸、高通 6690，售价 3299 元',
    body: '...',
    expected: true,
    description: '首销 + 价格',
  },
  {
    title: '华为 AI 眼镜"钛丝半框光学镜方形款"今日开售：钛银灰配色，2499 元',
    body: '...',
    expected: true,
    description: '今日开售 + 价格',
  },
  {
    title: '399元起，徕芬手持折叠小风扇 AirFold 开售',
    body: '...',
    expected: true,
    description: '价格开头 + 开售',
  },
  
  // ========== 不应该被识别为产品发售的文章 ==========
  {
    title: '中国科学家开发出无人机蜂群新算法：通信中断、视野受限条件下仍能作战',
    body: '...',
    expected: false,
    description: '科技新闻，无产品发售',
  },
  {
    title: '马斯克辟谣：SpaceX 下调 IPO 估值的报道不实',
    body: '...',
    expected: false,
    description: '财经新闻',
  },
  {
    title: '挑战美国巨头垄断，欧盟开源办公软件 EuroOffice 下月发布',
    body: '...',
    expected: false,
    description: '行业动态，非具体产品发售',
  },
  {
    title: '半年涨价 40%：人工智能带火了金属锡，业内预计仅够开采 15 年',
    body: '...',
    expected: false,
    description: '行业分析，无具体产品',
  },
];

console.log('========================================');
console.log('产品发售检测自我验证');
console.log('========================================\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = detectITHomeProductLaunch(testCase.title, testCase.body);
  const isCorrect = result.isProductLaunch === testCase.expected;
  
  if (isCorrect) {
    passed++;
    console.log(`✅ [通过] ${testCase.description}`);
    console.log(`   标题: ${testCase.title.substring(0, 60)}...`);
    if (result.isProductLaunch) {
      console.log(`   原因: ${result.reason}`);
    }
  } else {
    failed++;
    console.log(`❌ [失败] ${testCase.description}`);
    console.log(`   标题: ${testCase.title}`);
    console.log(`   期望: ${testCase.expected ? '是产品发售' : '不是产品发售'}`);
    console.log(`   实际: ${result.isProductLaunch ? '是产品发售' : '不是产品发售'}`);
    if (result.reason) {
      console.log(`   原因: ${result.reason}`);
    }
  }
  console.log('');
}

console.log('========================================');
console.log('验证结果');
console.log('========================================');
console.log(`总计: ${testCases.length} 个测试用例`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ 验证未通过，请检查检测逻辑');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试用例通过！');
  process.exit(0);
}
