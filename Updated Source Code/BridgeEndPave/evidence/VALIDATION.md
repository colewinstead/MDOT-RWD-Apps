# Expanded-app validation

Verified November 14, 2026 on Windows 11 using local headless Chrome, existing
Node.js/Playwright, and the existing Python/PyMuPDF developer tools. No app
runtime dependency was installed. The delivered HTML works directly from
`file://` without the repository or its reference PDFs.

## Calculation checks: passed

```sh
node --test "Updated Source Code/BridgeEndPave/calculations.test.cjs"
```

All **16 tests pass**. They retain the eight original legacy regression tests
and cover **216 valid combinations** of drawing, rail, slab section, roadway
surface, grooving inclusion and ordinary skew. Additional checks include:

- Independent zero-skew hand quantities for all rail and joint branches.
- Independent shoelace area of the notched pavement outline.
- Independent half-plane polygon clipping for SDBE-1's three-foot normal strip,
  including partial and full intersections at extreme skew.
- Actual 14.5/15.5-in SDBER profile projections kept separate from the nominal
  15/16-in slab allocations used in the area calculation.
- Separate bridge premolded, roadway doweled and bridge-plan seal quantities.
- Rejection of incompatible drawing/rail/thickness combinations and invalid
  numeric/contract-choice types.
- Integer-hundredth totals with all five rail heights and no seal double count.

The historical EXE fixture remains 126.48 SY paving, 58.73 LF joint,
123.33 SY grooving and 20 LF rail for 30/25-ft widths, 10 degrees and rail 32.
New drawing modes use rational dimensions and normal trigonometry rather than
silently sharing the original program's rail constants or approximate pi.
See `CALCULATION-CHECKS.md` for exact hand cases and geometric evidence.

## Standalone packaging: passed

```sh
python "Updated Source Code/BridgeEndPave/build-drawing-assets.py" --standard-pdf "PATH/TO/Roadway Design Standard Drawings.pdf"
node "Updated Source Code/BridgeEndPave/build-standalone.cjs"
```

Regenerating the twelve complete reference sheets from hash-verified PDFs
produces identical `drawing-sheets.js` bytes. Two consecutive standalone
builds also produce identical HTML. The builder verifies three embedded
scripts, one stylesheet, twelve inline PNG images, matching CSP hashes and
no required companion-file references. Final app size is about 6.2 MB,
including the full offline reference sheets.

## Browser checks: passed

```sh
node "Updated Source Code/BridgeEndPave/browser.test.cjs"
```

The test copies **only BridgeEndPave.html** into a task-created temporary
directory. It verifies:

- All 11 legal drawing/rail combinations through the actual UI against hand
  fixtures, including all five rail heights and the legacy no-rail option.
- Roadway surface changes the conditional joint; grooving inclusion and
  thickness/reference choices update correctly without losing dimensions.
- v1 files migrate to Legacy records with identical inputs and quantities;
  actual downloads reopen as v2 with all new fields intact.
- Mixed-family schedules, separate joint totals, rail totals by height and
  distinct source detail, text exports and print reports.
- Editing does not duplicate entries. Blank inputs suppress invalid totals
  and disable file/report actions; add/remove/select behavior works.
- Invalid dates, schema, numeric types, rail/family/thickness pairings,
  contract-choice types, unsafe totals and more than 200 records are rejected
  before replacing edits. Cancelled replacement preserves the current work.
- All twelve embedded source images decode without fetching companion assets.
- Imported markup is escaped rather than executed.
- Accessible SVG titles, light/dark appearance and 390-pixel layout without
  whole-page horizontal overflow. Large diagrams/sheets scroll locally.
- Both LF and Windows CRLF standalone files load with the CSP intact.
- No HTTP(S) requests, JavaScript errors or browser console errors in app use.

The synthetic 11-end print report has 12 nonempty Letter pages: a schedule,
rail-detail summary and individual plans. Full screenshots of every modern
family and desktop/mobile/dark layouts were visually reviewed. The final PDF
was rendered and checked for readable columns, separate rail identities,
heading placement and unclipped diagrams. Screenshots follow the repository's
PNG ignore rule; `report-sample.pdf` is developer evidence, not an app dependency.

## Preservation and limits

The original `Legacy/BridgeEndPave.exe` still has SHA-256
`114820772dbd045a88a32b6c23287057396fac691fe523bfd57fc1d41274f323`.
Original EXEs, DLLs and the user's source PDFs were not modified.

Mac Safari and other browser/OS combinations were not run here. Browser
downloads and print destinations follow browser/OS settings. New quantity
formulas are documented dimensional interpretations of the inspected drawing
geometry; project-approved sheets, contract grooving limits and joint details
govern applicability. Several special sheets are preliminary templates.

Further live EXE comparisons stopped when the user ended desktop control in
the original investigation. Half-cent legacy rounding ties remain unverified.
Structural design, concrete volumes, steel and drainage quantities are outside
the user's clarified scope.
