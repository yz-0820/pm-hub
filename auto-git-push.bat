@echo off
cd /d "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"

git add -A
for /f %%i in ('git status --porcelain') do (
    git commit -m "chore: hourly auto sync [%date% %time:~0,8%]"
    git push origin main
    exit /b 0
)
