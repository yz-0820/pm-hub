import { z } from 'zod';

export const prototypePlatformSchema = z.enum(['mobile', 'web', 'miniprogram', 'responsive']);

export const prototypeElementTypeSchema = z.enum([
  'frame',
  'section',
  'text',
  'button',
  'input',
  'card',
  'imagePlaceholder',
  'list',
  'tab',
  'navbar',
]);

export const prototypeV2ElementTypeSchema = z.enum([
  ...prototypeElementTypeSchema.options,
  'icon',
  'image',
  'hero',
  'bottomNav',
  'mediaPlayer',
  'stat',
  'badge',
  'divider',
]);

export const prototypeThemeSchema = z.enum(['light', 'dark', 'brand']);
export const prototypeValidationSeveritySchema = z.enum(['info', 'warning', 'error']);

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .optional();

const requiredColorSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

export const prototypeGradientSchema = z.object({
  from: requiredColorSchema,
  to: requiredColorSchema,
  via: requiredColorSchema.optional(),
  direction: z.enum(['horizontal', 'vertical', 'diagonal']).optional().default('diagonal'),
});

export const prototypeLayoutSchema = z.object({
  mode: z.enum(['absolute', 'vertical', 'horizontal', 'grid']).optional().default('absolute'),
  gap: z.number().min(0).max(120).optional(),
  padding: z.number().min(0).max(120).optional(),
  paddingX: z.number().min(0).max(120).optional(),
  paddingY: z.number().min(0).max(120).optional(),
  columns: z.number().int().min(1).max(6).optional(),
  align: z.enum(['start', 'center', 'end', 'between']).optional(),
});

export const prototypeValidationWarningSchema = z.object({
  severity: prototypeValidationSeveritySchema,
  code: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(240),
  elementName: z.string().trim().max(80).optional(),
});

export const prototypeElementSchema = z.object({
  type: prototypeElementTypeSchema,
  name: z.string().trim().min(1).max(80),
  text: z.string().trim().max(240).optional(),
  items: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  x: z.number().min(0).max(4000),
  y: z.number().min(0).max(4000),
  width: z.number().min(8).max(4000),
  height: z.number().min(8).max(4000),
  fontSize: z.number().min(10).max(48).optional(),
  color: colorSchema,
  background: colorSchema,
  borderColor: colorSchema,
});

export type PrototypeV2Element = z.infer<typeof prototypeV2ElementSchema>;

export const prototypeV2ElementSchema: z.ZodType<{
  type: z.infer<typeof prototypeV2ElementTypeSchema>;
  name: string;
  text?: string;
  items?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  background?: string;
  borderColor?: string;
  styleToken?: string;
  variant?: string;
  icon?: string;
  assetRef?: string;
  gradient?: z.infer<typeof prototypeGradientSchema>;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
  opacity?: number;
  radius?: number;
  layout?: z.infer<typeof prototypeLayoutSchema>;
  zIndex?: number;
  children?: PrototypeV2Element[];
}> = z.lazy(() =>
  z.object({
    type: prototypeV2ElementTypeSchema,
    name: z.string().trim().min(1).max(80),
    text: z.string().trim().max(320).optional(),
    items: z.array(z.string().trim().min(1).max(100)).max(12).optional(),
    x: z.number().min(0).max(4000),
    y: z.number().min(0).max(4000),
    width: z.number().min(8).max(4000),
    height: z.number().min(8).max(4000),
    fontSize: z.number().min(9).max(64).optional(),
    color: colorSchema,
    background: colorSchema,
    borderColor: colorSchema,
    styleToken: z.string().trim().min(1).max(80).optional(),
    variant: z.string().trim().min(1).max(80).optional(),
    icon: z.string().trim().min(1).max(80).optional(),
    assetRef: z.string().trim().min(1).max(120).optional(),
    gradient: prototypeGradientSchema.optional(),
    shadow: z.enum(['none', 'sm', 'md', 'lg', 'glow']).optional(),
    opacity: z.number().min(0).max(1).optional(),
    radius: z.number().min(0).max(120).optional(),
    layout: prototypeLayoutSchema.optional(),
    zIndex: z.number().int().min(-100).max(1000).optional(),
    children: z.array(prototypeV2ElementSchema).max(80).optional(),
  })
);

export const prototypeFrameSchema = z.object({
  name: z.string().trim().min(1).max(80),
  width: z.number().min(240).max(1920),
  height: z.number().min(320).max(2400),
  elements: z.array(prototypeElementSchema).min(1).max(80),
});

export const prototypeV2FrameSchema = z.object({
  name: z.string().trim().min(1).max(80),
  width: z.number().min(240).max(1920),
  height: z.number().min(320).max(2400),
  theme: prototypeThemeSchema.optional().default('brand'),
  templateId: z.string().trim().min(1).max(80).optional(),
  safeArea: z
    .object({
      top: z.number().min(0).max(96).optional(),
      bottom: z.number().min(0).max(120).optional(),
    })
    .optional(),
  background: z
    .object({
      color: colorSchema,
      gradient: prototypeGradientSchema.optional(),
    })
    .optional(),
  validation: z.array(prototypeValidationWarningSchema).max(40).optional(),
  elements: z.array(prototypeV2ElementSchema).min(1).max(140),
});

export const prototypeSpecV1Schema = z.object({
  version: z.literal('1.0'),
  specId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  platform: prototypePlatformSchema,
  canvas: z.object({
    width: z.number().min(240).max(1920),
    height: z.number().min(320).max(2400),
  }),
  frames: z.array(prototypeFrameSchema).min(1).max(4),
});

export const prototypeSpecV2Schema = z.object({
  version: z.literal('2.0'),
  specId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  platform: prototypePlatformSchema,
  canvas: z.object({
    width: z.number().min(240).max(1920),
    height: z.number().min(320).max(2400),
  }),
  designSystemVersion: z.literal('pmhub-prototype-v2').optional().default('pmhub-prototype-v2'),
  frames: z.array(prototypeV2FrameSchema).min(1).max(4),
});

export const prototypeSpecSchema = z.union([prototypeSpecV1Schema, prototypeSpecV2Schema]);

export const createPrototypeInputSchema = z.object({
  mode: z.literal('create'),
  name: z.string().trim().min(1, '请填写原型名称').max(80),
  platform: prototypePlatformSchema,
  pageType: z.string().trim().min(1, '请选择页面类型').max(80),
  productContext: z.string().trim().min(1, '请填写产品背景').max(2000),
  targetUser: z.string().trim().min(1, '请填写目标用户').max(1000),
  pageGoal: z.string().trim().min(1, '请填写页面目标').max(1000),
  keyContent: z.string().trim().min(1, '请填写关键模块').max(2000),
  instructions: z.string().trim().min(1, '请填写生成说明').max(2000),
  hasReferenceImage: z.boolean().optional().default(false),
  referenceImageSummary: z.string().trim().max(1200).optional(),
});

export const revisePrototypeInputSchema = z.object({
  mode: z.literal('revise'),
  baseSpecId: z.string().trim().min(1, '缺少上一版原型 ID'),
  revisionInstruction: z.string().trim().min(1, '请填写继续修改说明').max(2000),
});

export type PrototypePlatform = z.infer<typeof prototypePlatformSchema>;
export type PrototypeTheme = z.infer<typeof prototypeThemeSchema>;
export type PrototypeElementType = z.infer<typeof prototypeElementTypeSchema>;
export type PrototypeElement = z.infer<typeof prototypeElementSchema>;
export type PrototypeFrame = z.infer<typeof prototypeFrameSchema>;
export type PrototypeSpecV1 = z.infer<typeof prototypeSpecV1Schema>;
export type PrototypeSpecV2 = z.infer<typeof prototypeSpecV2Schema>;
export type PrototypeV2Frame = z.infer<typeof prototypeV2FrameSchema>;
export type PrototypeValidationWarning = z.infer<typeof prototypeValidationWarningSchema>;
export type PrototypeSpec = z.infer<typeof prototypeSpecSchema>;
export type CreatePrototypeInput = z.infer<typeof createPrototypeInputSchema>;
export type RevisePrototypeInput = z.infer<typeof revisePrototypeInputSchema>;

export function createEmptyPrototypeSpecId(): string {
  return `proto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createImportCode(): string {
  const raw = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

export function getDefaultCanvas(platform: PrototypePlatform) {
  if (platform === 'web') return { width: 1440, height: 900 };
  if (platform === 'responsive') return { width: 1200, height: 900 };
  return { width: 390, height: 844 };
}

export function isPrototypeSpecV2(value: PrototypeSpec): value is PrototypeSpecV2 {
  return value.version === '2.0';
}

export function validatePrototypeSpec(value: unknown): PrototypeSpec {
  return prototypeSpecSchema.parse(value);
}

function normalizeElementBounds<T extends { x: number; y: number; width: number; height: number; children?: T[] }>(
  element: T,
  frameWidth: number,
  frameHeight: number
): T {
  const width = Math.min(Math.round(element.width), frameWidth);
  const height = Math.min(Math.round(element.height), frameHeight);
  return {
    ...element,
    x: Math.max(0, Math.min(Math.round(element.x), Math.max(0, frameWidth - width))),
    y: Math.max(0, Math.min(Math.round(element.y), Math.max(0, frameHeight - height))),
    width,
    height,
    children: element.children?.map((child) => normalizeElementBounds(child, width, height)),
  };
}

export function normalizePrototypeSpec(value: PrototypeSpec): PrototypeSpec {
  if (value.version === '2.0') {
    return {
      ...value,
      canvas: {
        width: Math.round(value.canvas.width),
        height: Math.round(value.canvas.height),
      },
      frames: value.frames.map((frame) => {
        const width = Math.round(frame.width);
        const height = Math.round(frame.height);
        return {
          ...frame,
          width,
          height,
          elements: frame.elements
            .map((element) => normalizeElementBounds(element, width, height))
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
        };
      }),
    };
  }

  return {
    ...value,
    canvas: {
      width: Math.round(value.canvas.width),
      height: Math.round(value.canvas.height),
    },
    frames: value.frames.map((frame) => {
      const width = Math.round(frame.width);
      const height = Math.round(frame.height);
      return {
        ...frame,
        width,
        height,
        elements: frame.elements.map((element) => normalizeElementBounds(element, width, height)),
      };
    }),
  };
}
