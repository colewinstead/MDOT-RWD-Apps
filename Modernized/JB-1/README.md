# JB-1 · Junction box quantities

Open **JB-1.html** in the parent `Modernized` folder in a current browser. That single file includes all styling, calculations, instructions, and interface code. You can move or copy it by itself. No hosting, installation, internet connection, account, or build step is required to use it. Saved project JSON files contain your work and are kept separately.

This is a reconstruction of the supplied Mississippi MDOT JB-1 v5.0 executable, revised October 10, 2011. The original EXE and its DLLs are unchanged.

## Use

1. Replace the clearly labeled example inputs with project information and the current box number, station, and roadway side.
2. Enter pipe span, rise, and wall thickness in **inches**, and skew in **degrees**. Side 1 is always outflow. Uncheck other sides to omit their pipes.
3. The pipe wall field suggests the original thickness when a pipe size changes, unless you have edited that thickness. Confirm it against the actual pipe. Span and rise are separate dimensions for noncircular pipes.
4. Leave height blank for the original calculated minimum, or enter a height in **decimal feet** at least that high.
5. Review the dimensions, net concrete, steel weight, and bar schedule. The plan diagram is schematic, with centered openings; it is not a construction drawing or an opening-conflict check.
6. **Add box** builds a project of up to 50 boxes. The junction-box selector switches between them. **Print report** prints every box and project totals; choose your browser's Save as PDF destination if desired.
7. **Save project** downloads a JSON file containing the inputs. **Open project** restores it. Keep the JSON file; the app does not use a database or automatically persist edits. A new export is needed after edits.

The display follows the computer's light/dark appearance. Printing uses a white report. All assets are local and no project input is sent over a network.

## Calculation basis and limits

The engine reproduces the formulas and selected float32 stores recovered from this exact executable:

`99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462`

See [the recovery ledger](evidence/RECOVERY.md) for machine-code addresses, equations, defaults, fixed lookup tables, rounding, and distinctions between recovered behavior and modern input validation. [Validation](evidence/VALIDATION.md) records the actual checks and their limits.

- This version reproduces the legacy calculation rules. It does **not** certify current MDOT-standard compliance, structural adequacy, pipe conflicts, cover, or project suitability. The exact governing drawing edition was not supplied.
- Noncircular spans are limited to the recovered table: **22, 29, 36, 44, 51, 58, 65, 73, and 88 inches**. Its opening deductions depend only on span, regardless of entered rise, thickness, or skew; the app states that limit when applicable. No other size is silently substituted.
- Pipe skew must be strictly between −90° and +90°. This numerical input gate is not an agency acceptance limit. Pipe-layout applicability remains a separate review.
- The original steel equation includes a fixed **4 lb** allowance. It is preserved, not reinterpreted as a current standard.
- Calculation precision is retained internally. The new bar list shows lengths to two decimals instead of the original whole-inch display. Steel uses unrounded lengths, as in the original; displayed rounding is not a fabrication tolerance.
- JavaScript double calculations between selected float32 stores do not emulate every x87 extended-precision operation. The recorded Windows comparison cases establish a bounded compatibility check, not proof for every possible input.
- Invalid or unsupported calculations hide current quantities and disable printing/export. Fix the affected box before producing project totals.

A public MDOT [standard drawing collection](https://mdot.ms.gov/documents/Roadway%20Design/Standards/Drawings/Roadway%20Design%20Standard%20Drawings.pdf) includes a later JB-1 drawing. It is a reference link, not the adopted calculation basis for this reconstruction.

## Development checks

Use an existing Node.js installation:

```sh
node --test calculations.test.cjs
```

No dependencies are required by the app or calculation tests. The `evidence` folder contains static recovery notes and synthetic Windows verification artifacts; the app does not load those files.

The files in this development folder remain the editable sources. After changing them, run `node build-standalone.cjs` to regenerate `../JB-1.html`. The build checks that no companion-file references remain and creates exact content hashes for the embedded scripts and stylesheet. `index.html` is the source preview and still uses the separate source files.
