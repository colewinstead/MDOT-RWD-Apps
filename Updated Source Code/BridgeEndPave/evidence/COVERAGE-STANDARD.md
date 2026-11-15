# Standard drawing quantity audit

Reviewed November 12, 2026. Scope is paving area, transverse-grooving area,
expansion-joint lengths, and rail lengths. Concrete volume, reinforcement,
overlay tonnage, and drainage quantities are outside the clarified scope.

## Exact source

User PDF: `C:\Users\johnc\Downloads\Roadway Design Standard Drawings.pdf`.
It has 220 pages, 42,040,834 bytes, and SHA-256
`d7d1283a65316ad5da0a39eab459ccfda15f80687a72c7edbb6f4a8daa6ecb99`.
Physical PDF pages 10-13 contain BE-1, BE-2, BER-1, BER-2 (sheets 6007-6010),
all visibly issued August 1, 2017. The full sheets and enlarged plan edges,
sections, and rail profiles were rendered and read visually with PyMuPDF.
They are scanned pages, so blank PDF text extraction is not a negative search
for a particular note.

The official [2017 Standard Specifications, Section 501](https://mdot.ms.gov/documents/Construction/Specifications/2017%20Standard%20Specifications.pdf)
were also checked: physical PDF page 373, printed page 358, Subsection 501.04.

## Rail and slab compatibility matrix

| Slab family | Rail sheet / rail height | Overall slab width W | Rail base, each side | Nominal rail length | Source locations |
| --- | --- | --- | --- | --- | --- |
| BE-1 with overlay and sleeper slab | BER-1 / 33.5 in | WB + 2 ft 10 in | 17 in | 10 ft each side, 20 LF per end | BE-1 Plan at Bridge End and Section A-A; BER-1 Typical Section and Outside-Face Elevation |
| BE-1 with overlay and sleeper slab | BER-2 / 43.5 in | WB + 3 ft | 18 in | 10 ft each side, 20 LF per end | Same BE-1 locations; BER-2 Typical Section and Outside-Face Elevation |
| BE-2 with overlay, no sleeper slab | BER-1 / 33.5 in | WB + 2 ft 10 in | 17 in | 10 ft each side, 20 LF per end | BE-2 Plan / Section B-B and Plan at Bridge End; BER-1 details |
| BE-2 with overlay, no sleeper slab | BER-2 / 43.5 in | WB + 3 ft | 18 in | 10 ft each side, 20 LF per end | Same BE-2 locations; BER-2 details |

W1 and W2 are the crown-line-to-bridge-curb transverse widths; WB = W1 + W2.
They need not be equal. The 20-ft reference is the midpoint of the total slab
width, not necessarily the crown line. Both slab notes require A >= 10 ft and
base A/B on 20-ft mid-length. The lower sketches explicitly show zero skew,
skew with A > 10 ft, and skew with A = 10 ft.

No standard BE-1/BE-2 no-rail bridge-end alternative is explicitly shown. The
`W = WB + 12 in` label in BE-2's lower **Plan of Expansion Joints and Bridge
End Pavement** applies to the upstream *plain concrete roadway pavement*
block. It supports a normal-roadway width, not a no-rail bridge-end drawing.
The legacy program's no-rail computation can remain a separately identified
legacy/generic option, but should not be presented as a verified BE-1/BE-2
combination.

## Paving area and actual edges

Both slab longitudinal details explicitly identify `0.5(A+B)` as the pay-area
calculation length. The gross trapezoid construction envelope is therefore
`W * (A+B) / 18` SY. This is the envelope, not proof that every point inside
the rectangle/trapezoid is part of the actual paved boundary.

BE-1's enlarged plan edges visibly narrow outside the two 10-ft rail runs.
At the beginning of a rail the outside base edge projects beyond the normal
pavement edge; it is not a uniform full-W slab for the whole A/B lengths.
BER-1/BER-2 establish 17/18-in rail bases. BE-2's lower roadway plan explicitly
establishes the normal 6-in allowance on each side of WB (12 in total).

**Dimensional interpretation, not a printed pay formula:** using this normal
edge width gives the same correction model recovered from the EXE:

```
normalWidth = WB + 1 ft
railBase = 17/12 ft or 18/12 ft
outsideRailReduction = railBase - 0.5 ft
pavingSY = grossTrapezoidSY
           - ((A-10) + (B-10)) * outsideRailReduction / 9
```

The correction coefficient is 11/12 ft for BER-1 or 1 ft for BER-2. This is
the physically consistent extension of the recovered calculation to the same
17/18-in rail-base geometry; the drawing does not print the equation. Treating
the standard sheet as an explicit proof of an arbitrary whole-trapezoid area
would be equally unsupported. The source audit does not justify changing the
normal edge allowance merely because the rail height number changed.

The 10-ft rail lengths are measured along the roadway direction on the plan,
not along the skewed bridge interface. Thus rail lengths do not get a
`1/cos(Z)` multiplier. Rounding or bar-table skew limits do not change this
nominal 20 LF total.

## Expansion joints: separate locations and types

| Family / location | Explicit requirement | Quantity interpretation |
| --- | --- | --- |
| BE-1 bridge seat | Section B-B: **No expansion joint** | 0 LF at that location |
| BE-2 bridge interface | Plan and longitudinal elevation: 1-in premolded joint, poured filler, not doweled | Full interface length uses the skewed slab width; legacy model is W/cos(Z) |
| BE-1 roadway interface | Plan note: 1-in premolded joint, poured filler, doweled, **only if roadway is concrete** | Include a separate normal-transverse roadway joint for concrete; 0 for asphalt |
| BE-2 roadway interface | Same conditional requirement | Same separate roadway-joint rule |

The roadway joint is normal/transverse in the plan, so it does not receive
the bridge-skew multiplier. Its normal-roadway width is explicitly WB+1 ft
in BE-2's lower plain-concrete-pavement joint plan. Applying that same width
to BE-1 follows the normal-edge interpretation above; BE-1 does not repeat
the numerical width label at its joint line. Joint types should remain
separate in reports rather than combining doweled and non-doweled lengths
under the legacy program's one total. The exact project joint limits can
override a schematic model through the project's specified dimensions, but
must not be silently guessed from a rail height alone.

## Grooving: no zero-by-absence rule

The supplied BE-1/BE-2 sections show 1.5-in-and-variable asphalt overlay up
to the bridge end. Neither sheet explicitly marks the special SDBE-1
three-foot exposed concrete strip or prints a transverse-grooving equation.
The lack of a label alone does **not** establish that the contract grooving
quantity is zero.

Subsection 501.04 says, paraphrased:

- Grooving is measured when its pay item is included in the contract.
- For concrete/bridge-end pavements use the plan's stated grooving limits.
- When those limits are not shown, use the area bounded by the pavement
  edges and pavement length.

Exact 23-word excerpt from printed page 358 / physical PDF page 373:

> For concrete and bridge end pavements, the quantity will be computed by measuring by the limits of transverse grooving shown in the plan.

Consequently the app needs a clear contract/grooving policy. A standard
family selection alone cannot establish the presence of the grooving pay
item or whether the contract specifies an exposed strip. Useful explicit
cases are no grooving pay item (0), full exposed-concrete limits, and a
project-specified strip/area. The overlay-covered concrete surface should
not silently be treated as exposed grooving. If the contract calls for
full-width/exposed grooving, the surface excludes the actual two rail
footprints; each footprint is `10 * railBase` square feet. This deduction
is dimensional inference consistent with the legacy model, not an equation
printed on BE-1/BE-2.

The special SDBE-1's explicit three-foot strip is a different positive plan
limit and should be its own drawing-driven case. Do not transfer its strip
to these older standard sheets or transfer full-slab legacy grooving to
the special overlay family by default.

For a drawing-driven implementation that computes **exposed concrete surface
grooving**, the shown BE-1/BE-2 full overlay gives zero exposed-concrete area.
This is a positive finish-geometry convention, not a zero inferred from the
absence of the word grooving. State that convention in the result. A contract
pay-item input determines whether otherwise exposed concrete is counted;
project-specific grooving on an overlay or under another finish is not
established by these four sheets.

## Additional source details outside this scope

BE-1 has a nominal 1-ft concrete slab, 1-ft-thick by 6-ft-long sleeper slab,
filter/underdrain details, and a pay-item note including sleeper slab and
metal flashing. BE-2 has a 9-in-minimum slab and no sleeper slab. Reinforcing
and optional welded-wire-fabric arrangements appear on the sheets, with
skew-dependent bar bending tables, but no complete universal material
schedule for an arbitrary project. These details are reference-viewer
content; no volume, bar-weight, drainage, or structural-design result is
derived in this clarified quantity scope.
