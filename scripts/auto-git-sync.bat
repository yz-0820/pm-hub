@echo off
cd /d "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"

:: 检查是否有改动
git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo [%date% %time%] No changes to commit.
    exit /b 0
)

:: 有改动则提交并推送
git commit -m "Auto sync: %date% %time%"
git push origin main
echo [%date% %time%] Synced to GitHub.
