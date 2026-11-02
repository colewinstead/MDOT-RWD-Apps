# JB-2 drawing basis and verification

The shared portable app is `JB.html` at the repository root. Its editable sources remain in `Modernized/JB-1/`. Historical JB-1 recovery records are unchanged.

## Source and scope

MDOT standard drawing **JB-2, sheet 6506, August 1, 2017**, page **174 of 220** in the [Roadway Design Standard Drawings collection](https://mdot.ms.gov/documents/Roadway%20Design/Standards/Drawings/Roadway%20Design%20Standard%20Drawings.pdf). The user supplied a screenshot of this page and a common-pipe table. The original PDF was fetched and the complete drawing and enlarged tables inspected to resolve the screenshot's small text.

SHA-256 of the inspected collection: `d9b8e7bf3440f1c8d53ef841eba263520c300c2a4e983c375db1aad966c77e7f`.

This calculation implements that drawing's quantity expressions with the user-confirmed solid-wall count convention below. No JB-2 executable was supplied, so this is a drawing-based implementation rather than a recovered-executable compatibility claim. The drawing's applicability and structural design are outside the quantity calculation.

## Pipe selection and wall thickness

New pipe choices are limited to the following 18 sizes. Pipe dimensions and thickness are inches; deductions are cubic yards. A dash in the 6-inch column requires **8-inch walls on every side**. When that happens, every pipe uses its 8-inch deduction, including smaller pipes.

| Pipe span × rise | Pipe thickness T | 6-inch wall deduction | 8-inch wall deduction |
| --- | ---: | ---: | ---: |
| 18 × 18 | 2.5 | 0.053 | 0.071 |
| 24 × 24 | 3 | 0.091 | 0.121 |
| 30 × 30 | 3.5 | 0.138 | 0.184 |
| 36 × 36 | 4 | 0.196 | 0.261 |
| 42 × 42 | 4.5 | 0.263 | 0.350 |
| 48 × 48 | 5 | — | 0.453 |
| 54 × 54 | 5.5 | — | 0.569 |
| 60 × 60 | 6 | — | 0.699 |
| 66 × 66 | 6.5 | — | 0.840 |
| 72 × 72 | 7 | — | 0.996 |
| 22 × 13 | 2.5 | 0.053 | 0.071 |
| 29 × 18 | 3 | 0.087 | 0.116 |
| 36 × 23 | 3.5 | 0.129 | 0.172 |
| 44 × 27 | 4 | 0.185 | 0.247 |
| 51 × 31 | 4.5 | — | 0.327 |
| 58 × 36 | 5 | — | 0.424 |
| 65 × 40 | 5.5 | — | 0.525 |
| 73 × 45 | 6 | — | 0.652 |

The table above is used for JB-2. JB-1 retains its original unrounded circular deductions and recovered arch-span lookup, including 0.195 yd³ for span 44 rather than the drawing table's 0.185. Selecting a pipe does not change the JB-1 engine. Existing JB-1 JSON projects retain custom pipe dimensions/thicknesses; imported custom choices are not offered for new entries and cannot be calculated as JB-2.

## Geometry and concrete

All terms in the following formulas are inches until division by 46,656. Let `t` be the common box-wall thickness, `T1` the **outflow pipe thickness**, and `H` the box height. For each active pipe:

`required side width = (span + 2T) / cos(skew) + 2t + 9`.

The 9 inches are the two 4.5-inch allowances. Set W1 to the larger requirement on sides 1/3 and W2 to the larger on sides 2/4, each at least 30 inches. Both must be at most **111 inches (9 ft 3 in.)**. Skew magnitude must be below 90 degrees; the width limit can further restrict it.

The section geometry gives minimum H as the maximum active pipe's `rise + 2T + 12`, adding outflow thickness T1 for a non-outflow pipe with a different rise, consistent with the original app's invert-alignment convention. Entered height must be at least this value.

- `Q1 = 8 W1 W2 + (W1 - 2t - 0.5)(W2 - 2t - 0.5) + (T1 + 6) W1 W2`
- `Q2 = 2t [H - (T1 + 6)] [(W1 - 2t) + W2]`
- `gross concrete = (Q1 + Q2) / 46656`
- `net concrete = gross concrete - sum(applicable tabulated opening deductions)`

This uses the 8-inch cover term and the 12.5-/16.5-inch recess terms printed for 6-/8-inch walls. JB-2 uses ordinary JavaScript double precision; it does not insert JB-1 executable float32 stores.

## Reinforcement

Bars A1–A4 are the drawing's A bars grouped by entering side. Each active opening has two #4 bars of length `sqrt(196 + (W/2 + 2)^2)`, with the applicable side width W.

Before solid-wall additions:

- B: `2 + 2 if side 3 has an opening + 1 for side 1`; length W1 − 4.
- C: `2 + 2 per opening on sides 2/4`; length W2 − 4.
- D: `4 + 2 per opening on all sides`; length H, including the illustrated 6-inch foot.
- E: `2 [round(W1 / 6) + 1]`; length W2 − 4.
- F: `2 [round(W2 / 6) + 1]`; length W1 − 4.

B/C/D are #6 for 6-inch box walls and #7 for 8-inch box walls. E/F are #6. Positive half-integer bar-count ratios round upward. No displayed length rounding feeds steel weight.

**User-confirmed solid-wall interpretation:** the end bars are already included in the base schedule. Add `max(0, ceil(run / 12) - 1)` interior bars for each solid wall, providing intervals no larger than 12 inches between the counted endpoints. For B on a solid side 1/3 and C on a solid side 2/4, run = full H. For D on a solid wall, run = that wall's full W1 or W2. No additional endpoint-cover adjustment is assumed. For example, a 48-inch run adds three bars. This count expression is the agreed implementation convention, not an explicit formula printed on sheet 6506. The app and printed report state it.

Unit weights in lb/ft are #4 = **0.668**, #6 = **1.502**, #7 = **2.044**, verified against the [TxDOT Bridge Detailing Guide, Chapter 5, Table 5-3](https://ftp.dot.state.tx.us/pub/txdot-info/brg/design/bridge-detailing-guide.pdf). The bar geometry/counts come from MDOT, not TxDOT. Add the MDOT drawing's fixed **3.3 lb for two lift bars**.

Drawing note 5 requires breakback at the wall for skew above 15 degrees or conflicting openings. The app warns about skew above 15 degrees. The centered schematic shows pipe direction and does not design the breakback or evaluate conflicts.

## Checks

`node --test Modernized/JB-1/calculations.test.cjs Modernized/JB-1/jb2.test.cjs` runs the nine original JB-1 regressions and six JB-2 tests. JB-2 checks include both concrete formula branches, both pipe thresholds, all 18 deductions in standalone and forced-8-inch configurations, solid-wall bar additions, unit-weight totals, width boundaries, skew symmetry, invalid input, immutability, and mixed-standard totals.

Two hand-calculated concrete cases:

| Pipes on sides 1/3; sides 2/4 solid | Walls | W1 × W2 | H | Q1 | Q2 | Opening deduction |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| 24-inch / 24-inch circular | 6 | 51 × 30 | 42 | 26683.75 | 27324 | 0.182 |
| 24-inch / 48-inch circular | 8 | 83 × 30 | 73 | 43227.75 | 99328 | 0.574 |

The first case's B/C/D/E/F counts are 5/8/12/20/12; lengths are 47/26/42/26/47 inches. Its A bars total four at `sqrt(196 + 27.5²)` inches. The unit test independently sums these weights and the 3.3-lb lift-bar allowance.

The browser check uses only a copied `JB.html` in an isolated folder. Verified in installed Windows Chrome: list-only new pipe choices, per-box standard selection, automatic 6/8-inch wall and deduction changes, bar sizes, maximum-width rejection, mixed reports, JSON save/reopen, unchanged custom inputs from old JB-1 files, invalid imports without replacing current work, mobile layout, and no network requests or script/security-policy errors. macOS was not rerun for this change.
