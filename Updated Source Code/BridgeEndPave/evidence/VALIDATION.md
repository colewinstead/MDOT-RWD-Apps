# Validation

Host: Windows 11, local Chrome in headless mode, existing Node.js and Playwright.
App runs directly from `file://`. No application dependency was installed.
The AutoIt extractor was a separate developer-only temporary tool.

## Calculation checks

`node --test "Updated Source Code/BridgeEndPave/calculations.test.cjs"`

Eight tests cover zero-skew hand cases for all three rail options, clamped
45-degree cases, the A=10 switch boundary, exact approximate-pi behavior,
the historical report fixture, strict numeric/domain validation, rounding
before accumulation, integer-cent totals, and classic browser-script loading.

The historical report fixture for W1=30, W2=25, skew=10, rail=32 matches:
126.48 SY pavement, 58.73 LF joint, 123.33 SY grooving, and 20 LF rail.
The 12/12-ft, 45-degree project with rail options 0, 32, and 42 totals
197.08 SY pavement, 111.49 LF joint, 190.61 SY grooving, 20 LF rail32,
and 20 LF rail42. Repeated edits do not add another quantity entry.

## Standalone and browser checks

`node "Updated Source Code/BridgeEndPave/build-standalone.cjs"`

The builder checks exact inline CSP hashes, two embedded scripts, one embedded
stylesheet, and no required companion references. Two consecutive builds
produce identical bytes. No original app source or EXE is overwritten.

`node "Updated Source Code/BridgeEndPave/browser.test.cjs"`

The browser test copies **only BridgeEndPave.html** into a new temporary folder
and opens it directly. It verifies:

- Legacy sample quantities, all rail options, and the 10-ft minimum.
- Blank/negative inputs hide invalid results and disable file/report actions.
- Add/remove/select/edit records and totals without duplicate accumulation.
- Actual JSON download and reopen restores inputs and multiple ends.
- Bad schema, dates, boolean dimensions, unsupported rail, oversized totals,
  and more than 200 records are rejected without replacing edits.
- Cancelling replacement preserves the current unsaved project.
- Text download totals agree with the displayed schedule.
- Imported markup stays text and does not execute or create images.
- SVG titles/descriptions, desktop and 390-pixel layouts, light/dark appearance.
- A 12-end Letter report prints with schedule and per-end plan diagrams.
- No HTTP(S) requests, JavaScript errors, or console errors during app use.

Screenshots are generated locally under `evidence/` (PNG files follow the
repository's ignore rule). `report-sample.pdf` is a synthetic developer artifact,
not part of the app package. Full-page desktop/mobile/dark screenshots and
rendered report pages are visually inspected after meaningful diagram changes.

## Limits

Direct-file testing was performed on Windows Chrome. Mac Safari and other
browsers were not run in this environment. The browser print destination and
download location remain browser/operating-system choices.

The legacy UI was inspected from a byte-identical temporary copy; the user
stopped desktop control with Escape before a new controlled Calculate run.
The historical output fixture and recovered script establish the tested
comparison, not exhaustive live-runtime parity. Half-cent tie behavior is
unverified. Structural adequacy and applicability of a particular project
drawing are outside this quantity-port verification.
