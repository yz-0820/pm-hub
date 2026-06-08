# 创建 Windows 计划任务 - 每小时自动推送 pm-website 到 GitHub
# 需要以管理员身份运行此脚本

$taskName = "PM-Website-Hourly-Git-Push"
$vbsPath = "C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website\auto-push-hourly-hidden.vbs"

# 先删除已存在的任务
schtasks /Delete /TN "$taskName" /F 2>$null

# 使用 XML 文件创建任务，避免空格问题
$xmlContent = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>PM-Website 每小时自动推送代码变更到 GitHub</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <Repetition>
        <Interval>PT1H</Interval>
        <Duration>P3650D</Duration>
      </Repetition>
      <StartBoundary>$(Get-Date -Format "yyyy-MM-dd")T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>wscript.exe</Command>
      <Arguments>"$vbsPath"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

$xmlPath = "$env:TEMP\pm-website-task.xml"
$xmlContent | Out-File -FilePath $xmlPath -Encoding Unicode

# 创建任务
$result = schtasks /Create /TN "$taskName" /XML "$xmlPath" /F 2>&1
Write-Host $result

Write-Host ""
Write-Host "任务信息:"
schtasks /Query /TN "$taskName" /FO LIST | findstr /I "TaskName Next Run Time Schedule Type Start Time Run As User Status"

# 清理临时文件
Remove-Item "$xmlPath" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "计划任务 '$taskName' 创建完成！"
Write-Host "每小时会自动执行推送。"
