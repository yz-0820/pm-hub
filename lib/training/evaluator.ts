import { z } from 'zod';
import { getDeepSeekEnv } from '@/lib/env/server';

const weights = {
  userValue: 0.3,
  businessLogic: 0.25,
  featureDesign: 0.25,
  competition: 0.2,
} as const;

function coerceStringArray(value: unknown): unknown {
  if (typeof value === 'string') {
    const t = value.trim();
    return t ? [t] : [];
  }
  return value;
}

function coerceOptionalStringArray(value: unknown): unknown {
  if (value == null) return [];
  return coerceStringArray(value);
}

function normalizeDimensionKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t.includes('user') || t.includes('用户') || t.includes('价值')) return 'user_value';
  if (t.includes('business') || t.includes('商业') || t.includes('收入') || t.includes('变现')) return 'business_logic';
  if (t.includes('feature') || t.includes('design') || t.includes('功能') || t.includes('设计') || t.includes('交互'))
    return 'feature_design';
  if (t.includes('competition') || t.includes('竞品') || t.includes('对比') || t.includes('竞争'))
    return 'competition_analysis';
  return null;
}

function dimensionsFromArray(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const key = normalizeDimensionKey(obj.key ?? obj.dimension ?? obj.name ?? obj.title ?? obj.type);
    if (!key) continue;
    out[key] = {
      score: obj.score,
      analysis: obj.analysis ?? obj.comment ?? obj.feedback ?? '',
      evidence: obj.evidence ?? obj.basis ?? obj.rationale ?? obj.justification ?? obj.quotes ?? obj.citations ?? [],
      suggestions: obj.suggestions ?? obj.suggestion ?? obj.advice ?? [],
      reference: obj.reference ?? obj.reference_framework ?? obj.referenceFramework ?? [],
    };
  }
  return out;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickByKeyHint(obj: Record<string, unknown>, hint: string): unknown {
  const target = hint.toLowerCase();
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase().includes(target)) return v;
  }
  return undefined;
}

function normalizeAIOutput(value: unknown): unknown {
  const root = asObject(value);
  if (!root) return value;
  if (root.dimensions && root.overall) return value;

  const uvScore = root.user_value;
  const bizScore = root.business_logic;
  const designScore = root.feature_design;
  const compScore = root.competition_analysis;
  if (
    typeof uvScore === 'number' &&
    typeof bizScore === 'number' &&
    typeof designScore === 'number' &&
    typeof compScore === 'number'
  ) {
    return {
      dimensions: {
        user_value: { score: uvScore, analysis: '', evidence: [], suggestions: [], reference: [] },
        business_logic: { score: bizScore, analysis: '', evidence: [], suggestions: [], reference: [] },
        feature_design: { score: designScore, analysis: '', evidence: [], suggestions: [], reference: [] },
        competition_analysis: { score: compScore, analysis: '', evidence: [], suggestions: [], reference: [] },
      },
      overall: {
        strengths: root.strengths ?? [],
        weaknesses: root.weaknesses ?? [],
        next_steps: root.next_steps ?? root.nextSteps ?? [],
        reference_framework: root.reference_framework ?? root.referenceFramework ?? [],
      },
    };
  }

  const directUser = asObject(root.user_value ?? root.user_value_analysis ?? root.userValue ?? root.userValueAnalysis);
  const directBiz = asObject(
    root.business_logic ?? root.business_logic_integrity ?? root.businessLogic ?? root.businessLogicIntegrity
  );
  const directDesign = asObject(
    root.feature_design ?? root.feature_design_rationality ?? root.featureDesign ?? root.featureDesignRationality
  );
  const directComp = asObject(
    root.competition_analysis ?? root.competition_analysis_depth ?? root.competitionAnalysis ?? root.competitionAnalysisDepth
  );

  if (directUser || directBiz || directDesign || directComp) {
    const overall = asObject(root.overall) ?? {};
    return {
      dimensions: {
        user_value: {
          score: directUser?.score,
          analysis: directUser?.analysis ?? directUser?.comment ?? '',
          evidence:
            directUser?.evidence ??
            directUser?.basis ??
            directUser?.rationale ??
            directUser?.justification ??
            directUser?.quotes ??
            directUser?.citations ??
            [],
          suggestions: directUser?.suggestions ?? directUser?.suggestion ?? directUser?.advice ?? [],
          reference: directUser?.reference ?? directUser?.reference_framework ?? directUser?.referenceFramework ?? [],
        },
        business_logic: {
          score: directBiz?.score,
          analysis: directBiz?.analysis ?? directBiz?.comment ?? '',
          evidence:
            directBiz?.evidence ??
            directBiz?.basis ??
            directBiz?.rationale ??
            directBiz?.justification ??
            directBiz?.quotes ??
            directBiz?.citations ??
            [],
          suggestions: directBiz?.suggestions ?? directBiz?.suggestion ?? directBiz?.advice ?? [],
          reference: directBiz?.reference ?? directBiz?.reference_framework ?? directBiz?.referenceFramework ?? [],
        },
        feature_design: {
          score: directDesign?.score,
          analysis: directDesign?.analysis ?? directDesign?.comment ?? '',
          evidence:
            directDesign?.evidence ??
            directDesign?.basis ??
            directDesign?.rationale ??
            directDesign?.justification ??
            directDesign?.quotes ??
            directDesign?.citations ??
            [],
          suggestions: directDesign?.suggestions ?? directDesign?.suggestion ?? directDesign?.advice ?? [],
          reference: directDesign?.reference ?? directDesign?.reference_framework ?? directDesign?.referenceFramework ?? [],
        },
        competition_analysis: {
          score: directComp?.score,
          analysis: directComp?.analysis ?? directComp?.comment ?? '',
          evidence:
            directComp?.evidence ??
            directComp?.basis ??
            directComp?.rationale ??
            directComp?.justification ??
            directComp?.quotes ??
            directComp?.citations ??
            [],
          suggestions: directComp?.suggestions ?? directComp?.suggestion ?? directComp?.advice ?? [],
          reference: directComp?.reference ?? directComp?.reference_framework ?? directComp?.referenceFramework ?? [],
        },
      },
      overall: {
        strengths: overall['strengths'] ?? root['strengths'] ?? [],
        weaknesses: overall['weaknesses'] ?? root['weaknesses'] ?? [],
        next_steps: overall['next_steps'] ?? root['next_steps'] ?? root['nextSteps'] ?? [],
        reference_framework:
          overall['reference_framework'] ?? root['reference_framework'] ?? root['referenceFramework'] ?? [],
      },
    };
  }

  const nested = asObject(root.analysis);
  if (nested) {
    const nestedUser = asObject(nested.user_value ?? nested.user_value_analysis ?? nested.userValue ?? nested.userValueAnalysis);
    const nestedBiz = asObject(
      nested.business_logic ?? nested.business_logic_integrity ?? nested.businessLogic ?? nested.businessLogicIntegrity
    );
    const nestedDesign = asObject(
      nested.feature_design ?? nested.feature_design_rationality ?? nested.featureDesign ?? nested.featureDesignRationality
    );
    const nestedComp = asObject(
      nested.competition_analysis ?? nested.competition_analysis_depth ?? nested.competitionAnalysis ?? nested.competitionAnalysisDepth
    );

    if (nestedUser || nestedBiz || nestedDesign || nestedComp) {
      const overall = asObject(root.overall) ?? {};
      return {
        dimensions: {
          user_value: {
            score: nestedUser?.score,
            analysis: nestedUser?.analysis ?? nestedUser?.comment ?? '',
            evidence:
              nestedUser?.evidence ??
              nestedUser?.basis ??
              nestedUser?.rationale ??
              nestedUser?.justification ??
              nestedUser?.quotes ??
              nestedUser?.citations ??
              [],
            suggestions: nestedUser?.suggestions ?? nestedUser?.suggestion ?? nestedUser?.advice ?? [],
            reference: nestedUser?.reference ?? nestedUser?.reference_framework ?? nestedUser?.referenceFramework ?? [],
          },
          business_logic: {
            score: nestedBiz?.score,
            analysis: nestedBiz?.analysis ?? nestedBiz?.comment ?? '',
            evidence:
              nestedBiz?.evidence ??
              nestedBiz?.basis ??
              nestedBiz?.rationale ??
              nestedBiz?.justification ??
              nestedBiz?.quotes ??
              nestedBiz?.citations ??
              [],
            suggestions: nestedBiz?.suggestions ?? nestedBiz?.suggestion ?? nestedBiz?.advice ?? [],
            reference: nestedBiz?.reference ?? nestedBiz?.reference_framework ?? nestedBiz?.referenceFramework ?? [],
          },
          feature_design: {
            score: nestedDesign?.score,
            analysis: nestedDesign?.analysis ?? nestedDesign?.comment ?? '',
            evidence:
              nestedDesign?.evidence ??
              nestedDesign?.basis ??
              nestedDesign?.rationale ??
              nestedDesign?.justification ??
              nestedDesign?.quotes ??
              nestedDesign?.citations ??
              [],
            suggestions: nestedDesign?.suggestions ?? nestedDesign?.suggestion ?? nestedDesign?.advice ?? [],
            reference: nestedDesign?.reference ?? nestedDesign?.reference_framework ?? nestedDesign?.referenceFramework ?? [],
          },
          competition_analysis: {
            score: nestedComp?.score,
            analysis: nestedComp?.analysis ?? nestedComp?.comment ?? '',
            evidence:
              nestedComp?.evidence ??
              nestedComp?.basis ??
              nestedComp?.rationale ??
              nestedComp?.justification ??
              nestedComp?.quotes ??
              nestedComp?.citations ??
              [],
            suggestions: nestedComp?.suggestions ?? nestedComp?.suggestion ?? nestedComp?.advice ?? [],
            reference: nestedComp?.reference ?? nestedComp?.reference_framework ?? nestedComp?.referenceFramework ?? [],
          },
        },
        overall: {
          strengths: overall['strengths'] ?? root['strengths'] ?? [],
          weaknesses: overall['weaknesses'] ?? root['weaknesses'] ?? [],
          next_steps: overall['next_steps'] ?? root['next_steps'] ?? root['nextSteps'] ?? [],
          reference_framework:
            overall['reference_framework'] ?? root['reference_framework'] ?? root['referenceFramework'] ?? [],
        },
      };
    }
  }

  const scores = asObject(root.scores);
  const analysis = asObject(root.analysis);
  const suggestions = asObject(root.suggestions ?? root.suggestion ?? root.advice ?? root.recommendations);

  if (!scores || !analysis) return value;

  const userKey = pickByKeyHint(scores, 'user_value') ?? pickByKeyHint(scores, 'user');
  const bizKey = pickByKeyHint(scores, 'business_logic') ?? pickByKeyHint(scores, 'business');
  const designKey = pickByKeyHint(scores, 'feature_design') ?? pickByKeyHint(scores, 'design') ?? pickByKeyHint(scores, 'feature');
  const compKey =
    pickByKeyHint(scores, 'competition_analysis') ?? pickByKeyHint(scores, 'competition') ?? pickByKeyHint(scores, 'competitor');

  const overall = asObject(root.overall) ?? {};

  return {
    dimensions: {
      user_value: {
        score: userKey,
        analysis: pickByKeyHint(analysis, 'user_value') ?? pickByKeyHint(analysis, 'user') ?? '',
        evidence:
          pickByKeyHint(root, 'user_value_evidence') ??
          pickByKeyHint(root, 'user_evidence') ??
          pickByKeyHint(root, 'user_value_basis') ??
          pickByKeyHint(root, 'user_basis') ??
          [],
        suggestions: pickByKeyHint(suggestions ?? {}, 'user_value') ?? pickByKeyHint(suggestions ?? {}, 'user') ?? [],
        reference: pickByKeyHint(root, 'user_value_reference') ?? pickByKeyHint(root, 'user_reference') ?? [],
      },
      business_logic: {
        score: bizKey,
        analysis: pickByKeyHint(analysis, 'business_logic') ?? pickByKeyHint(analysis, 'business') ?? '',
        evidence:
          pickByKeyHint(root, 'business_logic_evidence') ??
          pickByKeyHint(root, 'business_evidence') ??
          pickByKeyHint(root, 'business_logic_basis') ??
          pickByKeyHint(root, 'business_basis') ??
          [],
        suggestions: pickByKeyHint(suggestions ?? {}, 'business_logic') ?? pickByKeyHint(suggestions ?? {}, 'business') ?? [],
        reference: pickByKeyHint(root, 'business_logic_reference') ?? pickByKeyHint(root, 'business_reference') ?? [],
      },
      feature_design: {
        score: designKey,
        analysis: pickByKeyHint(analysis, 'feature_design') ?? pickByKeyHint(analysis, 'design') ?? '',
        evidence:
          pickByKeyHint(root, 'feature_design_evidence') ??
          pickByKeyHint(root, 'design_evidence') ??
          pickByKeyHint(root, 'feature_design_basis') ??
          pickByKeyHint(root, 'design_basis') ??
          [],
        suggestions: pickByKeyHint(suggestions ?? {}, 'feature_design') ?? pickByKeyHint(suggestions ?? {}, 'design') ?? [],
        reference: pickByKeyHint(root, 'feature_design_reference') ?? pickByKeyHint(root, 'design_reference') ?? [],
      },
      competition_analysis: {
        score: compKey,
        analysis:
          pickByKeyHint(analysis, 'competition_analysis') ?? pickByKeyHint(analysis, 'competition') ?? pickByKeyHint(analysis, 'competitor') ?? '',
        evidence:
          pickByKeyHint(root, 'competition_analysis_evidence') ??
          pickByKeyHint(root, 'competition_evidence') ??
          pickByKeyHint(root, 'competitor_evidence') ??
          pickByKeyHint(root, 'competition_analysis_basis') ??
          pickByKeyHint(root, 'competition_basis') ??
          pickByKeyHint(root, 'competitor_basis') ??
          [],
        suggestions:
          pickByKeyHint(suggestions ?? {}, 'competition_analysis') ??
          pickByKeyHint(suggestions ?? {}, 'competition') ??
          pickByKeyHint(suggestions ?? {}, 'competitor') ??
          [],
        reference: pickByKeyHint(root, 'competition_analysis_reference') ?? pickByKeyHint(root, 'competition_reference') ?? [],
      },
    },
    overall: {
      strengths: overall['strengths'] ?? root['strengths'] ?? [],
      weaknesses: overall['weaknesses'] ?? root['weaknesses'] ?? [],
      next_steps: overall['next_steps'] ?? root['next_steps'] ?? root['nextSteps'] ?? [],
      reference_framework: overall['reference_framework'] ?? root['reference_framework'] ?? root['referenceFramework'] ?? [],
    },
  };
}

const aiOutputSchema = z.preprocess(
  (v) => normalizeAIOutput(v),
  z.object({
    dimensions: z.preprocess(
      (v) => dimensionsFromArray(v),
      z.object({
        user_value: z.object({
          score: z.coerce.number(),
          analysis: z.string(),
          evidence: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          suggestions: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          reference: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
        }),
        business_logic: z.object({
          score: z.coerce.number(),
          analysis: z.string(),
          evidence: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          suggestions: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          reference: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
        }),
        feature_design: z.object({
          score: z.coerce.number(),
          analysis: z.string(),
          evidence: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          suggestions: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          reference: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
        }),
        competition_analysis: z.object({
          score: z.coerce.number(),
          analysis: z.string(),
          evidence: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          suggestions: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
          reference: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
        }),
      })
    ),
    overall: z.object({
      strengths: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
      weaknesses: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
      next_steps: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
      reference_framework: z.preprocess(coerceOptionalStringArray, z.array(z.string())),
    }),
  })
);

export type TrainingEvaluationResult = {
  totalScore: number;
  valueScore: number;
  businessScore: number;
  designScore: number;
  competitionScore: number;
  report: {
    dimensions: z.infer<typeof aiOutputSchema>['dimensions'];
    overall: z.infer<typeof aiOutputSchema>['overall'];
  };
  model: string;
  usedAI: boolean;
};

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function weightedTotal(scores: {
  value: number;
  business: number;
  design: number;
  competition: number;
}): number {
  const total =
    scores.value * weights.userValue +
    scores.business * weights.businessLogic +
    scores.design * weights.featureDesign +
    scores.competition * weights.competition;
  return clampScore(total);
}

function keywordScore(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (t.includes(k.toLowerCase())) hits += 1;
  }
  return hits;
}

function fallbackEvaluate(answer: string): TrainingEvaluationResult {
  const len = answer.trim().length;
  const base = clampScore(Math.min(100, Math.round((len / 800) * 60 + 20)));

  const valueHits = keywordScore(answer, ['用户', '痛点', '场景', '需求', '价值', '体验', '目标用户']);
  const bizHits = keywordScore(answer, ['商业', '收入', '成本', '利润', '付费', '转化', '留存', '增长', 'LTV', 'CAC']);
  const designHits = keywordScore(answer, ['功能', '流程', '交互', '模块', '信息架构', '优先级', '边界']);
  const compHits = keywordScore(answer, ['竞品', '对比', '差异', '优势', '劣势', '壁垒', '替代', '市场']);

  const valueScore = clampScore(base + valueHits * 6);
  const businessScore = clampScore(base + bizHits * 5);
  const designScore = clampScore(base + designHits * 5);
  const competitionScore = clampScore(base + compHits * 6);

  return {
    totalScore: weightedTotal({
      value: valueScore,
      business: businessScore,
      design: designScore,
      competition: competitionScore,
    }),
    valueScore,
    businessScore,
    designScore,
    competitionScore,
    report: {
      dimensions: {
        user_value: {
          score: valueScore,
          analysis: '基于答案长度与关键词覆盖的规则评分结果，仅用于兜底展示。',
          evidence: [],
          suggestions: ['补充目标用户与关键场景', '明确核心痛点与价值主张', '给出可验证的指标与方法'],
          reference: ['价值主张画布', '用户画像与旅程图'],
        },
        business_logic: {
          score: businessScore,
          analysis: '基于答案长度与关键词覆盖的规则评分结果，仅用于兜底展示。',
          evidence: [],
          suggestions: ['补充收入/成本/定价与增长路径', '说明关键指标口径与漏斗', '识别约束条件与风险点'],
          reference: ['商业模式画布', 'AARRR 漏斗'],
        },
        feature_design: {
          score: designScore,
          analysis: '基于答案长度与关键词覆盖的规则评分结果，仅用于兜底展示。',
          evidence: [],
          suggestions: ['明确关键流程与信息架构', '阐明功能取舍与优先级', '补充异常/边界与埋点'],
          reference: ['用户故事地图', '信息架构', '流程图'],
        },
        competition_analysis: {
          score: competitionScore,
          analysis: '基于答案长度与关键词覆盖的规则评分结果，仅用于兜底展示。',
          evidence: [],
          suggestions: ['选择 2-3 个直接竞品做对比', '从用户/供给/分发/履约维度对比差异', '总结可复制与不可复制点'],
          reference: ['竞品矩阵', 'SWOT 分析'],
        },
      },
      overall: {
        strengths: ['结构完整度随答案长度提升而提高'],
        weaknesses: ['当前为规则兜底，无法替代AI评审的推理与专业判断'],
        next_steps: ['配置 DEEPSEEK_API_KEY 以启用 AI 评分'],
        reference_framework: [],
      },
    },
    model: '',
    usedAI: false,
  };
}

function isLowQualityAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (trimmed.length < 80) return true;
  const compact = trimmed.replace(/\s+/g, '');
  const letters = (compact.match(/[\p{Script=Han}A-Za-z]/gu) || []).length;
  const digits = (compact.match(/[0-9]/g) || []).length;
  if (letters < 60) return true;
  if (digits >= 40 && digits > letters * 2) return true;
  return false;
}

function invalidAnswerEvaluate(): TrainingEvaluationResult {
  const score = 10;
  return {
    totalScore: score,
    valueScore: score,
    businessScore: score,
    designScore: score,
    competitionScore: score,
    report: {
      dimensions: {
        user_value: {
          score,
          analysis: '答案内容缺少有效文字与结构，无法进行正常评审。',
          evidence: [],
          suggestions: ['按"用户价值/商业逻辑/功能设计/竞品分析"补全结构', '用具体用户场景与机制描述替代口号', '给出关键指标与验证方法'],
          reference: ['价值主张画布', '用户画像与旅程图'],
        },
        business_logic: {
          score,
          analysis: '答案内容缺少有效文字与结构，无法进行正常评审。',
          evidence: [],
          suggestions: ['说明收入/成本/转化路径', '补充关键指标口径与漏斗', '指出合规/资源等约束与取舍'],
          reference: ['商业模式画布', 'AARRR 漏斗'],
        },
        feature_design: {
          score,
          analysis: '答案内容缺少有效文字与结构，无法进行正常评审。',
          evidence: [],
          suggestions: ['给出关键流程与信息架构', '描述核心功能模块与取舍理由', '补充边界条件与异常处理'],
          reference: ['用户故事地图', '信息架构', '流程图'],
        },
        competition_analysis: {
          score,
          analysis: '答案内容缺少有效文字与结构，无法进行正常评审。',
          evidence: [],
          suggestions: ['选择 2-3 个竞品做对比', '用维度矩阵总结差异与壁垒', '给出可验证的改进点'],
          reference: ['竞品矩阵', 'SWOT 分析'],
        },
      },
      overall: {
        strengths: [],
        weaknesses: ['当前答案有效信息不足或疑似无意义输入'],
        next_steps: ['补充完整答案后再提交评分'],
        reference_framework: [],
      },
    },
    model: '',
    usedAI: false,
  };
}

export async function evaluateWithAI(input: {
  questionTitle: string;
  questionPrompt: string;
  answer: string;
}): Promise<TrainingEvaluationResult> {
  if (isLowQualityAnswer(input.answer)) return invalidAnswerEvaluate();
  const { apiKey, baseUrl, model } = getDeepSeekEnv();
  const isDev = process.env.NODE_ENV !== 'production';

  if (!apiKey) {
    if (isDev) console.warn('DeepSeek disabled: missing DEEPSEEK_API_KEY');
    return fallbackEvaluate(input.answer);
  }

  const system = [
    '你是资深产品面试官与产品导师，请对候选人的“产品拆解/产品分析”答案做专业评审。',
    '输出必须是严格的 JSON（不要 Markdown、不要多余文本）。',
    '对每个维度给出 0-100 分（整数），并给出基于答案内容的分析、关键依据（evidence）与可执行建议。',
    'evidence 必须是 2-4 条短句，直接引用或精确复述答案中出现的具体点，不得编造，不得使用“因为很不错”这类空话。',
    '如果答案明显无意义（纯数字/乱序字符/与题目无关/缺少结构），四个维度均不得超过 20 分，并在 weaknesses 明确指出原因。',
    '不得“鼓励性给分”，必须严格对齐答案质量与完整度；缺项必须扣分。',
    '维度：',
    '1) 用户价值分析 user_value（30%）',
    '2) 商业逻辑完整性 business_logic（25%）',
    '3) 功能设计合理性 feature_design（25%）',
    '4) 竞争分析深度 competition_analysis（20%）',
    '每个维度请在 evidence 同级增加 reference 字段（数组），给出该维度对应的参考答案框架/分析要点，仅与该维度相关，不要混入其他维度内容。',
    '整体部分给出 strengths/weaknesses/next_steps。',
    '输出 JSON 结构必须严格遵循：',
    '{"dimensions":{"user_value":{"score":0,"analysis":"","evidence":[""],"suggestions":[""],"reference":[""]},"business_logic":{"score":0,"analysis":"","evidence":[""],"suggestions":[""],"reference":[""]},"feature_design":{"score":0,"analysis":"","evidence":[""],"suggestions":[""],"reference":[""]},"competition_analysis":{"score":0,"analysis":"","evidence":[""],"suggestions":[""],"reference":[""]}},"overall":{"strengths":[""],"weaknesses":[""],"next_steps":[""]}}',
  ].join('\n');

  const user = [
    `题目：${input.questionTitle}`,
    `要求：${input.questionPrompt}`,
    '候选人答案：',
    input.answer,
  ].join('\n\n');

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        stream: false,
        thinking: { type: 'disabled' },
      }),
    });
  } catch (error) {
    if (isDev) console.error('DeepSeek request failed:', error);
    return fallbackEvaluate(input.answer);
  }

  if (!res.ok) {
    if (isDev) {
      const errText = await res.text().catch(() => '');
      console.error('DeepSeek response not ok:', res.status, errText.slice(0, 300));
    }
    return fallbackEvaluate(input.answer);
  }

  const data = await res.json().catch(() => null);
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    if (isDev) console.error('DeepSeek empty content:', JSON.stringify(data)?.slice(0, 300));
    return fallbackEvaluate(input.answer);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    if (isDev) console.error('DeepSeek JSON parse failed:', raw.slice(0, 300));
    return fallbackEvaluate(input.answer);
  }

  const validated = aiOutputSchema.safeParse(parsed);
  if (!validated.success) {
    if (isDev) {
      console.error('DeepSeek schema invalid:', validated.error.issues.slice(0, 6));
      console.error('DeepSeek raw head:', raw.slice(0, 300));
    }
    return fallbackEvaluate(input.answer);
  }

  const d = validated.data.dimensions;
  const valueScore = clampScore(d.user_value.score);
  const businessScore = clampScore(d.business_logic.score);
  const designScore = clampScore(d.feature_design.score);
  const competitionScore = clampScore(d.competition_analysis.score);

  return {
    totalScore: weightedTotal({
      value: valueScore,
      business: businessScore,
      design: designScore,
      competition: competitionScore,
    }),
    valueScore,
    businessScore,
    designScore,
    competitionScore,
    report: {
      dimensions: {
        user_value: { ...d.user_value, score: valueScore },
        business_logic: { ...d.business_logic, score: businessScore },
        feature_design: { ...d.feature_design, score: designScore },
        competition_analysis: { ...d.competition_analysis, score: competitionScore },
      },
      overall: validated.data.overall,
    },
    model,
    usedAI: true,
  };
}
