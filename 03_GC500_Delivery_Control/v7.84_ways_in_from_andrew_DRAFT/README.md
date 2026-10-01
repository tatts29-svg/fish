# v7.84 — the ways in Andrew gave (READY TO UPLOAD)

Author: Andrew Fisher · 2 Oct 2026 · one patch on the live v7.83 (`f6544262…`)

## What Andrew said (2 Oct 2026)

> "wc25 meet at pitlane start point. wc31 from North head towards hill to drop off. location on map.. wc45 meet at
> starting point pitlane wc47 meet at starting point pitlane Lane. gn04 meet at starting point pitlane"

## What it does

| Item | Way in on the text, the driver sheet, the drawer and the print check |
|---|---|
| WC25, WC45, WC47, GN04 | **Meet at the pit lane start point.** That is the pit lane entry the pit lane rule uses, off the Gold Coast Hwy at the north-west end. The text reads `Site access: meet at the pit lane start point - Gold Coast Hwy > north-west pit lane entry.` and `ENTRY: meet at the pit lane start point.` |
| WC31 | `ENTRY: from the north end, head towards The Hill to the drop-off (location on the map).` WC31 is part on site; this covers the rest still to come. |

- Drop-offs are unchanged: each item's own spot on the map.
- A way in pinned on site still wins.
- Park items keep the park's own pit lane rule.
- The HOLD on these five is gone.
- Still on HOLD until Andrew says: WB07 (Admiralty Dr), WB13, WB18, WB20 (Turn 2 / Ferny Ave).

## Build

```
bash toolchain/build.sh v7.84 v7.84_ways_in_from_andrew_DRAFT/patch_v784.py
```

8,767,811 bytes, SHA-256 `c9958a42085aef90aab8f7e81fdafddf6e49859669bf2b15fecff5818139a725`. check_page PASS, no keys.
Explorer unchanged (`dd6256bc…`).

## Results on c9958a42 (`evidence/`, `evidence/regress/`)

| Suite | Result |
|---|---|
| Ways in (`ways_in_tests.js`) | 10/10 desktop and phone |
| Rules (`rules_tests.js`, the v7.84 copy) | 45/45 desktop and phone. D2 now uses WB13 as its held example; Z2 expects WB07, WB13, WB18, WB20. The v7.82 file gives 43/45 because it still expects the old answers (logs kept). |
| Print check, one destination, inventory, explorer, fencing, fresh-after-save, P&L practice | all pass, desktop and phone |
| Both 21-tab/7-link sweeps, navigation | pass |
| Inventory PDF | 9/9 desktop and phone |
| v7.79 text checks | 16/23 (old raw-destination assertions; one fewer miss than v7.83) |

## Open with Andrew

- The way in for WB07, WB13, WB18, WB20.
- Gate 1 (Tedder Ave access point) and Gate 2 (GC Hwy underpass via Commodore Dr).
- The 05:00 morning-run scope.
- "Pit lane start point" is read as the north-west entry; if he means the south end (paddock ramps), it is a one-line change.

## Who checked what

Claude built it and ran everything above. A second audit is optional under the 2 Oct arrangement.
