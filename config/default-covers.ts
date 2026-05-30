/**
 * 默认封面图配置
 * 为文章页（articles）和职业发展页（career）提供分类相关的默认配图
 * 每个分类多张图片，通过文章ID/标题的hash值稳定分配
 */

// ========== 文章分类默认配图 ==========
export const articleDefaultCovers: Record<string, string[]> = {
  'product-management': [
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=400&fit=crop',
  ],
  'tech': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
  ],
  'ai': [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
  ],
  'finance': [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop',
  ],
};

// ========== 职业分类默认配图（扩展版） ==========
export const careerDefaultCovers: Record<string, string[]> = {
  communication: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
  ],
  productivity: [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  ],
  teamwork: [
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop',
  ],
  leadership: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop',
  ],
  all: [
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
  ],
};

// 所有默认封面图的集合（用于判断是否为默认封面）
export const allDefaultCoverValues = new Set([
  ...Object.values(articleDefaultCovers).flat(),
  ...Object.values(careerDefaultCovers).flat(),
]);

/**
 * 根据种子字符串生成稳定的索引
 */
function stableImageIndex(seed: string, size: number): number {
  if (size <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % size;
}

/**
 * 获取文章分类的默认封面
 */
export function getArticleDefaultCover(category: string, seed = ''): string {
  const covers = articleDefaultCovers[category] || articleDefaultCovers['product-management'];
  return covers[stableImageIndex(seed || category, covers.length)] || covers[0];
}

/**
 * 获取职业分类的默认封面
 */
export function getCareerDefaultCover(category: string, seed = ''): string {
  const covers = careerDefaultCovers[category] || careerDefaultCovers.all;
  return covers[stableImageIndex(seed || category, covers.length)] || careerDefaultCovers.all[0];
}

/**
 * 判断是否为默认封面图
 */
export function isDefaultCoverImage(url?: string | null): boolean {
  return !!url && allDefaultCoverValues.has(url);
}
