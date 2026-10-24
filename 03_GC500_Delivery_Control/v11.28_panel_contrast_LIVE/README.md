# v11.28 — Servicing panel tables read: one dark table, bright text, "not yet" in amber

The white under the pale text was the page's own row wash (`tbody tr{background:var(--paper)}`), which the skin's transparent
cells never covered; the v11.28 block paints the rows themselves.

Author: Andrew Fisher. Built on live v11.27 `26534688…`. LIVE line and hashes in STATUS.md.

Andrew, 23 Oct 2026, with a screenshot of the page's Servicing tab: "Also need to make this status data darker  can see
writing".

## Why it was pale

The panel wears the v11.04 race skin, which paints the servicing card dark and the table text light (names #dae9f0,
"not yet" #c4d7e1, dashes #a6c1cf, meant for its #161b1e table). On the page the table's body rows come through white
underneath, so that light text sits on white and all but vanishes. The panel's own earlier rules (slate on white) lose to
the skin on cascade order, which is why a fix inside the panel's block did nothing (first dry run, 5/7).

## What changes

A style block at the end of the page, after every skin: the table is one dark surface (the skin's #161b1e) from head to
foot, rows, cells and the done rows' dark green included, and the text on it is bright:

| Cell | Before (on white) | After (on the dark) |
|---|---|---|
| Reference name | #dae9f0 | white |
| Unit count and line | #a6c1cf | light grey (#c9dae3) |
| Column headings | white on navy | unchanged |
| "not yet" (a job not done) | #c4d7e1, 11.5 px | bold amber (#ffc97a) on a dark amber tint (#2e2410), 12 px |
| "–" (a job the line does not have) | #a6c1cf | quiet grey (#8ea3b0) |
| done hh:mm | #83efb8 | bright green (#8cf5c0) |
| done row | pale green | dark green (#13302a) |

Page-side only: the crew card is unchanged, so no tracker republish. Footer v11.27 → v11.28.

## Files

- `patch_v1128.py` — requires the live v11.27 page by SHA-256; inserts `<style id="svc1128-style">` before `</body>`, after
  every skin; footer; checks the block is last and not inside the crew card's JSON.
- `tests/test_v1128.cjs` — desktop and phone: the panel rendered from its own module inside the panel's own element so
  every skin applies, with PG01's FWF fully done and PG03's pumped: computed backgrounds of the table, a plain row, its
  cells and the heading row; computed colours of the reference name, unit line, "not yet" (colour, tint, weight), the dash
  and the done time; the done row's dark green; the block is the last style; the card template unchanged in substance;
  record unchanged, no errors, no writes. `test_v1127.cjs` runs on the same page as the regression.

## Checks

Applied to a copy of the live v11.27 page first; the live build is byte-identical (`db9368ab…`, 21,146,781 bytes). Toolchain
PASS. `tests/test_v1128.cjs` desktop 10/10 and phone 10/10; `test_v1127.cjs` regression 9/9; sweeps desktop + phone 25
tabs / 7 hashes / Back, 0 errors, 0 blocked writes. On the live page 10/10. A first dry run with the rules inside the
panel's own block passed only 5/7, which is how the cascade order and the row wash were found. No tracker republish (page
only).
