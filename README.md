# PM Hub - 产品经理专业平台

汇聚专业资讯、职业发展、题库训练、PRD 生成等多种功能，助力产品人持续成长。

## 功能概览

### 📡 资讯聚合

- **多源RSS聚合** — 自动抓取人人都是产品经理、36氪、虎嗅、钛媒体、爱范儿等优质中文信源
- **智能分类** — AI / 科技 / 财经 / 产品管理四大分类，支持分类浏览
- **全文搜索** — 基于 Meilisearch 的高性能搜索，支持标题和正文检索
- **自动刷新** — 本地开发时 instrumentation 自动启动 RSS 定时抓取

### 💼 职业发展

- **多平台内容聚合** — 整合人人都是产品经理、少数派、知乎、36氪、虎嗅、钛媒体、爱范儿、哔哩哔哩等多个平台的内容
- **四维分类体系** — 职场沟通 / 高效工作 / 团队协作 / 领导力，每篇内容经过 AI 关联度评分
- **智能过滤** — 自动剔除非中文内容、垃圾广告、财经投资类资讯，确保内容与职业发展强相关
- **分类验证** — 关键词匹配 + 核心组校验 + 职场锚点三重验证机制
- **自动抓取** — 本地开发时 instrumentation 自动启动职业发展定时抓取（默认每15分钟）

### 🧠 题库训练

- **产品思维训练** — 多行业（互联网/金融/教育/医疗/零售）× 多产品类型（移动端/Web/硬件/SaaS）的产品拆解题库
- **AI 智能评分** — 基于 DeepSeek 大模型，从用户价值分析、商业逻辑完整性、功能设计合理性、竞争分析深度四个维度自动评分
- **详细评分报告** — 每维度包含关键依据、参考答案、改进建议，支持草稿自动保存
- **编程知识训练** — 前端/后端/数据库三大领域选择题库，即时反馈与解析

### 🛠️ 产品工具

- **PRD 生成器** — AI 驱动的产品需求文档生成工具
- **原型描述生成器** — AI 辅助的原型描述生成

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | SQLite + Drizzle ORM + better-sqlite3 |
| 搜索 | Meilisearch |
| AI 评分 | DeepSeek API (deepseek-chat) |
| 图标 | Lucide React |
| 动画 | Framer Motion |
| 验证 | Zod |

## 快速开始

### 环境要求

- Node.js >= 22（见 `.nvmrc`）
- npm 或 pnpm

### 本地开发

```bash
# 安装依赖
npm install

# 创建数据目录
mkdir -p data

# 运行数据库迁移
npm run db:migrate

# 种子训练题库（可选）
npm run training:seed

# 启动开发服务器（自动启动 RSS 和职业发展定时抓取）
npm run dev
```

访问 http://localhost:3000

### 可选：启用 Meilisearch 全文搜索

```bash
# 1. 安装并启动 Meilisearch
# 参考: https://www.meilisearch.com/docs/learn/getting_started/installation

# 2. 配置环境变量
# MEILISEARCH_HOST=http://localhost:7700
# MEILISEARCH_API_KEY=your-master-key

# 3. 构建搜索索引
npm run search:rebuild
```

## 环境变量

在 `.env.local` 中配置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `./data/sqlite.db` |
| `MEILISEARCH_HOST` | Meilisearch 地址 | - |
| `MEILISEARCH_API_KEY` | Meilisearch 密钥 | - |
| `KIMI_MEILISEARCH_KEY` | 搜索功能备用密钥 | - |
| `API_KEY` | API 认证密钥 | - |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必需，用于 AI 评分） | - |
| `DEEPSEEK_BASE_URL` | DeepSeek API Base URL | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名 | `deepseek-chat` |
| `RSSHUB_BASE_URL` | RSSHub 实例地址（用于小红书/B站等） | - |
| `XIAOHONGSHU_COOKIE` | 小红书 Cookie | - |
| `ENABLE_LOCAL_RSS_SCHEDULER` | 开发时启用 RSS 自动抓取 | `false` |

## 项目结构

```
pm-website/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── career/               # 职业发展 API（内容/源/健康检查等）
│   │   ├── rss/                  # RSS 抓取/健康检查 API
│   │   ├── search/               # 搜索 API
│   │   ├── tools/                # PRD/原型工具 API
│   │   └── training/             # 训练题库 API
│   ├── articles/                 # 资讯文章列表/详情
│   ├── career/                   # 职业发展内容页
│   ├── categories/               # 分类浏览页
│   ├── search/                   # 搜索页面
│   ├── tools/                    # PRD 生成器 / 原型生成器
│   └── training/                 # 题库训练
│       ├── product-thinking/     # 产品思维训练（答题 + AI评分报告）
│       └── programming/          # 编程知识训练
├── components/                   # React 组件
│   ├── articles/                 # 文章卡片/列表
│   ├── career/                   # 职业发展内容卡片/列表
│   ├── layout/                   # Header / Footer
│   ├── tools/                    # PRD / 原型工具表单
│   ├── training/                 # 训练评分卡片/筛选器等
│   └── ui/                       # 通用 UI 组件
├── config/                       # 配置文件
│   ├── content-sources.ts        # 职业发展内容源（关键词+信源）
│   ├── resource-categories.ts    # 职业发展分类定义
│   ├── rss.ts                    # RSS 源配置
│   └── training.ts               # 训练题库行业/类型/难度
├── lib/                          # 核心逻辑
│   ├── career/                   # 职业发展抓取/分类/质量评估
│   │   └── platforms/            # 平台适配器（RSSHub等）
│   ├── db/                       # 数据库客户端与 Schema
│   ├── rss/                      # RSS 抓取/解析/相关性评估
│   ├── search/                   # Meilisearch 客户端
│   ├── tools/                    # PRD / 原型生成逻辑
│   ├── training/                 # 训练题 AI 评分引擎
│   └── utils/                    # 通用工具
├── scripts/                      # 脚本工具（迁移/抓取/审计等）
├── data/                         # SQLite 数据库文件
├── drizzle.config.ts             # Drizzle ORM 配置
├── next.config.ts                # Next.js 配置
└── instrumentation.ts            # 本地开发自动抓取入口
```

## 常用命令

```bash
# 数据库
npm run db:migrate          # 执行数据库迁移
npm run db:generate         # 生成迁移文件

# 训练
npm run training:seed       # 种子训练题库

# RSS 抓取
npm run rss:fetch           # 手动触发 RSS 抓取
npm run rss:schedule        # 启动 RSS 定时抓取进程

# 职业发展
npm run career:fetch        # 手动触发职业发展内容抓取
npm run career:schedule     # 启动职业发展定时抓取进程
npm run career:audit        # 审计职业发展内容质量
npm run career:reassess     # 重新评估职业发展内容

# 搜索
npm run search:rebuild      # 重建 Meilisearch 搜索索引
```

## Vercel 部署

项目已配置为 Vercel 一键部署，推送 `main` 分支后自动触发。需在 Vercel Dashboard 配置环境变量。

## 许可证

MIT License
