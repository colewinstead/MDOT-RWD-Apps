# JB-1 calculation recovery

Target: `JB-1(64).exe`, SHA-256 `99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462`.
Header: PE32 / x86. Embedded title: JUNCTION BOX PROGRAM JB-1, VERSION 5.0 (64 BIT), revised OCT 10, 2011. The executable header establishes a 32-bit target despite its displayed version label.

These are **static observations of the shipped executable**, translated into equations. They establish legacy implementation behavior, not present-day MDOT requirements. The user identifies the program as Mississippi MDOT software; the executable does not supply the governing drawing revision. Source code was not recovered. “BASIC” numbers below are numeric runtime source-line markers stored at virtual address `0x5be280`, not recovered source text. Runtime comparisons belong in a separate validation record.

## Evidence and reproduction

`native-disassembly.txt` was produced with the installed Xcode `llvm-objdump`:

```sh
xcrun llvm-objdump -d --no-show-raw-insn --x86-asm-syntax=intel 'JB-1(64).exe'
```

Address notation is the PE virtual address, image base `0x400000`. For addresses within `.text`, file offset = VA minus `0x400c00`; `.text` begins at VA `0x401000`, original file offset `0x400`. `.rdata` begins at VA `0x498000`, original file offset `0x96800`.


## Inputs and storage

Pipe span, rise, and thickness use inches. Skew uses degrees. Height input and result dimensions use decimal feet. Concrete uses cubic yards; steel uses pounds; bar lengths use inches. Side 1 is the outflow. No CRS or survey-foot interpretation is involved in these local dimensions.

The executable uses float32 variables and arrays, with x87 extended calculations and some float32/float64 local temporaries. The reconstruction uses `Math.fround` at recovered single-precision stores and JavaScript double arithmetic between stores. It does not emulate the x87 extended exponent/mantissa for every operation; runtime comparison is required to characterize any remaining rounding difference.

Globals hold 32-bit pointers to descriptors; descriptor offset `+0` holds a pointer to float32 element storage. For the pipe arrays, descriptor metadata initialized at `0x40b15e` onward is lower bound 0, count 6, stride 51 at offsets `+0x10/+0x14/+0x18`; lower bound 0, count 51, stride 1 at `+0x20/+0x24/+0x28`. Thus pipe element address = data pointer + `4*(51*side+boxIndex)`.

| Global VA | Meaning |
| --- | --- |
| `0x5bebac` | Pipe span array |
| `0x5bebb0` | Pipe rise array |
| `0x5beb9c` | Skew degrees array |
| `0x5beb98` | Skew radians array |
| `0x5beba0` | Pipe thickness array |
| `0x5beba4` | Width array, initially inches, later feet |
| `0x5beba8` | Thickness copy, sorted descending |
| `0x5bebb4` | Current box input-array index, scalar pointer |
| `0x5bebc0` | Current output box index, scalar pointer |
| `0x5bebc4` | Side iterator, scalar pointer |
| `0x5beb94` | Height feet array, also reused for temporary height candidates |
| `0x5beb28` | W1–3 feet result array |
| `0x5beb30` | W2–4 feet result array |
| `0x5beb34` | Height feet result array |
| `0x5beb38` | Net concrete cubic yards result array |
| `0x5beb3c` | Steel pounds result array |

One-dimensional result array element address = descriptor data pointer + `4*outputIndex`.

## Recovered equations

Let `s_i`, `r_i`, `t_i`, and `a_i` denote span, rise, thickness, and skew of side i. Inputs and final assignments use float32. The original pi constant is **3.141593**, not `Math.PI`.

### Thickness suggestions

The original suggestion routine compares rise and span at BASIC 4600 (`0x4213c8`–`0x42152d`). Circular pipes use `t=s/6*0.5+1` at BASIC 4620 (`0x4216f1`–`0x42170d`). Noncircular pipes use the table below at BASIC 4650–4725 (`0x42179f`–`0x4228f8`). Zero span forces zero thickness at BASIC 4730. These are editable suggestions, not substitutes for supplied pipe dimensions.

| Noncircular span (in.) | Suggested thickness (in.) | Opening deduction (cy) |
| --- | --- | --- |
| 22 | 2.5 | 0.053 |
| 29 | 3 | 0.087 |
| 36 | 3.5 | 0.129 |
| 44 | 4 | 0.195 |
| 51 | 4.5 | 0.245 |
| 58 | 5 | 0.318 |
| 65 | 5.5 | 0.394 |
| 73 | 6 | 0.489 |
| 88 | 7 | 0.688 |

### Widths

At BASIC 130 (`0x40d7f4`–`0x40d80c`), `theta_i=f32(a_i*3.141593/180)`.
At BASIC 140–150 (`0x40da3c`–`0x40dce2`), `W_i=max(30,f32((s_i+2*t_i)/cos(theta_i)+21))` inches.
Even an absent pipe initially has a 30-inch side width. Opposing pairs become their maxima at BASIC 180–190 (`0x40deb8`–`0x40e5cd`): `W1=W3=max(W1,W3)` and `W2=W4=max(W2,W4)`.
Widths 1 and 2 convert to feet at BASIC 500 (`0x411147`–`0x4113fa`); widths 3 and 4 convert at BASIC 8010 (`0x424853`–`0x424b06`). Each division by 12 stores float32.

### Minimum height

At BASIC 6010 (`0x422be3`–`0x422d86`), candidate 1 is `r1+2*t1+12` inches.
At BASIC 6020/6030/6040, candidates 2–4 are `r_i+2*t_i+12+t1`. At BASIC 6021/6031/6041, an **exact equal-rise comparison** with side 1 removes the added `t1` (`0x42316e`, `0x423727`, `0x423ce0`). This comparison is rise equality, not full pipe-size equality.
Candidates are copied and sorted descending at BASIC 6050–6120; BASIC 6130 (`0x424690`–`0x424756`) sets height to largest candidate / 12, stored float32. The original then offers a manual height replacement.

### Concrete

Maximum thickness is obtained by copying then sorting descending at BASIC 240–300 (`0x40ee19`–`0x40f6c7`), irrespective of which side controls width.

At BASIC 310 (`0x40f747`–`0x40fd8a`), with W1/W2 still in inches and H in feet:

```
gross_in3 = 5*W1*W2
          + (W1-12.5)*(W2-12.5)
          + W1*W2*(maxThickness+6)
          + (W1+W2-12)*(12*H-(maxThickness+6))*12
```

The standalone `(W1-12.5)*(W2-12.5)` term is what the executable computes; no additional multiplier is inferred. Recovered intermediate stores are preserved in `calculations.js`. BASIC 320 (`0x40fdbc`–`0x40fe49`) divides the float32 gross cubic inches by 46656 and stores float32 cubic yards.

BASIC 360 (`0x41016c`–`0x410176`) compares span and rise. When equal, BASIC 370 (`0x4101ca`–`0x41038d`) accumulates `((s_i/2+t_i)^2*3.141593*6)/46656`. The pow helper receives x87 exponent 2; its result is multiplied by extended constants pi and 6 then divided by 46656. An all-zero absent pipe contributes zero.

When span differs from rise, BASIC 390–465 (`0x4103f4`–`0x410f72`) selects the fixed span-only table above. BASIC 470 accumulates it. The original does not derive this deduction from entered rise, thickness, or skew. The reconstruction explicitly reports that limitation. Unsupported spans can leave a previous temporary value in the old program; that legacy state leakage is not reproduced. BASIC 490 (`0x411042`–`0x411115`) subtracts accumulated deductions from gross cubic yards.

### Bars and steel

Widths here are feet. Bar lengths and products are float32.

| Mark | Count | Length (in.) | Native source |
| --- | --- | --- | --- |
| A1–A4 | 2 if side has pipe; else 0 | `sqrt((6*W_i+2)^2+196)` if pipe; else 0 | BASIC 8030/8060/8070, `0x424c67`–`0x4252b7` |
| B | 2 | `12*W1-6` | BASIC 8090, `0x425321`–`0x42541d` |
| C | 2 | `12*W2-6` | BASIC 8100, `0x42544b`–`0x425547` |
| D | 4 | `12*H-6` | BASIC 8110, `0x425575`–`0x425631` |
| E | `2*(floor(12*W1/9+0.5)+1)` | `12*W2-4` | BASIC 8120, `0x42565f`–`0x42580e` |
| F | `2*(floor(12*W2/9+0.5)+1)` | `12*W1-4` | BASIC 8130, `0x425840`–`0x4259ef` |

The native helper at `0x45a05c` performs `fsqrt`; `0x496520` is an import thunk through IAT `0xa48a08` to `msvcrt.dll!floor`. This establishes the count rounding as **floor(x+0.5)** before adding one and doubling; it is not ceiling or nearest-even.

BASIC 8150/8170–8220 (`0x425b2b`–`0x426045`) multiplies count and length for each mark, storing the products float32, then sums and stores float32 total bar inches. BASIC 8230 (`0x426077`–`0x4260bf`) computes `steel_lb=f32(total_inches*0.055663+4)`. No governing origin is supplied for either constant or the added four pounds.

Final result arrays: lengths A1–A4 at globals `0x5beb40`, `44`, `48`, `4c`; B–F at `0x5beb50`, `54`, `58`, `5c`, `60`. Counts A1–A4 at `0x5beb64`, `68`, `6c`, `70`; B–F at `0x5beb74`, `78`, `7c`, `80`, `84`.

## Modern validation policy, separate from legacy behavior

The new calculation API requires four complete pipe records, numeric finite values representable as nonzero float32 where nonzero was supplied, a real outflow on side 1, positive active pipe span/rise/thickness, all four zeros for an absent side, and skew strictly between -90 and 90 degrees. It rejects unsupported noncircular span keys, manual height below the recovered minimum, nonfinite results, and nonpositive net concrete. The old program's permissive text conversion, invalid-input continuation, and stale lookup-state behavior are not compatibility requirements.

`defaultThickness(span,rise)` exposes only the recovered suggestions. It does not infer thickness from a governing current pipe specification. `supportedNoncircularSpans` lists the original keys; the original code does not establish acceptable rise ranges or approved combinations for those spans.

## Outstanding evidence limits

- Four synthetic cases were executed in the original Windows EXE. All92 checked stored float32 values match exactly; see VALIDATION.md and the retained raw result bytes. This is bounded characterization, not an exhaustive engineering validation.
- No current MDOT standard drawing, material specification, bar-size designation, cover requirement, structural design criterion, or official review was established by this static recovery.
- The application computes quantity/bar schedules under inherited legacy rules; it does not establish structural adequacy or current agency acceptance.
- IEEE float32 stores are emulated, but full x87 extended arithmetic is not. Compare printed results and stored outputs before claiming numerical parity.

## Project totals

BASIC1330/1331 accumulates boxes in input order, storing float32 after every addition. Steel: global0x5bec08, add0x41a723, store0x41a729. Concrete: global0x5bec0c, add0x41a7de, store0x41a7e4. `totalQuantities` preserves this order and precision for both screen and report. Totals are supported by static arithmetic evidence and an IEEE754 boundary regression; no original grand-total output file was generated.
