Add-Type @'
using System;
using System.Runtime.InteropServices;
public class SendSS2Key {
[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
}
'@
$p=Get-Process -Id ([int](Get-Content C:\Users\colew\SS2PilotTest\legacy.pid))
[SendSS2Key]::PostMessage($p.MainWindowHandle,256,[IntPtr]33,[IntPtr]0x1490001) | Out-Null
Start-Sleep -Milliseconds 100
[SendSS2Key]::PostMessage($p.MainWindowHandle,257,[IntPtr]33,[IntPtr]0xc1490001) | Out-Null
