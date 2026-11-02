$ErrorActionPreference='Stop'
Stop-ScheduledTask -TaskName 'CodexSS2Probe' -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'CodexSS2Probe' -Confirm:$false -ErrorAction SilentlyContinue
Get-Process -Name 'ss2-test' -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq 'C:\Users\colew\SS2PilotTest\ss2-test.exe'} | Stop-Process
if(Test-Path 'C:\S\SS-2A.TXT'){Remove-Item 'C:\S\SS-2A.TXT'}
if((Test-Path 'C:\S') -and @(Get-ChildItem 'C:\S' -Force).Count -eq 0){Remove-Item 'C:\S'}
[ordered]@{originalReportExists=(Test-Path 'C:\Q\SS-2A.TXT');syntheticReportFolderExists=(Test-Path 'C:\S');probeTaskExists=([bool](Get-ScheduledTask -TaskName 'CodexSS2Probe' -ErrorAction SilentlyContinue));probeProcessExists=([bool](Get-Process -Name 'ss2-test' -ErrorAction SilentlyContinue))} | ConvertTo-Json
