# PM Hub - 产品经理专业资讯平台

一个面向个人使用的产品经理专业网站，自动聚合RSS资讯，支持智能搜索和分类浏览。

## 功能特性

- 📡 **RSS自动聚合** - 每2小时自动抓取8+优质信源
- 🔍 **全文搜索** - 基于Meilisearch的高性能搜索
- 🏷️ **智能分类** - 产品经理、科技资讯、产品发现等分类
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **高性能** - Next.js ISR静态生成，秒级加载
- 🐳 **Docker部署** - 一键部署，易于维护

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **数据库**: SQLite + Drizzle ORM
- **搜索**: Meilisearch
- **部署**: Docker + Docker Compose + Nginx

## 快速开始

### 本地开发

```bash
# Node 版本要求：建议使用 Node.js 22（见 .nvmrc/.node-version）

# 安装依赖
npm install

# 创建数据目录
mkdir -p data

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### Docker部署

```bash
# 创建数据目录
mkdir -p data/meilisearch

# 启动服务
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npm run db:migrate

# 初始化搜索索引
docker-compose exec app npm run search:rebuild
```

### 手动触发RSS抓取

```bash
# 本地
curl -X POST http://localhost:3000/api/rss/fetch \
  -H "Authorization: Bearer your-secret-api-key"

# Docker
docker-compose exec app npm run rss:fetch
```

## 定时任务配置

在服务器上配置crontab：

```bash
# 编辑crontab
crontab -e

# 添加以下任务
# RSS抓取：每2小时执行一次
0 */2 * * * cd /opt/pm-website && docker-compose exec -T app npm run rss:fetch >> /var/log/rss-fetch.log 2>&1

# 职业发展内容抓取：每30分钟执行一次（通过API触发）
*/30 * * * * curl -sS -X POST http://localhost:3000/api/career/contents \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{}' >> /var/log/career-fetch.log 2>&1

# 每日凌晨重建搜索索引
0 3 * * * cd /opt/pm-website && docker-compose exec -T app npm run search:rebuild >> /var/log/search-rebuild.log 2>&1

# 每周日凌晨备份数据库
0 4 * * 0 /opt/pm-website/scripts/backup.sh

# 每周一凌晨自动部署
0 5 * * 1 /opt/pm-website/scripts/deploy.sh
```

### Windows（任务计划程序）

- 程序/脚本：`powershell.exe`
- 参数：

```powershell
-NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/career/contents -Headers @{ Authorization = 'Bearer your-secret-api-key' } -ContentType 'application/json' -Body '{}' | Out-Null"
```

### 本地开发自动RSS更新

在 `.env.local` 配置好抓取间隔后，启动一个定时抓取进程（建议单独开一个终端）：

```bash
ENABLE_LOCAL_RSS_SCHEDULER=true
LOCAL_RSS_INTERVAL_MINUTES=60
```

然后执行：

```bash
npm run rss:schedule
```

### 本地开发自动职业发展更新

在 `.env.local` 配置好抓取间隔后，启动一个定时抓取进程（建议单独开一个终端）：

```bash
CAREER_FETCH_INTERVAL_MINUTES=10
```

然后执行：

```bash
npm run career:schedule
```

### RSSHub 与小红书/知乎

知乎来源可以直接用公开 RSSHub 实例或自建实例；小红书路由一般需要 Puppeteer，建议自建 RSSHub 并配置：

```bash
RSSHUB_BASE_URL=https://your-rsshub.example.com
XIAOHONGSHU_COOKIE=...
```

## 项目结构

```
pm-website/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── articles/          # 文章列表和详情页
│   ├── categories/        # 分类页面
│   ├── search/            # 搜索页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React组件
│   ├── articles/          # 文章相关组件
│   ├── layout/            # 布局组件
│   ├── search/            # 搜索组件
│   └── ui/                # UI组件
├── lib/                   # 工具库
│   ├── db/                # 数据库相关
│   ├── rss/               # RSS处理
│   ├── search/            # 搜索相关
│   └── utils/             # 通用工具
├── config/                # 配置文件
├── scripts/               # 脚本工具
├── types/                 # TypeScript类型
├── Dockerfile             # Docker构建文件
├── docker-compose.yml     # Docker编排配置
└── nginx.conf             # Nginx配置
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | SQLite数据库路径 | ./data/sqlite.db |
| MEILISEARCH_HOST | Meilisearch地址 | http://localhost:7700 |
| MEILISEARCH_API_KEY | Meilisearch密钥 | masterKey |
| API_KEY | API认证密钥 | your-secret-api-key |
| SITE_URL | 网站URL | http://localhost:3000 |
| DEEPSEEK_API_KEY | DeepSeek API Key（用于训练题自动评分） | - |
| DEEPSEEK_BASE_URL | DeepSeek API Base URL | https://api.deepseek.com |
| DEEPSEEK_MODEL | DeepSeek 模型名 | deepseek-chat |

## RSS源配置

编辑 `config/rss.ts` 添加或修改RSS源：

```typescript
export const rssSources: RSSSource[] = [
  {
    id: 'source-id',
    name: 'Source Name',
    url: 'https://example.com/feed',
    category: 'category-name',
    language: 'zh',
    weight: 10,
    enabled: true,
  },
];
```

## 许可证

MIT License
