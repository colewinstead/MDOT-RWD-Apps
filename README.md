# MDOT Roadway Design Apps

Open a modernized HTML file directly in a current browser on Mac or Windows. Each file contains the complete offline app; you can copy it anywhere without installing anything or keeping the rest of this repository.

| App | Purpose | Instructions and calculation limits |
| --- | --- | --- |
| [JB-1.html](JB-1.html) | Junction box quantities | [JB-1 guide](Modernized/JB-1/README.md) |
| [SS-2A.html](SS-2A.html) | Storm sewer inlet quantities | [SS-2A guide](Modernized/SS-2A/README.md) |
| [SS-3.html](SS-3.html) | SS-3 and SS-4 storm sewer inlet quantities | [SS-3 guide](Modernized/SS-3/README.md) |

**Save project** downloads your inputs as a separate JSON file. Keep that file and use **Open project** to reopen it. Save again after edits; closing the app does not save your work. Use the app's print action and your browser's Save as PDF destination for reports.

Repository layout:

- Root `*.html`: portable modernized apps.
- [Modernized/](Modernized/README.md): editable sources, tests, guides, and recovery evidence.
- [Legacy/](Legacy/README.md): original Windows EXEs and their supporting DLLs.

To rebuild and check the apps with an existing Node.js installation, run from the repository root:

```sh
node Modernized/JB-1/build-standalone.cjs
node Modernized/SS-2A/build-standalone.cjs
node Modernized/SS-3/build-standalone.cjs
node --test Modernized/JB-1/calculations.test.cjs Modernized/SS-2A/calculations.test.cjs Modernized/SS-3/calculations.test.cjs
```

These apps reproduce recovered legacy calculations. Read each app's documented limits before using its quantities.
