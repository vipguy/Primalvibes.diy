# Claude browse + vibes debug helpers

This folder contains one-off debug scripts used while Claude is “live coding” against a running dev server and inspecting `console.log` output in the browser.

- Purpose: ad‑hoc helpers for Claude’s live browsing/loop workflows and local debugging.
- Not CI tests: these files are not part of the test suite and should not run in CI.
- JavaScript on purpose: files may remain plain JavaScript (e.g., `.spec.js`). Converting to TypeScript is neither required nor desired here.
- Usage: intended to be run manually against a locally running dev server for fast, iterative debugging convenience.

Tip: the root `playwright.config.js` points its `testDir` at this folder so you can run these helpers with Playwright when needed. Keep them lightweight and focused on reproducing issues while Claude iterates.
