$projectDir = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website"
Set-Location $projectDir

git add -A
$changes = git status --porcelain
if (-not $changes) { exit 0 }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "chore: hourly auto sync [$timestamp]"
git push origin main
