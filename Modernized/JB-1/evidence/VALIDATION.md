# JB-1 validation record

Validation date: October31,2026 (America/Chicago). This record distinguishes recovered legacy behavior, live Windows characterization, browser checks, and outstanding engineering review.

## Target identity

Original `JB-1(64).exe` SHA256:

`99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462`

PE32/x86; displayed version5.0 (64BIT), revised October10,2011. User identifies Mississippi MDOT. No exact governing drawing edition supplied.

REA/Hopper identified904procedures and270defined strings. Retained REA Evidence is in `rea-evidence.json` and `analysis-snapshot.json`. Key IDs: overview `ev_d4f8929eceb73a0d163f6cb01f65b68e1ccd4fdeeb1d427a3270f5b6c9e4779e`; title search `ev_901aa06a605ad740cabee5a37f966f2e44eee6426516b4d42bbd642ae057aa84`; height-string references `ev_5c246fb338aabec26fcb10d0e41a861e1a62d78b2280c7abea0716a1e9d22aa3`; containing procedure `ev_516171f5379de51bc8374e61356126f03f02c67c0e39d9afa4d21401016ab966`. The monolithic pseudocode request hit the client's450-second deadline and was not repeated. Calculations were instead traced in raw native assembly with the installed Xcode llvm-objdump. See RECOVERY.md; no original source-code recovery is claimed. Evidence exported and the native session closed.

## Original Windows execution

An isolated copy of the EXE and its supplied DLLs ran on the user's Windows test PC using the configured SSH alias. No additional software was installed. A temporary interactive scheduled task ran `windows-probe.ps1`, which entered synthetic values into the actual app. Initial screen captures were black; Win32 PrintWindow produced readable screenshots. The successful method is retained in the probe.

`read-legacy-results.ps1` verifies the isolated process path and executable digest, opens that process for read-only memory access, then records the actual result arrays. It does not patch program inputs, formulas, or results. `legacy-results.json` includes both human-readable values and exact little-endian float32 bytes in `rawHex`; regression tests use those bytes rather than PowerShell's rounded JSON numeric spelling. Array index0 is unused; cases occupy indexes1–4. `legacy-cases.json` records the corresponding input dimensions.

| Case | Inputs, inches except skew/height | Net concrete (yd³) | Steel (lb) |
| --- | --- | --- | --- |
| 1 | Side1:24×24,0°,wall3; other sides absent; minimum height3.5ft | 0.9682912826538086 | 64.32294464111328 |
| 2 | Side1:36×36,10°,wall4; side3:48×48,15°,wall5; minimum height6.166666507720947ft | 1.9291146993637085 | 103.3881607055664 |
| 3 | Side1:29×18,0°,wall3; side2:22×14,0°,wall2.5; minimum height3ft | 1.3385719060897827 | 96.91664123535156 |
| 4 | Sides1/3:36×36,0°,wall4; entered height6ft | 1.5790975093841553 | 86.54430389404297 |

Each case compares two widths, height, concrete, steel, and all nine bar lengths/counts:23values per case,92total. **All92stored float32 values match exactly, maximum observed residual0.** No numerical tolerance was relaxed. This is bounded regression/characterization evidence, not proof for every size, skew, height, noncircular rise, or rounding boundary.

Screenshots: `legacy-case1-result.png`, `legacy-case2-result.png`, `legacy-case3-result.png`, `legacy-case4-manual.png`. Later screens include earlier boxes as the original program scrolls.

The temporary Windows task was removed and the isolated EXE stopped after capture. The isolated test folder remains for reproducibility. No original `C:\Q\JB-1.TXT` report was generated or overwritten. Original source files and Mac EXE bytes remain unchanged.

## Automated checks

`node --test calculations.test.cjs`: **9tests passed**. Coverage includes a hand-worked circular case, opposite-side maxima and skew sign symmetry, equal-rise height branching, entered height, all9noncircular lookup entries, invalid/omitted/nonfinite/unsupported input, no input mutation, bar-to-steel consistency, the92actual Windows values, and original float32 project-total accumulation order.

`node --check app.js` passed. Project totals are statically traced to BASIC1330/1331 and tested at an IEEE754 precision boundary. No actual original grand-total text report was generated.

## Browser checks

The app was tested in the in-app browser using a temporary loopback HTTP preview. Shipping assets use classic local scripts and a local stylesheet; no modules, fetch, package install, external font, server endpoint, account, or network service is needed. CSP disables network connections.

Observed checks:

- Initial example renders live quantities/bar schedule and keyed plan.
- An entered height2ft hides current quantities, withholds project totals and disables print/save; clearing height restores the calculated minimum.
- Adding a second box updates project totals and allows switching boxes.
- SaveProject downloaded a local JSON file; OpenProject restored its two-box input state.
- PrintReport built the current report DOM with box dimensions, pipe inputs, bar lengths/counts and project totals. Native print invocation exceeded the automation click deadline; the complete report DOM was then read. Native print-dialog layout, PDF pagination and physical printing are **not visually verified**.
- Complete1440px desktop and390px phone captures were inspected. No page overflow at390px. The finish review identified tiny SVG annotations on phones; a tighter SVG viewBox and responsive annotation type fixed that finding. Both scored review fixes were marked resolved; that verdict does not establish engineering equivalence or print validation.
- The browser's URL security policy blocked `file://` navigation. Direct-file execution was therefore **not run in this automation browser**, and no workaround was attempted. Static file compatibility rests on using only ordinary classic local scripts/styles and browser file download/upload APIs; verify direct opening in the intended production browser before relying on it operationally.
- The OS was using dark appearance during screenshots. Light-mode colors exist in CSS but were not separately rendered. A static detector mixed print/dark style rules into low-contrast warnings; observed dark DOM colors were227/233/236text on23/29/33background, notes177/190/197. Small hint text was increased before final capture.

## Remaining engineering scope

No independent structural/design-standard certification, current MDOT drawing adoption, bar-size/cover check, pipe-opening conflict check, approved noncircular rise combination check, construction drawing, or field/project acceptance test was performed. Full x87 extended arithmetic is not emulated; the four exact comparison cases do not establish universal numeric identity. Use the retained limits and governing project requirements when reviewing real designs.
