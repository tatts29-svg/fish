# v10.33 — the seven symbols: delivery, install, level, steps, clean, demob, pick up (READY, not live)

Author: Andrew Fisher. Andrew, 16 Oct 2026, with a screenshot of an Equipment row: "Maybe we do a clean symbol. And
delivery and a symbol to be ticked and unticked. Goes in order: delivery, install, level, steps, clean, demob, pick up.
If applicable." And before it: "If I have unticked it don't go ticking it again."

| Change | Effect |
|---|---|
| One row of symbols on every reference, in that order, each a tick | On the Equipment list (every row), the day cards and the drawer's Complete it island. Only the symbols the thing carries: an FWF shows delivery, install, demob, pick up; a toilet block all seven; a waste tank no steps; a building all seven unless its card lines say otherwise (v10.32's rule). |
| Install, level, steps, clean, demob | The card's labour lines on the reference, through the page's own `setLabour` on every unit of every item that carries the line, so Pricing and the P&L follow. Level and steps also set the record's own Levelled and Steps ticks (`setLevelled`, `setSteps`), as the two buttons the row had did. |
| Delivery and pick up | The two transport legs at the card. A tick makes the leg's card charge actual (the building transport model takes the tick: actual = the leg's additional, nothing remaining); a tick taken off leaves the leg out, with the reason on the model. A reference the transport model has no row for shows neither. |
| The Levelled and Steps buttons | Now the Level and Steps symbols in the row's order; nothing else on the row moves. The Complete, Next day and Cancel buttons are as they were. |
| One transport model fetch per reference | The page's transport model is memoised only inside a draw and costs seconds outside one; the symbols fetch it once per reference and hand it to the two legs, so a drawer open or a test survey does not rebuild it three times. |
| A tick taken off stays off | The symbol reads the record (a stamp with no value is an untick) and writes only on a press; nothing here ticks on its own. |
| Footer | v10.32 → v10.33 |

No record value changes in the build; the symbols write only when pressed, through the page's own functions, on the
edit link.

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_sym1033.cjs` (every write aborted; toggles on a browser copy of the record only) | ALL 9 PASSED — order per kind (FWF, block, tank, building), 308 symbol buttons on the Equipment list, a delivery untick drops the transport total 98,320 → 97,520, island rows in the drawer |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, no errors |

Build `build/GC500_v10.33/` sha256 `46f7fdfd32ff8a73…` (18,023,301 bytes), chain v10.32 + v10.33 on the live v10.31
(`e592f9f5…`). Goes live on Andrew's "Upload", with v10.32, v10.34 and v10.35.

```sh
toolchain/build.sh v10.33 v10.32_all_today_DRAFT/patch_v1032.py v10.33_seven_symbols_DRAFT/patch_v1033.py
PAGE=build/GC500_v10.33/GC500_Delivery_Control_hosted.html node v10.33_seven_symbols_DRAFT/tests/test_sym1033.cjs
```
