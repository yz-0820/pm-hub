import type { ParsedArticle } from '@/types';

type AIRelevanceResult = {
  passed: boolean;
  score: number;
  meta: {
    score: number;
    positiveHits: string[];
    titleHits: string[];
    negativeHits: string[];
    threshold: number;
  };
};

export const AI_THRESHOLD = 35;

// AI相关关键词
const AI_KEYWORDS = [
  '人工智能', 'ai', 'a.i.',
  '机器学习', '深度学习', '神经网络',
  '大模型', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini',
  '生成式', '生成式ai', 'aigc',
  '算法', '模型训练', '推理', '微调', 'fine-tuning',
  '自然语言处理', 'nlp', '计算机视觉', 'cv',
  '语音识别', '图像识别', '人脸识别',
  '自动驾驶', '智能驾驶', '无人驾驶',
  '机器人', '具身智能', '人形机器人',
  '智能体', 'agent', 'ai agent',
  '多模态', 'transformer', 'diffusion', 'gan',
  'openai', 'anthropic', 'google ai', 'meta ai',
  '百度智能', '文心一言', '通义千问', '讯飞星火', '智谱',
  '算力', 'gpu', '英伟达', 'nvidia', 'cuda',
  'ai芯片', '神经网络芯片', 'npu', 'tpu',
  '数据标注', '数据集', '预训练',
  'rag', '检索增强', '向量数据库',
  'prompt', '提示词', '提示工程',
  'ai应用', 'ai工具', 'ai平台',
  '智能客服', '智能助手', '虚拟人', '数字人',
  'ai医疗', 'ai金融', 'ai教育', 'ai法律',
  'ai安全', 'ai伦理', 'ai治理',
  '幻觉', 'hallucination',
  'token', '上下文', 'context window',
  '参数', '百亿参数', '千亿参数', '万亿参数',
  '量化', '蒸馏', '剪枝',
  '强化学习', 'rlhf', '人类反馈',
  '涌现能力', 'emergent abilities',
];

// 非AI关键词（排除这些文章）
const NON_AI_KEYWORDS = [
  '世界杯', '足球', '篮球', 'nba', '转播', '咪咕', '体育',
  '新车', '汽车销量', '注册量', '上牌量', '交付量',
  '影视', '电影', '票房', '艺人', '明星', '综艺',
  '美食', '餐饮', '火锅', '奶茶', '咖啡', '餐厅',
  '旅游', '酒店', '民宿', '景区', '机票', '签证',
  '服装', '时尚', '穿搭', '美妆', '护肤', '化妆品',
  '母婴', '育儿', '早教', '幼儿园',
  '宠物', '猫', '狗', '猫粮', '狗粮',
  '房地产', '楼市', '房价', '楼盘', '购房', '租房',
  '装修', '家具', '家电', '建材',
  '婚庆', '婚纱', '摄影',
  '彩票', '博彩', '赌博',
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getText(article: ParsedArticle) {
  const title = normalizeText(article.title);
  const summary = normalizeText(article.summary || '');
  const content = normalizeText(article.content || '');
  return { title, body: `${summary}\n${content}`.trim() };
}

function matchKeywords(text: string, keywords: string[]): string[] {
  const hits: string[] = [];
  for (const k of keywords) {
    const nk = normalizeText(k);
    if (!nk) continue;
    if (text.includes(nk)) hits.push(k);
  }
  return hits;
}

export function evaluateAIRelevance(article: ParsedArticle): AIRelevanceResult {
  const { title, body } = getText(article);
  const full = `${title}\n${body}`.trim();

  // 检查非AI关键词
  const nonAiHits = matchKeywords(full, NON_AI_KEYWORDS);
  if (nonAiHits.length >= 2) {
    return {
      passed: false,
      score: 0,
      meta: {
        score: 0,
        positiveHits: [],
        titleHits: [],
        negativeHits: nonAiHits,
        threshold: AI_THRESHOLD,
      },
    };
  }

  // 检查AI关键词
  const titleHits = matchKeywords(title, AI_KEYWORDS);
  const bodyHits = matchKeywords(full, AI_KEYWORDS);
  const uniq = Array.from(new Set([...titleHits, ...bodyHits]));

  // 计算分数
  const titleScore = titleHits.length * 25;
  const bodyScore = Math.min(bodyHits.length * 8, 40);
  const score = Math.max(0, Math.min(100, Math.round(titleScore + bodyScore)));

  // 通过条件：分数达标且至少有AI相关关键词
  const passed = score >= AI_THRESHOLD && uniq.length >= 1;

  return {
    passed,
    score,
    meta: {
      score,
      positiveHits: uniq,
      titleHits,
      negativeHits: nonAiHits,
      threshold: AI_THRESHOLD,
    },
  };
}
