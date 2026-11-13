# Original Windows applications

This folder preserves the original 23 EXEs and 16 supporting DLLs. Their contents are unchanged by the repository reorganization. Keep them together: many EXEs require the SDL and GCC runtime DLLs alongside them.

These are 32-bit Windows binaries, including EXEs with `(64)` in their names. They are retained for reference and recovery; the modernized HTML apps at the repository root do not need them.

When running an original application, use this folder as its working directory and keep any project or report files it creates. Recovery scripts and evidence are stored separately under `Modernize Source Code/<app-name>/evidence/`; historical paths in those records describe the original analysis environment.
