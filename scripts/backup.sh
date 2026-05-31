#!/bin/bash

set -e

PROJECT_DIR="/opt/pm-website"
BACKUP_DIR="/opt/backups/pm-website"
DATE=$(date +%Y%m%d-%H%M%S)

echo "========================================"
echo "Starting backup..."
echo "========================================"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份SQLite数据库
if [ -f "$PROJECT_DIR/data/sqlite.db" ]; then
    echo "Backing up SQLite database..."
    cp $PROJECT_DIR/data/sqlite.db $BACKUP_DIR/sqlite-$DATE.db
fi

# 备份Meilisearch数据
if [ -d "$PROJECT_DIR/data/meilisearch" ]; then
    echo "Backing up Meilisearch data..."
    tar -czf $BACKUP_DIR/meilisearch-$DATE.tar.gz -C $PROJECT_DIR/data meilisearch
fi

# 清理旧备份（保留最近30天）
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "sqlite-*.db" -mtime +30 -delete
find $BACKUP_DIR -name "meilisearch-*.tar.gz" -mtime +30 -delete

echo "========================================"
echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo "========================================"
