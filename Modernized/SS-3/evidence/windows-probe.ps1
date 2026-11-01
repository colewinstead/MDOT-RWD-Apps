# Controlled legacy-app observation. Runs in the signed-in user's interactive session.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class SSWindow {
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
 [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
 [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint message, IntPtr w, IntPtr l);
 [DllImport("user32.dll")] public static extern short VkKeyScan(char ch);
 [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint map);
 public struct Rect { public int Left,Top,Right,Bottom; }
}
'@
$app = Start-Process -FilePath (Join-Path $root 'ss-3-test.exe') -WorkingDirectory $root -PassThru
try {
 for ($n=0; $n -lt 40; $n++) {
  Start-Sleep -Milliseconds 250
  $app.Refresh()
  if ($app.MainWindowHandle -ne 0) { break }
 }
 if ($app.MainWindowHandle -eq 0) { throw 'SS-3 did not create a window.' }
 $app.Id | Set-Content (Join-Path $root 'legacy.pid')
 while (-not $app.HasExited) {
  $commandPath = Join-Path $root 'command.json'
  if (Test-Path $commandPath) {
   $command = Get-Content $commandPath -Raw | ConvertFrom-Json
   Remove-Item $commandPath
   [SSWindow]::SetForegroundWindow($app.MainWindowHandle) | Out-Null
   Start-Sleep -Milliseconds 250
   if ($command.keys) {
    foreach ($key in $command.keys) {
     foreach ($token in [regex]::Matches($key,'\{ENTER\}|.')) {
      $vk = if ($token.Value -eq '{ENTER}') { 13 } else { [SSWindow]::VkKeyScan($token.Value[0]) -band 255 }
      $scan = [SSWindow]::MapVirtualKey($vk,0)
      [SSWindow]::PostMessage($app.MainWindowHandle,256,[IntPtr]$vk,[IntPtr](1 -bor ($scan -shl 16))) | Out-Null
      Start-Sleep -Milliseconds 35
      [SSWindow]::PostMessage($app.MainWindowHandle,257,[IntPtr]$vk,[IntPtr](0xC0000001L -bor ($scan -shl 16))) | Out-Null
     }
     Start-Sleep -Milliseconds 180
    }
   }
   Start-Sleep -Milliseconds 500
   $rect = New-Object SSWindow+Rect
   if (-not [SSWindow]::GetWindowRect($app.MainWindowHandle,[ref]$rect)) { throw 'Cannot locate SS-3 window.' }
   $bitmap = New-Object Drawing.Bitmap ($rect.Right-$rect.Left),($rect.Bottom-$rect.Top)
   $graphics = [Drawing.Graphics]::FromImage($bitmap)
   $dc = $graphics.GetHdc()
   [SSWindow]::PrintWindow($app.MainWindowHandle,$dc,2) | Out-Null
   $graphics.ReleaseHdc($dc)
   $bitmap.Save((Join-Path $root ($command.name+'.png')),[Drawing.Imaging.ImageFormat]::Png)
   $graphics.Dispose()
   $bitmap.Dispose()
   $command.name | Set-Content (Join-Path $root 'completed.txt')
   if ($command.stop) { break }
  }
  Start-Sleep -Milliseconds 250
  $app.Refresh()
 }
} catch {
 $_ | Out-String | Set-Content (Join-Path $root 'probe-error.txt')
} finally {
 if (-not $app.HasExited) { Stop-Process -Id $app.Id }
}
