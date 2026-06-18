$ProjectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$Timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$CommitMsg  = "chore: hourly auto sync [$Timestamp]"

Set-Location $ProjectDir

# 暂存所有变更
git add -A

# 检查是否有变更
$changes = git status --porcelain

if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Output "[$Timestamp] 无代码变更，跳过提交。"
    exit 0
}

# 提交并推送
git commit -m "$CommitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Output "[$Timestamp] git commit 失败"
    exit 1
}

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Output "[$Timestamp] git push 失败"
    exit 1
}

Write-Output "[$Timestamp] 代码已推送成功。"
