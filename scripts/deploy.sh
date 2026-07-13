#!/bin/sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/opt/pm-website}"

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${MEILISEARCH_API_KEY:?MEILISEARCH_API_KEY is required}"
: "${API_KEY:?API_KEY is required}"

echo "Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

echo "Rebuilding containers..."
docker compose down
docker compose up -d --build

echo "Deployment completed successfully."
