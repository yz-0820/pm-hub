# pm-website hourly auto push to GitHub
# Only commit and push when there are actual code changes

$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$logFile = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website-push.log"

function Write-Log {
    param([string]$msg)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "$ts - $msg"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
    Write-Host $line
}

Write-Log "=== Start hourly auto push ==="

if (-not (Test-Path "$projectDir\.git")) {
    Write-Log "ERROR: Not a valid git repo: $projectDir"
    exit 1
}

Set-Location $projectDir

# Step 2: Stage all changes
git add -A 2>&1 | ForEach-Object { Write-Log "git add: $_" }

# Step 3: Check for changes
$changes = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Log "No changes detected, skipping push."
    exit 0
}

$changeCount = ($changes | Measure-Object).Count
Write-Log "Detected $changeCount changed file(s)."
$changes | ForEach-Object { Write-Log "  $_" }

# Get current branch
$branch = git rev-parse --abbrev-ref HEAD 2>&1
Write-Log "Current branch: $branch"

# Step 4: Commit and push
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMsg = "chore: hourly auto sync [$timestamp]"

git commit -m "$commitMsg" 2>&1 | ForEach-Object { Write-Log "git commit: $_" }
Write-Log "Committed: $commitMsg"

$pushOutput = git push origin $branch 2>&1
$pushExitCode = $LASTEXITCODE

if ($pushExitCode -eq 0) {
    Write-Log "Push successful!"
} else {
    Write-Log "Push failed: $pushOutput"
    exit 1
}

Write-Log "=== Hourly auto push completed ==="
