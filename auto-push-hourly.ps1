# pm-website 每小时自动推送到 GitHub
# 只在有实际代码变更时才执行 commit 和 push，避免空提交

$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$logFile = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website-push.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "$ts - $msg"
    $line | Out-File -Append -Encoding UTF8 $logFile
    Write-Host $line
}

try {
    Write-Log "=== 开始每小时自动推送 ==="

    if (-not (Test-Path "$projectDir\.git")) {
        Write-Log "错误: 不是有效的 Git 仓库: $projectDir"
        exit 1
    }

    Set-Location $projectDir

    # 步骤 2: 暂存所有变更
    git add -A 2>&1 | ForEach-Object { Write-Log "git add: $_" }

    # 步骤 3: 检查是否有变更
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Log "没有检测到变更，跳过推送。"
        exit 0
    }

    $changeCount = ($changes | Measure-Object).Count
    Write-Log "检测到 $changeCount 个文件有变更。"
    $changes | ForEach-Object { Write-Log "  $_" }

    # 获取当前分支
    $branch = git rev-parse --abbrev-ref HEAD 2>&1
    Write-Log "当前分支: $branch"

    # 步骤 4: 提交并推送
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "chore: hourly auto sync [$timestamp]"

    git commit -m "$commitMsg" 2>&1 | ForEach-Object { Write-Log "git commit: $_" }
    Write-Log "已提交: $commitMsg"

    $pushOutput = git push origin $branch 2>&1
    $pushExitCode = $LASTEXITCODE

    if ($pushExitCode -eq 0) {
        Write-Log "推送成功！"
    } else {
        Write-Log "推送失败: $pushOutput"
        exit 1
    }

    Write-Log "=== 每小时自动推送完成 ==="

} catch {
    Write-Log "错误: $($_.Exception.Message)"
    exit 1
}
