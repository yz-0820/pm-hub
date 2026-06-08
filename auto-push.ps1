$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$logFile = Join-Path $projectDir "auto-push.log"

try {
    Set-Location $projectDir

    # Check for changes
    $changes = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($changes)) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path $logFile -Value "[$timestamp] No changes detected. Skipped."
        exit 0
    }

    # Stage all changes
    git add -A

    # Commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "chore: hourly auto sync [$timestamp]"
    git commit -m $commitMsg

    # Push to origin main
    git push origin main

    Add-Content -Path $logFile -Value "[$timestamp] Pushed successfully."
} catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$timestamp] ERROR: $_"
    exit 1
}
