/**
 * 促销导购检测模块
 * 用于识别和过滤电商促销、价格导购类文章
 * 这类文章无论是否包含产品/科技关键词，都应该被拒绝
 */

// ========== 强促销导购检测模式 ==========
export const PROMO_DEAL_PATTERNS: Array<{ label: string; re: RegExp }> = [
  // 价格箭头模式：原价 → 折后价（如 "2099 → 979 元"）
  { label: '价格箭头促销', re: /\d+[\s]*[→➡]\s*\d+\s*元/ },
  // 国补/以旧换新/叠加优惠
  { label: '国补促销', re: /(国补|以旧换新|晒单返|种草返|叠加|领券|满减|立减)/ },
  // 京东/天猫促销活动
  { label: '电商大促', re: /(京东|天猫|淘宝|拼多多|苏宁).*(618|双11|双12|大促|促销|活动|会场)/ },
  // 折扣率描述（如 "9折", "6.5折券"）
  { label: '折扣率', re: /\d[\.\d]*折(券)?/ },
  // "新低"/"到手价"/"史低"
  { label: '到手价/新低', re: /(新低|史低|到手价|到手仅需|折合仅需|券后|补贴后)/ },
  // 促销步骤引导
  { label: '购买步骤引导', re: /(先领|领券后|下单时|加入购物车|按下方|点此查看|点此抽取)/ },
  // PLUS会员/会员价
  { label: '会员专享价', re: /(plus|PLUS|会员价|会员专享|仅售|仅需)/ },
  // 价格+新低组合（如 "3173 元国补新低"）
  { label: '价格新低', re: /\d+\s*元.*(国补|新低|史低)/ },
  // 京东活动免责声明（促销文章标配）
  { label: '京东活动声明', re: /京东活动可能随时变更/ },
];

// 强信号列表 - 单个命中即可判定为促销
const STRONG_SIGNALS = ['价格箭头促销', '国补促销', '到手价/新低', '价格新低', '京东活动声明'];

/**
 * 检测是否为强促销导购文章
 * @param title 文章标题
 * @param body 文章正文/摘要
 * @returns 检测结果：是否为促销文章 + 原因
 */
export function detectPromoDeal(title: string, body: string): { isPromo: boolean; reason: string } {
  const fullText = `${title} ${body}`;
  const hits = PROMO_DEAL_PATTERNS.filter(p => p.re.test(fullText));

  // 命中2个及以上促销模式 → 判定为促销导购
  if (hits.length >= 2) {
    return { isPromo: true, reason: `promo_deal(${hits.map(h => h.label).join(',')})` };
  }

  // 单个强信号也拒绝
  if (hits.some(h => STRONG_SIGNALS.includes(h.label))) {
    return { isPromo: true, reason: `promo_deal(${hits.find(h => STRONG_SIGNALS.includes(h.label))!.label})` };
  }

  return { isPromo: false, reason: '' };
}

/**
 * 促销检测结果类型
 */
export type PromoDealCheckResult = { isPromo: boolean; reason: string };
