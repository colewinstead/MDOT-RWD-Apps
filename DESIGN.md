---
name: JB-1 working interface
description: Offline junction-box quantity workspace with OS-matched appearance.
colors:
  ground: '#f3f4f4'
  surface: '#fff'
  subtle: '#f7f8f8'
  ink: '#20292e'
  muted: '#57656c'
  line: '#d6dddf'
  accent: '#a74613'
  accent-hover: '#85350c'
  error: '#a22424'
  error-bg: '#fff1ef'
  focus: '#247b9a'
  pipe: '#627f8c'
  dark-ground: '#171d21'
  dark-surface: '#20282d'
  dark-subtle: '#1a2227'
  dark-ink: '#e3e9ec'
  dark-muted: '#b1bec5'
  dark-line: '#425058'
  dark-accent: '#ffb178'
  dark-accent-hover: '#ffc99f'
  dark-error: '#ffaaa3'
  dark-error-bg: '#3b2525'
  dark-focus: '#79c6e7'
  dark-pipe: '#94b3c2'
  on-accent: '#fff'
  dark-on-accent: '#24170f'
typography:
  headline:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.6rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -.025em
  section:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1.2rem
    fontWeight: 650
  title:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 1rem
    fontWeight: 650
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 16px
    lineHeight: 1.5
  label:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: .83rem
    fontWeight: 600
  note:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: .8rem
rounded:
  field: 5px
  control: 6px
  panel: 10px
spacing:
  compact: 8px
  field-gap: 12px
  panel-gap: 24px
  panel-inset: 22px
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.on-accent}'
    rounded: '{rounded.control}'
    padding: 8px 13px
  button-primary-hover:
    backgroundColor: '{colors.accent-hover}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 8px 13px
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    padding: 8px 9px
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.panel}'
    padding: 22px
  error:
    backgroundColor: '{colors.error-bg}'
    textColor: '{colors.error}'
    rounded: '{rounded.control}'
    padding: 14px 16px
---

# Design System: JB-1 working interface

## Overview

**Creative North Star: "Contemporary transport reference manual"**

Neutral surfaces, measured divisions, aligned quantity tables, and a keyed geometric diagram make the inherited calculation state inspectable. Orange identifies the main action and outflow, while subdued rules organize a dense working interface.

This is a code-led, local HTML/CSS/JavaScript tool. System UI typography and light or dark colors follow the operating system; no external fonts or raster assets form part of the interface. The documented visual scope is Modernize Source Code/JB-1, not a brand system for unrelated utilities.

**Key Characteristics:**
- Inputs alongside a larger diagram and quantity workspace on desktop.
- Aligned tabular numbers with explicit units.
- Flat bordered panels and restrained action color.
- OS-matched appearance and a separate printable report.

## Colors

A restrained orange action color sits within cool neutral working surfaces. Frontmatter colors use the source light values; `dark-` counterparts replace the same roles under `prefers-color-scheme: dark`. On-accent text changes with that theme as well.

### Primary

- **Action orange** (`accent`, `accent-hover`): Print report, the JB identity tile, link text, selection, checkbox state, and schematic outflow.

### Neutral

- **Working ground** (`ground`): page background and disabled inputs.
- **Panel surface** (`surface`): inputs, results, fields, and diagram interior.
- **Diagram recess** (`subtle`): schematic background and secondary button hover.
- **Primary ink / supporting ink** (`ink`, `muted`): quantities and headings / labels, notes, and dimension rules.
- **Division stroke** (`line`): panel edges, field borders, table rules, and schematic wall fill.
- **On-accent ink** (`on-accent`, `dark-on-accent`): readable primary-action and identity text.

### Functional colors

- **Error red** (`error`, `error-bg`): input error borders, alert surface, and removal action.
- **Focus blue** (`focus`): visible keyboard outline.
- **Pipe blue-gray** (`pipe`): pipe outlines and dashed centerlines; these identify geometry rather than a secondary brand color.

**The State Before Quantity Rule.** Invalid current inputs replace the current diagram and quantities with an error; invalid boxes also suppress project totals and disable Save and Print.

## Typography

**Interface font:** the platform system UI stack, shared by headings, body copy, controls, and schematic text. There is no separate display face or font download. This is the approved practical-app choice, not a display-font recommendation for other surfaces.

### Hierarchy

Frontmatter records the reused roles. The app name is the headline; section titles use the section role; bar-list and quantity headings use the title role. The selected-box results heading is a local variation (1.35rem). Body text inherits the base line height; labels are compact and semibold, while notes use supporting ink. Numeric input, tables, quantities, and totals use tabular numerals.

**The Aligned Numbers Rule.** Use tabular numerals for numeric fields, quantities, and tables; keep units adjacent to their values or column headings.

## Layout

The desktop workspace has a narrow editing column (minmax(370px, 430px)) and a flexible results column, within a centered maximum width (1540px), a gutter (24px), and panel gap (24px). Input-panel inset is the frontmatter panel inset; results use a wider inset (24px 28px). Project fields use two columns, with project number spanning both. The four-side pipe table remains horizontally scrollable rather than squeezing its fixed minimum width (340px).

At 1050px and below, the input column narrows (350–390px), workspace gap/gutter become 16px, and quantities form one column. At 820px and below, panels stack in a container capped at 720px; header actions wrap and quantities return to two columns. At 460px and below, quantities become one column, header actions share the available row, panel inset becomes 18px 14px, and the redundant top unit note is hidden. The SVG retains its viewBox, with diagram dimension/side labels enlarged to 22 SVG units and outflow text to 20 for mobile legibility.

Print switches to a separate report, hiding the working interface. Its white page, black text, 16mm page margins, 19pt report title, 13pt section headings, 9pt tables, and 8pt notes support quantity/bar schedules for every valid box. Individual box report sections avoid internal page breaks.

## Elevation & Depth

Panel hierarchy comes from ground, surface, diagram recess, and one-pixel divisions. No box shadows, gradients, overlays, or animated entrances are implemented. Buttons move downward by one pixel while pressed; there are no timed transitions.

**The Flat Surface Rule.** Separate regions with surface tone and thin borders; the built interface uses no box shadows.

## Shapes

Fields and the identity tile share the field radius; buttons, the diagram recess, and alerts share the control radius. Main panels use the panel radius. Thin rectangular table rules and literal SVG geometry carry the technical character. The diagram uses solid pipe outlines, dashed axes, dimension ticks, numbered sides, and an outflow arrow.

## Components

### Buttons and file actions

Primary Print / PDF uses action orange and on-accent ink; Open/Save/Export Excel/Add use surface with an outline. The four file/report buttons use two columns on phones. Hover changes fill/border, active shifts by one pixel, and disabled controls use half opacity without movement. The plain text removal action uses error ink. Keyboard focus is a three-pixel focus-colored outline offset by three pixels. File operations use the native file picker/download; removal and replacing unsaved state use native confirmation dialogs.

### Inputs / Fields

Persistent compact labels sit above bordered surface-colored fields. Numeric values use tabular figures. Disabled fields use ground, supporting ink, and reduced opacity. Invalid fields receive an error border when flagged; the main alert contains correction text. Checkbox controls use the accent and the required outflow checkbox is disabled. No custom input widget library exists.

### Panels / Tables

Input and result panels have a thin division-stroke border. Quantity rows align supporting labels with semibold values. Bar schedules right-align numeric columns and retain horizontal overflow. Section labels stay close to their related data; the project summary follows a ruled division.

### Diagram

An inline SVG uses the same ink and surface roles as the UI. The shared JB app provides a per-box JB-1/JB-2 selector and listed pipe-size choices. Side numbers connect the input rows with the plan, and orange marks outflow. Pipes and the outflow arrow follow entered skew: zero points along the wall's outward normal, positive turns clockwise in plan, negative counterclockwise. Pipe widths use their actual width before rotation, with the inner end cut along the wall. JB-2 wall thickness follows the selected pipes' 6/8-inch requirement. The viewBox expands when needed to keep the drawing visible. Keep its visible schematic disclaimer and accessible title/description. Geometry is centered for illustration; it is not a construction drawing.

### Error feedback

The alert uses error ink, a thin error border, a softly tinted error surface, and a live alert role. It replaces the current result block rather than leaving stale quantities visible. Invalid projects cannot be saved or printed through the action buttons.

## Do's and Don'ts

### Do:
- Do preserve explicit units and diagram side numbers.
- Do follow the operating system appearance with the paired light and dark colors.
- Do keep invalid calculation feedback visible and suppress invalid quantities.
- Do keep project file actions local and report printing available for valid projects.

### Don't:
- Don't present the schematic as a construction drawing.
- Don't imply current MDOT compliance or structural adequacy from this legacy reproduction.
- Don't introduce remote fonts, hosted dependencies, or shipping raster assets into the offline interface.
