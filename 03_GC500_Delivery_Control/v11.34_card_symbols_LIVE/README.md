# v11.34 — The crew card's plan draws each reference as a symbol of what it is; a tap zooms to it, a second tap navigates

Author: Andrew Fisher. Built on live v11.33 `0d2f2726…`. LIVE line and hashes in STATUS.md.

## Andrew's word, 23 Oct 2026, on the live card

"I want a symbol of what it is like what we do in maps. And where it exactly it is on map so the symbol when u zoom in
takes you to where it is on the same area on map."

## What changes on the card

- **Symbols.** Every pin carries a symbol inside its coloured disc, from the record's lines for the reference: a toilet
  cubicle (FWF, the standard unit), a block with doors (Toilet Block 6m, 16Pan Block), an accessible unit (cubicle with
  the wheel), a trailer unit (cubicle on wheels), a sewer-connected unit (cubicle on its connection), a waste tank (the
  cylinder; no reference is a tank alone on the record, so it sits in the key for now). The disc colours stay: white with
  the halo for the scanned one, green done, hi-vis to go. The discs are a touch larger (w/38, was w/44) so the symbols
  read; the label layout keeps every label clear (v11.31 test still 11/11).
- **Tap to zoom.** A tap on a symbol no longer leaves the card: the plan zooms to that reference (the Closer crop centred
  on it) and names it under the plan with its units and a Navigate link; a second tap on the same symbol navigates.
  Wider goes back and lets the focus go.
- **Key.** The six symbols with their words under the plan.

## Files

- `patch_v1134.py` — requires live v11.33 by SHA-256; rewrites the v11.31 map block (`kindOf1134`, `symHtml1134`,
  `symKey1134`, the kind per pin, the Closer crop centred on the focus, the pin anchor with its reference, the symbol in
  the disc, the key and the focused reference in the foot, the tap listener, the handle's `setFocus`/`focus`/`kindOf`);
  style; footer.
- `tests/test_v1134.cjs` — desktop and phone: the template; every reference's map drawn and every pin's symbol compared
  with the kind the record gives it; the key; a tap on WC43 kept on the card (zoom, focus, name, Navigate link), the
  second tap let through, Wider clearing the focus; record unchanged, no errors, no writes.
- `tracker_card_check.cjs` — also requires 12+ symbols on the published card and the six-symbol key.

## Checks

- Dry build on a scratch copy of live v11.33, scrubbed as the build is, then the real build from live: byte for byte the
  same (`a9bf0214…`).
- `tests/test_v1134.cjs`: 8/8 desktop and phone on the build; 8/8 desktop and phone on live.
- Regressions: v11.31 11/11 and v11.30 10/10 on the build (evidence/regression_dry/); v11.31 11/11 and v11.33 12/12 on live.
- Sweeps, desktop and phone: 27 tabs, 7 hashes, Back, 0 console, 0 writes blocked (evidence/sweep_*.json).
- LIVE 23 Oct 2026 03:10 AEST. TEST and EVENT trackers republished 03:12; `tracker_card_check.cjs` CARD OK on both: 14
  pins with 14 symbols, the six-symbol key, PG01 highlighted, the plan on a `blob:` source, 0 label overlaps, Closer,
  Where am I, the kept copy, the Save & close status page, 0 writes blocked, 0 page errors.
- Screenshots: `evidence/dry_map_PG01_wide.png`, `evidence/dry_map_PG01_closer.png` (the build), `evidence/area_map_PG01_phone_v1134.png`,
  `evidence/card_live_phone_v1134.png` and the desktop pair (the live TEST card).
