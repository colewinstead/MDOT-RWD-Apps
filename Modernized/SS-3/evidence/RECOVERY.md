# SS-3 / SS-4 recovery ledger

Target: `ss-3(64).exe`, SHA-256 `130e6e3abf1e01bc355617641b11e3dc98062d9c8f2398ab85b318b1c913f00b`.
PE32 x86 despite the filename. Embedded title: Storm Sewer Inlet Calculations, version 3.0 (64 BIT), October 10, 2011.

## Observed static evidence

REA/Hopper opened a digest-verified private copy. Retained records are in `rea-evidence.json`; session snapshot is `analysis-snapshot.json`. No decompiled original source is claimed. The monolithic BASIC program was read as native x86 assembly using the installed Xcode llvm-objdump; the complete disassembly is retained in `native-disassembly.txt`.

- Height prompt inventory: `ev_ad91e96ed600f4fad96f8e1dd875f5665e3bea93c4d469748d75873041c65c6a`.
- First height-prompt reference at `0x40dad0`: `ev_78f9320cb0c0fc8958c9cc148e959502fd9b12064bd5c7720cdc414b0ddf731d`.
- Hopper containing procedure `sub_407a7d`: Consult the retained resolve_containing_procedure record. Hopper does not expose complete body ranges here.
- SS-3 concrete rate, double at `0x48ccc0`, bytes `5a643bdf4f8dc73f` = 0.184: `ev_96558ceece2b45ba90eed21ba1750ab66c085777e78efc97c0803cf85fc3bffe`.
- SS-4 concrete rate, double at `0x48cee8`, bytes `ae47e17a14aec73f` = 0.185: `ev_d8f78d9475aaaf96dc7da724da95b617d220bb579b07279306deafd20fa90280`.
- SS-3 height-product instructions starting `0x413899`: `ev_dddeccd82678d28f8f4567c4bf99cd840d9f27d189afacd9b019cd9882007c54`. SS-4 starting `0x415a92`: `ev_4bd9979d6cbf5348aaca8b36c9dbc3e587b37a5d65088f16bf0b16a1f4008370`.

## Recovered calculation path

Global slots contain pointers to single-precision values: `0x5b2b4c` baseline height, `0x5b2b50` concrete, `0x5b2b54` reinforcement, `0x5b2b5c` concrete height addition, `0x5b2b60` reinforcement addition, `0x5b2b74` entered height, `0x5b2b78` height difference. SS-3 grate/frame pointers `0x5b2b3c`/`0x5b2b40` are set to 200/244 lb at `0x409f2d`/`0x409f8a`.

The SS-3 branch contains 19 constant triples (baseline height ft, concrete yd³, steel lb) from `0x40d7c7` through `0x412320`. They are transcribed in pipe-menu order in `calculations.js`. The tests independently extract all 57 immediates from the retained assembly and compare their actual float32 values with the engine. SS-4 sets reinforcement to 31 lb at `0x413a3c`; its four baseline-height/concrete pairs run from `0x41483b` to `0x415560`.

Let f(x) be an IEEE754 float32 store. Input height and table constants are stored as float32. At `0x41268a` (SS-3) or `0x415916` (SS-4), d = f(height − baseline height). A positive difference produces:

- SS-3 concrete addition = f(d × 0.184); steel addition = f(d × 17).
- SS-4 concrete addition = f(d × 0.185); reinforcement remains 31 lb.
- Final quantities are f(baseline quantity + stored addition), at `0x412767`/`0x4127d1` or `0x4159f3`.

The original zeros additions before each inlet (`0x40aad2`/`0x40ab2f` and SS-4 entry); additions are not accumulated across inlets. Tables already include deductions for **one** selected pipe opening. No extra opening geometry, bar schedule, strength check, or design criteria has been inferred.

## Presentation and validation decisions

Below-baseline heights are rejected by the new input validation. The original accepts them and keeps baseline quantities; its labels call these minimum heights. This is an explicit new safeguard, not a recovered acceptance rule. Valid heights retain the original formulas. Decimal baseline heights are preserved exactly as encoded, including 4.084 and 4.468; no geometrical or fractional-foot replacements are made.

The new project schedule sums unrounded per-inlet quantities in JavaScript doubles. The original prints individual entries; no recovered grand-total accumulation rule is claimed. Grate/frame weights remain separate from reinforcing steel, and are not reported for SS-4. Display rounding does not feed calculations.

REA static observations establish bytes, strings and references, not execution. Windows characterization is separately recorded in VALIDATION.md and its fixtures. No current governing drawing edition, structural adequacy, independent design-standard compliance, or field acceptance was evaluated.
