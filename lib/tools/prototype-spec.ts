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

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .optional();

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

export const prototypeFrameSchema = z.object({
  name: z.string().trim().min(1).max(80),
  width: z.number().min(240).max(1920),
  height: z.number().min(320).max(2400),
  elements: z.array(prototypeElementSchema).min(1).max(80),
});

export const prototypeSpecSchema = z.object({
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
export type PrototypeElementType = z.infer<typeof prototypeElementTypeSchema>;
export type PrototypeElement = z.infer<typeof prototypeElementSchema>;
export type PrototypeFrame = z.infer<typeof prototypeFrameSchema>;
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

export function validatePrototypeSpec(value: unknown): PrototypeSpec {
  return prototypeSpecSchema.parse(value);
}

export function normalizePrototypeSpec(value: PrototypeSpec): PrototypeSpec {
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
        elements: frame.elements.map((element) => {
          const elementWidth = Math.min(Math.round(element.width), width);
          const elementHeight = Math.min(Math.round(element.height), height);
          return {
            ...element,
            x: Math.max(0, Math.min(Math.round(element.x), Math.max(0, width - elementWidth))),
            y: Math.max(0, Math.min(Math.round(element.y), Math.max(0, height - elementHeight))),
            width: elementWidth,
            height: elementHeight,
          };
        }),
      };
    }),
  };
}
