# JB · JB-1 and JB-2 junction box quantities

Open [JB.html](../../JB.html) at the repository root in a current browser. That single file includes all styling, calculations, instructions, and interface code. You can move or copy it by itself. No hosting, installation, internet connection, account, or build step is required to use it. Saved project JSON files contain your work and are kept separately.

JB-1 reconstructs the supplied Mississippi MDOT v5.0 executable, revised October 10, 2011. JB-2 implements the supplied traffic-load standard drawing, MDOT sheet 6506, August 1, 2017. The original EXE and its DLLs are preserved in `Legacy/` at the repository root. Editable sources remain in this `Modernized/JB-1/` folder.

## Use

1. Replace the clearly labeled example inputs with project information and the current box number, station, and roadway side.
2. Choose **JB-1** or **JB-2** for this box. Projects can contain both types. New boxes initially use the selected box's type.
3. Choose each pipe from the 10 circular and 8 arch sizes in the supplied common pipe table. Span, rise and pipe wall thickness are supplied together. Enter skew in **degrees**. Each pipe and the outflow arrow follow the entered angle in the plan. Zero skew points straight out of its wall; positive skew turns clockwise in the plan, negative counterclockwise. Side 1 is always outflow. Uncheck other sides to omit their pipes.
4. Leave height blank for the calculated minimum, or enter a height in **decimal feet** at least that high.
5. Review the dimensions, net concrete, steel weight, and bar schedule. The plan diagram is schematic, with centered openings; it is not a construction drawing or an opening-conflict check.
6. **Add box** builds a project of up to 50 boxes. The junction-box selector switches between them. **Print report** prints every box and project totals; choose your browser's Save as PDF destination if desired.
7. **Save project** downloads `JB-project.json` containing the inputs and each box's type. **Open project** restores it and also accepts older `jb1-project-v1` files. Older custom pipe inputs are preserved as an imported selection for JB-1; new choices use the list. JB-2 requires a listed pipe. Keep the JSON file; the app does not use a database or automatically persist edits. A new export is needed after edits.

The display follows the computer's light/dark appearance. Printing uses a white report. All assets are local and no project input is sent over a network.

## JB-2 calculation basis and limits

- See [JB-2 basis and validation](evidence/JB-2.md) for the drawing formulas, complete pipe tables, bar-count convention, unit weights, and hand-worked checks.
- Circular pipes **48 inches and larger** and arch pipes **51 × 31 inches and larger** require **all four walls to be 8 inches**. Every opening then uses its 8-inch deduction, including smaller pipes. Other JB-2 boxes use 6-inch walls.
- The 8-inch cover and applicable 6/8-inch wall concrete formulas come from sheet 6506. Both box widths are limited to **9 ft 3 in.** by that drawing.
- B/C/D bars use **#6** for 6-inch walls and **#7** for 8-inch walls. A bars use #4 and E/F use #6. Steel includes the drawing's **3.3 lb** for two lift bars.
- The user confirmed that end bars are already counted for solid-wall spacing. Each solid wall therefore adds `max(0, ceil(run / 12 inches) - 1)` interior bars: run = H for B/C, and the applicable full wall width for D. A 48-inch run adds three interior bars. This documented counting convention is an interpretation used by the app; it is not a count formula printed on the drawing.
- The drawing calls for pipes with more than 15 degrees skew, or conflicting openings, to be broken back to the wall. The schematic shows the entered pipe direction and does not detail the breakback or detect conflicts.

## JB-1 calculation basis and limits

The engine reproduces the formulas and selected float32 stores recovered from this exact executable:

`99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462`

See [the recovery ledger](evidence/RECOVERY.md) for machine-code addresses, equations, defaults, fixed lookup tables, rounding, and distinctions between recovered behavior and modern input validation. [Validation](evidence/VALIDATION.md) records the actual checks and their limits.

- JB-1 reproduces the legacy calculation rules. Drawing applicability, structural adequacy, pipe conflicts, cover, and project suitability require separate review. The exact governing drawing edition for the original executable was not supplied.
- Imported JB-1 noncircular spans are limited to the recovered table: **22, 29, 36, 44, 51, 58, 65, 73, and 88 inches**. New pipe choices use the supplied common-size list. JB-1 opening deductions depend only on span, regardless of entered rise, thickness, or skew; the app states that limit when applicable. No other size is silently substituted.
- Pipe skew must be strictly between −90° and +90°. This numerical input gate is not an agency acceptance limit. Pipe-layout applicability remains a separate review.
- The original steel equation includes a fixed **4 lb** allowance. It is preserved, not reinterpreted as a current standard.
- Calculation precision is retained internally. The new bar list shows lengths to two decimals instead of the original whole-inch display. Steel uses unrounded lengths, as in the original; displayed rounding is not a fabrication tolerance.
- JavaScript double calculations between selected float32 stores do not emulate every x87 extended-precision operation. The recorded Windows comparison cases establish a bounded compatibility check, not proof for every possible input.
- Invalid or unsupported calculations hide current quantities and disable printing/export. Fix the affected box before producing project totals.

A public MDOT [standard drawing collection](https://mdot.ms.gov/documents/Roadway%20Design/Standards/Drawings/Roadway%20Design%20Standard%20Drawings.pdf) includes a later JB-1 drawing. It is a reference link, not the adopted calculation basis for this reconstruction.

Selecting listed pipes does not replace JB-1's recovered arithmetic with the rounded 2017 deduction table. For example, the legacy 44-inch arch-span deduction is **0.195 yd³**, while the supplied 44 × 27 table shows **0.185 yd³**. JB-1 retains 0.195; JB-2 uses 0.185 with 6-inch walls or 0.247 with 8-inch walls.

## Development checks

Use an existing Node.js installation:

```sh
node --test calculations.test.cjs jb2.test.cjs
```

No dependencies are required by the app or calculation tests. The `evidence` folder contains static recovery notes and synthetic Windows verification artifacts; the app does not load those files.

`browser.test.cjs` is an optional developer check using an existing Playwright installation and Chrome (`CHROME_PATH` can select its executable). It checks isolated direct-file use, pipe skew on all four sides, automatic wall and deduction changes, mixed standards, width limits, reports, save/reopen, legacy custom-pipe migration, invalid imports, and mobile layout. Screenshots are written to `output/playwright/` at the repository root.

The files in this development folder remain the editable sources. After changing them, run `node build-standalone.cjs` to regenerate `../../JB.html` at the repository root. The build checks that no companion-file references remain and creates exact content hashes for the embedded scripts and stylesheet. `index.html` is the source preview and still uses the separate source files.
