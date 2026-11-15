# Structure excavation

Open **`StrExc.html` at the repository root** in a current browser on Windows or Mac. That file contains the entire app and works offline without installation or companion files.

Enter a project name, county and date, then add one row per pipe. Each row has an ID, station, listed pipe size, length in feet, average excavation depth in feet, and 0–2 flared end sections (FES). Depth is excavation depth, not pipe cover. Results update as rows change. All rows must be valid before Excel export. The app supports up to 500 pipes.

**Export Excel** downloads a genuine `.xlsx` schedule containing the pipe inputs, diameter/span, FES allowance, trench CY, FES CY and total excavation CY. The three quantity columns and bottom totals contain formulas and cached results. Numeric length, depth and FES inputs can be changed in Excel. Size, span and allowance are exported values: change pipe size in the app and export again. The workbook freezes the headings and first two columns, filters the pipe rows and repeats headings for printing.

**Save project** downloads a separate `.strexc.json` file. Keep it and use **Open project** to reopen your inputs. Blank length/depth fields can be saved as unfinished rows. Invalid values must be corrected. Save again after editing; closing the app does not save inputs. Excel files are reports and cannot be reopened as app projects. Confirmed removal and unsaved-change prompts help prevent accidental loss.

## Calculation basis

Recovered from `Legacy/strexc.exe`, whose embedded script identifies **Mississippi DOT (Roadway Design), Version 1.1**:

```text
Trench width (ft) = (diameter or arch span in inches + 24) / 12
Trench CY        = trench width * pipe length * average excavation depth / 27
FES CY           = FES count * size allowance * average excavation depth
Excavation CY    = trench CY + FES CY
```

The recovered 20-size allowance table is in `calculations.js` and is checked directly against `evidence/recovered-script.au3`. For arch sizes such as 22x13, use 22 inches as the span. AutoIt's documented implicit numeric conversion takes the leading number of such a string; see [datatypes](https://www.autoitscript.com/autoit3/docs/intro/lang_datatypes.htm) and [Number](https://www.autoitscript.com/autoit3/docs/functions/Number.htm).

Rows display 3 decimal places and project totals display 2, matching the original report precision. Totals add unrounded quantities. Rounding at exact ties has not been compared with the old runtime. Editing a row replaces its quantity. Unlike the legacy click accumulator, invalid entries and repeated edits do not add hidden quantities to the total.

The original EXE launch was refused by Windows (`ShellExecuteW returned 5`). Static extraction and independent spreadsheet recalculation were verified; executable runtime parity was not. These are the recovered legacy rules, not a claim of compliance with current MDOT specifications. The script adds no sloped-wall, shoring or separate bedding allowance. Verify that this method and the allowance table apply to your project.

## Build and check

No new runtime dependencies. With an existing Node.js installation:

```powershell
node 'Updated Source Code/StrExc/build-standalone.cjs'
node --test 'Updated Source Code/StrExc/calculations.test.cjs'
```

The builder embeds the three scripts and stylesheet, sets content security hashes and rejects companion-file references. It normalizes line endings for reproducible packaging.

Optional development checks use existing Playwright Core, Chrome, Python/openpyxl and Artifact Tool installations. They are not needed by users:

```powershell
# If playwright-core is not on the module path, set PLAYWRIGHT_MODULE to its installed folder.
# CHROME_PATH optionally selects an installed Chrome/Chromium executable.
node 'Updated Source Code/StrExc/browser.test.cjs'
python 'Updated Source Code/StrExc/xlsx.test.py'
# ARTIFACT_TOOL_MODULE optionally points to the installed artifact_tool.mjs entry.
node 'Updated Source Code/StrExc/workbook-check.mjs'
```

Browser tests copy only `StrExc.html` into a new temporary directory, load it through `file://` with networking disabled, and exercise calculation, validation, save/reopen, malformed files, replacement cancellation, text escaping, empty state, light/dark appearance, mobile overflow and 500 rows. They write synthetic Excel exports and screenshots under `evidence/`. The Python check inspects exported packages, formulas, cached values and metadata. Artifact Tool independently recalculates the sample and verifies that changing depth updates row and project quantities, then restores and renders it.

Windows Chrome direct-file checks passed. Mac, Safari, Firefox and desktop Microsoft Excel were not tested. See [recovery](evidence/RECOVERY.md) and [validation](evidence/VALIDATION.md).
