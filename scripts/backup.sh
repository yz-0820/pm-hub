#!/bin/sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/opt/pm-website}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/pm-website}"
DATE="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# PostgreSQL backups are managed by the database provider. This script only
# preserves the local Meilisearch index, which can also be rebuilt from Postgres.
if [ -d "$PROJECT_DIR/data/meilisearch" ]; then
  tar -czf "$BACKUP_DIR/meilisearch-$DATE.tar.gz" -C "$PROJECT_DIR/data" meilisearch
fi

find "$BACKUP_DIR" -name "meilisearch-*.tar.gz" -mtime +30 -delete
echo "Backup completed: $BACKUP_DIR"
