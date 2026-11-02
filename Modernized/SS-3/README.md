# SS-3 · Storm sewer inlet quantities

Open [SS-3.html](../../SS-3.html) at the repository root directly in a current browser on Mac or Windows. That one file contains the app, calculations, styles, instructions, and report. It needs no installation, internet connection, or companion files.

This modernization preserves the recovered SS-3 and SS-4 quantity calculations from the supplied version 3.0 executable dated October 10, 2011. The original executable and repository DLLs are preserved in `Legacy/` at the repository root. Impeccable was not used for this first pass.

## Working with a project

Enter project information, select an inlet type and pipe size, and enter height in **decimal feet**. Pipe sizes are **inches**. Changing the pipe or type starts at that choice's original baseline height. Add inlets for other stations. Review the individual quantities, height additions, project schedule, and totals.

**Save project** downloads an input JSON file. Keep that file and save again after edits; **Open project** restores it. The HTML is the application, and the JSON is your work. Inputs are not sent to a server. Use **Print report** and the browser's **Save as PDF** destination for a PDF report. Grate and frame weights are separate from reinforcement; SS-4 has no grate/frame values in the original report.

## Calculation basis

The table values and arithmetic come from this exact supplied binary, not a newly selected engineering standard. Its quantities include a deduction for **one selected pipe opening**. SS-3 provides 19 pipe choices; SS-4 provides four. Taller SS-3 inlets add 0.184 yd³ concrete and 17 lb reinforcement per added foot. Taller SS-4 inlets add 0.185 yd³ concrete per added foot, while reinforcement remains 31 lb. Original float32 stores are reproduced before display rounding.

The app rejects heights below the original baseline as a new input safeguard. Original baseline decimals are preserved, including seemingly unusual rounded values. Totals sum unrounded inlet results as a new reporting convenience.

See [recovery evidence](evidence/RECOVERY.md) and [validation](evidence/VALIDATION.md) for the actual comparison coverage and limits. Matching the original program does not establish current drawing compliance, structural adequacy, or project suitability.

The original BASIC input parser can round very long decimal strings differently from a browser. Use ordinary decimal-foot entries (the comparison grid checks four-decimal raised heights); universal bitwise equivalence at every input-rounding boundary is not claimed.

## Editable sources

No runtime packages are needed. With an existing Node.js installation:

```sh
node --test Modernized/SS-3/calculations.test.cjs
node Modernized/SS-3/build-standalone.cjs
```

Regenerate `SS-3.html` after source changes. The reproducible builder embeds all runtime files and rejects remaining companion-file references. Developer tests, evidence, and documentation are not required to run the delivered HTML.

`browser.test.cjs` is an optional developer check using an existing Playwright installation and Chrome (`CHROME_PATH` can select its executable). It verifies isolated direct-file use, project save/open, validation, mobile layout and a sample PDF. It is not an application dependency.
