$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    Set-Location $projectDir

    git add -A
    $changes = git status --porcelain

    if ([string]::IsNullOrWhiteSpace($changes)) {
        Write-Output "[$timestamp] No changes detected. Skipping commit/push."
        exit 0
    }

    $commitMsg = "chore: hourly auto sync [$timestamp]"
    git commit -m $commitMsg
    git push origin main

    Write-Output "[$timestamp] Changes pushed successfully."
} catch {
    Write-Output "[$timestamp] ERROR: $_"
    exit 1
}
