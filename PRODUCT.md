# Roadway design utilities

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain HTML, CSS, and JavaScript, approved by the user. The user requested one portable file: open Modernized/JB-1.html in a browser on Mac or Windows. Styles and scripts are embedded; no companion assets, hosting, account, network dependency, or installation. Project inputs are explicitly saved in separate JSON files.

## Product Purpose

Modernize the supplied legacy roadway design programs, starting with JB-1, while preserving their calculation behavior and documenting its evidence.

## Users

The owner of these roadway design programs. Roadway quantity calculation is the inferred primary task; broader distribution is undecided.

## Operating Context

The user identifies JB-1 as a Mississippi MDOT program. The supplied executable identifies itself as version 5.0, revised October 10, 2011. Its native header is 32-bit x86 despite its filename.

## Capabilities and Constraints

The original accepts project information and pipe dimensions for four box sides. Its report includes box dimensions, concrete after pipe-opening deductions, reinforcing steel, and bar schedules A1 through F. Recover these rules from the executable; do not claim compliance with current MDOT drawings without separate verification. Preserve original files. Save modern work under Modernized/JB-1. The agreed interface puts inputs beside a junction-box diagram and printable results.

## Evidence on Hand

JB-1(64).exe SHA-256: 99a2e4c39ffcbe4de55eef8b47d0bbcd465a15b0f849081780c0fd19596bd462. Source code and applicable drawing edition have not been supplied. REA/Hopper static analysis is available; a Windows test PC is reachable.

## Product Principles

- Keep calculation rules separate from presentation.
- Preserve and document the legacy baseline before changing engineering behavior.
- Keep dimensions and units explicit.
- Make invalid or unsupported input visible.
- Keep the first version self-contained and offline.
