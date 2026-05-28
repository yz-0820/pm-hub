import fs from 'node:fs';
import path from 'node:path';

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

function ensureOpenAIEnv(): void {
  if (process.env.OPENAI_API_KEY) return;

  try {
    let dir = process.cwd();
    for (let i = 0; i < 8; i += 1) {
      const envPath = path.join(dir, '.env.local');
      if (fs.existsSync(envPath)) {
        const raw = fs.readFileSync(envPath, 'utf8');
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx <= 0) continue;

          const key = trimmed.slice(0, idx).trim();
          if (key !== 'OPENAI_API_KEY' && key !== 'OPENAI_IMAGE_MODEL') continue;

          const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (value && !process.env[key]) process.env[key] = value;
        }
        return;
      }

      const parent = path.dirname(dir);
      if (parent === dir) return;
      dir = parent;
    }
  } catch {
    return;
  }
}

function toFilename(file: File): string {
  const name = file.name?.trim();
  if (name) return name;
  if (file.type === 'image/jpeg') return 'prototype.jpg';
  if (file.type === 'image/webp') return 'prototype.webp';
  return 'prototype.png';
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAI image URL fetch failed: ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/png';
  const bytes = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${bytes.toString('base64')}`;
}

export async function generatePrototypeImage(input: PrototypeInput): Promise<PrototypeGenerationResult> {
  const validationError = validatePrototypeInput(input);
  if (validationError) throw new Error(validationError);

  ensureOpenAIEnv();

  const apiKey = process.env.OPENAI_API_KEY || '';
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  if (!apiKey) throw new Error('未配置 OPENAI_API_KEY，无法生成原型图');

  const prompt = [
    '你是一名产品原型设计师。请基于用户上传的图片进行原型图编辑。',
    '保持原图的主体结构、版式关系和产品原型风格。',
    '只修改用户明确描述的区域或元素，不要引入无关内容，不要重绘整张图。',
    '如果用户描述不够明确，请做最小合理修改。',
    '',
    `用户修改说明：${input.prompt.trim()}`,
  ].join('\n');

  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt);
  formData.append('image', input.image, toFilename(input.image));
  formData.append('output_format', 'png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI 图片编辑失败：${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json().catch(() => null);
  const image = data?.data?.[0];
  if (typeof image?.b64_json === 'string' && image.b64_json.trim()) {
    return {
      imageDataUrl: `data:image/png;base64,${image.b64_json}`,
      model,
    };
  }

  if (typeof image?.url === 'string' && image.url.trim()) {
    return {
      imageDataUrl: await imageUrlToDataUrl(image.url),
      model,
    };
  }

  throw new Error('OpenAI 未返回可用图片');
}
