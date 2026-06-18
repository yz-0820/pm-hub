# Investigation: 爱范儿文章概要混入公众号推广语

## Hand-off Brief

1. **What happened.** 爱范儿 RSS 的摘要和正文末尾自带固定公众号推广语，PM Hub 未做来源级清洗便写入数据库。
2. **Where the case stands.** 根因已确认；线上、实时 feed、数据库和代码链路相互印证，14/14 条爱范儿记录的 summary 与 content 均受影响。
3. **What's needed next.** 在入库前清理精确匹配的爱范儿尾注，并一次性回填历史 summary/content。

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-06-18 |
| Status | Concluded |
| System | PM Hub, Next.js 16, Node.js 22, Postgres |
| Evidence sources | 用户截图、线上页面、实时 RSS、Postgres、解析/抓取/渲染代码 |

## Problem Statement

来源为“爱范儿”的文章概要持续包含“欢迎关注爱范儿官方微信公众号……”推广语。

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| 用户截图 | Available | 多篇卡片稳定复现同一尾句 |
| 线上 `/articles?category=tech&page=2` | Available | HTTP 200 且响应包含推广语及截图标题 |
| 爱范儿实时 RSS | Available | 最新 5 项的 `contentSnippet`、`content`、`content:encoded` 均含 `ifanr` 推广尾注 |
| Postgres | Available | 14/14 条 `source_id='ifanr'` 记录的 summary 与 content 均含 `ifanr` |
| 源码 | Available | 字段映射、入库和原样渲染链路已确认 |

## Confirmed Findings

### Finding 1: 推广语来自爱范儿 RSS

**Evidence:** `config/rss.ts:135-141` 指向 `https://www.ifanr.com/feed`；2026-06-18 实时读取最新 5 项，推广尾注同时存在于 `contentSnippet`、`content` 和 `content:encoded`。

### Finding 2: 解析器未清洗摘要

**Evidence:** `lib/rss/parser.ts:62-66`

**Detail:** 正文直接取 `content:encoded`，summary 直接取 `summary || contentSnippet`，没有来源级或模板尾注过滤。

### Finding 3: 入库仅截断，不清洗

**Evidence:** `lib/rss/fetcher.ts:432-448`

**Detail:** summary 仅执行 `slice(0, 500)`，content 原样保存。

### Finding 4: UI 原样输出污染字段

**Evidence:** `components/articles/article-card.tsx:61-67`; `app/articles/[slug]/page.tsx:142-147`

**Detail:** 卡片直接渲染 summary，详情页直接渲染 content。

### Finding 5: 当前历史数据全部受影响

**Evidence:** 2026-06-18 只读数据库查询。

**Detail:** 爱范儿记录共 14 条，summary 含 `ifanr` 14 条，content 含 `ifanr` 14 条。

## Hypothesized Paths

### Hypothesis 1: 页面主动拼接推广语

**Status:** Refuted

**Resolution:** 仓库不存在该固定文案；UI 只原样输出数据库字段。

### Hypothesis 2: RSS 自带尾注且系统未过滤

**Status:** Confirmed

**Resolution:** 实时 feed、数据库内容和代码字段流一致。

## Source Code Trace

| Element | Detail |
| --- | --- |
| Error origin | 爱范儿 feed 的 description/content:encoded 尾注 |
| Trigger | RSS 定时抓取解析爱范儿条目 |
| Condition | `contentSnippet`/`content:encoded` 含固定推广尾注，且无清洗规则 |
| Related files | `config/rss.ts`, `lib/rss/parser.ts`, `lib/rss/fetcher.ts`, `components/articles/article-card.tsx`, `app/articles/[slug]/page.tsx` |

## Conclusion

**Confidence:** High

根因是上游 RSS 固定尾注与本项目缺少 boilerplate 清洗共同造成。问题可确定性修复，且无需改变页面布局或数据模型。

## Recommended Next Steps

### Fix direction

1. 新增可测试的纯清洗函数，只对 `sourceId='ifanr'` 且位于结尾的精确推广模板生效，避免误删正文中的正常微信相关内容。
2. 在相关性/质量评估和数据库写入之前，同时清理 `article.summary` 与 `article.content`。
3. 对现有 14 条爱范儿记录执行一次性回填，清理 summary 和 content 中的相同尾注。
4. 如搜索索引包含 article summary，回填后执行 `npm run search:rebuild`。

### Verification

- 单元测试覆盖纯文本、HTML 段落、无尾注、正文中间提及微信、重复执行幂等性。
- 重新抓取爱范儿样本，确认数据库及 `/articles?category=tech&page=2` 不含尾注。
- 抽查文章详情页，确认正文主体未被截断。

## Follow-up: 2026-06-18

### Resolution

- 已在抓取过滤与入库前接入来源限定、结尾限定的 summary/content 清洗。
- 历史脚本预览 14 条并事务更新 14 条；复查待清理数为 0。
- 本地 Meilisearch 已重建 1111 篇文章；线上列表、详情页和搜索 API 均不再出现固定推广尾注。
