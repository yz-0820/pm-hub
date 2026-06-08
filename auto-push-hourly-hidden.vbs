' PM-Website 每小时自动推送 GitHub - 隐藏窗口运行
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\MECHREVO\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a0fc2f3f7ec912ef0662871\pm-website\auto-push-hourly.ps1""", 0, False
Set WshShell = Nothing
