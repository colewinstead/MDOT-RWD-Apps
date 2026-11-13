# Special bridge-end pavement drawing comparison

Reviewed 2026-11-12. The six downloaded MDOT PDFs and their exact source URLs,
byte counts, and SHA-256 hashes are in [reference-drawings/manifest.json](reference-drawings/manifest.json).
Each is one page. All six were rendered with PyMuPDF at 2x scale; the two slab
sheets were inspected as full sheets, and all four rail sheets were inspected
at their section details. Text extraction was used to locate notes, not as a
substitute for visual review. The original PDFs were not modified.

## Closest match: SDBE-1A

[SDBE-1A](reference-drawings/SDBE-1A.pdf), page 1, the upper-left cross section and
central plan, specify the following width relationships. These directly support
the recovered EXE's allowances (with its stored decimal approximation for 34/12):

| Rail case | Drawing relationship | Recovered EXE |
| --- | --- | --- |
| 32 inches | W = WB + 2 ft 10 in | W = W1 + W2 + 2.833333 |
| 42 inches | W = WB + 3 ft | W = W1 + W2 + 3 |
| No-rail end shown in lower-middle joint plan | W = WB + 12 in | W = W1 + W2 + 1 |

The upper-right bridge-end plan dimensions WB between the bridge curb lines and
shows W1 and W2 on opposite sides of the crown line. This supplies a physical
interpretation absent from the embedded script: W1 and W2 are transverse widths
from that crown line to those curb lines; their sum is WB. It does not require
W1 = W2. In this sketch, the 20-foot reference is at the midpoint of W, which
need not coincide with an asymmetric crown line.

General note 2, lower right, establishes a 20-foot mid-length with A never below
10 feet. The three small bottom sketches explicitly distinguish unskewed,
skewed A above 10, and skewed A at 10 cases. This agrees with the two recovered
geometry branches. The longitudinal elevation identifies 0.5(A+B) as the length
used for pay-area calculation.

At the bridge interface, the upper-right plan specifies a one-inch premolded
expansion joint with poured filler and no dowels. At the roadway interface, it
specifies a separate doweled joint only when roadway pavement is concrete.
The EXE computes one length W/cos(Z); it has no pavement-type choice or second
joint quantity. Treating it as a complete construction-joint schedule would
therefore exceed its evidence. SDBE-1A does not explicitly label transverse
grooving or print the EXE's deduction formulas.

The sheet is visibly marked preliminary and not for construction. Its project
and revision entries are placeholders. A matching calculation does not make
this a project-approved drawing.

## Rail sheets corroborate the allowances and fixed rail length

The following details were visually checked on page 1 of all four PDFs:

| Sheets | Typical rail base width (upper-right section) | Outside-face elevation (left middle) | Pavement thickness |
| --- | --- | --- | --- |
| [SDBEPR-1-12](reference-drawings/SDBEPR-1-12.pdf), [SDBEPR-1-9](reference-drawings/SDBEPR-1-9.pdf) | 1 ft 5 in (17 in) | 10 ft rail | 12 in / 9 in respectively |
| [SDBEPR-1A-12](reference-drawings/SDBEPR-1A-12.pdf), [SDBEPR-1A-9](reference-drawings/SDBEPR-1A-9.pdf) | 1 ft 6 in (18 in) | 10 ft rail | 12 in / 9 in respectively |

The plan note on the left calls for transitions at both left and right railings
at each bridge end. Two 10-foot rails explain the EXE's fixed 20 LF per entered
end. Both pavement-thickness variants retain the same plan width and length;
their vertical slab/embedment and reinforcing details differ. The EXE has no
pavement-thickness or reinforcing inputs and does not calculate concrete volume,
reinforcement, anchor assemblies, or structural adequacy.

**Dimensional inference, not a printed pay formula:** combining these rail
dimensions with SDBE-1A's normal 6-inch allowance on each side explains all
four area constants in the EXE:

- Outside the 10-foot rail length, reduce each side's 17-inch allowance to
  6 inches: 17 - 6 = 11 inches = 0.916666... ft. This matches the stored
  0.916667 coefficient multiplying (A-10) and (B-10) for 32-inch rail.
- For 42-inch rail, 18 - 6 = 12 inches = 1 ft, matching its coefficient.
- The two 32-inch rail footprints occupy 2 x 10 x (17/12) / 9 =
  3.148148... square yards, matching the additional grooving deduction.
- The two 42-inch rail footprints occupy 2 x 10 x (18/12) / 9 =
  3.333333... square yards, matching its grooving deduction.

These identities explain why grooving is less than paving in rail cases and
why additional side-strip deductions begin after 10 feet. They support a
schematic showing two 10-foot rails and narrower pavement edges past them.
No reviewed special sheet explicitly states these four pay-area equations;
the recovered script remains the direct evidence of the arithmetic.

The 42-inch rail sheets carry preliminary/not-for-construction stamps. The
32-inch sheets' title blocks do not show that same stamp in these downloads;
neither fact establishes approval for a particular project.

## SDBE-1 is a different system and does not match this EXE

[SDBE-1](reference-drawings/SDBE-1.pdf), page 1, is the overlay-and-sleeper-slab
new-construction design. The top-right plan/upper-left cross section specify
W = WB + 2 ft 6 in for the 37.5-inch rail label and W = WB + 2 ft 8 in for
43.5-inch rail. The local per-side cross-section note separately says 1 ft
3 in for a 33.5-inch label, an internal height-label inconsistency in this
download. None of these is the EXE's 32/42-inch allowance set.

Its longitudinal section B-B, mid-left, shows a three-foot exposed strip by the
bridge designated for transverse grooving; asphalt overlay covers the remaining
bridge-end slab. The EXE instead grooves its net paving area minus the fixed
rail footprints. Applying the EXE to that overlay design would therefore
produce a different grooving basis. SDBE-1 also includes a sleeper slab,
underdrain/outlet details, overlay transitions, and a bridge joint supplied
with bridge-specific details. These are outside the EXE's quantity model.

SDBE-1 note 2 still shares the 20-foot mid-length/A minimum geometry, but that
common geometry does not make its rail, joint, or grooving details equivalent.
Its border identifies a 2026-03-18 plot, despite the download folder's 2017
name, and it is stamped preliminary/not for construction. Do not infer a
2017 issue date or current project applicability from the folder name.

## Implications for the app

Keep the recovered EXE arithmetic. Cite SDBE-1A plus the 32/42-inch SDBEPR
details as dimensional corroboration and diagram references, with their
preliminary/project-selection limits. Do not relabel the app as implementing
the overlay/sleeper-slab SDBE-1 system, change its grooving to a three-foot
strip, or add another joint quantity without an explicit new calculation
scope. Diagrams remain quantity schematics, not construction details.
