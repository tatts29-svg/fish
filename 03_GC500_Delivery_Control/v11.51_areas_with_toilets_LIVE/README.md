# v11.51 — The servicing areas on the Map explorer only with the toilets

Author: Andrew Fisher. Built on live v11.50 `13f89f19…`. LIVE 23 Oct 2026 11:24 AEST: page
`da4e1ef94fc0e7057e777d0d7425c525eb3987e019266a019523e75c67b7f0c8` (21,395,240 bytes), guarded page upload, byte for byte;
no media change. Full entry in STATUS.md. (The v11.49 claim renumbered so the footer never reads backwards.)

## Andrew's words, 23 Oct 2026 10:33, on v11.47

"you pinged the areas in all description the areas was only for The toilets".

## What changes on the Map explorer

v11.47 painted the thirteen servicing-area outlines and their captions across the whole plan on opening, over the
generators, the buildings, the VMS boards and everything else. v11.51 edits that block (`mapunits1147-script`, Codex's
v11.47) in place:

- **The selector opens on "With the toilets":** the outlines and captions draw only while the explorer's
  *Toilets & amenities* chip is pressed, and redraw as the chip is pressed or released. "All areas · separate outlines",
  "Hide area highlights" and each single area (which still zooms to fit it) stay as choices.
- **The hint says so:** "The servicing areas belong to the toilets: their outlines show while the Toilets & amenities
  filter is on, or when one area is chosen here. Area numbers match the servicing sheets; outlines group recorded
  locations, not surveyed boundaries."
- Nothing else in the block moves: the equipment symbols beside the codes, the symbols key, the fit-to-area, `#expcard`.
  The record and the crew card are untouched.

## Files

- `patch_v1151.py` — requires live v11.50 by SHA-256; eleven text edits inside the block (the default, `toiletsOn()` and
  the chip repaint, the draw guard and the single-area emphasis, the selector's choices and the hint, the handle);
  footer v11.50 → v11.51.
- `tests/test_v1151.cjs` — desktop and phone: on opening the explorer is ready with its symbols, the chip is off and
  nothing is painted, the selector sits on "With the toilets" with every area, All areas and Hide still offered and the
  hint in place; the chip pressed draws the areas within a second, released they go; one area chosen draws it alone;
  back to "With the toilets" draws nothing; "All areas" still draws on request; record unchanged, no errors, no writes.
  Screenshots: the explorer on opening (no areas), with the toilets filter on (areas), Area 1 chosen.

## Checks

- Dry build on a copy of live v11.50, scrubbed as the build is, check_page PASS; the real build from live byte for byte
  the same (`da4e1ef9…`, 21,395,240 bytes).
- `tests/test_v1151.cjs`: 10/10 desktop and phone on the build (evidence/dry/) and 10/10 desktop and phone on the live page
  after the upload (evidence/live_*_test_v1151.json; screenshots `explorer_*_live_*.png`).
- Regressions on the build: Codex's `test_v1147.cjs` 19/19, v11.44 (satellite maps) 11/11, v11.41 (where it is) 10/10,
  v11.42 (finder) 14/16 (its two north-up centre checks superseded since v11.44) — evidence/dry/regress/.
- Sweeps, desktop and phone, on the build: 27 tabs (19 shown) / 7 hashes / Back, 0 errors, 0 console, 0 blocked writes
  (evidence/dry/sweep_*.json).
