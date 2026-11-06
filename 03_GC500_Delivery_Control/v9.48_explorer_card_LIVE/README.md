LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Explorer reference card remains reachable

Author: Andrew Fisher

READY for final integration. Not published. The final combined-page and fresh-live checks belong to the release owner.

At 1440 × 900, the native WC20 map card was taller than its available space above the minimap. Its top and Close button extended behind the Explorer header. The existing phone card already closed normally.

The parent page now gives the existing desktop card a maximum height based on its stage and native bottom clearance. Contents scroll, the existing title and Close stay reachable while scrolling, and the thumbnail yields space on a short landscape viewport. Portrait phone styles are preserved. Native Close, Escape, selection, reference content and bottom-control placement remain in use.

This uses the established same-origin iframe extension approach. The machine bundle and operational record do not change. The extension disposes observers and pending animation work when the frame is replaced, parked or its tab is hidden. Remounting reuses one stylesheet, and unchanged sizing does not create an observer loop.

`patch_v948.py` accepts the final v9.47 page or the focused v9.41 test base. It inserts one extension and one native frame-ready hook, then advances the footer. Reversing exactly those changes reproduces the original focused base byte for byte.

Validation: 14 focused checks each on desktop and phone, including WC20 and GN19 normal Close, Escape, content scrolling, minimap visibility changes, viewport resize, three departure/reopen cycles and idle observer stability. All stored state, specification data and financial models remained identical; all 17 native financial reconciliation ties passed. Zero operational writes or page errors. Screenshots were visually inspected. Independent source review covered lifecycle, scoping and observer behaviour.

The proxy was unavailable during these tests. The optional fixture harness replayed an authentic captured record and checked every supplied Explorer file against the current served machine manifest before use. Satellite imagery warnings in the private screenshots reflect that offline context. These checks do not claim a new live deployment or physical-device graphics performance.

Run `tests/browser948.cjs` under the shared browser lock with `PAGE` and `OUT948` set. The normal harness permits GET only. Optional offline variables are `STATE948`, `MANIFEST948`, `MACHINE948` and `ITEMS948`; the last points to the current manifest-verified plan-items file. Keep those private source files outside the repository. `evidence/focused948.json` contains the sanitised results and exact source/build hashes.
