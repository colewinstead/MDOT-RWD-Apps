# Bridge end pavement

Open [BridgeEndPave.html](../../BridgeEndPave.html) directly in a current browser. It contains the complete offline app, diagrams and all twelve reference sheets. Copying that one HTML file is sufficient; no installation, companion file, hosting or network connection is required.

## Use

Choose the drawing family before choosing its rail and pavement section. Enter W1/W2 in decimal feet and nonnegative skew Z in degrees. W1 and W2 run from the crown line to the bridge curb lines; WB is their sum. The 20-ft reference depth is at mid-width and side A has a 10-ft minimum.

Choose asphalt or concrete roadway pavement. Concrete includes the drawing's separate doweled roadway joint; asphalt omits that conditional joint. Check **Include transverse grooving pay item** when it applies to the project. The selected drawing determines which concrete surface is exposed and counted. The app keeps bridge expansion joints, roadway expansion joints and bridge-plan joint/seal spans separate.

Add one record for each bridge end. Editing a record changes its existing quantities instead of adding another calculation to the total. Reports show the drawing and rail detail for every record. Rail summaries retain both height and detail identity, so BER-2 and SDBER-2 are not treated as the same design merely because both are 43.5 inches high.

The plan, section and rail diagram update with the inputs. Green identifies included exposed-concrete grooving; gray identifies rail footprints. Open **Embedded drawing sheets** to read any full source sheet offline and use its zoom control for small dimensions.

**Save project** downloads all inputs as JSON. Keep it separately and use **Open project** to resume later. Save again after editing; closing the app does not save your changes. Invalid imports are rejected before replacing work. **Export text** downloads a quantity report; **Print / PDF** prints the schedule and individual plans. Reports do not reopen as projects.

## Supported drawing and rail combinations

| Family | Rail heights | Pavement section | Exposed-concrete grooving when included | Joint rules |
| --- | --- | --- | --- | --- |
| BE-1 standard | 33.5, 43.5 in | 12 in; overlay and sleeper slab | Zero: the shown surface is fully overlaid | No bridge-seat expansion joint; conditional doweled roadway joint |
| BE-2 standard | 33.5, 43.5 in | 9 or 12 in; overlay without sleeper | Zero: the shown surface is fully overlaid | Bridge premolded joint plus conditional doweled roadway joint |
| SDBE-1 special | 37.5, 43.5 in | 12 in; overlay and sleeper | Three-foot strip measured normal to the skewed bridge joint, bounded by clear pavement | Bridge-plan seal span reported separately; conditional doweled roadway joint |
| SDBE-1A special | 32, 42 in | 9 or 12 in; bare concrete | Exposed pavement less the two rail footprints | Bridge premolded joint plus conditional doweled roadway joint |
| Legacy MDOT Program | No rail, 32, 42 in | Section metadata does not change its old area calculation | Recovered executable result when included | Preserves its original single joint span; roadway type adds no second joint |

No-rail is a separately identified legacy option. The normal roadway block marked WB+12 in is not proof of a no-rail bridge-end alternative on a standard sheet. Unsupported rail/family combinations are rejected.

References included: BE-1, BE-2, BER-1, BER-2, SDBE-1, SDBE-1A, SDBEPR-1-9, SDBEPR-1-12, SDBEPR-1A-9, SDBEPR-1A-12, SDBER-1 and SDBER-2. Standard pages come from the supplied 2017 set, sheets 6007-6010. Special sheets are the inspected MDOT downloads identified by URL and hash in `evidence/reference-drawings/manifest.json`. Several special templates are marked preliminary/not for construction; project-selected details govern.

## Calculation basis and limits

Drawing modes use exact fractional dimensions, the drawn paving perimeter and ordinary trigonometry. Legacy mode retains the EXE's approximate pi and decimal constants. Its historical 30/25-ft, 10-degree, 32-inch-rail case still gives 126.48 SY paving, 58.73 LF joint and 123.33 SY grooving when included.

The new families derive paving from the gross trapezoid less the outer strips beyond the two 10-ft rails. Standard and older-special details retain the normal 6-in edge allowance; newer SDBE-1 does not. These are dimensional interpretations of the drawn perimeter, not equations printed verbatim as pay formulas. SDBE-1's nominal 15/16-in slab wings are distinct from the typical rail profiles' 14.5/15.5-in base projections.

SDBE-1's three-foot grooving strip is measured **normal to the joint**, so its longitudinal depth is 3/cos(Z). The engine intersects that strip with the actual clear-pavement boundary, including at extreme skews. Full asphalt-covered concrete is excluded from exposed-concrete grooving. Section 501.04 makes grooving measurement dependent on its contract pay item and specified plan limits; project-specific finishes or limits outside these drawing configurations require their own project interpretation.

Each end's quantities round to two decimals before accumulation. Doweled and non-doweled lengths remain separate; their displayed rounded components add to the expansion-joint total. Bridge-plan seal spans are not added to that total. Rail lengths remain two 10-ft runs rather than receiving a skew multiplier. Totals use integer hundredths to avoid accumulation drift.

Only **paving, grooving, joint lengths and rail lengths** are calculated, as requested. Pavement thickness selects its reference section; the app does not calculate concrete volume, reinforcing steel, drainage or structural adequacy. Diagrams are quantity schematics. Source interpretation and high-skew quantity geometry are not structural approval of a drawing at that skew. Half-cent live EXE rounding remains unverified.

## Saved projects

New files use `bridge-end-pave-project-v2` with 1-200 records. Each stores its drawing, rail height, pavement thickness, roadway type and grooving inclusion in addition to its dimensions, ID and station. The original v1 JSON format opens in Legacy mode, retaining its inputs and numeric results. Saving then downloads a v2 copy; it does not overwrite the old file. Malformed data, unsupported combinations and unsafe totals are rejected atomically.

## Rebuild and checks

From the repository root with an existing Node.js installation:

```sh
node "Updated Source Code/BridgeEndPave/build-standalone.cjs"
node --test "Updated Source Code/BridgeEndPave/calculations.test.cjs"
```

The builder embeds all three scripts and CSS, generates matching CSP hashes and asserts that twelve reference images are included without companion-file references. The checked-in `drawing-sheets.js` means rebuilding needs only Node.js.

To regenerate the reference images using the existing Python/PyMuPDF developer tools:

```sh
python "Updated Source Code/BridgeEndPave/build-drawing-assets.py" --standard-pdf "PATH/TO/Roadway Design Standard Drawings.pdf"
node "Updated Source Code/BridgeEndPave/build-standalone.cjs"
```

The asset generator verifies source PDF hashes before rendering the four standard and eight special sheets. No PDF or Python package is required at app runtime.

Optional browser verification uses an existing Playwright and Chrome installation:

```sh
node "Updated Source Code/BridgeEndPave/browser.test.cjs"
```

Set `NODE_PATH` to an existing Playwright package location and `CHROME_PATH` if Chrome is elsewhere. The test opens a temporary folder containing only the generated HTML. It checks every drawing/rail choice, hand fixtures, choices and migration, mixed schedules and exports, invalid imports, all twelve source images, accessibility titles, mobile/dark layouts and absence of network or browser errors.

See [CALCULATION-CHECKS.md](evidence/CALCULATION-CHECKS.md), [COVERAGE-STANDARD.md](evidence/COVERAGE-STANDARD.md), [COVERAGE-SPECIAL.md](evidence/COVERAGE-SPECIAL.md), [RECOVERY.md](evidence/RECOVERY.md) and [VALIDATION.md](evidence/VALIDATION.md). The original EXE and DLLs remain unchanged under `Legacy/`.
