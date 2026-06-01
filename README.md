# PM Hub

PM Hub 是一个面向产品经理和产品团队的内容与工具站点，聚合专业资讯、职业发展内容、题库训练和实用 AI 工具。

## 功能概览

### 专业资讯

- 多源 RSS 聚合：接入人人都是产品经理、36氪、虎嗅、钛媒体、爱范儿等中文信息源。
- 智能分类：支持产品经理、科技动态、人工智能、金融市场等分类。
- 相关性过滤：对泛产品发布、促销导购、泛金融、低相关 AI 内容进行过滤。
- 搜索：支持标题、摘要、正文、来源的站内搜索；配置 Meilisearch 后可使用独立搜索索引。
- 自动抓取：本地开发环境可通过 scheduler 自动抓取；线上通过 Vercel Cron 定时触发。

### 职业发展

- 四类内容体系：职场沟通、高效工作、团队协作、领导力。
- 多平台内容源：RSS 文章源、知乎、B站精选视频与 B站 RSSHub 视频源。
- 严格准入：质量分、分类匹配分、核心主题命中、职场锚点、硬拒规则多层过滤。
- 每日兜底精选：如果某个北京时间自然日没有新增 active 内容，会从当天 pending 内容里选综合分最高的一条放行。
- 视频精选池：`data/career-video-links.json` 维护 B站精选视频，覆盖四个职业分类。

### 题库训练

- 产品思维训练：围绕产品拆解、用户价值、商业逻辑、功能设计和竞品分析进行练习。
- 编程知识训练：覆盖前端、后端、数据库等基础知识题库。
- AI 评分：使用 DeepSeek 对产品思维答案进行结构化评分和反馈。

### 实用工具

- PRD 生成：输入需求背景、目标用户、功能点、约束条件、成功指标，生成 Markdown PRD，并支持 Word 下载。
- 原型生成：上传图片并描述修改需求，调用 Qwen 图像能力生成修改后的原型图。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Web 框架 | Next.js 16 App Router, React 19, TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | Postgres, Drizzle ORM |
| 搜索 | Meilisearch，可选 |
| AI 文本 | DeepSeek API |
| AI 图像 | Qwen 图像模型接口 |
| RSS 解析 | rss-parser, fast-xml-parser |
| 部署 | Vercel |

## 本地开发

### 环境要求

- Node.js `>=22 <23`
- npm
- 可访问的 Postgres 数据库，推荐 Neon

### 启动步骤

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run training:seed
npm run dev
```

访问：

```text
http://localhost:3000
```

### 常用命令

```bash
# 开发与构建
npm run dev
npm run build
npm run start
npm run lint

# 数据库
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:import:sqlite

# 专业资讯
npm run rss:fetch
npm run rss:schedule
npm run articles:reassess-tech
npm run articles:reassess-finance

# 职业发展
npm run career:fetch
npm run career:schedule
npm run career:reassess -- --apply
npm run career:audit
npm run career:videos:validate

# 搜索
npm run search:rebuild
```

## 环境变量

在 `.env.local` 中配置：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | Postgres 连接串，应用运行时使用；Neon 推荐使用 pooled URL |
| `DATABASE_URL_UNPOOLED` | 否 | 迁移或导入脚本可使用的直连 URL |
| `API_KEY` | 否 | 手动触发 RSS/career 抓取接口的 Bearer token |
| `SITE_URL` | 建议 | 站点地址，本地通常是 `http://localhost:3000` |
| `REVALIDATE_TOKEN` | 否 | 手动 revalidate 接口 token |
| `CRON_SECRET` | 线上必填 | Vercel Cron 调用 `/api/cron/fetch-content` 的鉴权 token |
| `ENABLE_LOCAL_RSS_SCHEDULER` | 否 | 是否在本地开发环境启用 RSS 定时器 |
| `LOCAL_RSS_INTERVAL_MINUTES` | 否 | 本地 RSS 抓取间隔，默认 60 |
| `CAREER_FETCH_INTERVAL_MINUTES` | 否 | 本地职业内容抓取间隔，默认 60 |
| `RSSHUB_BASE_URL` | 否 | 自建 RSSHub 地址，用于 B站、知乎等源的镜像或代理 |
| `XIAOHONGSHU_COOKIE` | 否 | 小红书相关源预留 |
| `DEEPSEEK_API_KEY` | 工具必填 | PRD 生成、题库评分等文本 AI 能力 |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-chat` |
| `DASHSCOPE_API_KEY` | 原型工具必填 | 原型生成工具使用的阿里云 DashScope / Qwen API Key |
| `QWEN_IMAGE_MODEL` | 否 | Qwen 图像模型名，按实际服务配置 |
| `DASHSCOPE_BASE_URL` | 否 | DashScope 图像接口地址，通常无需配置 |
| `MEILISEARCH_HOST` | 否 | Meilisearch 地址 |
| `MEILISEARCH_API_KEY` | 否 | Meilisearch API Key |

> 不要把真实 API Key、数据库连接串或 Cron Secret 提交到仓库。

## 内容抓取机制

### 本地

- `instrumentation.ts` 会在开发环境按配置启动 RSS 与职业发展两套定时器。
- RSS 默认每 60 分钟抓取一次。
- 职业发展默认每 60 分钟抓取一次，可通过 `CAREER_FETCH_INTERVAL_MINUTES` 覆盖。

### 线上

- `vercel.json` 配置了 Vercel Cron：

```json
{
  "path": "/api/cron/fetch-content",
  "schedule": "0 0 * * *"
}
```

- 触发时间是 UTC 00:00，约等于北京时间 08:00。
- Cron 接口会校验 `Authorization: Bearer ${CRON_SECRET}`。
- Vercel Hobby 计划通常只适合每天一次 Cron；如果需要更高频率，需要升级计划或使用外部调度器。

## 职业内容准入规则

职业内容进入 `/career` 的基本流程：

1. 抓取 RSS、精选视频或平台 feed。
2. 标准化为统一内容结构。
3. 计算质量分 `qualityScore`。
4. 计算四个职业分类的最佳匹配。
5. 执行全局职业相关性检测。
6. 命中硬拒规则的内容进入 `rejected`。
7. 满足质量分、分类匹配、核心主题和职场锚点的内容进入 `active`。
8. 边界内容进入 `pending`。

当前核心门槛：

- 质量分：`>= 60`
- 分类匹配分：`>= 80`
- 普通内容至少命中 3 个分类关键词
- B站视频至少命中 2 个分类关键词
- 必须命中对应分类核心组
- 职场沟通、团队协作等分类还会要求额外职场锚点

硬拒方向包括：

- 非中文内容或乱码严重内容
- 大量广告、促销、导购
- 泛融资、IPO、财报、投资内容
- AI 榜单、赛道格局、行业全景等泛资讯
- 与职业发展无关的产品发布、工具测评、行业新闻
- 产品经理基础教程、Axure/Figma/PRD 工具课等非职业发展视频

### 每日兜底精选

为了保证 `/career` 尽量每天至少有 1 条新增内容，系统在完整职业内容抓取结束后执行兜底：

- “每天”按北京时间自然日计算，不按最近 24 小时计算。
- 先检查当天 `publishedAt` 落在北京时间当天的 active 内容。
- 如果当天已有 active 内容，不做兜底。
- 如果当天没有 active 内容，从当天 pending 内容里选综合分最高的一条。
- 只从 `pending` 中选，不从 `rejected` 中选。
- 候选内容仍需满足：
  - `qualityScore >= 70`
  - `matchScore >= 75`
  - `matchCoreMatched = true`
  - 不含明显风险原因，例如无职场关联、非职业发展主题、商业/融资、大量疑似广告等。

## B站精选视频维护

精选视频文件：

```text
data/career-video-links.json
```

每条记录包含：

```json
{
  "platform": "bilibili",
  "category": "communication",
  "title": "视频标题",
  "url": "https://www.bilibili.com/video/...",
  "publishedAt": "2026-01-01T00:00:00.000Z"
}
```

维护后运行校验：

```bash
npm run career:videos:validate
```

校验内容包括：

- 平台必须是 `bilibili`
- 分类必须是 `communication`、`productivity`、`teamwork`、`leadership`
- 标题不能为空
- URL 必须是 B站链接
- 不允许重复 URL

## 部署到 Vercel

1. 在 Vercel 绑定项目和 GitHub 仓库。
2. 配置 Production 环境变量，至少包含：
   - `DATABASE_URL`
   - `CRON_SECRET`
   - `SITE_URL`
   - `DEEPSEEK_API_KEY`，如果使用 AI 文本工具
   - `DASHSCOPE_API_KEY`，如果使用原型生成工具
3. 推送 `main` 分支触发部署。
4. 部署后在 Vercel Cron Jobs 中确认 `/api/cron/fetch-content` 存在。
5. 首次部署后可手动触发抓取或等待下一次 Cron。

## 项目结构

```text
pm-website/
├─ app/
│  ├─ api/                  # API routes
│  ├─ articles/             # 专业资讯页面
│  ├─ career/               # 职业发展页面
│  ├─ search/               # 搜索页面
│  ├─ tools/                # PRD / 原型生成工具
│  └─ training/             # 题库训练
├─ components/              # React 组件
├─ config/                  # 内容源、分类、RSS、训练配置
├─ data/                    # 精选视频等本地数据
├─ lib/
│  ├─ career/               # 职业内容抓取、质量评估、缓存
│  ├─ db/                   # Drizzle schema 和数据库客户端
│  ├─ rss/                  # 专业资讯 RSS 抓取和相关性评估
│  ├─ search/               # Meilisearch 客户端
│  ├─ tools/                # PRD / 原型生成逻辑
│  └─ training/             # 训练与 AI 评分逻辑
├─ scripts/                 # 迁移、抓取、审计、重评脚本
├─ drizzle.config.ts
├─ instrumentation.ts       # 本地自动抓取入口
├─ next.config.ts
└─ vercel.json              # Vercel Cron 配置
```

## 维护建议

- 新增内容源后先本地执行抓取，再运行相关重评脚本。
- 调整职业内容准入规则后执行 `npm run career:reassess -- --apply`。
- 调整专业资讯相关性规则后执行对应 `articles:reassess-*` 脚本。
- 修改 B站精选视频池后必须运行 `npm run career:videos:validate`。
- 部署前运行 `npm run build`，确保 TypeScript 和 Next 构建通过。

## License

MIT
