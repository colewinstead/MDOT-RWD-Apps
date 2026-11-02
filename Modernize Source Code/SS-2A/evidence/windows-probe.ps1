# Controlled legacy-app observation. Runs in the signed-in user's interactive session.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class SSWindow {
 public delegate bool EnumWindowsProc(IntPtr h,IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb,IntPtr p);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 public static IntPtr Find(int pid) { IntPtr found=IntPtr.Zero; EnumWindows((h,p)=>{uint owner;GetWindowThreadProcessId(h,out owner);if(owner==pid && IsWindowVisible(h)){found=h;return false;}return true;},IntPtr.Zero);return found; }

 [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
 [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
 [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint message, IntPtr w, IntPtr l);
 [DllImport("user32.dll")] public static extern short VkKeyScan(char ch);
 [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint code, uint map);
 public struct Rect { public int Left,Top,Right,Bottom; }
}
'@
$app = Start-Process -FilePath (Join-Path $root 'ss2-test.exe') -WorkingDirectory $root -PassThru
try {
 for ($n=0; $n -lt 40; $n++) {
  Start-Sleep -Milliseconds 250
  $app.Refresh()
  if ($app.MainWindowHandle -ne 0) { break }
 }
 if ($app.MainWindowHandle -eq 0) { throw 'SS-2A did not create a window.' }
 $windowHandle = [SSWindow]::Find($app.Id)
 $app.Id | Set-Content (Join-Path $root 'legacy.pid')
 while (-not $app.HasExited) {
  $commandPath = Join-Path $root 'command.json'
  if (Test-Path $commandPath) {
   $command = Get-Content $commandPath -Raw | ConvertFrom-Json
   Remove-Item $commandPath
   $windowHandle = [SSWindow]::Find($app.Id)
   [SSWindow]::SetForegroundWindow($windowHandle) | Out-Null
   Start-Sleep -Milliseconds 250
   if ($command.keys) {
    foreach ($key in $command.keys) {
     $windowHandle = [SSWindow]::Find($app.Id)
     foreach ($token in [regex]::Matches($key,'\{ENTER\}|\{PAGEUP\}|\{PAGEDOWN\}|\{DOWN\}|\{RIGHT\}|\{LEFT\}|\{UP\}|.')) {
      $vk = switch ($token.Value) { '{ENTER}' {13} '{PAGEUP}' {33} '{PAGEDOWN}' {34} '{DOWN}' {40} '{UP}' {38} '{RIGHT}' {39} '{LEFT}' {37} default {[SSWindow]::VkKeyScan($token.Value[0]) -band 255} }
      $scan = [SSWindow]::MapVirtualKey($vk,0)
      [SSWindow]::PostMessage($windowHandle,256,[IntPtr]$vk,[IntPtr](1 -bor ($scan -shl 16) -bor $(if ($vk -in 33,34,37,38,39,40) {0x1000000} else {0}))) | Out-Null
      Start-Sleep -Milliseconds 35
      [SSWindow]::PostMessage($windowHandle,257,[IntPtr]$vk,[IntPtr](0xC0000001L -bor ($scan -shl 16) -bor $(if ($vk -in 33,34,37,38,39,40) {0x1000000} else {0}))) | Out-Null
     }
     Start-Sleep -Milliseconds 800
    }
   }
   Start-Sleep -Milliseconds 500
   $windowHandle = [SSWindow]::Find($app.Id)
   $rect = New-Object SSWindow+Rect
   if (-not [SSWindow]::GetWindowRect($windowHandle,[ref]$rect)) { throw 'Cannot locate SS-3 window.' }
   $bitmap = New-Object Drawing.Bitmap ($rect.Right-$rect.Left),($rect.Bottom-$rect.Top)
   $graphics = [Drawing.Graphics]::FromImage($bitmap)
   $dc = $graphics.GetHdc()
   [SSWindow]::PrintWindow($windowHandle,$dc,2) | Out-Null
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
