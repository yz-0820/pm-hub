# 自动推送脚本 - 每小时检查并推送代码变更
param(
    [string]$ProjectPath = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website",
    [string]$Branch = "main"
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 记录开始时间
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "[$timestamp] 开始检查代码变更..." -ForegroundColor Cyan

# 进入项目目录
try {
    Set-Location -Path $ProjectPath
    Write-Host "进入项目目录: $ProjectPath" -ForegroundColor Gray
} catch {
    Write-Error "无法进入项目目录: $_"
    exit 1
}

# 检查是否是git仓库
if (-not (Test-Path -Path ".git")) {
    Write-Error "当前目录不是Git仓库"
    exit 1
}

# 暂存所有变更
try {
    git add -A
    Write-Host "已暂存所有变更" -ForegroundColor Gray
} catch {
    Write-Error "git add 失败: $_"
    exit 1
}

# 检查是否有变更
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[$timestamp] 没有代码变更，跳过推送" -ForegroundColor Yellow
    exit 0
}

# 显示变更文件
Write-Host "检测到以下变更:" -ForegroundColor Green
$status | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

# 提交变更
$commitMessage = "chore: hourly auto sync [$timestamp]"
try {
    git commit -m "$commitMessage"
    Write-Host "已提交变更: $commitMessage" -ForegroundColor Green
} catch {
    Write-Error "git commit 失败: $_"
    exit 1
}

# 推送到远程
try {
    git push origin $Branch
    Write-Host "[$timestamp] 成功推送到 origin/$Branch" -ForegroundColor Green
} catch {
    Write-Error "git push 失败: $_"
    exit 1
}

Write-Host "[$timestamp] 自动推送完成" -ForegroundColor Cyan
