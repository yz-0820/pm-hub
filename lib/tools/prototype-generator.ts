import { getQwenImageEnv } from '@/lib/env/server';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type PrototypeGenerationResult = {
  imageDataUrl: string;
  model: string;
};

export type PrototypeInput = {
  image: File;
  prompt: string;
};

export function validatePrototypeInput(input: PrototypeInput): string | null {
  if (!input.image || input.image.size <= 0) return '请上传一张图片';
  if (!SUPPORTED_TYPES.has(input.image.type)) return '仅支持 PNG、JPG、JPEG、WEBP 图片';
  if (input.image.size > MAX_IMAGE_SIZE) return '图片不能超过 10MB';
  if (!input.prompt.trim()) return '请填写需要修改的内容';
  return null;
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString('base64')}`;
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Qwen image URL fetch failed: ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/png';
  const bytes = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString('base64')}`;
}

function extractImageUrl(data: unknown): string | null {
  const root = data as {
    output?: {
      choices?: Array<{
        message?: {
          content?: Array<{ image?: unknown }>;
        };
      }>;
    };
  };

  const content = root.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return null;

  for (const item of content) {
    if (typeof item.image === 'string' && item.image.trim()) return item.image;
  }

  return null;
}

export async function generatePrototypeImage(input: PrototypeInput): Promise<PrototypeGenerationResult> {
  const validationError = validatePrototypeInput(input);
  if (validationError) throw new Error(validationError);

  const { apiKey, model, endpoint } = getQwenImageEnv();
  if (!apiKey) throw new Error('未配置 DASHSCOPE_API_KEY，无法生成原型图');

  const prompt = [
    '你是一名产品原型设计师。请基于用户上传的图片进行原型图编辑。',
    '保持原图的主体结构、版式关系和产品原型风格。',
    '只修改用户明确描述的区域或元素，不要引入无关内容，不要重绘整张图。',
    '如果用户描述不够明确，请做最小合理修改。',
    '',
    `用户修改说明：${input.prompt.trim()}`,
  ].join('\n');

  const imageDataUrl = await fileToDataUrl(input.image);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ image: imageDataUrl }, { text: prompt }],
          },
        ],
      },
      parameters: {
        n: 1,
        watermark: false,
        prompt_extend: true,
        negative_prompt: '模糊、低清晰度、无关元素、整体重绘',
      },
    }),
  });

  const responseText = await res.text();
  const data = responseText ? JSON.parse(responseText) : null;

  if (!res.ok) {
    const message = data?.message || data?.code || responseText.slice(0, 300);
    throw new Error(`Qwen 图片编辑失败：${res.status} ${message}`);
  }

  const imageUrl = extractImageUrl(data);
  if (!imageUrl) throw new Error('Qwen 未返回可用图片');

  return {
    imageDataUrl: await imageUrlToDataUrl(imageUrl),
    model,
  };
}
