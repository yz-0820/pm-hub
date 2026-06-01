/**
 * IT之家 产品介绍/发售文章检测
 * 用于识别和过滤产品介绍、发售、上市类文章
 */

// 产品发售信号关键词 - 标题中出现这些词表明可能是产品发售文章
const PRODUCT_LAUNCH_SIGNALS = [
  '发布', '发售', '开售', '上市', '推出', '亮相', '开卖', '首销',
  '展示', '公布', '曝光', '开启预约', '开启预售', '正式发布',
  '正式发售', '正式开售', '正式上市', '新品发布', '新品上市',
  // 新增：众筹、新增版本/配色、预售等
  '众筹', '开启众筹', '新增', '配色', '版本', '预售', '预定', '预订',
  '首发', '正式首发', '全球首发', '国内首发',
];

// 产品价格信号 - 表明文章包含价格信息
const PRODUCT_PRICE_SIGNALS = [
  '元', '售价', '首发价', '起价', '限时价', '优惠价', '美元', 
  '定价', '到手价', '国行价', '港版价', '美版价', '价格',
  '多少钱', '仅需', '只要', '低至', '直降', '降价',
];

// 产品规格信号 - 表明文章包含详细产品规格
const PRODUCT_SPEC_SIGNALS = [
  '配置', '参数', '规格', '处理器', '内存', '屏幕', '电池', 
  '英寸', '刷新率', '芯片', '核心', 'mAh', 'GB', 'TB', 'MP',
  '像素', '分辨率', '跑分', ' benchmark', '重量', '厚度',
  '摄像头', '镜头', '传感器', '光圈', '焦距',
];

// 强产品发售信号 - 标题中出现这些词几乎可以确定是产品发售文章
const STRONG_PRODUCT_LAUNCH_SIGNALS = [
  '今日开售', '今日发售', '今日上市', '正式开售', '正式发售', '正式上市',
  '首销', '首发价', '国行开售', '国行发售', '国行上市',
  '开启预约', '开启预售', '预约开启', '预售开启',
  '降价', '直降', '跌破', '元现货', '元开售', '元发售',
  // 新增：众筹相关
  '开启众筹', '众筹开启', '众筹价', '众筹中',
  // 新增：新增版本/配色（带价格）
  '新增.*配色', '新增.*版本', '新配色.*元', '新版本.*元',
];

/**
 * 检测是否为产品介绍/发售类文章
 * 
 * 检测逻辑：
 * 1. 如果标题命中强产品发售信号 → 直接判定为产品发售
 * 2. 如果标题命中产品发售信号 + (价格信号 或 规格信号) → 判定为产品发售
 * 
 * @param title 文章标题
 * @param body 文章内容
 * @returns 检测结果和原因
 */
export function detectProductLaunch(
  title: string,
  body: string
): {
  isProductLaunch: boolean;
  reason: string;
} {
  const fullText = `${title} ${body}`.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // ========== 最高优先级：价格开头模式 ==========
  // 标题以 "数字+元" 开头（如 "1799元，小米..."），直接判定为产品发售
  const priceStartPattern = /^\d+[\d,]*\s*元[，,、\s]/;
  if (priceStartPattern.test(title)) {
    return {
      isProductLaunch: true,
      reason: `price_start_pattern: ${title.match(/^\d+[\d,]*\s*元/)?.[0]}`,
    };
  }

  // ========== 高优先级：强产品发售信号 ==========
  // 标题中出现强信号词，直接判定为产品发售
  const strongSignalHits = STRONG_PRODUCT_LAUNCH_SIGNALS.filter(keyword =>
    lowerTitle.includes(keyword.toLowerCase())
  );
  
  if (strongSignalHits.length >= 1) {
    return {
      isProductLaunch: true,
      reason: `strong_product_launch_signal: ${strongSignalHits.join(', ')}`,
    };
  }

  // ========== 常规检测：产品发售信号 + 辅助信号 ==========
  // 检测产品发售信号
  const launchSignalHits = PRODUCT_LAUNCH_SIGNALS.filter(keyword =>
    lowerTitle.includes(keyword.toLowerCase())
  );

  // 如果没有产品发售信号，直接返回
  if (launchSignalHits.length === 0) {
    return {
      isProductLaunch: false,
      reason: '',
    };
  }

  // 检测价格信号
  const priceSignalHits = PRODUCT_PRICE_SIGNALS.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  );

  // 检测规格信号
  const specSignalHits = PRODUCT_SPEC_SIGNALS.filter(keyword =>
    fullText.includes(keyword.toLowerCase())
  );

  // 产品发售信号 + (价格信号 或 规格信号) = 产品发售文章
  if (priceSignalHits.length >= 1 || specSignalHits.length >= 2) {
    return {
      isProductLaunch: true,
      reason: `product_launch_with_${priceSignalHits.length > 0 ? 'price' : 'specs'}: ${launchSignalHits.join(', ')}`,
    };
  }

  return {
    isProductLaunch: false,
    reason: '',
  };
}

/**
 * 专门用于 IT之家 的文章检测
 * 对 IT之家 的文章进行更严格的检测
 * 
 * @param title 文章标题
 * @param body 文章内容
 * @returns 检测结果和原因
 */
export function detectITHomeProductLaunch(
  title: string,
  body: string
): {
  isProductLaunch: boolean;
  reason: string;
} {
  // IT之家 的文章通常更短，标题更直接
  // 使用相同的检测逻辑，但可以考虑未来添加 IT之家 特有的规则
  return detectProductLaunch(title, body);
}
