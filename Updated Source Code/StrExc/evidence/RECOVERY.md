# Legacy recovery

Source: `Legacy/strexc.exe`, 306,035 bytes, SHA-256 `e9978456ced24aca404ea9d33665d17bfdc26f36d0d24b157ef8e95075df7b63`.

Fetched from `origin/main` commit `d50008b` (add strexc legacy app) into the isolated `modernize-strexc` worktree. No original binary or DLL was changed. REA identified a 32-bit x86 PE; its static inventory/snapshot is retained as `analysis-snapshot.json`. The executable contains appended AutoIt EA06 bytecode at offset 301584. A pre-existing developer-only installation of autoit-ripper 1.2.0 recovered the single `script.au3` record without executing the binary.

Reproduce with an existing Python and autoit-ripper 1.2.0 installation:

```powershell
python 'Updated Source Code/StrExc/evidence/extract-autoit.py' --package-path '<existing autoit-ripper installation folder>'
```

The extractor verifies the executable hash, package version and single script record. It writes the recovered token stream and identity manifest. This is decompiled embedded script, not a claim that original whitespace or comments survive.

The GUI identifies Mississippi DOT (Roadway Design), Version 1.1. The script exposes station, length, pipe size, FES count and average excavation depth. It includes 11 round and 9 arch sizes. The quantity expression near the end is:

```autoit
$TOTAL = ( ( ( ( ( $D + 24 ) / 12 ) * $L * $C ) / 27 ) + ( $F * $CY * $C ) )
```

Here D is the selected diameter/span string, L is length in feet, C is excavation depth in feet, F is the count of flared ends, and CY is the selected per-size allowance. AutoIt's [datatype reference](https://www.autoitscript.com/autoit3/docs/intro/lang_datatypes.htm) documents implicit Number conversion. The [Number reference](https://www.autoitscript.com/autoit3/docs/functions/Number.htm) documents returning the leading number and ignoring subsequent text. Thus arch input 22x13 contributes a 22-inch span; the modern app stores that span explicitly.

The original rounds row output to 3 decimals and the final unrounded running sum to 2. Its accumulator is updated before validation; repeated Calculate clicks and invalid entries can contaminate it. The modern schedule instead totals the current valid rows and blocks export if any row is incomplete or invalid. It also restricts sizes to the actual table and FES to 0–2 rather than accepting unvalidated editable combo text. These are intentional safeguards.

Attempted launch using the Windows Computer Use runtime failed with `Windows failed to launch app (ShellExecuteW returned 5)`. No window was opened, no safety barrier was bypassed, and no runtime observations are claimed. AutoIt rounding at exact ties remains unverified. The retained factors and formula are static evidence, not validation against current drawings or construction specifications.
