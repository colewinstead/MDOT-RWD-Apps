# SS-3 modernization validation

Date: November 1, 2026 (America/Chicago).

## Calculation recovery

The exact binary identity and REA Evidence IDs are in RECOVERY.md. Static analysis recovered all 19 SS-3 triples and four SS-4 pairs, height additions, float32 stores, SS-3 grate/frame weights and SS-4 fixed reinforcement. The calculation test independently extracts each table immediate from the native disassembly. Original EXE/DLL bytes in the repository are unchanged.

The Windows characterization method, isolated report-path copy, original/probe hashes, and cleanup are documented in windows-validation.md. Exact runtime float32 bytes are retained in legacy-results.json; comparison uses these bytes, not PowerShell's rounded JSON decimal spelling. Tests compare concrete and reinforcement for every case, plus grate/frame for SS-3. SS-4's unused grate/frame memory is not interpreted as reported output.

**All five calculation tests pass.** The runtime grid covers every one of the 23 pipe choices at its listed minimum and at minimum plus 1.2345 ft (46 cases). All **168 quantity comparisons** match exact stored float32 values, maximum observed residual **0 yd³ / 0 lb**. All 46 stored input heights also match exactly. Long-decimal and pagination-capture exceptions are retained separately and explained below and in windows-validation.md; they were not hidden by loosening comparison tolerances.

Tests also cover all baseline choices, taller inlets, no state carried between inlets, malformed/nonfinite/below-minimum inputs, no input mutation, and totals based on unrounded per-inlet results. Project summation is a new report feature rather than a recovered original grand-total rule.

## Standalone and browser verification

The reproducible builder embeds styles and both scripts, creates exact SHA-256 CSP hashes, and rejects companion-file references. Network connections are disabled by CSP.

`browser.test.cjs` uses the already installed Playwright and Google Chrome, with **no dependency installation**. It copies only SS-3.html into an otherwise empty temporary folder and opens the actual **file://** URL on Mac. Verified:

- Default result 0.869 yd³ concrete and 76.000 lb reinforcement.
- Editing height below minimum hides quantities, clears totals, and disables save/print. Restoring minimum recovers valid quantities.
- Adding an inlet and switching to SS-4 resets height to its baseline; increased height preserves 31 lb steel. SS-4 hardware displays a dash, not a purported hardware quantity.
- Save downloads a two-inlet JSON file; reopening restores its inputs. Invalid boolean height in a project file is rejected without replacing the current project.
- Literal script text in project metadata remains inert text; no execution occurs.
- A 390-pixel viewport has no document overflow. Schedule tables scroll inside their own container. Separate top/result screenshots were visually inspected.
- No page errors, console errors, or HTTP/HTTPS requests occur.
- Chrome generates a Letter PDF directly from the report DOM, exercising beforeprint. The 12-inlet mixed SS-3/SS-4 synthetic report spans seven pages. All pages are rendered and inspected for spacing, clipping, separated inlet IDs/stations, quantities, hardware dashes, and page breaks. Calculation blocks stay together, the schedule is configured to repeat table headers when needed, and a details heading stays with its first inlet.

Screenshots and report-sample.pdf are synthetic developer evidence; they are not needed to run the app. Printing/PDF creation was checked in headless Chrome. A physical printer and other browser print engines were not exercised.

The identical standalone file was also opened directly on the user's Windows test PC in existing Microsoft Edge 156.0.4314.58. Its folder contained only SS-3.html; the rendered DOM contained concrete 0.869 and reinforcement 76.000. `windows-browser-result.json` records its file URL and SHA-256 `f5d18dacd9a11829ac164668ca7a1015c7d57100e4a6c6aa72fa2a23849af4da`, matching the delivered file. Windows interactive editing, downloads, and printing were not separately exercised.

The temporary legacy process was stopped, its scheduled task removed, and the synthetic C:\S report folder removed. C:\Q remained absent. The full original text report was not retained after cleanup; exact runtime memory fixtures and representative screenshots are the retained compatibility evidence.

## Limits

The new app blocks below-baseline heights; the original retained baseline quantities for those heights. That explicit input safeguard is not a change to the formulas for accepted inputs. Exact stored baseline decimals are retained. Displayed quantities use three decimals; unrounded results feed totals.

The implementation reproduces selected float32 stores with JavaScript Math.fround. It does not emulate every x87 extended-precision intermediate. Runtime comparisons establish the documented bounded cases, not bitwise identity for every possible height or rounding boundary.

An input-parser difference was observed with long decimal strings such as `7.6514999999999995`: the original stored a height one float32 ULP below JavaScript's conversion. The quantity arithmetic matched exactly when given that actual stored height. Those original observations are retained separately from the comparison grid; replacement comparisons use explicit four-decimal height strings and also require exact height-byte equality. The modern app uses JavaScript numeric parsing followed by float32 storage. Arbitrarily long decimal input strings are therefore not claimed to parse identically to legacy BASIC.

This work does not establish current MDOT drawing compliance, structural capacity, pipe-opening conflicts, project suitability, or field acceptance. No engineering criteria or additional opening deductions were invented. The interface and reports were built without the Impeccable skill.
