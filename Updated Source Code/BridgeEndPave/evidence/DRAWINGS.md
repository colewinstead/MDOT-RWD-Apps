# Supplied drawing reference

The supplied standard set below was inspected first. Subsequent inspection of
MDOT's special design sheets identified **SDBE-1A** as the closer reference for
the recovered EXE. See [SPECIAL-DRAWINGS.md](SPECIAL-DRAWINGS.md) and the retained
PDFs/URL/hash manifest under `reference-drawings/`. The final app uses SDBE-1A as
its main diagram basis while retaining these observations about the different
BE-1/BE-2/BER families. The special templates are marked preliminary, not for
construction.

The user identified physical PDF pages 10-13 of
`C:\Users\johnc\Downloads\Roadway Design Standard Drawings.pdf`.
The complete file contains 220 pages and is 42,040,834 bytes. SHA-256:
`d7d1283a65316ad5da0a39eab459ccfda15f80687a72c7edbb6f4a8daa6ecb99`.
The earlier `bridge end pv.pdf` contained clipped versions of these pages and
was superseded for diagram verification. Both source files remain unchanged.

| PDF page | Working number | Sheet | Supplied title |
| --- | --- | --- | --- |
| 10 | BE-1 | 6007 | Bridge end pavement with rail, overlay, and sleeper slab (new construction) |
| 11 | BE-2 | 6008 | Bridge end pavement with rail and overlay |
| 12 | BER-1 | 6009 | 33.5-inch bridge end pavement rail |
| 13 | BER-2 | 6010 | 43.5-inch bridge end pavement rail |

The visible issue date is August 1, 2017. This records the supplied artifact;
no claim is made that it is the currently applicable standard. These scanned
pages have no useful extracted text, so the full pages and enlarged plan/section
regions were rendered and read visually with PyMuPDF.

## Observed details used in the app

- Roadway is left, bridge deck right, and the skewed interface runs between them.
  A is the upper side, B the lower side. W2 is above the crown line; W1 below.
  WB is bridge width, equal to W1 + W2. The calculation envelope width W adds the
  selected rail allowance. Normal shoulder lines and rail geometry are not the
  same as the arithmetic blocks in the width breakdown.
- BE-1/BE-2 note 2 bases A/B on 20 ft mid-length with A at least 10 ft.
  The EXE's symmetric W/2 formula is preserved; it does not use the crown-line
  position to change A/B when W1 and W2 differ.
- The drawings state `W = WB + 2 ft 10 in.` for 33.5-inch rail and
  `W = WB + 3 ft` for 43.5-inch rail. These additions equal the EXE's
  2.833333 and 3-foot branches, whose rail labels are 32 and 42 inches.
  Matching additions alone do not prove identical height definitions.
- BE-1 Section B-B shows a 1-ft-thick sleeper slab 6 ft long; the bridge end
  pavement itself is 1 ft thick. The asphalt overlay is 1.5 inches and variable.
  Its pay-area calculation length is 0.5(A+B).
- BE-1 Section B-B explicitly calls for **no expansion joint at the bridge
  seat**, with metal flashing or three thicknesses of tar paper beneath the
  bearing surface. Its roadway joint is conditional on concrete roadway
  pavement. BE-2's longitudinal elevation shows a 1-inch joint at the bridge,
  9-inch-minimum bridge end pavement, and no BE-1 sleeper slab.
- BE-1 note 6 includes bridge end pavement, sleeper slab, and metal flashing
  in the bridge-end-pavement pay item. The app preserves the recovered area
  calculation and does not add separate volume or reinforcement quantities.

## Boundary

Diagrams explain the quantities and compare the supplied arrangements. They do
not reproduce full reinforcement, anchorage, drainage, skew-bar tables, rail
profiles, or construction details. W1/W2 labels are grounded in these drawings;
the old script alone did not define their physical datum. Joint applicability
and rail-height differences are visible in the app and reports instead of
silently changing the legacy calculations.
