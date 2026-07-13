@echo off
setlocal

set NODE_ENV=production
if not defined DATABASE_DRIVER set DATABASE_DRIVER=postgres-js
if not defined PORT set PORT=3000

if not defined DATABASE_URL (
  echo DATABASE_URL is required
  exit /b 1
)
if not defined API_KEY (
  echo API_KEY is required
  exit /b 1
)
if not defined SITE_URL (
  echo SITE_URL is required
  exit /b 1
)

echo Running PostgreSQL migrations...
call npm run db:migrate
if errorlevel 1 exit /b %errorlevel%

echo Starting PM Hub on port %PORT%...
npm start
