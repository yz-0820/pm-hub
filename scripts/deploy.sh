#!/bin/bash

set -e

PROJECT_DIR="/opt/pm-website"
BACKUP_DIR="/opt/backups/pm-website"

echo "========================================"
echo "Starting deployment..."
echo "========================================"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库（如果存在）
if [ -f "$PROJECT_DIR/data/sqlite.db" ]; then
    echo "Backing up database..."
    cp $PROJECT_DIR/data/sqlite.db $BACKUP_DIR/sqlite-$(date +%Y%m%d-%H%M%S).db
fi

# 拉取最新代码
echo "Pulling latest code..."
cd $PROJECT_DIR
git pull origin main

# 重建并启动容器
echo "Rebuilding containers..."
docker-compose down
docker-compose up -d --build

# 等待服务启动
echo "Waiting for services to start..."
sleep 10

# 运行数据库迁移
echo "Running database migrations..."
docker-compose exec -T app npm run db:migrate

# 清理旧备份（保留最近7天）
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "sqlite-*.db" -mtime +7 -delete

echo "========================================"
echo "Deployment completed successfully!"
echo "========================================"
