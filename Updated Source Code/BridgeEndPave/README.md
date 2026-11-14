# Bridge end pavement

Open [BridgeEndPave.html](../../BridgeEndPave.html) directly in a current browser. That single file includes all code, styling, instructions, and SVG diagrams. It works offline and can be copied away from this repository. No installation or companion files are required.

Enter W1/W2 in decimal feet, nonnegative skew Z in degrees, and the original program's rail option. The app calculates square yards of bridge end pavement and transverse grooving, linear feet of expansion joint, and linear feet of the selected rail. W1/W2 are the widths from the crown line shown in the supplied plan; WB is their sum. The plan shows W, A/B, skew, and the bridge interface. The width breakdown and reference sections explain the calculation and arrangement.

Add a separate record for each bridge end. Editing a record updates its quantities rather than adding another copy to the totals. The schedule counts every record once. Invalid dimensions withhold results and reports until corrected.

**Save project** downloads a JSON file with all inputs and project metadata. Keep this file separately and use **Open project** to reopen it; save again after editing. Closing the page does not save edits. JSON files use schema `bridge-end-pave-project-v1`, with 1-200 bridge ends. Invalid imports are rejected before replacing current work. **Export text** downloads a readable quantity report. **Print / PDF** uses the browser print dialog; select Save as PDF for a report containing the schedule and per-end plan diagrams. Reports do not reopen as projects.

## Drawing and calculation limits

Calculations preserve the supplied `BridgeEndPave.exe`, whose recovered script identifies Version AI 1.2. The main diagram reference is **SDBE-1A**, retrieved from MDOT's *Special Design Sheets Active 2017 - PowerGeoPak Borders* index. It explicitly uses the same 32/42-inch rails, added widths, 20-ft mid-length, 10-ft side-A minimum, and a 1-inch bridge-end joint. The four SDBEPR sheets provide 32/42-inch rail details for 9/12-inch pavement. Downloaded references are retained under `evidence/reference-drawings/` with URLs and hashes; SDBE-1A and several other sheets are marked **Preliminary - Not for Construction**. These templates do not establish which detail is applicable to a particular project. Reference PDFs are developer evidence and are not required to run the standalone HTML.

The user also supplied *Roadway Design Standard Drawings.pdf*, pages 10-13: BE-1, BE-2, BER-1, and BER-2, sheets 6007-6010, issued August 1, 2017. These provide a comparison to a different drawing family.

- The EXE's **32/42-inch** rail labels agree with SDBE-1A and the corresponding SDBEPR rail sheets. The supplied BER-1/BER-2 drawings instead identify **33.5/43.5-inch** rails. The current downloaded SDBE-1 template uses **37.5/43.5-inch** rail branches with different overall-width additions. These families are not interchangeable; the app retains the recovered calculation rather than silently substituting another rail design.
- The EXE reports expansion joint as `W / cos(Z)`, consistent with the skewed 1-inch bridge-end joint shown on SDBE-1A. The supplied BE-1 Section B-B instead specifies **no expansion joint at the bridge seat**; BE-2 shows a 1-inch joint there. Joint applicability must follow the selected project detail.
- SDBE-1A has 9-inch-minimum pavement and a different arrangement from BE-1's 1-ft pavement and sleeper slab. The reference section follows SDBE-1A. No concrete volume, reinforcement, overlay, sleeper-slab, underdrain, or structural calculation is added.
- Schematic diagrams are not construction drawings. Proportions and added-width placement are illustrative; dimensions govern. Plan geometry uses the legacy symmetric `W/2` skew formula even when W1 and W2 differ; their crown line is shown separately.
- Modern safeguards reject negative widths, nonpositive combined width, negative skew, skew at or above 90 degrees, unsupported rail options, nonfinite results, and negative physical quantities. Inputs extremely close to 90 degrees can also fail because the original uses approximate pi. These checks improve on the original's unchecked inputs.
- Each end's quantities round to two decimals before totals, as in the EXE. The app sums integer hundredths. Half-cent rounding ties have not been checked against a new live EXE run; general tie-level equivalence is not claimed.

## Build and verification

From the repository root, with an existing Node.js installation:

```sh
node "Updated Source Code/BridgeEndPave/build-standalone.cjs"
node --test "Updated Source Code/BridgeEndPave/calculations.test.cjs"
```

The builder embeds both scripts and CSS, generates matching CSP hashes, and rejects companion-file references. Rebuilding requires no third-party package. Regenerate the root HTML after changing any app source.

The optional browser check uses an existing `playwright` installation and Chrome:

```sh
node "Updated Source Code/BridgeEndPave/browser.test.cjs"
```

Set `NODE_PATH` to an existing Playwright package location if it is not available locally, and `CHROME_PATH` if Chrome is elsewhere. The check copies only the root HTML into a new temporary directory and opens it using `file://`. It checks quantities, validation, edit/totals behavior, save/reopen, rejected and cancelled imports, exports, escaping, mobile layout, dark mode, PDF printing, and absence of network requests. Runtime app use does not require Playwright, Node, or Python.

See [RECOVERY.md](evidence/RECOVERY.md), [DRAWINGS.md](evidence/DRAWINGS.md), [SPECIAL-DRAWINGS.md](evidence/SPECIAL-DRAWINGS.md), [EXTRACTION.md](evidence/EXTRACTION.md), and [VALIDATION.md](evidence/VALIDATION.md) for evidence and limits. The original EXE remains unchanged under `Legacy/`.
