param([int]$Count=4)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$legacyProcessId=[int](Get-Content (Join-Path $root 'legacy.pid'))
$process=Get-Process -Id $legacyProcessId
if($process.Path -ne (Join-Path $root 'JB-1(64).exe')) { throw 'The PID no longer belongs to the isolated JB-1 test copy.' }
if((Get-FileHash $process.Path -Algorithm SHA256).Hash -ne '99A2E4C39FFCBE4DE55EEF8B47D0BBCD465A15B0F849081780C0FD19596BD462') { throw 'Legacy executable digest mismatch.' }
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
 $globals=[ordered]@{width13=0x5beb28;width24=0x5beb30;height=0x5beb34;concrete=0x5beb38;steel=0x5beb3c;a1=0x5beb40;a2=0x5beb44;a3=0x5beb48;a4=0x5beb4c;b=0x5beb50;c=0x5beb54;d=0x5beb58;e=0x5beb5c;f=0x5beb60;na1=0x5beb64;na2=0x5beb68;na3=0x5beb6c;na4=0x5beb70;nb=0x5beb74;nc=0x5beb78;nd=0x5beb7c;ne=0x5beb80;nf=0x5beb84}
 $output=[ordered]@{sourceSha256='99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462';basicLine=[BitConverter]::ToDouble((Read-Bytes 0x5be280 8),0);arrays=[ordered]@{};rawHex=[ordered]@{}}
 foreach($key in $globals.Keys) {
  $descriptor=Read-Pointer $globals[$key]
  $data=Read-Pointer $descriptor
  $bytes=Read-Bytes $data (4*($Count+1))
  $output.arrays[$key]=@(0..$Count | ForEach-Object {[BitConverter]::ToSingle($bytes,4*$_)})
  $output.rawHex[$key]=[BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
 }
 $output | ConvertTo-Json -Depth 5
} finally { [JBRead]::CloseHandle($handle) | Out-Null }
