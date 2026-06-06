# pm-website hourly auto push to GitHub

$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$logFile = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website-push.log"

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts - $msg" | Out-File -Append -Encoding UTF8 $logFile
}

try {
    Write-Log "=== Start hourly auto push ==="

    if (-not (Test-Path "$projectDir\.git")) {
        Write-Log "ERROR: Not a valid git repo: $projectDir"
        exit 1
    }

    Set-Location $projectDir

    git add -A 2>&1 | ForEach-Object { Write-Log $_ }

    $changes = git status --porcelain
    if (-not $changes) {
        Write-Log "No changes detected, skipping push."
        exit 0
    }

    $changeCount = ($changes | Measure-Object).Count
    Write-Log "Detected $changeCount changed file(s)."

    $branch = git rev-parse --abbrev-ref HEAD 2>&1
    Write-Log "Current branch: $branch"

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "chore: hourly auto sync [$timestamp]"

    git commit -m $commitMsg 2>&1 | ForEach-Object { Write-Log $_ }
    Write-Log "Committed: $commitMsg"

    git push origin $branch 2>&1 | ForEach-Object { Write-Log $_ }
    Write-Log "Push completed successfully."

} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
