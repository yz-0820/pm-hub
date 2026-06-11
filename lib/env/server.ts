// Server-only environment helpers.
// Next.js loads .env files for the app, and standalone scripts load them via scripts/prod/load-env.
// Production must rely on platform-provided environment variables.

export type DeepSeekEnv = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type QwenImageEnv = {
  apiKey: string;
  endpoint: string;
  model: string;
};

export type DashScopeVisionEnv = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function getDeepSeekEnv(): DeepSeekEnv {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, ''),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

export function getQwenImageEnv(): QwenImageEnv {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY || '',
    endpoint:
      process.env.DASHSCOPE_BASE_URL ||
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: process.env.QWEN_IMAGE_MODEL || 'qwen-image-2.0-pro',
  };
}

export function getDashScopeVisionEnv(): DashScopeVisionEnv {
  return {
    apiKey: process.env.DASHSCOPE_VISION_API_KEY || process.env.DASHSCOPE_API_KEY || '',
    baseUrl: (
      process.env.DASHSCOPE_COMPATIBLE_BASE_URL ||
      process.env.DASHSCOPE_OPENAI_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1'
    ).replace(/\/+$/, ''),
    model: process.env.QWEN_VISION_MODEL || 'qwen-vl-plus',
  };
}
