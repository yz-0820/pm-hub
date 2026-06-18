# Investigation: 产品管理分类未使用源图片

## Hand-off Brief

1. **What happened.** 已确认产品管理列表第一页 10 条记录均使用本地默认封面，数据库对应 `image_url` 均为空，但人人都是产品经理 RSS 和原文都提供了真实图片。
2. **Where the case stands.** Concluded；根因是 `image.woshipm.com` 不在统一图片域名白名单中，采集验证返回 `Domain not allowed`，随后将图片字段保存为 `NULL`。
3. **What's needed next.** 最小修复是精确放行 `image.woshipm.com`，增加验证测试，再对已有 `woshipm` 空图片记录执行受限回填。

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-06-18 |
| Status | Concluded |
| System | Windows, Next.js 16, Node.js 22.x, localhost:3000 |
| Evidence sources | 页面 DOM、源代码、Postgres 文章记录、上游 RSS 和原文 |

## Problem Statement

用户报告：`http://localhost:3000/articles?category=product-management` 分类下的文章来源页都有图片，但列表没有启用源图片，而选择了默认图片。

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| 页面 DOM | Available | 第一页 10 张卡片图均为 `/covers/articles/product-management/{1..3}.jpg` |
| 源代码 | Available | 已完成卡片、封面解析、RSS parser/fetcher、validator、proxy 链路追踪 |
| 数据库 | Available | 第一页对应 10 条 `woshipm` 记录的 `image_url` 均为 `NULL` |
| 上游 RSS/原文 | Available | 样本 RSS `content:encoded` 含图片；原文 `og:image` 指向同一图片域名 |

## Confirmed Findings

### Finding 1: 前端按设计使用默认图

**Evidence:** `components/articles/article-card.tsx:18-40`, `lib/utils/article-cover.ts:31-40`

只有非默认的 `article.imageUrl` 才会作为源图；为空时稳定选择分类默认封面。浏览器实际观察到第一页 10 张图均为本地产品管理封面。

### Finding 2: 当前文章记录没有保存源图

**Evidence:** 2026-06-18 对当前 Postgres 的只读查询

列表第一页 10 条文章均来自 `source_id='woshipm'`，`image_url` 全为 `NULL`。

### Finding 3: RSS 和原文确实提供源图

**Evidence:** `https://www.woshipm.com/feed` 中文章 6415241 的 `content:encoded`; `https://www.woshipm.com/ai/6415241.html` 的 `og:image`

两者均指向 `https://image.woshipm.com/...png`；该图片直接请求返回 200、`image/png`、约 1.76 MB。

### Finding 4: 统一白名单拒绝了图片域名

**Evidence:** `lib/utils/image-proxy-validation.ts:146-155`, `lib/utils/image-proxy-validation.ts:174-205`, `lib/rss/image-validator.ts:93-103`, `lib/rss/fetcher.ts:357-370`

白名单没有 `image.woshipm.com`。验证失败后 fetcher 将 `finalImageUrl` 设为分类默认值；该函数实际返回 `null`（`lib/rss/fetcher.ts:48-59`），最终数据库保存空值。本地代理复现为 HTTP 400 `{"error":"Domain not allowed"}`。

## Hypothesized Paths

### Hypothesis 1: RSS 没有提供图片

**Status:** Refuted

**Resolution:** RSS item 的 `content:encoded` 已包含有效 `<img>`；缺失不是 parser 没看到图片，而是后续 validator 拒绝图片域名。

### Hypothesis 2: 图片域名未进入白名单导致采集时丢弃

**Status:** Confirmed

**Resolution:** 本地代理对样本返回 400 `Domain not allowed`；同一图片直接请求返回 200。

## Missing Evidence

| Gap | Impact | How to Obtain |
| --- | --- | --- |
| 历史 243 篇中可回填图片的精确数量 | 影响回填工作量，不影响根因 | 对 `woshipm` 空图片记录运行 dry-run 回填审计 |

## Source Code Trace

| Element | Detail |
| --- | --- |
| Error origin | `lib/utils/image-proxy-validation.ts:201-202` |
| Trigger | 抓取 `woshipm` RSS 文章并验证 `image.woshipm.com` 图片 |
| Condition | RSS 图片主机不在允许域名集合中 |
| Related files | `lib/rss/parser.ts`, `lib/rss/image-validator.ts`, `lib/rss/fetcher.ts`, `app/api/image-proxy/route.ts`, `lib/utils/article-cover.ts` |

## Conclusion

**Confidence:** High

根因已确认：源站和 RSS 都有图，parser 也能从 `content:encoded` 提取，但统一图片安全白名单遗漏 `image.woshipm.com`。采集阶段因此把源图判为无效并保存为 `NULL`，前端只能按设计显示分类默认封面。这不是文章卡片优先级错误。

## Recommended Next Steps

### Fix direction

1. 在统一白名单中只增加精确主机 `image.woshipm.com`，不扩大到整个 `woshipm.com` 通配范围。
2. 为 validator 增加允许该主机、拒绝伪造后缀域名的测试；验证代理能返回真实图片。
3. 新文章会在后续 RSS 抓取时直接保存源图。
4. 对已有 `source_id='woshipm' AND image_url IS NULL` 记录做独立 dry-run 回填：从原文 `og:image` 或可匹配的 RSS 内容提取、走同一 validator、限并发更新。单纯重跑 RSS 不够，因为重复标题逻辑会跳过已有记录（`lib/rss/fetcher.ts:386-397`）。

### Diagnostic

修复后抽查样本应满足：validator 为 valid、代理 HTTP 200、数据库保存远程 URL、列表 `img` 首选 `/api/image-proxy?url=...` 而非本地 `/covers/`。

## Reproduction Plan

打开产品管理列表，记录第一张卡片；查询其 `image_url` 为 `NULL`；从 RSS/原文取得 `image.woshipm.com` 图片；调用本地代理得到 400 `Domain not allowed`。放行并回填后重复检查，期望代理和卡片均使用源图。
