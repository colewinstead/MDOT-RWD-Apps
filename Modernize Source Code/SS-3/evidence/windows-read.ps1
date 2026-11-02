$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$legacyProcessId=[int](Get-Content (Join-Path $root 'legacy.pid'))
$process=Get-Process -Id $legacyProcessId
if($process.Path -ne (Join-Path $root 'ss-3-test.exe')){throw 'PID mismatch'}
if((Get-FileHash $process.Path -Algorithm SHA256).Hash -ne '39F04AC3751E923527DF69F9F5A4051583A5AD8A080E1A5037035616FC591355'){throw 'Digest mismatch'}
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class SSRead {
 [DllImport("kernel32.dll",SetLastError=true)] public static extern IntPtr OpenProcess(uint access,bool inherit,int pid);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool ReadProcessMemory(IntPtr process,IntPtr address,byte[] bytes,int size,out IntPtr read);
 [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
}
'@
$handle=[SSRead]::OpenProcess(0x410,$false,$legacyProcessId)
function Read-Bytes([long]$address,[int]$length){
 $bytes=New-Object byte[] $length; $read=[IntPtr]::Zero
 if(-not [SSRead]::ReadProcessMemory($handle,[IntPtr]$address,$bytes,$length,[ref]$read) -or $read.ToInt64() -ne $length){throw "Read failed $address"}
 return ,$bytes
}
try {
 $globals=[ordered]@{minimum=0x5b2b4c;concrete=0x5b2b50;steel=0x5b2b54;concreteExtra=0x5b2b5c;steelExtra=0x5b2b60;height=0x5b2b74;delta=0x5b2b78;grate=0x5b2b3c;frame=0x5b2b40}
 $out=[ordered]@{values=[ordered]@{};rawHex=[ordered]@{}}
 foreach($key in $globals.Keys){
  $pointer=[BitConverter]::ToUInt32((Read-Bytes $globals[$key] 4),0)
  $bytes=Read-Bytes $pointer 4
  $out.values[$key]=[BitConverter]::ToSingle($bytes,0)
  $out.rawHex[$key]=[BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
 }
 $out | ConvertTo-Json -Depth 4 -Compress
}finally{[SSRead]::CloseHandle($handle)|Out-Null}
