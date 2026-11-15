# Validation

Verified on Windows, November 14, 2026:

- Five Node test groups pass. Every recovered size, type and FES factor is compared directly with the embedded script. Formula checks cover all 20 sizes across 3 lengths, 3 depths and 3 FES counts (540 combinations), plus independent hand calculations, malformed inputs, unrounded totals, import validation, blank drafts and limits.
- Reproducible standalone build embeds all CSS and JavaScript. Its assertions reject external/companion asset references. The delivered file was copied alone into a temporary directory and loaded with `file://` in headless Windows Chrome, with browser networking disabled. Browser identity and zero network/error logs are in `browser-results.json`.
- Browser checks passed for round and arch calculations, FES changes, hidden totals and blocked export on incomplete/zero depth, actual Excel and JSON downloads, draft save, save/reopen, cancelled replacement, malformed-file preservation, escaped input, row removal, empty state, mobile width, light/dark appearance and 500 pipes.
- Python/openpyxl parses the 2-pipe and 500-pipe exported XLSX packages. ZIP CRC, all XML parts, typed numeric cells, literal stations, formulas at every detail row, cached quantities, SUM totals, number formats, validation, filter and frozen panes pass independent checks.
- The four Excel notes use 9-point italic text. Export checks verify the note styling and absence of the removed runtime-comparison note; the updated workbook render was visually reviewed.
- Artifact Tool imports the exact browser-exported sample. Independent recalculation returns 65.20 CY. Changing the arch depth from 3 to 6 ft updates its quantity from 30.20 to 60.40 CY and the total from 65.20 to 95.40 CY. Restoring depth restores the original results. Formula-error search returns no matches. The workbook was rendered and visually reviewed; all 12 columns and notes fit without clipped headings or quantities.
- Light/dark desktop and mobile screenshots were reviewed. The narrow layout scrolls within the schedule; the document does not overflow horizontally. Hallmark static checks: 0 FAIL, 0 REFLEX, 0 WARN. Its own render tier was unavailable because Puppeteer is not installed; actual Chrome/Playwright screenshots were used for visual review.
- Independent Hallmark finish review requested stronger control borders and a mobile scroll hint. Both were fixed and rescored as resolved: border contrast is 3.71:1 in light mode and 4.70:1 in dark mode. Final review verdict: ship.

Limits: Windows refused to launch the legacy EXE (ShellExecuteW 5). Recovery tests compare its extracted script, not a running legacy process. No Mac, Safari, Firefox or desktop Microsoft Excel verification. Exact legacy rounding ties and applicability to current MDOT standards remain unverified. Exported size, span and FES factors are fixed values; change size in the app before re-exporting.

`sample-export.xlsx` and `large-export.xlsx` contain synthetic test data, not project estimates. Save/open JSON is the editable project format. The original `Legacy/strexc.exe` hash is unchanged.
