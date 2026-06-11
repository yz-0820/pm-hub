import { getDeepSeekEnv } from '@/lib/env/server';
import {
  CreatePrototypeInput,
  PrototypeElement,
  PrototypeSpec,
  RevisePrototypeInput,
  createEmptyPrototypeSpecId,
  getDefaultCanvas,
  normalizePrototypeSpec,
  validatePrototypeSpec,
} from './prototype-spec';

export type PrototypeGenerationOutput = {
  prototypeSpec: PrototypeSpec;
  summary: string;
  model: string;
  usedAI: boolean;
};

function element(type: PrototypeElement['type'], patch: Omit<PrototypeElement, 'type'>): PrototypeElement {
  return { type, ...patch };
}

function fallbackCreateSpec(input: CreatePrototypeInput): PrototypeGenerationOutput {
  const canvas = getDefaultCanvas(input.platform);
  const isWide = canvas.width >= 900;
  const margin = isWide ? 64 : 24;
  const contentWidth = canvas.width - margin * 2;
  const title = input.name;
  const modules = input.keyContent
    .split(/\r?\n|[，,；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, isWide ? 4 : 3);

  const elements: PrototypeElement[] = [
    element('navbar', {
      name: '顶部导航',
      text: title,
      items: ['概览', '详情', '设置'],
      x: 0,
      y: 0,
      width: canvas.width,
      height: isWide ? 72 : 64,
      background: '#ffffff',
      borderColor: '#e2e8f0',
    }),
    element('text', {
      name: '页面标题',
      text: title,
      x: margin,
      y: isWide ? 112 : 96,
      width: contentWidth,
      height: 40,
      fontSize: isWide ? 28 : 24,
      color: '#0f172a',
    }),
    element('text', {
      name: '页面目标',
      text: input.pageGoal,
      x: margin,
      y: isWide ? 158 : 136,
      width: contentWidth,
      height: 56,
      fontSize: 15,
      color: '#64748b',
    }),
  ];

  const startY = isWide ? 240 : 208;
  const cardGap = 16;
  const cardColumns = isWide ? 2 : 1;
  const cardWidth = Math.floor((contentWidth - cardGap * (cardColumns - 1)) / cardColumns);
  const cardHeight = isWide ? 132 : 104;

  const displayModules = modules.length > 0 ? modules : ['核心信息', '关键操作', '状态反馈'];
  displayModules.forEach((module, index) => {
    const col = index % cardColumns;
    const row = Math.floor(index / cardColumns);
    elements.push(
      element('card', {
        name: `模块-${index + 1}`,
        text: module,
        x: margin + col * (cardWidth + cardGap),
        y: startY + row * (cardHeight + cardGap),
        width: cardWidth,
        height: cardHeight,
        background: '#ffffff',
        borderColor: '#dbeafe',
      })
    );
  });

  const listY = startY + Math.ceil(displayModules.length / cardColumns) * (cardHeight + cardGap) + 8;
  const buttonY = canvas.height - (isWide ? 112 : 84);
  if (listY + (isWide ? 180 : 168) < buttonY - 16) {
    elements.push(
      element('section', {
        name: '核心流程',
        text: '核心流程',
        items: ['进入页面', '查看关键信息', '完成主要操作', '获得明确反馈'],
        x: margin,
        y: listY,
        width: contentWidth,
        height: isWide ? 180 : 168,
        background: '#f8fafc',
        borderColor: '#e2e8f0',
      })
    );
  }
  elements.push(
    element('button', {
      name: '主操作按钮',
      text: input.instructions.slice(0, 24) || '确认并继续',
      x: margin,
      y: buttonY,
      width: isWide ? 240 : contentWidth,
      height: 48,
      background: '#2563eb',
      color: '#ffffff',
    })
  );

  const spec: PrototypeSpec = {
    version: '1.0',
    specId: createEmptyPrototypeSpecId(),
    name: title,
    platform: input.platform,
    canvas,
    frames: [
      {
        name: `${title} - ${input.pageType}`,
        width: canvas.width,
        height: canvas.height,
        elements,
      },
    ],
  };

  return {
    prototypeSpec: normalizePrototypeSpec(spec),
    summary: `${title} ${input.platform === 'web' ? 'Web' : '移动端'}中保真原型，包含导航、目标说明、核心模块、流程区和主操作。`,
    model: '',
    usedAI: false,
  };
}

function fallbackReviseSpec(base: PrototypeSpec, input: RevisePrototypeInput): PrototypeGenerationOutput {
  const spec: PrototypeSpec = JSON.parse(JSON.stringify(base)) as PrototypeSpec;
  spec.specId = createEmptyPrototypeSpecId();
  spec.name = base.name;
  const frame = spec.frames[0];
  frame.name = `${base.name} - 修改版`;
  frame.elements = [
    ...frame.elements,
    element('card', {
      name: '修改说明',
      text: input.revisionInstruction,
      x: 24,
      y: Math.max(96, frame.height - 180),
      width: Math.min(frame.width - 48, 520),
      height: 120,
      background: '#eff6ff',
      borderColor: '#93c5fd',
    }),
  ].slice(0, 80);

  return {
    prototypeSpec: normalizePrototypeSpec(spec),
    summary: `已基于上一版加入修改说明：${input.revisionInstruction.slice(0, 80)}`,
    model: '',
    usedAI: false,
  };
}

function extractJsonObject(content: string): unknown | null {
  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function requestJsonFromAI(system: string, user: string): Promise<{ content: string; model: string } | null> {
  const { apiKey, baseUrl, model } = getDeepSeekEnv();
  if (!apiKey) return null;

  const res = await fetch(`${baseUrl}/chat/completions`, {
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
      temperature: 0.25,
      stream: false,
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  return { content, model };
}

const schemaInstruction = [
  '你是产品原型信息架构师。只输出 JSON，不要输出 Markdown 或解释。',
  '输出必须符合 prototypeSpec v1：version, specId, name, platform, canvas, frames。',
  '元素类型只能使用：frame, section, text, button, input, card, imagePlaceholder, list, tab, navbar。',
  '所有元素必须包含 type, name, x, y, width, height；文本元素需要 text；列表/Tab 可用 items。',
  '坐标和尺寸必须在画布内，避免明显重叠，保持中保真产品原型风格。',
  '颜色只能用 #RRGGBB。',
  '移动端画布优先 390x844，Web 画布优先 1440x900。',
].join('\n');

export async function generatePrototypeFromInput(input: CreatePrototypeInput): Promise<PrototypeGenerationOutput> {
  const fallback = fallbackCreateSpec(input);
  const user = [
    `原型名称：${input.name}`,
    `平台：${input.platform}`,
    `页面类型：${input.pageType}`,
    `产品背景：${input.productContext}`,
    `目标用户：${input.targetUser}`,
    `页面目标：${input.pageGoal}`,
    `关键模块：${input.keyContent}`,
    `生成说明：${input.instructions}`,
    `是否提供参考图：${input.hasReferenceImage ? '是，仅作为布局/风格参考' : '否'}`,
    `请使用 specId：${fallback.prototypeSpec.specId}`,
  ].join('\n\n');

  const ai = await requestJsonFromAI(schemaInstruction, user).catch(() => null);
  if (!ai) return fallback;

  const parsed = extractJsonObject(ai.content);
  if (!parsed) return fallback;

  try {
    const spec = normalizePrototypeSpec(validatePrototypeSpec({
      ...(parsed as Record<string, unknown>),
      specId: fallback.prototypeSpec.specId,
    }));
    return {
      prototypeSpec: spec,
      summary: `${spec.name} ${spec.platform === 'web' ? 'Web' : '移动端'}中保真原型，包含 ${spec.frames[0]?.elements.length || 0} 个可编辑元素。`,
      model: ai.model,
      usedAI: true,
    };
  } catch {
    return fallback;
  }
}

export async function revisePrototypeFromInput(
  base: PrototypeSpec,
  input: RevisePrototypeInput
): Promise<PrototypeGenerationOutput> {
  const fallback = fallbackReviseSpec(base, input);
  const user = [
    '请基于上一版 prototypeSpec 生成一个完整的新 prototypeSpec，不要只输出差异。',
    `修改说明：${input.revisionInstruction}`,
    `新 specId：${fallback.prototypeSpec.specId}`,
    '上一版 prototypeSpec：',
    JSON.stringify(base),
  ].join('\n\n');

  const ai = await requestJsonFromAI(schemaInstruction, user).catch(() => null);
  if (!ai) return fallback;

  const parsed = extractJsonObject(ai.content);
  if (!parsed) return fallback;

  try {
    const spec = normalizePrototypeSpec(validatePrototypeSpec({
      ...(parsed as Record<string, unknown>),
      specId: fallback.prototypeSpec.specId,
    }));
    return {
      prototypeSpec: spec,
      summary: `已基于上一版修改：${input.revisionInstruction.slice(0, 80)}`,
      model: ai.model,
      usedAI: true,
    };
  } catch {
    return fallback;
  }
}
