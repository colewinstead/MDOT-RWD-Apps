Stop-ScheduledTask -TaskName 'CodexSS2Probe' -ErrorAction SilentlyContinue
Get-Process -Name 'ss2-test' -ErrorAction SilentlyContinue | Stop-Process
Start-Sleep -Milliseconds 700
Remove-Item C:\Users\colew\SS2PilotTest\command.json -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File C:\Users\colew\SS2PilotTest\windows-probe.ps1'
$principal = New-ScheduledTaskPrincipal -UserId 'colew' -LogonType Interactive
Register-ScheduledTask -TaskName 'CodexSS2Probe' -Action $action -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName 'CodexSS2Probe'
