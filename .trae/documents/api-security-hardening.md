# API 安全加固计划

## 摘要

解决 PM Hub 两个关键安全问题：
1. API 密钥验证逻辑重复且分散，缺乏统一的 IP 白名单机制
2. AI 工具 API 输入校验不足，存在提示词注入和超长输入风险

## 当前状态分析

### 问题 1：API 密钥验证（app/api/rss/fetch/route.ts 等）

**现状：**
- 6 个 API 路由各自复制了相同的 Bearer Token 验证逻辑（`app/api/rss/fetch/route.ts`、`app/api/career/contents/route.ts`、`app/api/career/review/route.ts`、`app/api/admin/cleanup-ithome/route.ts`、`app/api/training/questions/route.ts`、`app/api/training/questions/[id]/route.ts`）
- 仅验证 `Authorization: Bearer <API_KEY>` Header，无 IP 限制
- 密钥 `API_KEY=pm-hub-secret-key-2024` 存在于 `.env.local` 中，格式简单可猜测
- 任何人获取密钥后可从任意 IP 调用管理接口（RSS 抓取、内容审核、数据清理）

**风险：**
- 密钥泄露 = 完全控制后台接口
- 无 IP 白名单 = 无法限制调用来源
- 代码重复 = 维护困难，容易遗漏

### 问题 2：AI 工具输入校验（app/api/tools/prd/route.ts 等）

**现状：**
- PRD 生成：使用 Zod schema 校验（`prdInputSchema`），有长度限制（productName max 80, background max 3000 等）
- 原型生成：使用 Zod schema 校验（`createPrototypeInputSchema`、`revisePrototypeInputSchema`），有图片大小限制（10MB）
- 已有限流：每 IP 10 分钟 5 次请求
- **但缺少：** 提示词注入过滤、敏感词检测、总输入长度上限控制

**风险：**
- 用户可通过输入恶意提示词诱导 AI 输出有害内容
- 超长输入导致 API 费用暴增（虽然单个字段有限制，但组合后总长度可能很大）
- 无敏感词过滤 = 可能生成违规内容

## 拟议变更

### 变更 1：统一 API 认证中间件 + IP 白名单

**文件：** `lib/utils/api-auth.ts`（新建）
**内容：**
- 创建 `verifyApiAuth(request: NextRequest): { success: boolean; error?: string; status?: number }` 函数
- 统一验证逻辑：检查 `Authorization: Bearer <API_KEY>`
- 新增 IP 白名单验证：读取 `API_ALLOWLIST_IPS` 环境变量（逗号分隔），若配置则仅允许指定 IP/网段
- 支持 CIDR 格式（如 `192.168.1.0/24`）和单个 IP
- 若 `API_ALLOWLIST_IPS` 未配置或为空，保持现有行为（仅验证密钥）

**文件：** `app/api/rss/fetch/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**文件：** `app/api/career/contents/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**文件：** `app/api/career/review/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**文件：** `app/api/admin/cleanup-ithome/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**文件：** `app/api/training/questions/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**文件：** `app/api/training/questions/[id]/route.ts`
**修改：** 替换内联验证为 `verifyApiAuth(request)`

**环境变量：** `.env.local` 新增
```
# API 访问控制（可选）
# 未配置时仅验证 API_KEY；配置后仅允许指定 IP/网段访问管理接口
# 支持 CIDR 格式，多个用逗号分隔
API_ALLOWLIST_IPS=127.0.0.1,::1
```

### 变更 2：AI 工具输入安全过滤

**文件：** `lib/utils/input-sanitizer.ts`（新建）
**内容：**
- `sanitizePromptInput(input: string): { clean: string; blocked: boolean; reason?: string }`
- 敏感词黑名单：包含常见提示词注入模式（如 "ignore previous instructions", "DAN", "jailbreak" 等）
- 总输入长度检查：PRD 所有字段组合后总长度不超过 10000 字符；原型生成总输入不超过 8000 字符
- 返回过滤结果，若 blocked=true 则拒绝请求

**文件：** `app/api/tools/prd/route.ts`
**修改：**
- 在 `prdInputSchema.safeParse(body)` 之后，调用 `sanitizePromptInput` 对所有文本字段进行过滤
- 若检测到注入，返回 400 错误：`{ success: false, error: '输入包含不安全内容' }`

**文件：** `app/api/tools/prototype/route.ts`
**修改：**
- 在 schema 校验之后，调用 `sanitizePromptInput` 对 `name`, `productContext`, `targetUser`, `pageGoal`, `keyContent`, `instructions`, `revisionInstruction` 进行过滤
- 若检测到注入，返回 400 错误

**敏感词列表（中文 + 英文）：**
```typescript
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
  // 中文注入模式
  /忽略(之前|以上|前面)(的|所有)?指令/i,
  /忘记(之前|以上|前面)(的|所有)?指令/i,
  /你现在(是|扮演)/i,
  /系统提示/i,
  /开发者模式/i,
  /越狱/i,
];
```

## 假设与决策

1. **IP 白名单可选**：不强制要求配置，保持向后兼容；未配置时仅验证密钥
2. **敏感词过滤不拦截正常内容**：仅拦截明确的提示词注入模式，避免误杀正常产品描述
3. **总长度限制基于实际场景**：PRD 生成通常需要较长输入，故设为 10000；原型生成 8000
4. **不修改现有 Zod schema 的字段级限制**：在 schema 校验之后增加一层安全过滤

## 验证步骤

1. **API 认证测试：**
   - 无 Authorization Header → 401
   - 错误 API Key → 401
   - 正确 API Key + 不在白名单 IP → 403（若配置了白名单）
   - 正确 API Key + 在白名单 IP → 200

2. **输入过滤测试：**
   - 正常产品描述 → 通过
   - 包含 "ignore previous instructions" → 400
   - 包含 "你现在是一个黑客" → 400
   - 超长输入（>10000 字符）→ 400

3. **回归测试：**
   - 所有管理 API 仍可正常调用
   - AI 工具仍可正常生成内容
   - 类型检查通过：`npx tsc --noEmit`
