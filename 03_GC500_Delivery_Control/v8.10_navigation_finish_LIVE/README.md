# v8.10 — truthful reference and day addresses

Author: Andrew Fisher · 2 Oct 2026

**Focused scope ready for root integration. Not published.** The final combined release checks, release marker and publication remain with the release owner.

A missing reference link previously left the prior reference drawer and scrim open. An impossible day such as `#day/2026-02-31` silently showed another day's deliveries while retaining the impossible date in the address and viewing state.

The patch closes the old drawer, clears its selection and opens Equipment with an explicit missing-reference notice. Invalid day dates open Today with an explicit notice and no phantom selected day. Calendar-valid dates outside the programme also say why Today was opened. The rejected history entry is replaced with its actual destination; normal Back/Forward remains intact. Empty reference suffixes, encoded newlines and malformed URI escapes cannot bypass the guards.

Valid references and available days keep their original route bodies. This includes empty programme days. The ISO check accepts real leap dates; a valid leap day can be routed when present in the calendar, and a date outside this job's programme is labelled as unavailable rather than invalid.

All page bytes outside the added guards and `route()` are unchanged, including Claude's frozen v8.05 map/Money work, DATA, calculations, CSS and print code. These changes concern viewing state only. No service record was written.

## Frozen source and private candidate

- Base: live v8.07 plus exact frozen Claude v8.05 commit `5fac75b`, scrubbed with the official toolchain. SHA-256 `36d27b553b9d2ee8c221b155d49d760d02fd225645653eaaec9f3637fd3789ad`.
- Patch: `patch_v810.py`, SHA-256 `14c350a2c247dc0e1def8d20cbe91c31265c2e3bcd1ae6826d4a8df42b21c1da`.
- Helper: `navigation810_src.js`, SHA-256 `70d9fc6e45d6910b58910f83c5b80a54b0546f521b00a399770e5be5e5d104bc`.
- Private candidate: `/workspace/private-navigation-quality-02Oct2026/v810/candidate810.html`, 9,105,084 bytes, SHA-256 `0344325c5fa32798a64cc58ee686d954fdc9d0cf947cb97cc43c6595a9873611`.
- The candidate deliberately retains the prior release marker; root adds the final marker after integration. Official attribution scrub is byte-identical.

## Validation

- 42/42 native tests: exact source guards and route bodies, leap-year/calendar validity, empty/missing/malformed/encoded-newline addresses, safe history completion, record sentinel preservation and patch refusal without changing input.
- Phone 27/27 and desktop 27/27 actual-browser checks: keyboard Open/Escape, stale drawer removal, explicit notices, valid and empty days, malformed addresses, Back/Forward and exact shared-document preservation.
- Official static checks pass: eight inline scripts parse, no new keys or edit token.
- Final phone/desktop screenshots visually inspected. Full private results and screenshots are in `/workspace/private-navigation-quality-02Oct2026/v810/`; summary is `evidence/focused_summary.json`.

Both browser tests use the public view and block every non-GET request. The optional Google tile-session POST is deliberately aborted; no operational write was attempted. No external Navigate link or Showcase was opened.

Run from `03_GC500_Delivery_Control/`:

```sh
python3 v8.10_navigation_finish_DRAFT/patch_v810.py <805-on-807-page.html>
BASE=<markerless-805-base> PAGE=<markerless-810-candidate> node v8.10_navigation_finish_DRAFT/evidence/navigation810_native.cjs
PAGE=<candidate> PRIVATE_OUT=<private-evidence-directory> node v8.10_navigation_finish_DRAFT/evidence/navigation810_browser.cjs
MOB=1 PAGE=<candidate> PRIVATE_OUT=<private-evidence-directory> node v8.10_navigation_finish_DRAFT/evidence/navigation810_browser.cjs
```

The browser harness needs the installed Playwright module and Chromium path as documented by the shared toolchain. Browser checks may run on the final release-marked page; the native byte-preservation comparison uses the markerless base/candidate pair above.
