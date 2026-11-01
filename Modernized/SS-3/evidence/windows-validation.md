# Windows legacy characterization

Date: November 1, 2026 (America/Chicago).

The supplied SS-3 executable was copied to the user's Windows test PC via the configured `superelevation-windows` SSH alias, together with its supplied DLLs. No software was installed and no firewall/authentication settings were changed.

## Isolation

Before launch, `C:\Q` and `C:\Q\SS-3.TXT` were confirmed absent. The probe used a separate `C:\Users\colew\SS3PilotTest` working directory. A private copy of the executable was changed at exactly one ASCII filename byte: `C:\Q\SS-3.TXT` became `C:\S\SS-3.TXT`. `C:\S` was confirmed absent and created only for this synthetic run. No machine instructions or numeric constants were changed. Original and probe digests and the changed offset are recorded in `windows-copy-identity.json`; the original repository executable remains unchanged. The startup explanation still displays the old path because it is separate text, while actual report writes go to the isolated path.

An interactive scheduled task ran `windows-probe.ps1`. Keyboard input was sent through Win32 window messages to the actual SDL/QB64 app. `PrintWindow` captured screenshots. Station, project and county inputs are synthetic. `windows-read.ps1` verifies the running executable's exact probe digest and reads its float32 result globals using `ReadProcessMemory`; it never changes program memory.

`windows-characterize.py` drives every menu choice at its displayed minimum height and minimum plus 1.2345 feet. Inputs and exact little-endian float32 bytes are retained in `legacy-results.json`. JSON numeric text is PowerShell's rounded representation; use `rawHex` for exact comparison. The original text report was also read while the app ran; the first captured case showed 0.869 yd³, 76.000 lb reinforcing, 200.000 lb grate, and 244.000 lb frame. A full report copy was not retained before synthetic-run cleanup.

Some result-global snapshots read zero after a report page break, even though the preceding report line contains the correct nonzero quantities. These transient snapshots must be rerun outside the page-break branch before being used as fixtures; they are capture-state artifacts, not a zero-result claim.

This is bounded software compatibility evidence. It does not establish current MDOT drawing compliance, independent engineering validity, or every floating-point boundary. No original engineering source code or governing drawing edition was supplied.

## Completed capture and cleanup

All 46 clean-input cases have nonzero result captures. Every captured height, concrete quantity and steel quantity agrees exactly with the modern engine at float32 precision (no tolerance). SS-3 grate and frame values are 200 and 244 pounds in every captured case; SS-4 does not report those hardware quantities. Six page-break captures were rerun; their original snapshots remain in `pageBreakCaptures`. Three additional reruns replaced long-decimal typed heights with explicit four-decimal text. The original long-decimal parser observations are retained separately in `legacy-input-parsing.json`: the legacy decimal parser and JavaScript can store different float32 heights for long digit strings, even though their arithmetic agrees exactly when supplied the same stored height. The new app uses JavaScript decimal conversion followed by float32 storage.

The native process was stopped, its temporary scheduled task unregistered, and the synthetic `C:\S` report file/folder removed. The isolated Windows test folder and supplied DLL copies remain for reproducibility. `C:\Q\SS-3.TXT` remained absent; no existing user report was overwritten. The repository executable digest remained unchanged.

## Standalone Windows direct-file check

The generated `SS-3.html` (SHA-256 `f5d18dacd9a11829ac164668ca7a1015c7d57100e4a6c6aa72fa2a23849af4da`) was copied into a Windows folder containing only that HTML file. Existing Microsoft Edge 156.0.4314.58 opened its actual `file:///C:/Users/colew/SS3PilotTest/standalone/SS-3.html` URL in headless mode. The resulting DOM contained concrete **0.869 yd³** and reinforcing steel **76.000 lb**. The retained checker and compact result are `windows-browser-check.ps1` and `windows-browser-result.json`.

This verifies Windows direct-file script execution and the baseline DOM, with no companion app files or installation. It does not visually verify Windows browser layout, native file dialogs, printing, or physical output. Browser profiles and the isolated test copy remain under the synthetic Windows test folder.
