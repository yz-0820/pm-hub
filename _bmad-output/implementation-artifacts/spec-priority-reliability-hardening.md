---
title: '按优先级修复 PM Hub 工程可靠性问题'
type: 'refactor'
created: '2026-07-13'
status: 'done'
baseline_commit: 'eedd2a42f9167d8fe43c8e675eb943e3780b4752'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 项目目前存在运行时与数据库配置漂移、搜索结果不完整、Lint/CI 失效、年份硬编码、仓库内提交运行时、单实例限流、Figma 导入跨域过宽，以及关键路径测试不足等问题，影响部署可靠性与维护效率。

**Approach:** 按已确认的性价比优先级逐项修复，先消除会导致部署或数据错误的问题，再补齐自动化质量门禁、安全边界和针对性测试；只在本次触及的代码范围内做必要拆分。

## Boundaries & Constraints

**Always:** 使用 Node.js 22；以 PostgreSQL/Neon 为唯一现行数据库；保留现有公开路由和产品行为；不暴露 `.env*` 密钥；每项修复均有可重复验证；保留用户已修改的 README。

**Ask First:** 需要新增付费外部服务、修改生产域名所有权、执行不可逆数据库数据变更、或重写 Git 历史时暂停确认。

**Never:** 不迁回 SQLite；不把密钥写入脚本、镜像或文档；不顺手重构无关模块；不通过关闭规则或跳过测试来让 CI 变绿；不自动提交或推送。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 搜索混合结果 | Meili 有文章命中且职业内容也命中 | 两类结果共同参与稳定分页，时间戳正确 | Meili 不可用时回退数据库且分页语义一致 |
| 年份边界 | 当前日期跨年 | 职业统计自动使用当前自然年 | 无有效日期的数据不计入年度统计 |
| 限流 | 多实例同时收到同一身份请求 | 共享数据库计数并返回一致限流结果 | 存储异常返回明确服务错误，不静默放行 |
| Figma 导入 | 允许域、未知域、无 Origin | 仅允许配置域；同源/服务端请求可用 | 未授权跨域请求不返回许可头 |

</frozen-after-approval>

## Code Map

- `drizzle.config.ts`, `Dockerfile`, `docker-compose.yml`, `scripts/prod/*` -- Node/数据库/部署配置。
- `app/api/search/route.ts`, `lib/search/indexer.ts` -- 搜索索引、时间戳与混合分页。
- `eslint.config.mjs`, `.github/workflows/ci.yml` -- 静态检查和持续集成。
- `app/career/page.tsx`, `lib/career/cache.ts` -- 当前年度统计。
- `.gitignore`, `scripts/prod/dev-runner.cjs`, `.tools/` -- 本地运行时与仓库体积。
- `lib/utils/rate-limiter.ts`, `app/api/tools/*`, `figma-plugin/manifest.json` -- 分布式限流和跨域边界。
- `tests/` -- 搜索、限流、年份、配置和关键 API 回归测试。
- `README.md` -- 与修复后真实运行方式保持一致。

## Tasks & Acceptance

**Execution:**
- [x] 统一 Node 22、PostgreSQL/Neon 和部署脚本，移除硬编码密钥与 SQLite 现行路径。
- [x] 修复搜索时间戳、跨类型合并和分页回退逻辑，并添加单元测试。
- [x] 修复 ESLint 配置，新增 GitHub Actions 的测试、Lint、类型检查和构建门禁。
- [x] 将职业数据的 2026 年区间改为动态当前年，并覆盖跨年测试。
- [x] 让开发启动器不依赖已提交 `.tools`，忽略并停止跟踪仓库内运行时文件。
- [x] 使用 PostgreSQL 原子计数实现多实例限流；将 Figma CORS 和插件域名收紧到配置域。
- [x] 为上述关键路径和鉴权/API 边界补充高价值测试。
- [x] 仅对本次触及的超大逻辑做小型纯函数抽取，并引入轻量结构化日志入口，不全量改写日志。
- [x] 更新 README，使配置、运行、测试和部署说明与代码一致。

**Acceptance Criteria:**
- 全仓不再有作为现行运行路径的 SQLite 配置或硬编码生产密钥。
- 搜索能正确返回文章与职业内容，时间与分页在主路径和回退路径一致。
- 年度统计无需每年改代码；CI 能在 Node 22 上阻止测试、Lint、类型或构建失败。
- 限流跨实例共享；Figma API 不再返回通配 CORS。
- 本地 Node 22 验证命令全部通过，现有产品路由不变。

## Spec Change Log

- 2026-07-13：完成三层代码复审；补齐迁移幂等日志、搜索零命中回退与有界分页、代理 IP 信任边界、动态年度审计和 CORS `null` 边界测试。

## Design Notes

共享限流优先复用现有 PostgreSQL，避免为单一能力引入新的基础设施。仓库体积修复只停止跟踪 `.tools`，不重写历史；如需真正缩小既有 Git 历史，必须另行批准。超大文件只抽取本次新增或修改的纯逻辑，以控制回归面。

## Verification

**Commands:**
- `npm test` -- 全部测试通过。
- `npm run lint` -- ESLint 零错误。
- `npx tsc --noEmit --incremental false` -- 类型检查通过。
- `npm run build` -- Node 22 生产构建成功。
- `git grep -n -E "node:20|Access-Control-Allow-Origin.*\\*" -- Dockerfile docker-compose.yml drizzle.config.ts app lib scripts/prod ':!scripts/prod/import-sqlite-to-postgres.ts'` -- 无现行错误配置。
- `git grep -n '"dialect": "sqlite"' -- drizzle.config.ts lib/db/migrations/meta` -- 迁移配置和元数据均为 PostgreSQL。

## Suggested Review Order

**部署与迁移**

- 统一 Node 22 镜像
  [`Dockerfile:2`](../../Dockerfile#L2)

- 编排外部 PostgreSQL
  [`docker-compose.yml:1`](../../docker-compose.yml#L1)

- 锁定幂等迁移
  [`migrate.ts:22`](../../scripts/prod/migrate.ts#L22)

**搜索正确性**

- 统一跨类型分页
  [`route.ts:14`](../../app/api/search/route.ts#L14)

- 规范时间并合并
  [`results.ts:14`](../../lib/search/results.ts#L14)

- 保证候选时间顺序
  [`client.ts:59`](../../lib/search/client.ts#L59)

**安全与共享状态**

- PostgreSQL 原子限流
  [`rate-limiter.ts:51`](../../lib/utils/rate-limiter.ts#L51)

- 收紧代理身份来源
  [`rate-limiter.ts:87`](../../lib/utils/rate-limiter.ts#L87)

- 精确校验 Figma 来源
  [`figma-cors.ts:27`](../../lib/tools/figma-cors.ts#L27)

**年度与质量门禁**

- 动态计算 UTC 年度
  [`year-range.ts:3`](../../lib/career/year-range.ts#L3)

- 固化 Node 22 CI
  [`ci.yml:12`](../../.github/workflows/ci.yml#L12)

- 记录真实运行方式
  [`README.md:1`](../../README.md#L1)

- 覆盖搜索合并边界
  [`results.test.ts:18`](../../__tests__/search/results.test.ts#L18)

- 覆盖 CORS 拒绝边界
  [`figma-cors.test.ts:4`](../../__tests__/tools/figma-cors.test.ts#L4)
