#!/bin/sh

set -eu

export NODE_ENV=production
export DATABASE_DRIVER="${DATABASE_DRIVER:-postgres-js}"
export PORT="${PORT:-3000}"

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${API_KEY:?API_KEY is required}"
: "${SITE_URL:?SITE_URL is required}"

echo "Running PostgreSQL migrations..."
npm run db:migrate

echo "Starting PM Hub on port ${PORT}..."
exec npm start
