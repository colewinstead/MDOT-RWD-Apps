# Embedded AutoIt script recovery

`Legacy/BridgeEndPave.exe` is a 371,907-byte AutoIt executable. Its SHA-256 is
`114820772dbd045a88a32b6c23287057396fac691fe523bfd57fc1d41274f323`.
The recovered GUI labels the app **Mississippi DOT (Roadway Design), Version AI 1.2**.

The source was read without executing or modifying the EXE. The EA06 script is in
an appended AutoIt container, with `AU3!EA06` at file offset 367120. The
[`autoit-ripper` project's documented `extract(data)` API](https://github.com/nazywam/AutoIt-Ripper)
handles this layout through its locator-based route. Explicitly choosing EA06 in
that library searches for an RT_RCDATA SCRIPT resource and fails on this file;
using its default format detection succeeds. This is an extractor routing detail,
not evidence that the bytecode is EA05.

## Reproduce

From the repository root in PowerShell, using an existing Python installation:

```powershell
$packagePath = Join-Path $env:TEMP 'mdot-bridge-autoit-ripper'
python -m pip install --target $packagePath autoit-ripper==1.2.0
python 'Updated Source Code/BridgeEndPave/evidence/extract-autoit.py' --package-path $packagePath
```

The developer-only package was installed in the temporary directory; it is not a
runtime dependency of the modernized HTML. The extractor validates the source
digest and the single script record, saves `recovered-script.au3`, and records
source/output identity in `extraction-manifest.json`. It does not run the script.
Recovered text is a decompiled token stream, not a claim that the original source
file's whitespace, comments, or identifiers outside the compiled stream survived.

## Recovered calculation behavior

The recovered script reads abutment station, W1/W2 (feet), skew Z (degrees), and
rail height (0, 32, or 42 inches). It computes with `Z * 3.141593 / 180`, not a
newly selected value of pi. WB = W1 + W2. Overall W adds 1, 2.833333, or 3 feet
for rail heights 0, 32, or 42 respectively.

A = max(10, 20 - W/2 * tan(Z)). When A = 10, B = 10 + W * tan(Z); otherwise
B = 20 + W/2 * tan(Z). Gross area Y = (A+B)/2 * W / 9 square yards, and
expansion joint = W / cos(Z) linear feet.

For rail 0, paving and grooving both equal Y. For 32-inch rail, deduct
((A-10)+(B-10)) * 0.916667 / 9 from paving, then deduct 3.148148 square yards
from paving to obtain grooving. For 42-inch rail, use 1.0 instead of 0.916667,
then deduct 3.333333 square yards for grooving. Each rail case reports 20 linear
feet of that rail and zero of the other height.

The script rounds paving, expansion joint, and grooving to two decimals **before**
adding them to project totals. It also rounds displayed W1, W2, W, A, B, and Z
to two decimals; WB retains its numeric value. Every Calculate click appends an
entry to the text report; exiting writes project totals and opens that report.

The original has no explicit numeric/domain validation. A modern input safeguard
must be documented as a design choice. Static recovery establishes these formulas;
it does not establish runtime equivalence, current drawing applicability, or
engineering suitability. The source does not define what physical datum W1/W2
measure or how negative skew should be interpreted in a drawing; diagrams should
label the entered widths and recovered geometry without inventing those details.

## Modern calculation safeguards

`calculations.js` accepts finite decimal numbers or decimal-number strings. W1/W2
must be nonnegative with a positive combined width. Rail height must be exactly
0, 32, or 42 inches. Skew is entered as a **nonnegative magnitude**, 0 <= Z < 90;
negative skew is rejected instead of silently taking its absolute value. This is
a modern safeguard, not the legacy program's behavior. Nonfinite or negative
physical results are rejected. This also catches inputs extremely close to 90
degrees where the recovered approximate pi can make cosine negative.

Project totals add the already-rounded per-end quantities as integer cents.
Totals beyond JavaScript's safe integer-cent range are rejected rather than
reported with silent precision loss. The static tests cover all three rail
options, both geometry branches and their switch boundary, the existing user
report, decimal input validation, and round-before-total behavior.

The [official AutoIt Round documentation](https://www.autoitscript.com/autoit3/docs/functions/Round.htm)
describes rounding to decimal places but does not specify the half-cent tie rule.
The modern implementation initially uses nearest-cent rounding of nonnegative
double values; runtime probes at ties must establish any further compatibility
claim. General binary-decimal input rounding equivalence is not established by
the recovered token stream alone.
