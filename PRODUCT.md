# Roadway design utilities

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain HTML, CSS, and JavaScript, approved by the user. Open JB.html at the repository root in a browser on Mac or Windows, and select JB-1 or JB-2 for each box. Styles and scripts are embedded; no companion assets, hosting, account, network dependency, or installation. Project inputs are explicitly saved in separate JSON files.

## Product Purpose

Modernize the supplied legacy roadway design programs, starting with JB-1, while preserving their calculation behavior and documenting its evidence.

## Users

The owner of these roadway design programs. Roadway quantity calculation is the inferred primary task; broader distribution is undecided.

## Operating Context

The user identifies JB-1 as a Mississippi MDOT program. The supplied executable identifies itself as version 5.0, revised October 10, 2011. Its native header is 32-bit x86 despite its filename.

## Capabilities and Constraints

The app accepts project information, separate work sheet and box IDs, and pipe choices for four box sides. Its report includes box dimensions, concrete after pipe-opening deductions, reinforcing steel, and bar schedules A1 through F. JB-1 preserves recovered geometry/concrete/bar rules and uses bar-only steel weight, omitting the original fixed add-on at the user's request. JB-2 uses MDOT sheet 6506 dated August 1, 2017, and the user-confirmed convention for solid-wall infill bars. Pipe selection supplies listed span, rise and thickness. Large JB-2 pipes automatically require 8-inch walls throughout. Preserve original files under Legacy/. Save editable sources and evidence under Modernized/JB-1 and deliver JB.html at the repository root. The agreed interface puts inputs beside a junction-box diagram and printable results.

Export Excel creates a single-sheet quantity schedule matching the visible main portion of the user's reference workbook, with separate WK. SH. NO., BOX ID and LT/RT columns. Steel and total bar lengths use row formulas, and bottom quantity totals use SUM formulas for manual adjustments. Project information appears below the schedule with the notes. Pipe/standard changes are recalculated in the app; JSON remains its editable project format. Browser printing still supports PDF reports. All exports work locally from the standalone HTML.

## Evidence on Hand

Legacy/JB-1(64).exe SHA-256: 99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462. Source code and applicable drawing edition have not been supplied. REA/Hopper static analysis is available; a Windows test PC is reachable.

## Product Principles

- Keep calculation rules separate from presentation.
- Preserve and document the legacy baseline before changing engineering behavior.
- Keep dimensions and units explicit.
- Make invalid or unsupported input visible.
- Keep the first version self-contained and offline.
