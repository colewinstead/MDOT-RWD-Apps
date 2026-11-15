# Expanded calculation checks

Verified November 14, 2026 with Node.js 24.15.0:

```sh
node --test "Updated Source Code/BridgeEndPave/calculations.test.cjs"
```

All 16 tests pass. The original eight checks retain the recovered legacy
numeric results, including the historical 30/25-ft, 10-degree, 32-inch-rail
report. New checks cover 216 legal combinations of drawing family, rail,
slab thickness, roadway surface, grooving inclusion, and 0/10/45-degree skew.
Invalid family/rail combinations and nonnumeric contract choices are rejected.

## Independent geometry checks

- At 45 degrees, the actual notched slab perimeter is constructed as a polygon
  and measured with the shoelace formula. It agrees with the analytical paving
  expression for all nominal rail-base groups, rather than merely repeating
  the gross-area-minus-strip equation in the test.
- For SDBE-1, the clear-pavement quadrilateral is clipped by a half-plane at
  three feet normal distance from the skewed bridge edge. Its polygon area
  agrees with the analytical strip integration at 0, 10, 45, 80, 85, 89, and
  89.5 degrees, including strips crossing or covering the complete short end.
- The normal-strip case at 45 degrees with WB=24 ft gives 11.31 SY, rather
  than the 8.00 SY that an incorrect longitudinal-strip interpretation gives.
- The 37.5/43.5-inch SDBER profile projections remain 14.5/15.5 inches;
  the separate slab-plan allocations remain 15/16 inches. Tests prevent the
  two sets of dimensions from being substituted for each other.
- Mixed totals check each joint type and all five rail heights. A bridge-plan
  seal span does not enter the premolded-expansion-joint total. Rail runs remain
  two ten-foot lengths; they are not multiplied by the bridge-skew factor.

## Zero-skew hand cases

W1=W2=12 ft. Grooving is explicitly included. Roadway is asphalt, so the
conditional roadway expansion joint is zero. All rail quantities are 20 LF.

| Drawing / rail | Paving SY | Grooving SY | Bridge premolded joint LF | Bridge-plan seal span LF |
| --- | ---: | ---: | ---: | ---: |
| BE-1 / 33.5 in | 57.59 | 0.00 | 0.00 | 0.00 |
| BE-1 / 43.5 in | 57.78 | 0.00 | 0.00 | 0.00 |
| BE-2 / 33.5 in | 57.59 | 0.00 | 26.83 | 0.00 |
| BE-2 / 43.5 in | 57.78 | 0.00 | 27.00 | 0.00 |
| SDBE-1A / 32 in | 57.59 | 54.44 | 26.83 | 0.00 |
| SDBE-1A / 42 in | 57.78 | 54.44 | 27.00 | 0.00 |
| SDBE-1 / 37.5 in | 56.11 | 8.00 | 0.00 | 24.00 |
| SDBE-1 / 43.5 in | 56.30 | 8.00 | 0.00 | 24.00 |

For concrete roadway, the separate doweled roadway joint is 25 LF for these
BE-1/BE-2/SDBE-1A cases and 24 LF for SDBE-1. Legacy compatibility mode preserves
its original single joint quantity instead of adding a roadway joint.

## Interpretation boundary

These checks verify the implemented dimensional model. The paving edge-cut
equations and exposed strip integration are derived from the reviewed geometry;
the sheets do not print every pay-area equation verbatim. See
`COVERAGE-STANDARD.md` and `COVERAGE-SPECIAL.md` for their source evidence and
limits. The grooving checkbox represents project inclusion, not a declaration
that every reference sheet requires grooving. Overlay-covered concrete is not
counted as exposed-concrete grooving. No-rail calculation is retained only in
the separately identified legacy family; no standard no-rail detail is claimed.

No additional live EXE comparisons, construction approval, or structural
adequacy checks are established by this test suite. Legacy half-cent tie
behavior remains unverified against a live AutoIt run.
