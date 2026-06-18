# Investigation: 爱范儿文章概要混入公众号推广语

## Hand-off Brief

1. **What happened.** 截图确认多篇爱范儿文章概要重复出现公众号推广语。
2. **Where the case stands.** 正在追踪 RSS 原始字段、入库清洗和列表渲染链路。
3. **What's needed next.** 确认推广语进入数据库的阶段，并判断新数据与历史数据的修复边界。

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-06-18 |
| Status | Active |
| System | PM Hub, Next.js 16, Node.js 22, Postgres |
| Evidence sources | 用户截图、RSS 配置、解析/抓取/渲染代码、版本历史 |

## Problem Statement

用户报告来源为“爱范儿”的文章概要持续包含“欢迎关注爱范儿官方微信公众号……”推广语，希望确认原因及可修复性。

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| 用户截图 | Available | 多篇爱范儿卡片稳定复现同一推广尾句 |
| RSS 配置与抓取代码 | Available | 待追踪字段映射和清洗逻辑 |
| 当前数据库样本 | Partial | 待确认存储字段是否已包含推广语 |
| 爱范儿实时 RSS | Partial | 待确认源 feed 当前输出 |

## Investigation Backlog

| # | Path to Explore | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | RSS 字段映射 | High | In Progress | 确认 summary 来源 |
| 2 | 入库前内容清洗 | High | Open | 搜索通用/来源级噪声过滤 |
| 3 | 列表渲染 | Medium | Open | 确认是否原样展示数据库 summary |
| 4 | 历史数据 | Medium | Open | 判断是否需要回填清理 |

## Hypothesized Paths

### Hypothesis 1: 爱范儿 RSS 摘要自带推广尾句且系统未过滤

**Status:** Open

**Theory:** 抓取器将 feed 的摘要字段原样截断并入库，页面随后原样展示。

**Supporting indicators:** 相同推广语跨多篇文章重复，符合来源模板化尾注特征。

**Would confirm:** 实时 feed 或数据库 summary 含该字符串，且代码链路不存在对应过滤。

**Would refute:** feed 与数据库均不含该字符串，或页面渲染阶段自行拼接。

**Resolution:** Pending.
