import { getDashScopeVisionEnv, getDeepSeekEnv } from '@/lib/env/server';
import {
  CreatePrototypeInput,
  PrototypeSpec,
  PrototypeSpecV2,
  PrototypeV2Element,
  RevisePrototypeInput,
  createEmptyPrototypeSpecId,
  getDefaultCanvas,
  normalizePrototypeSpec,
  validatePrototypeSpec,
} from './prototype-spec';
import { prototypeAssets } from './prototype-assets';
import { attachPrototypeValidation } from './prototype-validator';
import { selectPrototypeTemplate } from './prototype-templates';

export type PrototypeGenerationOutput = {
  prototypeSpec: PrototypeSpec;
  summary: string;
  model: string;
  usedAI: boolean;
};

const MAX_VISION_INLINE_IMAGE_SIZE = 7 * 1024 * 1024;
const MODEL_TIMEOUT_MS = 12_000;

function splitModules(value: string, limit: number) {
  return value
    .split(/\r?\n|[，,；;、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function conciseText(value: string | undefined, fallback: string, maxLength: number) {
  const text = (value || '').replace(/\s+/g, ' ').trim() || fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getPrototypeTitle(input: CreatePrototypeInput) {
  return conciseText(input.name, conciseText(input.instructions, '页面原型', 28), 40);
}

function element(type: PrototypeV2Element['type'], patch: Omit<PrototypeV2Element, 'type'>): PrototypeV2Element {
  return { type, ...patch };
}

function createMediaFallbackSpec(input: CreatePrototypeInput): PrototypeSpecV2 {
  const title = getPrototypeTitle(input);
  const modules = splitModules(input.keyContent, 5);
  const cards = modules.length >= 3 ? modules.slice(0, 3) : ['每日推荐', '私人雷达', '热播榜单'];

  return {
    version: '2.0',
    designSystemVersion: 'pmhub-prototype-v2',
    specId: createEmptyPrototypeSpecId(),
    name: title,
    platform: input.platform,
    canvas: { width: 390, height: 844 },
    frames: [
      {
        name: `${title} - 高保真移动端`,
        width: 390,
        height: 844,
        theme: 'brand',
        templateId: 'mobile-media',
        safeArea: { top: 44, bottom: 34 },
        background: {
          gradient: { from: '#effff7', via: '#f8fbff', to: '#ffffff', direction: 'vertical' },
        },
        elements: [
          element('section', {
            name: 'Status Bar',
            x: 24,
            y: 12,
            width: 342,
            height: 28,
            layout: { mode: 'horizontal', align: 'between' },
            children: [
              element('text', { name: 'Time', text: '9:41', x: 0, y: 0, width: 60, height: 18, fontSize: 13, color: '#101820' }),
              element('text', { name: 'System Icons', text: '5G  ▰', x: 286, y: 0, width: 56, height: 18, fontSize: 12, color: '#101820' }),
            ],
          }),
          element('navbar', {
            name: 'Search Header',
            text: title,
            items: ['搜索歌曲 / 歌手 / 歌单'],
            icon: 'search',
            assetRef: 'avatar.member',
            x: 24,
            y: 54,
            width: 342,
            height: 92,
            styleToken: 'card.glass',
            background: '#ffffff',
            radius: 24,
            shadow: 'md',
          }),
          element('hero', {
            name: 'Daily Mix Hero',
            text: conciseText(input.pageGoal, '让节奏接上你的状态', 34),
            items: ['今日专属推荐', '立即播放'],
            icon: 'play',
            assetRef: 'cover.green-wave',
            x: 24,
            y: 168,
            width: 342,
            height: 136,
            styleToken: 'hero.media',
            gradient: { from: '#13d78a', to: '#1ba5ff', direction: 'diagonal' },
            color: '#ffffff',
            radius: 26,
            shadow: 'glow',
          }),
          element('section', {
            name: 'Quick Actions',
            x: 24,
            y: 326,
            width: 342,
            height: 78,
            layout: { mode: 'horizontal', align: 'between' },
            children: [
              element('button', { name: 'Daily 30', text: '每日30首', icon: 'music', x: 0, y: 0, width: 74, height: 72, background: '#13d78a', color: '#063b2b', radius: 20 }),
              element('button', { name: 'Ranking', text: '排行榜', icon: 'chart', x: 90, y: 0, width: 74, height: 72, background: '#1ba5ff', color: '#082f49', radius: 20 }),
              element('button', { name: 'Radio', text: '电台', icon: 'sparkles', x: 180, y: 0, width: 74, height: 72, background: '#7c3aed', color: '#ffffff', radius: 20 }),
              element('button', { name: 'Member', text: '会员', icon: 'star', x: 268, y: 0, width: 74, height: 72, background: '#ffb84d', color: '#101820', radius: 20 }),
            ],
          }),
          element('text', { name: 'Playlist Section Title', text: '为你精选', x: 24, y: 428, width: 180, height: 26, fontSize: 18, color: '#101820' }),
          element('section', {
            name: 'Playlist Cards',
            x: 24,
            y: 466,
            width: 342,
            height: 158,
            layout: { mode: 'horizontal', gap: 15 },
            children: cards.map((card, index) =>
              element('card', {
                name: `Playlist ${index + 1}`,
                text: card,
                items: [`${index === 0 ? '2.1' : index === 1 ? '8.6' : '16'}万播放`],
                assetRef: index === 0 ? 'cover.green-wave' : index === 1 ? 'cover.night-radio' : 'cover.sunset',
                x: index * 119,
                y: 0,
                width: 104,
                height: 150,
                styleToken: 'image.cover',
                radius: 18,
                shadow: 'sm',
              })
            ),
          }),
          element('list', {
            name: 'Hot Ranking',
            text: '飙升榜',
            items: modules.length ? modules.slice(0, 4) : ['晴天之后的海', '城市夜行', '华语新声热播'],
            x: 24,
            y: 632,
            width: 342,
            height: 82,
            background: '#ffffff',
            borderColor: '#d9f0e7',
            radius: 22,
            shadow: 'md',
          }),
          element('mediaPlayer', {
            name: 'Mini Player',
            text: '你的私人 FM 正在播放',
            items: ['Music+ Daily Radio'],
            icon: 'pause',
            assetRef: 'cover.green-wave',
            x: 24,
            y: 724,
            width: 342,
            height: 52,
            background: '#101820',
            color: '#ffffff',
            radius: 29,
            shadow: 'lg',
            zIndex: 5,
          }),
          element('bottomNav', {
            name: 'Bottom Navigation',
            items: ['首页', '发现', '听歌', '我的'],
            icon: 'home',
            x: 0,
            y: 782,
            width: 390,
            height: 62,
            background: '#ffffff',
            radius: 0,
            shadow: 'lg',
            zIndex: 4,
          }),
        ],
      },
    ],
  };
}

function createGenericFallbackSpec(input: CreatePrototypeInput): PrototypeSpecV2 {
  const canvas = getDefaultCanvas(input.platform);
  const isWide = canvas.width >= 900;
  const margin = isWide ? 64 : 24;
  const contentWidth = canvas.width - margin * 2;
  const template = selectPrototypeTemplate(input);
  const modules = splitModules(input.keyContent, isWide ? 6 : 4);
  const displayModules = modules.length ? modules : ['核心信息', '关键操作', '状态反馈'];
  const title = getPrototypeTitle(input);

  if (!isWide && template.id === 'mobile-media') return createMediaFallbackSpec(input);

  const cards = displayModules.slice(0, isWide ? 4 : 3).map((module, index) =>
    element('card', {
      name: `Feature Card ${index + 1}`,
      text: module,
      items: index === 0 ? [conciseText(input.targetUser, '目标用户与核心场景', 40)] : undefined,
      icon: index === 0 ? 'sparkles' : index === 1 ? 'chart' : 'star',
      assetRef: index === 0 ? 'cover.blueprint' : index === 1 ? 'illustration.empty-state' : 'cover.green-wave',
      x: margin + (isWide ? index % 2 : 0) * ((contentWidth - 16) / 2 + 16),
      y: (isWide ? 292 : 318) + Math.floor(index / (isWide ? 2 : 1)) * (isWide ? 148 : 116),
      width: isWide ? Math.floor((contentWidth - 16) / 2) : contentWidth,
      height: isWide ? 132 : 98,
      background: '#ffffff',
      borderColor: '#e2e8f0',
      radius: 22,
      shadow: 'md',
    })
  );

  return {
    version: '2.0',
    designSystemVersion: 'pmhub-prototype-v2',
    specId: createEmptyPrototypeSpecId(),
    name: title,
    platform: input.platform,
    canvas,
    frames: [
      {
        name: `${title} - ${template.name}`,
        width: canvas.width,
        height: canvas.height,
        theme: template.id === 'mobile-dashboard' ? 'dark' : 'brand',
        templateId: template.id,
        safeArea: isWide ? undefined : { top: 44, bottom: 34 },
        background: {
          gradient: template.id === 'mobile-dashboard'
            ? { from: '#08111f', to: '#17243a', direction: 'vertical' }
            : { from: '#effff7', via: '#f8fbff', to: '#ffffff', direction: 'vertical' },
        },
        elements: [
          element('navbar', {
            name: 'Header',
            text: title,
            items: isWide ? ['概览', '流程', '设置'] : ['搜索功能 / 用户 / 场景'],
            icon: 'search',
            assetRef: 'avatar.member',
            x: margin,
            y: isWide ? 32 : 54,
            width: contentWidth,
            height: isWide ? 72 : 92,
            background: '#ffffff',
            borderColor: '#e2e8f0',
            radius: isWide ? 20 : 24,
            shadow: 'md',
          }),
          element('hero', {
            name: 'Hero',
            text: conciseText(input.pageGoal, '让用户快速理解价值并完成核心操作', isWide ? 48 : 34),
            items: [conciseText(input.productContext, '核心价值说明', 40), '开始体验'],
            icon: 'play',
            assetRef: 'cover.blueprint',
            x: margin,
            y: isWide ? 132 : 168,
            width: contentWidth,
            height: isWide ? 132 : 126,
            gradient: { from: '#2563eb', via: '#06b6d4', to: '#13d78a', direction: 'diagonal' },
            color: '#ffffff',
            radius: 26,
            shadow: 'glow',
          }),
          ...cards,
          element('list', {
            name: 'Workflow',
            text: '核心流程',
            items: ['进入页面', '理解关键价值', '完成主操作', '获得明确反馈'],
            x: margin,
            y: isWide ? 612 : 660,
            width: contentWidth,
            height: isWide ? 170 : 120,
            background: '#ffffff',
            borderColor: '#e2e8f0',
            radius: 22,
            shadow: 'md',
          }),
          element('button', {
            name: 'Primary CTA',
            text: input.instructions.slice(0, 28) || '确认并继续',
            icon: 'sparkles',
            x: margin,
            y: canvas.height - (isWide ? 112 : 86),
            width: isWide ? 260 : contentWidth,
            height: 52,
            background: '#13d78a',
            color: '#052e1f',
            radius: 26,
            shadow: 'glow',
            zIndex: 5,
          }),
        ],
      },
    ],
  };
}

function finalizeSpec(spec: unknown): PrototypeSpec {
  const normalized = normalizePrototypeSpec(validatePrototypeSpec(spec));
  return attachPrototypeValidation(normalized);
}

function fallbackCreateSpec(input: CreatePrototypeInput): PrototypeGenerationOutput {
  const spec = finalizeSpec(createGenericFallbackSpec(input));
  return {
    prototypeSpec: spec,
    summary: `${spec.name} 高保真原型，包含主题 token、内置资产、组件化预览和 Figma v2 导入图层。`,
    model: '',
    usedAI: false,
  };
}

function shouldUseStableFallback(spec: PrototypeSpec, expectedTemplateId: string) {
  if (spec.version !== '2.0') return false;

  const actualTemplateId = spec.frames[0]?.templateId;
  const templateSensitiveIds = new Set(['mobile-media', 'mobile-membership', 'mobile-dashboard']);
  if (templateSensitiveIds.has(expectedTemplateId) && actualTemplateId !== expectedTemplateId) {
    return true;
  }

  return spec.frames.some((frame) => frame.validation?.some((warning) => warning.severity === 'error'));
}

function fallbackReviseSpec(base: PrototypeSpec, input: RevisePrototypeInput): PrototypeGenerationOutput {
  const spec = JSON.parse(JSON.stringify(base)) as PrototypeSpec;
  spec.specId = createEmptyPrototypeSpecId();
  spec.name = base.name;
  if (spec.version === '2.0') {
    spec.frames = spec.frames.map((frame, index) => ({
      ...frame,
      name: index === 0 ? `${base.name} - 修改版` : frame.name,
      elements: [
        ...frame.elements,
        element('badge', {
          name: 'Revision Note',
          text: input.revisionInstruction.slice(0, 80),
          icon: 'sparkles',
          x: 24,
          y: Math.max(92, frame.height - 152),
          width: Math.min(frame.width - 48, 420),
          height: 48,
          background: '#e7fbf2',
          color: '#0f766e',
          radius: 24,
          shadow: 'sm',
          zIndex: 10,
        }),
      ].slice(0, 140),
    }));
  } else {
    spec.frames = spec.frames.map((frame) => ({
      ...frame,
      name: `${base.name} - 修改版`,
      elements: [
        ...frame.elements,
        {
          type: 'card' as const,
          name: '修改说明',
          text: input.revisionInstruction,
          x: 24,
          y: Math.max(96, frame.height - 180),
          width: Math.min(frame.width - 48, 520),
          height: 120,
          background: '#eff6ff',
          borderColor: '#93c5fd',
        },
      ].slice(0, 80),
    }));
  }

  const finalized = finalizeSpec(spec);
  return {
    prototypeSpec: finalized,
    summary: `已基于上一版修改：${input.revisionInstruction.slice(0, 80)}`,
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
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
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
    }),
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) return null;
  return { content, model };
}

export async function summarizePrototypeReferenceImage(file: File): Promise<string | null> {
  if (file.size <= 0 || file.size > MAX_VISION_INLINE_IMAGE_SIZE) return null;

  const { apiKey, baseUrl, model } = getDashScopeVisionEnv();
  if (!apiKey) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString('base64')}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            {
              type: 'text',
              text: [
                '请分析这张参考图对高保真产品原型生成有用的信息。',
                '只总结页面结构、视觉层级、主色、组件形态、图片/图标使用、关键交互控件。',
                '控制在 300 字以内。',
              ].join('\n'),
            },
          ],
        },
      ],
      temperature: 0.1,
      stream: false,
    }),
  })
    .catch(() => null)
    .finally(() => clearTimeout(timeout));

  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === 'string' && content.trim() ? content.trim().slice(0, 1200) : null;
}

const schemaInstruction = [
  '你是高保真产品原型设计师。只输出 JSON，不要输出 Markdown 或解释。',
  '输出必须符合 prototypeSpec v2：version 必须为 "2.0"，包含 specId, name, platform, canvas, designSystemVersion, frames。',
  'v2 元素类型可用：frame, section, text, button, input, card, imagePlaceholder, list, tab, navbar, icon, image, hero, bottomNav, mediaPlayer, stat, badge, divider。',
  '所有元素必须包含 type, name, x, y, width, height；可使用 text, items, icon, assetRef, gradient, shadow, radius, opacity, layout, children, zIndex。',
  '可用 theme：light, dark, brand；可用 templateId：mobile-home, mobile-detail, mobile-list, mobile-form, mobile-dashboard, mobile-membership, mobile-feed, mobile-media。',
  `可用内置 assetRef：${Object.keys(prototypeAssets).join(', ')}。不要输出外部图片 URL。`,
  '移动端优先 390x844，必须给顶部安全区、底部导航/主操作留空间。避免明显重叠，保持高保真视觉稿风格。',
  '颜色只能用 #RRGGBB。shadow 只能用 none, sm, md, lg, glow。',
].join('\n');

export async function generatePrototypeFromInput(input: CreatePrototypeInput): Promise<PrototypeGenerationOutput> {
  const fallback = fallbackCreateSpec(input);
  const template = selectPrototypeTemplate(input);
  const user = [
    `原型名称：${input.name || '未提供'}`,
    `平台：${input.platform}`,
    `页面类型：${input.pageType}`,
    `推荐模板：${template.id} - ${template.description}`,
    `产品背景：${input.productContext || '未提供'}`,
    `目标用户：${input.targetUser || '未提供'}`,
    `页面目标：${input.pageGoal || '未提供'}`,
    `关键模块：${input.keyContent || '未提供'}`,
    `生成说明：${input.instructions}`,
    `是否提供参考图：${input.hasReferenceImage ? '是，仅作布局和风格参考' : '否'}`,
    input.referenceImageSummary ? `参考图视觉摘要：${input.referenceImageSummary}` : '',
    `请使用 specId：${fallback.prototypeSpec.specId}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const ai = await requestJsonFromAI(schemaInstruction, user).catch(() => null);
  if (!ai) return fallback;

  const parsed = extractJsonObject(ai.content);
  if (!parsed) return fallback;

  try {
    const merged = {
      ...(parsed as Record<string, unknown>),
      version: '2.0' as const,
      specId: fallback.prototypeSpec.specId,
      designSystemVersion: 'pmhub-prototype-v2' as const,
    };
    const spec = finalizeSpec(merged as PrototypeSpec);
    if (shouldUseStableFallback(spec, template.id)) return fallback;

    return {
      prototypeSpec: spec,
      summary: `${spec.name} 高保真原型，包含 ${spec.frames[0]?.elements.length || 0} 个可编辑元素。`,
      model: ai.model,
      usedAI: true,
    };
  } catch {
    return fallback;
  }
}

export async function revisePrototypeFromInput(base: PrototypeSpec, input: RevisePrototypeInput): Promise<PrototypeGenerationOutput> {
  const fallback = fallbackReviseSpec(base, input);
  const user = [
    '请基于上一版 prototypeSpec 生成一个完整的新 prototypeSpec，不要只输出差异。',
    '如果上一版是 v1，请升级为 v2；如果上一版是 v2，请保留主题、模板、资产引用和高保真视觉风格。',
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
    const merged = {
      ...(parsed as Record<string, unknown>),
      version: '2.0' as const,
      specId: fallback.prototypeSpec.specId,
      designSystemVersion: 'pmhub-prototype-v2' as const,
    };
    const spec = finalizeSpec(merged as PrototypeSpec);
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
