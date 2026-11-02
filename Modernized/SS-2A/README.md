# SS-2A · Storm sewer inlet quantities

Open [SS-2A.html](../../SS-2A.html) at the repository root in a current browser on Mac or Windows. That single file includes the interface, calculations, instructions and printable reports. No installation, server, account, network connection or companion files are needed.

This is a separate app from SS-3/SS-4. It reconstructs the supplied MDOT SS-2A.exe, version 6.0, October 10, 2011. Original executable files and their DLLs are preserved in `Legacy/` at the repository root.

## Use

1. Enter project information, inlet ID, station and roadway side.
2. Select length **5, 10 or 15 feet** and enter width and height in **decimal feet**. Select whether concrete pavement is used.
3. Select the pipe sizes and number of openings to deduct. Pipe dimensions are **inches**. Add another pipe-size row for a different opening, or remove a row with ×.
4. Review concrete, reinforcing steel, pipe-opening deductions. Add inlets to build a project of up to 50 inlets.
5. **Save project** downloads a JSON file containing the inputs. Keep that file, and use **Open project** to restore it. Save again after editing; closing the HTML does not save changes. The HTML is the app, and JSON files are your projects.
6. **Print / Save PDF** produces the project schedule and individual inlet quantities and deductions. Choose the browser's Save as PDF destination for a PDF copy.

Project data stays on your computer. Invalid inputs withhold quantities and project totals and disable saving and printing until corrected. Import validates the entire file before replacing your project.

## Calculation basis

The calculation engine uses the supplied executable's recovered legacy rules, with explicit float32 stores. Display rounding does not feed the calculations. See the recovery and validation evidence in the `evidence` folder for source addresses, actual comparison coverage and remaining limits. The software reproduces quantity calculations; its use does not establish current standard-drawing compliance or structural adequacy.

## Editable sources and reproducible packaging

The editable source files, tests and evidence live in this development folder. Users need only the generated `SS-2A.html` file. With an existing Node.js installation:

```sh
node --test Modernized/SS-2A/calculations.test.cjs
node Modernized/SS-2A/build-standalone.cjs
```

Regenerate the HTML after changing sources. The builder embeds CSS and JavaScript, generates exact CSP content hashes and rejects companion-file references. No runtime dependencies or build steps are required for the delivered app.
