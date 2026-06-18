---
title: '清理爱范儿 RSS 推广尾注'
type: 'bugfix'
created: '2026-06-18'
status: 'done'
baseline_commit: 'c957b61'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/investigations/ifanr-summary-promo-investigation.md'
---

# 清理爱范儿 RSS 推广尾注

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 爱范儿 RSS 在摘要和 HTML 正文结尾附加固定微信公众号推广语，当前抓取器将其原样入库并展示；现有 14 条爱范儿记录的 summary/content 均受影响。

**Approach:** 在相关性判断和入库前执行来源限定、结尾限定的精确清洗；用同一纯函数安全回填历史数据，随后重建搜索索引。

## Boundaries & Constraints

**Always:** 仅对 `sourceId='ifanr'` 生效；仅删除位于字段结尾的固定模板；同时处理纯文本 summary 和 HTML content；清理函数必须幂等；历史脚本默认只预览，显式 `--apply` 才写数据库。

**Ask First:** 如果检测到固定模板以外的变体、影响记录数不是预期的 14 条，或需要清理其他来源，停止写入并报告。

**Never:** 不把整篇文章判为广告；不使用宽泛的“微信/公众号”关键词删除；不修改文章标题、分类、URL、评分或正文主体；不改变数据库结构。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| 爱范儿纯文本尾注 | 正文后跟固定推广模板 | 只删除尾注并 trim | 保留正文 |
| 爱范儿 HTML 尾注 | 最后一个 `<p>` 为固定模板 | 删除该段落 | 保留此前 HTML |
| 正文中间提及微信 | 固定文案不在结尾或普通微信描述 | 原样保留 | 不清洗 |
| 非爱范儿来源 | 相同文本 | 原样保留 | 来源隔离 |
| 重复执行 | 已清理内容 | 输出不再变化 | 幂等 |

</frozen-after-approval>

## Code Map

- `lib/rss/content-sanitizer.ts` — 来源级固定尾注清洗纯函数。
- `lib/rss/fetcher.ts` — 抓取后、过滤和入库前应用清洗。
- `__tests__/rss/content-sanitizer.test.ts` — 正向、误删防护和幂等测试。
- `scripts/maintenance/clean-ifanr-boilerplate.ts` — 历史数据预览/显式回填脚本。
- `scripts/prod/build-search-index.ts` — 回填完成后重建 Meilisearch 索引。

## Tasks & Acceptance

**Execution:**
- [x] `__tests__/rss/content-sanitizer.test.ts` — 先添加失败测试，覆盖矩阵中的全部场景。
- [x] `lib/rss/content-sanitizer.ts` — 实现来源和结尾双重约束的 summary/content 清洗。
- [x] `lib/rss/fetcher.ts` — 在促销、相关性和质量判断之前清洗每篇已解析文章。
- [x] `scripts/maintenance/clean-ifanr-boilerplate.ts` — 复用纯函数，默认预览，`--apply` 更新匹配记录。
- [x] 数据维护 — 先验证恰好 14 条，再应用回填并确认污染计数为 0。
- [x] 搜索维护 — 重建索引并确认爱范儿搜索结果不再包含推广尾注。

**Acceptance Criteria:**
- Given 爱范儿 feed 含固定尾注, when 抓取器处理条目, then summary/content 入库前均已清理且文章仍被正常评估。
- Given 正文中间正常提到微信或来源不是爱范儿, when 清洗函数运行, then 输入保持不变。
- Given 现有 14 条污染记录, when 预览和 `--apply` 依次执行, then 仅这 14 条被更新且再次执行更新数为 0。
- Given 数据回填完成, when 搜索索引重建, then数据库、索引和文章页面均不再出现固定尾注。

## Spec Change Log

- 2026-06-18：本地 Meilisearch 未运行且 Docker 不可用；使用仓库锁定的官方 v1.6.2 Windows 二进制隐藏启动，完成 1111 篇索引重建后停止进程，并将本地索引目录加入 `.gitignore`。
- 2026-06-18：审查发现索引写入只等待入队且未指定主键；改为等待每个任务完成、传播失败详情并显式使用 `id` 主键，避免虚假成功和 `id`/`sourceId` 推断冲突。KEEP：来源/结尾双重限定清洗、14 条安全门和数据库回填结果。

## Design Notes

清洗应基于规范化后的“完整固定句 + 字段结尾”匹配；HTML 只移除承载该句的尾部段落。维护脚本必须调用生产清洗函数，避免线上与回填规则漂移。

## Verification

**Commands:**
- `npm test` — 所有测试通过，新增边界测试通过。
- `npx eslint lib/rss/content-sanitizer.ts lib/rss/fetcher.ts __tests__/rss/content-sanitizer.test.ts scripts/maintenance/clean-ifanr-boilerplate.ts` — 改动文件无 lint 错误。
- `npx tsx scripts/maintenance/clean-ifanr-boilerplate.ts` — 只读预览恰好 14 条。
- `npx tsx scripts/maintenance/clean-ifanr-boilerplate.ts --apply` — 更新 14 条并复查为 0。
- `npm run search:rebuild` — Meilisearch 重建成功。
- `npm run build` — OpenNext Cloudflare 构建通过。

**Manual checks:**
- 线上 `/articles?category=tech&page=2` 与任一爱范儿详情页不再出现固定推广尾注。

## Suggested Review Order

**抓取清洗**

- 在所有过滤和入库前统一清理两个内容字段。
  [`fetcher.ts:138`](../../lib/rss/fetcher.ts#L138)

- 用来源和尾部双重约束避免误删正文。
  [`content-sanitizer.ts:9`](../../lib/rss/content-sanitizer.ts#L9)

**历史与搜索维护**

- 默认预览并以 14 条安全门保护数据库写入。
  [`clean-ifanr-boilerplate.ts:31`](../../scripts/maintenance/clean-ifanr-boilerplate.ts#L31)

- 明确主键并等待索引任务真正完成。
  [`indexer.ts:49`](../../lib/search/indexer.ts#L49)

- 动态加载搜索模块以确保脚本环境先初始化。
  [`build-search-index.ts:4`](../../scripts/prod/build-search-index.ts#L4)

**回归保护**

- 覆盖纯文本、HTML、误删防护和幂等场景。
  [`content-sanitizer.test.ts:7`](../../__tests__/rss/content-sanitizer.test.ts#L7)

- 防止本地索引数据进入版本控制。
  [`.gitignore:46`](../../.gitignore#L46)
