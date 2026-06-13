/**
 * AI 工具输入安全过滤器
 * 检测提示词注入攻击和超长输入
 */

const PROMPT_INJECTION_PATTERNS = [
  // 英文注入模式
  /ignore\s+(previous|all|above)\s+instructions?/i,
  /forget\s+(previous|all|above)\s+instructions?/i,
  /disregard\s+(previous|all|above)\s+instructions?/i,
  /you\s+are\s+now\s+(?:a\s+)?DAN/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /developer\s+mode/i,
  /system\s+prompt/i,
  /ignore\s+your\s+(?:training|programming|rules)/i,
  /bypass\s+(?:safety|security|restrictions)/i,
  /roleplay\s+as/i,
  /simulate\s+(?:a\s+)?(?:hacker|attacker|bad)/i,
  // 中文注入模式
  /忽略(之前|以上|前面)(的|所有)?指令/i,
  /忘记(之前|以上|前面)(的|所有)?指令/i,
  /你现在(是|扮演)/i,
  /系统提示/i,
  /开发者模式/i,
  /越狱/i,
  /绕过(安全|限制|规则)/i,
  /模拟(黑客|攻击者)/i,
];

export interface SanitizeResult {
  clean: string;
  blocked: boolean;
  reason?: string;
}

/**
 * 对单个输入字符串进行安全过滤
 */
export function sanitizePromptInput(input: string): SanitizeResult {
  if (!input || typeof input !== 'string') {
    return { clean: input || '', blocked: false };
  }

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        clean: input,
        blocked: true,
        reason: `检测到提示词注入模式: ${pattern.source}`,
      };
    }
  }

  return { clean: input, blocked: false };
}

/**
 * 对多个输入字段进行批量安全过滤
 * 返回第一个被拦截的结果，或全部通过的结果
 */
export function sanitizePromptInputs(inputs: Record<string, string>): SanitizeResult {
  const combinedText = Object.values(inputs).filter(Boolean).join(' ');

  // 先检查总长度
  if (combinedText.length > 10000) {
    return {
      clean: combinedText,
      blocked: true,
      reason: `总输入长度 ${combinedText.length} 超过限制（最大 10000 字符）`,
    };
  }

  // 再检查每个字段的注入模式
  for (const [key, value] of Object.entries(inputs)) {
    const result = sanitizePromptInput(value);
    if (result.blocked) {
      return {
        clean: combinedText,
        blocked: true,
        reason: `字段 "${key}" 包含不安全内容`,
      };
    }
  }

  return { clean: combinedText, blocked: false };
}
