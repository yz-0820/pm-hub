@echo off
chcp 65001 >nul
echo ========================================
echo PM Hub - 生产环境启动脚本
echo ========================================

REM 设置环境变量
set NODE_ENV=production
set DATABASE_URL=./data/sqlite.db
set MEILISEARCH_HOST=http://localhost:7700
set MEILISEARCH_API_KEY=masterKey
set API_KEY=pm-hub-secret-key-2024
set SITE_URL=http://localhost:3000
set PORT=3000

echo.
echo 检查数据库...
if not exist data\sqlite.db (
    echo 数据库不存在，运行迁移...
    npm run db:migrate
)

echo.
echo 启动生产服务器...
npm start
