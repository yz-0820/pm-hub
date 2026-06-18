@echo off
chcp 65001 >nul
echo ==========================================
echo  PM-Website 每小时自动推送 - 计划任务设置
echo ==========================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 请以管理员身份运行此脚本！
    echo 右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

set "taskName=PM-Website-Hourly-Git-Push"
set "xmlPath=C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website\task-template.xml"

echo [1/3] 删除已存在的任务...
schtasks /Delete /TN "%taskName%" /F 2>nul

echo [2/3] 创建新任务...
schtasks /Create /TN "%taskName%" /XML "%xmlPath%" /F
if %errorLevel% neq 0 (
    echo 任务创建失败！
    pause
    exit /b 1
)

echo [3/3] 验证任务...
echo.
schtasks /Query /TN "%taskName%" /FO LIST | findstr /I "TaskName Next Run Time Schedule Type Status"

echo.
echo ==========================================
echo  计划任务设置完成！
echo ==========================================
echo.
echo 任务名称: %taskName%
echo 执行频率: 每小时
echo 脚本路径: auto-push-hourly.ps1
echo 日志文件: pm-website-push.log
echo.
echo 提示: 可以在"任务计划程序"中查看和管理此任务
echo.
pause
