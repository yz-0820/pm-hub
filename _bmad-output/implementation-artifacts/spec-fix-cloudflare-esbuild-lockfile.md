---
title: '修复 Cloudflare 构建的 esbuild 锁文件不一致'
type: 'bugfix'
created: '2026-06-18'
status: 'done'
route: 'one-shot'
---

# 修复 Cloudflare 构建的 esbuild 锁文件不一致

## Intent

**Problem:** npm 10 执行 `npm ci` 时发现 `package-lock.json` 缺少 Vitest 所需的 `esbuild@0.28.1` 及平台可选包，导致 Cloudflare 在依赖安装阶段终止。

**Approach:** 使用项目要求的 Node 22/npm 10 重新规范化锁文件，并通过隔离 `npm ci`、测试与 OpenNext Cloudflare 构建验证。

## Suggested Review Order

- 核对 Vitest 私有 esbuild 依赖及全部平台可选包已写入锁文件。
  [`package-lock.json:13480`](../../package-lock.json#L13480)
