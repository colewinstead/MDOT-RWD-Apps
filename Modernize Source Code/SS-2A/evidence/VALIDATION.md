# SS-2A validation

November 1, 2026 (America/Chicago).

The calculation reconstruction is bound to the original executable SHA-256 `31b10c65b0f06e9d8e9c4c46e3236759842b2613af5166e3c6a68fb8b5ca9b0b`. REA/Hopper Evidence, its snapshot, and the native disassembly are retained here. See formulas.md for recovered arithmetic, constants, storage and precision choices.

## Report scope

The original startup screen says “BAR LIST,” but its actual saved report (legacy-report-case1.txt) contains quantities, dimensions, pipe deductions and grand totals, with no bar schedule. The modern app reproduces that report scope; no fabricated bar quantities or schedule are added.

## Calculation comparisons

All six calculation tests pass. All19pipe-deduction constants are independently compared with native float32 immediates. Eight fresh-process Windows cases cover all3lengths with both pavement choices, varied width/height, multiple circular and arch sizes, counts1/2/3, no openings, and mixed sizes. All16concrete/steel quantities match the original stored float32 bytes exactly, maximum observed residual0yd³ and0lb. Screenshots verify the actual dimensions and selected deductions for each accepted fixture. The first separately captured baseline also matches exactly.

The original form auto-advances on two-character lengths, side/pavement choices accept a single key, and pipe counts accept a single digit without Enter. Earlier mistyped test attempts are preserved as investigation evidence; they are not accepted comparison fixtures. Final valid inputs/results are in legacy-grid-results.json. The engine tests do not relax tolerance or substitute rounded report text for exact bytes.

## Browser and packaging

The reproducible builder embeds CSS and both scripts with CSP content hashes and rejects companion-file references. Browser verification uses an existing Playwright and Chrome installation; these are development tools, not application dependencies.

browser.test.cjs copies only the generated HTML into an otherwise empty temporary folder and opens its actual file URL on Mac. It verifies the first original case displays 2.614 yd³; invalid dimensions disable printing; a two-inlet project with both pavement choices saves and reopens; malformed imports preserve the current project; metadata containing script text stays inert; and the page has no document overflow at390px. No HTTP/HTTPS requests or page errors occur. Desktop/mobile screenshots are retained.

A two-inlet Letter PDF was generated through Chrome's beforeprint path. Both pages were rendered for visual review. It contains the schedule, unrounded-result totals, per-inlet dimensions/pavement/pipe inputs, deductions, quantities and requested concise reconstruction footer. A physical printer and other browser print engines were not exercised.

The final standalone HTML was also opened directly on the Windows test PC in existing Microsoft Edge156.0.4314.58, in a folder containing only that HTML. Its rendered DOM contained concrete2.614 and reinforcement218.745. windows-browser-result.json records the matching file SHA-256 `4debcc76aefccb528e6d6cfaa9add3c0dccafe3ae89a75a1b443712234e80b82`. Windows interactive editing, file dialogs and printing were not separately checked.

## Limits

This is reproduction of this supplied program's quantity rules, not verification against a current agency drawing or structural design standard. Source code was not supplied. JavaScript float32 stores reproduce the recovered arithmetic, but universal identity at every extended-precision or decimal-parser boundary is not claimed. Input gates for positive dimensions/quantities, height exceeding0.5ft and at most50openings are modern safeguards, not newly adopted agency criteria.

Saved JSON files hold inputs separately from the application. The app requires no companion files, installation, hosting or network access. Impeccable was not used.

The Windows probe process and scheduled task were removed after testing. The synthetic report folder was removed, and the original C:\Q\SS-2A.TXT remained absent. The repository executable digest is unchanged. See windows-validation.md and windows-cleanup-result.json for retained cleanup evidence.
