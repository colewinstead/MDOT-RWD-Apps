# Special drawing family coverage and quantity basis

Reviewed 2026-11-12. This extends the earlier legacy-only investigation; it does
not alter or reinterpret the recovered AI 1.2 calculation. The new requested
outputs are paving area, transverse-grooving area, joint lengths, and rail
lengths. Concrete volumes and reinforcement quantities are outside that scope.

Source PDFs, exact MDOT URLs, byte counts, and hashes are recorded in
[reference-drawings/manifest.json](reference-drawings/manifest.json). The manifest
now also includes SDBER-1 and SDBER-2. Both were downloaded directly from the
documented MDOT special-sheet folder, rendered at 2x, and visually inspected;
the section details and SDBE-1 groove dimension were additionally rendered at
3x. The originals remain unchanged. PDF text encoding corrupts some fractions
in SDBER files, so the dimensions below were checked in the rendered drawings.

## Supported catalogue by source family

| Family | Rail choices supported by these sheets | Surface/detail | Dimensional source |
| --- | --- | --- | --- |
| SDBE-1A, bare slab | No rail, 32 in, 42 in | Bare concrete; slab sheet shows 9-in minimum; separate 9/12-in rail/embedment variants | SDBE-1A with SDBEPR-1-9/-12 or SDBEPR-1A-9/-12 |
| SDBE-1, overlay and sleeper slab | 37.5 in, 43.5 in | 12-in slab, 1.5-in overlay, exposed 3-ft strip normal to bridge joint | SDBE-1 with SDBER-1 or SDBER-2 |

This is a compatibility table, not permission to combine every rail height with
every family. The standard BE-1/BE-2 33.5/43.5-in family is a separate source
audit. In particular, the 37.5-in special rail must not silently become a
33.5-in standard rail, and the old 32/42-in details must not be used as aliases.

## SDBER-1 and SDBER-2: new source observations

[SDBER-1](reference-drawings/SDBER-1.pdf), page 1, is titled for 37.5-in rail;
[SDBER-2](reference-drawings/SDBER-2.pdf), page 1, is titled for 43.5-in rail.
Both show a 2017-08-01 issue date and a 2023-08-04 border/revision date.
Their upper-right typical sections show the nominal rail heights as 3 ft
1.5 in and 3 ft 7.5 in. A 1.5-in overlay is shown at the slab surface.

The typical profile's horizontal projection is dimensioned 1 ft 2.5 in for
37.5-in rail and 1 ft 3.5 in for 43.5-in rail. The corresponding end elevations
show thickened end widths of 1 ft 3 in and 1 ft 4 in. The separate SDBE-1 slab
plan allocates 1 ft 3 in and 1 ft 4 in **per side**. Thus paving geometry must
use the slab-plan allocations, not the smaller typical-profile projection.
The difference is visible in the details and is not a reason to average the
dimensions or modify the slab allowance.

The lower-left outside-face elevation dimensions each rail at 10 ft. The plan
and general note 3 call for both left and right railings at each bridge end.
The supported quantity is therefore two 10-ft rails, or 20 LF per end, for
either selected rail size. SDBER files depict the 12-in slab system; there is
no separate 9-in SDBER variant in the supplied/downloaded source set.

There are bar shapes, spacing notes, and skew lookup tables (5 through 45
degrees). These are not steel weight or complete per-end quantity schedules.
The lookup notes direct rounding upward to the next listed skew for a specific
bar and field adjustment of paired bars. Those details do not change the
four requested plan quantities, nor establish structural applicability at
arbitrary skew. No rebar quantity implementation is required here.

## Common plan variables

Let WB = W1 + W2. Let r be the nominal per-side rail/slab allowance, n the
normal no-rail edge allowance, and W = WB + 2r. Let z be the nonnegative skew
angle. The dimensional geometry supported by both slab sheets is:

```
A = max(10, 20 - (W/2) * tan(z))
B = A + W * tan(z)
gross bounding trapezoid area = W * (A+B) / 2
```

Lengths are feet and the area above is square feet. The 20-ft mid-length and
A minimum are explicit in general note 2 and the three small geometry sketches.
The old EXE's approximate pi and decimal constants belong only to compatibility
mode; drawing-derived calculations can use exact fractional dimensions and the
platform's pi, while clearly labeling their different basis.

## SDBE-1: derived paving perimeter, not legacy deductions

The top-left PLAN visibly continues the main slab between gutter lines to the
roadway end. The two outer rail-wing strips stop 10 ft from the bridge. The
upper-right PLAN AT BRIDGE END gives W = WB + 2 ft 6 in for 37.5-in rail and
W = WB + 2 ft 8 in for 43.5-in rail. Therefore r = 15/12 or 16/12 ft.

**Drawing-derived planar-area candidate:** subtract the outer strips beyond
their 10-ft rail lengths from the bounding trapezoid:

```
paving square yards = (W*(A+B)/2 - r*(A+B-20)) / 9
```

This is the area of the drawn main slab plus its two 10-ft wings. It is not a
formula printed verbatim on the sheet. The longitudinal elevation identifies
the average A/B length for pay-area calculation; no full pay-area equation is
printed. Labeling this output as a drawing-derived plan area states its evidence
accurately. The old legacy deduction `(r-0.5)*(A+B-20)` would leave unsupported
6-in strips beyond the rails and is **not** appropriate to this SDBE-1 perimeter.

General note 7 absorbs sleeper-slab construction into the paving pay item.
Do not add the sleeper slab's projecting footprint as another paving area;
the marked A/B length is the main bridge-end slab length.

### SDBE-1 transverse grooving

The upper-right plan draws the overlay termination parallel to the skewed
bridge joint. The 3-ft dimension line between them is rotated **normal to
the joint**, not parallel to the roadway. Section B-B identifies this exposed
strip for transverse grooving. The clear gutter-to-gutter width is WB.

**Derived strip area, when it fits the slab:**

```
grooving square yards = 3 * WB / cos(z) / 9
```

This is not `3*WB/9` except at zero skew, and is not the legacy full-slab
grooving calculation. It also is not a three-foot longitudinal strip: the
dimension orientation in the plan establishes the normal interpretation.

The whole strip fits only if its required longitudinal depth does not pass the
roadway end at the shortest clear-pavement edge:

```
A + r*tan(z) >= 3/cos(z)
equivalently: A*cos(z) + r*sin(z) >= 3
```

That holds in ordinary illustrated skews, but not for every mathematical skew
arbitrarily close to 90 degrees. A case that fails requires explicit clipping
geometry or project-specific direction. Do not silently report the full-strip
formula or invent a different pay area in that case.

### SDBE-1 joints

The roadway-side premolded/doweled joint is conditional on concrete roadway
pavement. In the plan it crosses the main roadway-end slab perpendicular to
the roadway, across WB; its derived length is WB when required, zero when the
roadway is asphalt. The bridge interface is identified as a bridge joint and
shown with bridge-plan details; it is not the old one-inch premolded joint.
A separate bridge-joint geometric span may be shown, but it must not be
automatically added as a premolded expansion-joint pay quantity. An explicit
roadway surface input is needed to determine the conditional roadway joint.

## SDBE-1A: retain its different perimeter and joint details

This is the older bare-slab system. Its nominal rail allocations are r = 17/12
ft for 32-in rail and 18/12 ft for 42-in rail. Its no-rail joint-plan detail
gives W = WB + 12 in, or n = 0.5 ft on each side. Together with the drawn
10-ft rails, these dimensions corroborate the EXE's narrower outer strips
after the rails.

**Drawing-derived planar candidates:**

```
paving square yards = (W*(A+B)/2 - (r-n)*(A+B-20)) / 9
exposed bare area = paving area - (2*10*r)/9
```

For no rail, use r = n = 0.5 and no rail-footprint subtraction. This is the
rational-dimension equivalent of the legacy 32/42-in area model, subject to
the EXE's stored approximations and rounding. The bare-area expression can be
offered as a computed exposed-surface area. **SDBE-1A does not explicitly require
transverse grooving in the reviewed sheet**, so an app should not describe
grooving as a source-mandated item without a project requirement/input. A clear
explicit choice is necessary if it is to enter a grooving total.

The bridge-side joint is explicitly premolded, sealed, and not doweled. The
derived geometric span is W/cos(z). The separate roadway joint is doweled and
conditional on concrete roadway. At the roadway end beyond the rails, its
derived span is WB + 1 ft. Keep the two joint types and the conditional item
separate rather than adding them indiscriminately to one expansion-joint total.

## Remaining input/approval boundaries

- Select a source family first; restrict rail choices to that family.
- Enter roadway surface to control the conditional roadway joint.
- For SDBE-1A, explicitly select whether the exposed bare surface is to be
  reported as required grooving; the reviewed sheet alone does not decide it.
- Preserve legacy mode separately when exact AI 1.2 quantities are desired.
- Flag the SDBE-1 strip-fit failure and source/provisional status rather than
  extrapolating a hidden quantity rule.
- The earlier SDBE-1 per-side 33.5-in label conflicts with its 37.5-in overall
  width label. SDBER-1's title and dimensions corroborate the 37.5-in family,
  but do not erase the inconsistent label in that slab-sheet download.

These observations establish a bounded dimension/quantity basis, not project
approval, structural design, or an authoritative pay-measurement interpretation
where the drawing gives geometry but no printed area equation.
