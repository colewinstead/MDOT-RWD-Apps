# Repository instructions

## Single-file app delivery

- Deliver every modernized app in this repository as one self-contained HTML file under `Modernized/<app-name>.html`.
- Embed all runtime JavaScript, CSS, instructions, and required visual assets in that file. The app must work offline when opened directly in a browser on Mac or Windows, without companion files, hosting, installation, a build step, or network services.
- Keep editable sources, tests, recovery evidence, and developer documentation separately when useful. Users must only need the generated HTML file to run an app.
- Saved project files and exported reports are user data and may remain separate from the application file. Explain how to save and reopen that data.
- Whenever source changes affect an app, regenerate its standalone HTML before handing off the work. Keep packaging reproducible with existing tools and no runtime dependencies.
- Check that the standalone output contains no required companion-file references. Test it with only that HTML file available, along with the relevant calculation checks. State any browser or operating-system limitation that prevents direct-file verification.

JB-1 follows this convention: `Modernized/JB-1.html` is the portable app; `Modernized/JB-1/` contains its editable sources and development evidence.
