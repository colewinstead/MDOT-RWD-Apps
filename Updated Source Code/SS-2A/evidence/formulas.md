# Recovered SS-2A quantity engine

Static recovery of `ss-2a(64).exe`, SHA256 `31b10c65b0f06e9d8e9c4c46e3236759842b2613af5166e3c6a68fb8b5ca9b0b`. This documents implementation behavior, not a selected current design standard. References are original virtual addresses in native-disassembly.txt and the retained REA/Hopper pseudocode in rea-evidence.json. No original BASIC source is claimed.

## Units and storage

Inputs length L, width W and height H use decimal feet. Quantity outputs are cubic yards concrete and pounds reinforcing steel. Pipe menu sizes are inches. Station and roadway side are report metadata and do not enter formulas. The original input string array descriptor is at global0x5b9b4c, with field5 length,6 width,7 height,8 pavement. Current inlet index is stored at the pointer0x5b9b50. Final concrete and steel array descriptors are0x5b9b44 and0x5b9b48; their first word points to float32 data and element0 is unused.

Let f denote an IEEE754 float32 store. The engine parses width numerically without first storing it to float32; the original VAL function returns x87 extended precision. It replaces height with h=f(H−0.5) at BASIC1031–1033, addresses0x40edc4–0x40f047. Later quantity expressions use this calculation height. The half-foot subtraction is retained, not reinterpreted as a governing cover criterion.

## Length constants

| L ft | Base concrete ft³ | Base steel lb | Concrete-pavement steel addition lb |
|---|---|---|---|
|5|14.611|121|73|
|10|38.641|231|100|
|15|62.671|341|127|

The concrete bases are stored float32 at0x40ea2d,0x40ebc9,0x40ed65. Base steel constants are at0x40ea5f,0x40ebfb,0x40ed97. Pavement constants are at0x4103a8,0x410569,0x41072a.

## Concrete and steel

Gross concrete is:

`f((W*h + 5.5*W + 6*h + f(baseConcrete))/27)`

BASIC1050–1070,0x40f268–0x40f986. The program stores diagnostic component products in float32, but its actual result expression recomputes the products before the final float32 store; the engine preserves that distinction.

The original round-down helper at0x491120 jumps through IAT0xa43a08 to `msvcrt!floor`. BASIC1040 computes integer-count intermediates `f(floor(W+.5))` and `f(floor(h−1.58+.5))`. These feed the steel expression at BASIC1080–1100,0x40f9b2–0x40febd:

`grossSteel=f(W*8.68 + h*9.350001 + f(floor(W+.5))*3.79 + f(floor(h−1.58+.5))*7.57 + baseSteel)`

The native extended-precision constant really is **9.350001**, not9.35. Pavement Y adds the table's fixed steel amount to the stored grossSteel, with a final float32 store. N adds none. No extra concrete is added for the pavement flag. There is no opening deduction from reinforcing steel.

## Pipe-opening deductions

Menu IDs1–11 are circular15,18,24,30,36,42,48,54,60,66,72inches. IDs12–19 are arch22×13,29×19,36×23,44×27,51×31,58×36,65×40,73×45inches.

Corresponding concrete deductions in yd³ are:

`.0384,.0534,.091,.1383,.1955,.2627,.3398,.4267,.5236,.6304,.747,.053,.087,.129,.185,.245,.318,.394,.489`

These are float32 constants assigned from0x416bb6 through0x418c32. In particular, **44×27 arch is0.185**, not a value inferred from another program. The test independently extracts all19 actual float32 immediate values from the disassembly.

The original repeats one deduction for every selected opening and accumulates f(previous+constant) in selector order at0x418e16–0x418e7a. Its stored total is subtracted from stored gross concrete at0x410a37, with another float32 store. The modern engine preserves opening-array order and repeated addition rather than replacing it with multiplication. Empty opening lists give no deduction.

## Project totals and original report scope

Grand totals add stored inlet quantities sequentially with a float32 store after each addition at0x415d0f and0x415dc7. SS2.totals follows that accumulation order.

Although the introductory screen mentions a bar list, the recovered output path and actual saved original report contain quantities and pipe deductions without a reinforcing-bar schedule. The new engine does not invent bar marks, lengths or counts.

## Modern safeguards and precision limits

The engine rejects unknown length/pipe choices, nonnumeric/nonfinite values, width≤0, height≤0.5ft, malformed pavement flags and opening records, noninteger/zero counts, and calculations leaving nonpositive or nonfinite concrete/steel. It caps50openings per inlet as a modern input/computation safeguard; this is not an agency design limit or claim about the original array capacity. Input objects are never mutated.

JavaScript doubles plus explicit float32 stores do not emulate every x87 extended-precision intermediate or legacy decimal-string conversion. Runtime exact-byte comparisons establish bounded compatibility. Display rounding never feeds the calculation or project totals.
