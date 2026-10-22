# v11.46 — The crew card names each line in the crew's words, with its symbol

Author: Andrew Fisher. Built on live v11.44 `471bb02f…`. LIVE 23 Oct 2026 09:55 AEST, page `9763bea1f82b5a0a…` (21,378,737 bytes; full hash in STATUS.md).

## Andrew's word, 23 Oct 2026

"We want to know is it a toilet flush or sewer tank and toilet block. Or sewer tank toilet. Pee panels. Or disabled toilets."

## What changes on the card (the record, the printed sheets and the QR codes untouched)

- **Each line's title** is the kind's symbol (the v11.34 set, in the orange disc) and the words, from the line's type and
  kind on the record: `1 × FWF` reads **1 flush toilet**; `8 × FWF` **8 flush toilets**; `2 × Toilet block 6 m` on sewer
  **2 toilet blocks on sewer**, with its own tank **2 toilet blocks**; `2 × Waste tank` **2 sewer tanks**;
  `1 × Accessible toilet` **1 accessible toilet**; `2 × 16-pan toilet block` **2 toilet blocks, 16 pans each**;
  `1 × 4-person trailer toilet` **1 4-person trailer toilet**; `2 × FWF trailer` **2 trailer flush toilets**. A label's place
  is kept: **1 flush toilet at EVL**, **1 flush toilet at the Coates office**.
- **The record's own line stays**, small, beside the asset numbers (`1 × FWF · Asset nos 0285`), so the card still matches
  the printed sheets.
- The same words in the job buttons' spoken labels, the undo question, the "waiting for signal" list, the status page's
  lines and the focused reference under the plan.
- No urinal is on the servicing record, so no line reads "pee panel". "Accessible toilet" is the record's own type word
  for what Andrew called the disabled toilets; one word to change if he wants "disabled toilet" on the card.

## Files

- `patch_v1146.py` — requires live v11.44 by SHA-256; adds `lineKind1146`, `words1146`, `symInline1146` to the v11.37 map
  block (and names `words` / `lineKind` on the `SvcMap1129` handle), restyles the line title, rewrites the seven places the
  card showed a line's label; footer v11.44 → v11.46 (v11.45 is Codex's claim on the board).
- `tests/test_v1146.cjs` — desktop and phone: the template; the words for every one of the 84 lines on the record, checked
  against the expected wording per kind; no line reads FWF or ×; six references of different kinds opened at their codes
  (a tank and the pump-only trailer on their pump code) with the title in words, the symbol at 28 px, the record label
  small, the spoken labels in words; the focused reference under the plan; the card tab error-free; record unchanged, no
  errors, no writes. Screenshot of PG01's card.
- `tracker_update.cjs`, `tracker_card_check.cjs` — as v11.37 (the private links file beside them is gitignored).

## Checks

- Dry build on a scratch copy of live v11.44, scrubbed as the build is, check_page PASS; then the real build from live,
  byte for byte the same (`9763bea1…`).
- `tests/test_v1146.cjs`: 11/11 desktop and phone on the build (evidence/dry/); 11/11 desktop and phone on live (evidence/live_*).
- Regressions on the build: v11.37 (card zoom) 10/10 and v11.34 (card symbols) 8/8, desktop and phone (evidence/dry/regress/).
- Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 errors, 0 console, 0 writes blocked (evidence/dry/sweep_*.json).
- Trackers: TEST republished 09:56 AEST on the v11.46 card (saved and read back, 75 entries, one POST /api/cards, 0 page
  errors); `tracker_card_check.cjs test PG01` CARD OK, 0 writes blocked, 0 page errors (evidence/tracker_test_*). EVENT not
  republished: it waits for Andrew's word; the printed codes stay the same either way.
