---
title: '修复首页新闻轮播图片切换卡顿'
type: 'bugfix'
created: '2026-08-05'
status: 'draft'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 首页两个新闻轮播切图卡顿：外部封面经代理后仍是未缩放的大图，下一张没有稳定预热；两个轮播又以相同周期同步播放，离屏或后台时也持续工作。

**Approach:** 依次降低图片体积、优化加载时机、调整播放调度、改善合成动画：仅为首页轮播请求受控尺寸的 WebP，首图优先且只预热下一张；错开周期，并在离屏、后台或减少动态效果时暂停。

## Boundaries & Constraints

**Always:** 保持文章、链接、指示点和手动切换不变；保留代理校验、防盗链与备用图；兼容 Node 22、Next 16、OpenNext 和本地开发；转换参数有限；既有无参数代理请求不变。

**Ask First:** 新增付费服务、数据库迁移、公开 API 变更或绕过现有图片代理前必须暂停确认。

**Never:** 不全局开启 Next Image 优化；不引入 Worker 原生依赖；不 eager 全部图片；不改其他页面图片策略或重做首页视觉。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 首屏 | 可见且至少两项 | 首图优先，仅预热下一张 | 失败使用备用图 |
| 转换 | 合法参数 | 返回缩放 WebP 并缓存 | 不可转换时回退原图；非法参数 400 |
| 暂停 | 离屏、后台、减少动态或不足两项 | 停止；条件恢复后继续 | 手动导航可用 |

</frozen-after-approval>

## Code Map

- `app/api/image-proxy/route.ts`、`lib/utils/image-proxy.ts` — 受控图片 URL、转换、缓存与回退。
- `components/ui/article-carousel.tsx`、`app/page.tsx` — 加载、播放、动画与错峰周期。
- `__tests__/utils/image-proxy.test.ts`、`__tests__/ui/article-carousel-behavior.test.ts` — 回归测试。

## Tasks & Acceptance

**Execution:**
- [ ] `lib/utils/image-proxy.ts`、`app/api/image-proxy/route.ts` — 生成固定参数 URL；通过现有 `IMAGES` binding 输出并缓存 WebP；无绑定、不支持或异常时回退。
- [ ] `components/ui/article-carousel.tsx` — 首图 preload/high、下一张 eager；用视口、页面可见性和 reduced-motion 控制稳定的 Autoplay；增加 GPU 合成提示。
- [ ] `app/page.tsx` — 周期由 3500/3500ms 改为 3500/4700ms。
- [ ] 新增测试 — 覆盖参数、下一张回绕和暂停条件。

**Acceptance Criteria:**
- 两个轮播不再同步；离屏、后台或减少动态时停止，恢复可见后继续。
- 外部封面在 Cloudflare preview 返回缩放 WebP（目标约 150 KB 内）；失败可回退；桌面和移动端切换、链接、图片比例正常，且不首屏加载全部图片。

## Spec Change Log

## Design Notes

保留全局 `unoptimized`：OpenNext 的 `/_next/image` 会把动态相对代理地址当静态 `ASSETS`，上线可能 404。转换仅在现有代理内由首页显式启用；本地无 binding 时回退。

## Verification

**Commands:**
- `npm test` — 全部测试通过。
- `npx eslint app/page.tsx app/api/image-proxy/route.ts components/ui/article-carousel.tsx lib/utils/image-proxy.ts __tests__/utils/image-proxy.test.ts __tests__/ui/article-carousel-behavior.test.ts` — 无 lint 错误。
- `npm run build` — OpenNext 构建成功。

**Manual checks:** 本地验证加载、切换、暂停恢复与错峰；Cloudflare preview 验证 WebP、体积、缓存和失败回退。
