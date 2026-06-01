import { z } from 'zod';
import { getDeepSeekEnv } from '@/lib/env/server';

export const prdInputSchema = z.object({
  productName: z.string().trim().min(1, '请填写产品或功能名称').max(80),
  background: z.string().trim().min(1, '请填写背景与问题').max(3000),
  goals: z.string().trim().min(1, '请填写目标').max(2000),
  users: z.string().trim().min(1, '请填写目标用户').max(1200),
  features: z.string().trim().min(1, '请填写核心功能点').max(3000),
  constraints: z.string().trim().max(1500).optional().default(''),
  metrics: z.string().trim().max(1500).optional().default(''),
});

export type PrdInput = z.infer<typeof prdInputSchema>;

export type PrdGenerationResult = {
  content: string;
  model: string;
  usedAI: boolean;
};

function fallbackGenerate(input: PrdInput): PrdGenerationResult {
  const constraints = input.constraints || '待补充';
  const metrics = input.metrics || '待补充';

  return {
    model: '',
    usedAI: false,
    content: [
      `# ${input.productName} 产品需求文档`,
      '',
      '## 1. 背景与问题',
      input.background,
      '',
      '## 2. 目标',
      input.goals
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `- ${item}`)
        .join('\n') || `- ${input.goals}`,
      '',
      '## 3. 目标用户与场景',
      input.users,
      '',
      '## 4. 需求范围',
      '### 4.1 核心功能',
      input.features
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n') || input.features,
      '',
      '### 4.2 暂不包含',
      '- 需要结合资源、排期和业务优先级进一步确认。',
      '',
      '## 5. 关键流程',
      '1. 用户进入功能入口。',
      '2. 用户完成必要信息输入或选择。',
      '3. 系统校验信息并给出明确反馈。',
      '4. 用户完成核心任务并获得结果。',
      '',
      '## 6. 规则与约束',
      constraints,
      '',
      '## 7. 成功指标',
      metrics,
      '',
      '## 8. 里程碑',
      '待确认',
      '',
      '## 9. 风险与待确认',
      '- 需求边界、异常场景和权限规则需要进一步细化。',
      '- 数据来源、埋点口径和上线验收标准需要与相关方确认。',
      '',
      '> 当前为无 API Key 时的结构化兜底版本。配置 DEEPSEEK_API_KEY 后会生成更完整的 PRD。',
    ].join('\n'),
  };
}

export async function generatePrd(input: PrdInput): Promise<PrdGenerationResult> {
  const { apiKey, baseUrl, model } = getDeepSeekEnv();
  const isDev = process.env.NODE_ENV !== 'production';

  if (!apiKey) {
    if (isDev) console.warn('PRD generator disabled: missing DEEPSEEK_API_KEY');
    return fallbackGenerate(input);
  }

  const system = [
    '你是一名资深产品经理，擅长把零散需求背景整理成可以进入评审的产品需求文档。',
    '请只输出 Markdown 格式的 PRD 正文，不要输出寒暄、解释或代码块。',
    '内容必须基于用户提供的信息生成；缺失信息可以写成“待确认”，不要编造具体业务事实。',
    'PRD 至少包含：背景与问题、目标、目标用户与场景、需求范围、功能需求、用户流程、规则与约束、非功能需求、数据指标、里程碑、风险与待确认。',
    '功能需求需要包含优先级、说明和验收标准。验收标准要可验证。',
    '输出标准 PRD，结构完整但避免无意义堆砌。',
  ].join('\n');

  const user = [
    `产品或功能名称：${input.productName}`,
    `背景：${input.background}`,
    `目标：${input.goals}`,
    `目标用户：${input.users}`,
    `核心功能点：${input.features}`,
    `约束条件：${input.constraints || '未提供'}`,
    `成功指标：${input.metrics || '未提供'}`,
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
        temperature: 0.35,
        stream: false,
        thinking: { type: 'disabled' },
      }),
    });
  } catch (error) {
    if (isDev) console.error('PRD generation request failed:', error);
    return fallbackGenerate(input);
  }

  if (!res.ok) {
    if (isDev) {
      const errText = await res.text().catch(() => '');
      console.error('PRD generation response not ok:', res.status, errText.slice(0, 300));
    }
    return fallbackGenerate(input);
  }

  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    if (isDev) console.error('PRD generation empty content:', JSON.stringify(data)?.slice(0, 300));
    return fallbackGenerate(input);
  }

  return {
    content: content.trim(),
    model,
    usedAI: true,
  };
}
