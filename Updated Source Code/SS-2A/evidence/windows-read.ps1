param([int]$Count=1)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$legacyProcessId=[int](Get-Content (Join-Path $root 'legacy.pid'))
$process=Get-Process -Id $legacyProcessId
if($process.Path -ne (Join-Path $root 'ss2-test.exe')) { throw 'The PID no longer belongs to the isolated JB-1 test copy.' }
if((Get-FileHash $process.Path -Algorithm SHA256).Hash -ne 'A11965CD84BDD325FE7A1279B0F8BC7F056F1C2CE0EA873F047C2847DF99DBBB') { throw 'Legacy executable digest mismatch.' }
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class JBRead {
 [DllImport("kernel32.dll",SetLastError=true)] public static extern IntPtr OpenProcess(uint access,bool inherit,int pid);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool ReadProcessMemory(IntPtr process,IntPtr address,byte[] bytes,int size,out IntPtr read);
 [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
}
'@
$handle=[JBRead]::OpenProcess(0x410,$false,$legacyProcessId)
if($handle -eq [IntPtr]::Zero) { throw 'Cannot read the isolated test process.' }
function Read-Bytes([long]$address,[int]$length) {
 $buffer=New-Object byte[] $length
 $read=[IntPtr]::Zero
 if(-not [JBRead]::ReadProcessMemory($handle,[IntPtr]$address,$buffer,$length,[ref]$read) -or $read.ToInt64() -ne $length) { throw "Cannot read legacy address $address." }
 return ,$buffer
}
function Read-Pointer([long]$address) { return [BitConverter]::ToUInt32((Read-Bytes $address 4),0) }
try {
 $globals=[ordered]@{concrete=0x5b9b44;steel=0x5b9b48}
 $output=[ordered]@{sourceSha256='a11965cd84bdd325fe7a1279b0f8bc7f056f1c2ce0ea873f047c2847df99dbbb';basicLine=[BitConverter]::ToDouble((Read-Bytes 0x5b9280 8),0);arrays=[ordered]@{};rawHex=[ordered]@{}}
 foreach($key in $globals.Keys) {
  $descriptor=Read-Pointer $globals[$key]
  $data=Read-Pointer $descriptor
  $bytes=Read-Bytes $data (4*($Count+1))
  $output.arrays[$key]=@(0..$Count | ForEach-Object {[BitConverter]::ToSingle($bytes,4*$_)})
  $output.rawHex[$key]=[BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
 }
 $output | ConvertTo-Json -Depth 5
} finally { [JBRead]::CloseHandle($handle) | Out-Null }
