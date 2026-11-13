# Recovery ledger

Investigation date: November 12, 2026 (America/Chicago).

## Target identity and route

Source: `Legacy/BridgeEndPave.exe`, 371,907 bytes. SHA-256:
`114820772dbd045a88a32b6c23287057396fac691fe523bfd57fc1d41274f323`.

REA opened the exact x86 PE using Ghidra 12.1.4. Its defined-string search for
`bridge|pav|length|width|thick|skew|concrete|quantity` returned no matches.
This is bounded evidence about the provider inventory, not proof that app text
is absent. Evidence ID:
`ev_f239131f0e2331af172c010c509a8760a101f5e0a3eb875d796d7807ec5cffd4`.
The native interpreter stub did not expose the application formulas. REA's
portable PE resource inspection rejected the packed layout because raw section
bytes overlap headers; it was not repeated. Session evidence and snapshot were
exported to `rea-evidence.json` and `analysis-snapshot.json`, then closed.

PE version metadata identifies AutoIt v3.3.0. The appended `AU3!EA06` marker is
at offset 367120. A developer-only AutoIt-Ripper 1.2.0 extraction recovered the
complete 8,307-byte tokenized script without executing it. The recovered script
SHA-256 is `7f7ec6b383a94fe6829391ce5e58f52891e120b755833aac18a21a748ee5fd96`.
See `extract-autoit.py`, `extraction-manifest.json`, and `EXTRACTION.md`.

## Behavior established from the script

| Question | Evidence | Status |
| --- | --- | --- |
| Inputs and rail options | `recovered-script.au3`, lines 89-100 | Answered: station, W1/W2, skew, rail 0/32/42 |
| Geometry, minimum, deductions | Lines 118-166 | Answered: exact constants and branches ported |
| Quantity units and rounding | Lines 153-176 | Answered: SY/LF; two decimals per end |
| Totals and repeated Calculate behavior | Lines 177-190 | Answered: appends each click and sums rounded outputs |
| Saved project structure | No project-input save path in recovered script | New JSON format is a modern design choice |
| Physical plan labels and sections | User-supplied PDF, pages 10-13; official MDOT SDBE-1A/SDBEPR templates | Answered in `DRAWINGS.md` and `SPECIAL-DRAWINGS.md`; SDBE-1A matches the legacy geometry/rail family |
| Exact half-cent runtime ties | No completed new controlled quantity run | Unresolved; no full rounding-equivalence claim |

`existing-report-case.json` transcribes the pre-existing user report at
`Legacy/output test/BridgeEndPave.txt`. It is historical-reference evidence,
not a newly controlled run. Inputs 30/25 ft, 10 degrees, and rail 32 yield
126.48 SY paving, 58.73 LF joint, 123.33 SY grooving, and 20 LF rail.

A byte-identical temporary EXE copy was launched to inspect its Windows UI.
The intro, report file dialog, and input/rail layout agreed with the script.
The user stopped desktop control with Escape before another Calculate run;
no additional live output parity is claimed. The original EXE and its DLLs
were not modified. The modern browser checks run independently without
controlling the user's desktop.

## Design choices

Live recalculation replaces the old append-on-Calculate workflow. Project totals
count each saved end once. Validation, JSON projects, escaped reports, responsive
layout, and accessible inline diagrams are new. Numeric formulas, approximate
pi, and rail identifiers retain the recovered build's behavior. No speculative
structural or reinforcement calculation was added.
