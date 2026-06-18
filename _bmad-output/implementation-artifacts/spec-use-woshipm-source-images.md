---
title: '产品管理文章启用人人都是产品经理源图片'
type: 'bugfix'
created: '2026-06-18'
status: 'done'
baseline_commit: '6d15f8ce0bdccc5a977e34efb0e4b0d8bd257476'
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/investigations/product-management-source-images-investigation.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `woshipm` RSS 已提供文章图片，但 `image.woshipm.com` 未进入统一图片域名白名单，导致采集验证失败、数据库保存空 `image_url`，产品管理文章列表只能使用默认封面。

**Approach:** 精确放行该图片主机并补充验证测试；新增默认 dry-run 的历史回填命令，从文章页提取 `og:image`、复用现有图片验证后，仅更新 `woshipm` 的空图片记录。

## Boundaries & Constraints

**Always:** 只放行精确主机 `image.woshipm.com`；所有远程图片继续通过统一 validator/proxy；回填默认只读，必须显式传入 `--apply` 才写库；使用 Node 22；请求串行或受限并发。

**Ask First:** 若源站页面结构无法稳定提取图片，或回填需要修改非 `woshipm` 记录，则暂停确认。

**Never:** 不放行整个 `woshipm.com` 通配域；不绕过 SSRF/私网保护；不覆盖已有非空图片；不修改文章卡片的默认图优先级；不自动执行写库回填。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 新文章源图 | `https://image.woshipm.com/...` | validator 通过，采集保存源 URL | 网络/格式失败仍保存空值并使用默认图 |
| 伪造域名 | `image.woshipm.com.evil.test` | validator 拒绝 | 返回 `Domain not allowed` |
| 历史回填 dry-run | `woshipm` 且 `image_url IS NULL` | 输出候选与汇总，不写数据库 | 单条失败记录原因并继续 |
| 历史回填 apply | 同上并传入 `--apply` | 只更新验证通过的图片 URL | 不覆盖并发期间已出现的非空值 |

</frozen-after-approval>

## Code Map

- `lib/utils/image-proxy-validation.ts` -- 图片代理和采集共用的允许域名与 SSRF 校验。
- `__tests__/utils/image-proxy-validation.test.ts` -- 白名单与拒绝边界测试；当前含一个与白名单策略不一致的旧断言。
- `scripts/prod/backfill-woshipm-article-images.ts` -- 新增历史空图片 dry-run/apply 回填入口。
- `package.json` -- 暴露可重复执行的回填命令。
- `lib/rss/fetcher.ts` -- 新文章现有采集链路；无需改变控制流。

## Tasks & Acceptance

**Execution:**
- [x] `lib/utils/image-proxy-validation.ts` -- 添加精确的 `image.woshipm.com` 允许项。
- [x] `__tests__/utils/image-proxy-validation.test.ts` -- 修正旧的任意公网域名断言，并覆盖允许主机、相似恶意主机、私网拒绝。
- [x] `scripts/prod/backfill-woshipm-article-images.ts` -- 实现限定来源、空值、默认 dry-run、`--apply`、`--limit`、页面元图提取、统一图片验证和条件更新。
- [x] `package.json` -- 添加 `articles:backfill-woshipm-images` 命令。

**Acceptance Criteria:**
- Given 合法 woshipm 图片 URL, when 运行统一校验或代理, then 校验通过且代理返回图片。
- Given 其他未授权或伪造域名, when 运行校验, then 仍被拒绝。
- Given 历史空图片记录, when 运行回填 dry-run, then 数据库不变化且输出候选/失败/汇总。
- Given 同一记录执行 `--apply`, when 候选图片验证通过, then 仅空 `image_url` 被更新。
- Given 修改完成, when 运行测试、构建和页面检查, then 测试与构建通过，回填后的卡片使用代理源图。

## Spec Change Log

## Design Notes

回填使用页面 `og:image`，因为历史文章可能已离开当前仅 15 条的 RSS 窗口。数据库更新条件同时包含记录 ID、来源和 `image_url IS NULL`，避免覆盖并发更新。

## Verification

**Commands:**
- `npm test`（Node 22）-- expected: 全部测试通过。
- `npm run articles:backfill-woshipm-images -- --limit=3`（Node 22）-- expected: dry-run 找到候选且 `updated=0`。
- `npm run build`（Node 22）-- expected: 构建成功。
- 本地代理样本请求 -- expected: HTTP 200 且 `Content-Type: image/*`。

## Suggested Review Order

**历史回填边界**

- 默认 dry-run，仅处理可信来源和空图片记录。
  [`backfill-woshipm-article-images.ts:69`](../../scripts/prod/backfill-woshipm-article-images.ts#L69)

- 页面请求限制为精确 HTTPS 主机且禁止重定向。
  [`backfill-woshipm-article-images.ts:37`](../../scripts/prod/backfill-woshipm-article-images.ts#L37)

**统一图片安全策略**

- 只增加人人都是产品经理的精确图片主机。
  [`image-proxy-validation.ts:54`](../../lib/utils/image-proxy-validation.ts#L54)

**验证与入口**

- 覆盖合法主机和相似恶意主机。
  [`image-proxy-validation.test.ts:7`](../../__tests__/utils/image-proxy-validation.test.ts#L7)

- 暴露可重复执行的历史回填命令。
  [`package.json:42`](../../package.json#L42)
