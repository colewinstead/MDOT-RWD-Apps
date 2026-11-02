# Windows characterization

November 1, 2026 (America/Chicago). The original supplied executable was copied with its supplied DLLs to `C:\Users\colew\SS2PilotTest` on the user's Windows test PC using the configured SSH alias. No software was installed and no firewall or authentication settings changed.

`C:\S` and the original `C:\Q\SS-2A.TXT` were confirmed absent before capture. A private test copy changed exactly one ASCII filename byte, redirecting actual report writes from `C:\Q\SS-2A.TXT` to `C:\S\SS-2A.TXT`. Original/probe SHA-256 and exact changed offset are in windows-copy-identity.json. No instruction or numerical constant was changed. The repository EXE remains untouched.

An interactive scheduled task runs windows-probe.ps1. It posts keys to the actual application and captures screenshots with Win32 PrintWindow. `windows-read.ps1` verifies process path and exact test-copy SHA-256 before read-only ReadProcessMemory access. Results are float32 arrays at global descriptor slots 0x5b9b44 (concrete) and 0x5b9b48 (reinforcement); data element zero is unused, and the fresh-process captures use resultIndex 1. rawHex retains exact little-endian bytes; JSON decimal spelling is rounded by PowerShell and is not the comparison source.

The side and pavement answers are single characters without Enter. The length field auto-advances after two digits: 10 and 15 must be sent without a trailing Enter; the one-digit 5 requires Enter. Input groups are separated by 800 ms to let the original redraw its next field. The pipe-count answer is also entered without Enter; Enter selects a highlighted pipe, once for each requested opening. Page Up ends the selector. The 'another inlet' prompt uses a text input requiring Enter. Earlier malformed-input attempts are retained as screenshots but are not accepted as regression fixtures. Final fixture dimensions, opening selections and counts must be checked against the result screenshot before comparison.

The actual saved original report is retained in legacy-report-case1.txt. Despite the introduction saying 'BAR LIST', this report contains metadata, station, side, concrete, reinforcement, dimensions, pipe deductions and grand totals, with no bar marks or bar schedule. No invented bar list is added to the modern app.

## Completed grid

All eight final screenshots (`legacy-final-case1.png` through `legacy-final-case8.png`) were inspected against their declared dimensions and pipe selections. All sixteen exact float32 concrete/reinforcement comparisons passed with zero residual; the separate first-case capture also agrees. The grid covers all three lengths with both pavement choices, varied widths/heights, circular 15/24/72-inch pipes, arch 22×13/36×23/73×45 pipes, repeated counts, zero openings, and mixed circular/arch openings. Earlier attempts are retained for diagnosis, but only the final captures populate `legacy-grid-results.json`. Fresh processes make every resultIndex equal to 1.

The six calculation tests pass, including all nineteen statically recovered opening constants, the eight real Windows cases, validation, and float32 totals. This is bounded compatibility evidence; it does not establish every possible input or current drawing compliance.

## Direct-file browser and cleanup

The final standalone HTML (SHA-256 `4debcc76aefccb528e6d6cfaa9add3c0dccafe3ae89a75a1b443712234e80b82`) was copied into a Windows folder containing only SS-2A.html. Existing Microsoft Edge 156.0.4314.58 opened its actual file URL. The rendered DOM contained 2.614 yd³ and 218.745 lb, matching the default case. `windows-browser-result.json` records the URL, sole-file inventory, version, digest and checks. This check does not exercise Windows interactive editing, download dialogs, printing or visual layout.

The probe was stopped, its scheduled task removed, and the synthetic C:\S report folder removed. C:\Q\SS-2A.TXT remained absent. `windows-cleanup-result.json` records these checks. The isolated test folder, executable copy, DLLs and Edge profile remain for reproducibility; no existing user report was overwritten.
