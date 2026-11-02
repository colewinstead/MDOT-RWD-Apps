# Modernize Source Code

The portable apps are at the repository root: [JB (JB-1 and JB-2)](../JB.html), [SS-2A](../SS-2A.html), and [SS-3](../SS-3.html). Each HTML file works by itself. Junction-box editable sources remain in `JB-1/`.

This folder holds each app's editable HTML, CSS, JavaScript, tests, documentation, and recovery evidence. Run its `build-standalone.cjs` after source changes to regenerate the root HTML file. See the per-app README for commands and calculation limits.

The builders normalize line endings before generating security-policy hashes, so Windows and Mac checkouts produce the same portable HTML.

Original EXEs and DLLs now live in [Legacy](../Legacy/). Historical recovery records retain the paths and hashes recorded during analysis. Windows probe scripts are retained evidence for isolated test copies; they do not launch directly from the repository layout.
