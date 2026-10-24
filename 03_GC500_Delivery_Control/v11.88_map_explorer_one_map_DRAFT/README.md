# v11.88 Map explorer, one map at a time

Author: Andrew Fisher · 24 Oct 2026

Andrew, 24 Oct 2026 (this chat): "can we look at map explorer it look very over corwed very confising we need to make this simple and
easy we showing 2 maps why easy simple maybe drop down selection".

## What it was

The tab stacked two whole maps:
- **The site plan.** The explorer: the master plan with every reference, with Plan / Sat + plan / Satellite / 3D.
- **The satellite map** of VMS boards, generators, grandstands, turns and gates. Under it sat its list of 89 places, about
  2,600 px tall on a computer and over 9,000 px on a phone.

A five-line note also sat under "Highlight area".

## What changed

- **"Show map" drop-down.** It sits at the top, straight after Find it on the map: **Site plan & equipment** or **VMS, generators
  & gates**. Only the chosen map shows; the other is folded away (`display: none`), not removed. The phone keeps the choice
  (`localStorage`), so it opens the same way next time. A hint line says what the chosen map holds.
- **The right map opens by itself:**
  - a gate, stand or turn ringed on the satellite (`gate1156Zoom`, used by Find and the gate search) shows the satellite map;
  - "show on the plan", the finder's plan markers, the plan explorer opened from anywhere (`mapLocate`, `expFind`, `expOpen2d`,
    `expOpen3d`, `showOnMap`) and a reference or drawing opened from another tab show the site plan;
  - plainly coming back to the tab keeps the choice.
- **Folded behind one tap, nothing deleted:**
  - the note under Highlight area ("What the outlines mean");
  - the satellite map's list ("Show the list (89)").
- **Not touched:** the VMS boards tab's own satellite map, and every component (explorer, Highlight area, Equipment symbols, Find,
  satellite map, pins, filters). They are kept as built and not redrawn or restyled. No record, servicing, crew card, QR or server
  change.

## Checks

- **Toolchain:** PASS, 181 inline scripts.
- **`tests/test_native1188.cjs` 21/21 desktop and 21/21 phone,** on the real page reading the live record. It checks:
  - the drop-down's place;
  - the plan by default, then only one map at a time;
  - the satellite map at full width with its pins after switching;
  - the folded note and list, and that each opens with one tap;
  - the choice is remembered and survives a redraw and a return to the tab;
  - a reference from elsewhere shows the plan, without changing the remembered choice;
  - a ringed spot shows the satellite, and the explorer from anywhere shows the plan;
  - the VMS tab's map is untouched;
  - 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Phone and desktop screenshots** of both views are in `evidence/` and were inspected.

```
toolchain/build.sh v11.88 v11.88_map_explorer_one_map_DRAFT/patch_v1188.py
PAGE=build/GC500_v11.88/GC500_Delivery_Control_hosted.html [MOB=1] node v11.88_map_explorer_one_map_DRAFT/tests/test_native1188.cjs
```

Built on live v11.87 `b18acda01b96e653ff39612f12ed2dae29123d0dded5e8757fd680ac8b13bdfa`. Implemented and tested by Claude, for Andrew;
not reviewed by Codex.
