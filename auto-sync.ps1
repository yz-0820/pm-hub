# 每小时自动同步脚本
$projectPath = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$timestamp] 开始检查代码变更..." -ForegroundColor Cyan

# 进入项目目录
Set-Location $projectPath

# 暂存所有变更
git add -A

# 检查是否有变更
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[$timestamp] 没有检测到代码变更，跳过同步。" -ForegroundColor Yellow
    exit 0
}

# 有变更，执行提交和推送
Write-Host "[$timestamp] 检测到变更，准备提交..." -ForegroundColor Green
Write-Host "变更内容:" -ForegroundColor Gray
Write-Host $status -ForegroundColor Gray

$commitMessage = "chore: hourly auto sync [$timestamp]"
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[$timestamp] Git commit 失败!" -ForegroundColor Red
    exit 1
}

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[$timestamp] Git push 失败!" -ForegroundColor Red
    exit 1
}

Write-Host "[$timestamp] 代码已成功推送到 GitHub!" -ForegroundColor Green
