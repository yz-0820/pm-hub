#!/bin/bash

echo "========================================"
echo "PM Hub - 生产环境启动脚本"
echo "========================================"

# 设置环境变量
export NODE_ENV=production
export DATABASE_URL=./data/sqlite.db
export MEILISEARCH_HOST=http://localhost:7700
export MEILISEARCH_API_KEY=masterKey
export API_KEY=pm-hub-secret-key-2024
export SITE_URL=http://localhost:3000
export PORT=3000

echo ""
echo "检查数据库..."
if [ ! -f "data/sqlite.db" ]; then
    echo "数据库不存在，运行迁移..."
    npm run db:migrate
fi

echo ""
echo "启动生产服务器..."
npm start
