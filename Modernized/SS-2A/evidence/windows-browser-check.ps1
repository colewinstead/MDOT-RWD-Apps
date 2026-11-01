$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$browser=Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
if(-not(Test-Path $browser)){throw 'Existing Microsoft Edge not found.'}
$html=Join-Path $root 'standalone\SS-2A.html'
if(-not(Test-Path $html)){throw 'Standalone HTML missing.'}
$arguments=@('--headless=new','--disable-gpu','--no-first-run',('--user-data-dir='+ (Join-Path $root 'edge-profile')),'--dump-dom',('file:///'+$html.Replace('\','/')))
$ErrorActionPreference='Continue'
& $browser @arguments 2> (Join-Path $root 'edge-stderr.txt') | Set-Content -Encoding UTF8 (Join-Path $root 'edge-dom.html')
$ErrorActionPreference='Stop'
$dom=Get-Content (Join-Path $root 'edge-dom.html') -Raw
$expected=@('<strong id="concrete">2.614</strong>','<strong id="steel">218.745</strong>')
$matches=@($expected | ForEach-Object { $dom.Contains($_) })
[ordered]@{htmlSha256=(Get-FileHash $html -Algorithm SHA256).Hash;browser=$browser;version=(Get-Item $browser).VersionInfo.ProductVersion;url=('file:///'+$html.Replace('\','/'));standaloneFiles=@(Get-ChildItem (Split-Path -Parent $html) | Select-Object -ExpandProperty Name);concretePresent=$matches[0];steelPresent=$matches[1];domBytes=$dom.Length} | ConvertTo-Json
