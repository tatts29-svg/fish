**Published in v10.36 on 16 Oct 2026 at 06:41 AEST.** Page `d72e7f6198111f51…` (18,024,035 bytes), read back byte for byte by the view link; the stack v10.32 → v10.36 went up together on the live v10.31. Author: Andrew Fisher.

# v10.35 — generators and VMS boards carry delivery, install and pick up (LIVE)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Whatever as per rate card, that is the cost it will get, unless I unticked
it. Generators as example: delivery, install, pick up. VMS boards: delivery, install, pick up. This is everything you
should know."

| Change | Effect |
|---|---|
| `labourKeep1032(item, disc)`: a generator and a VMS board carry the install line only | v10.32's rule said what an FWF, a toilet block, a waste tank and a building carry. Now a reference in the Generators discipline, or in Variable message signs (or an item named VMS), keeps `install` and withholds `demob`; the two transport legs (delivery, pick up) are at the card as before. The rule reads the discipline because a generator is `60kva`, `100KVA TRAILER` or `Generator 200kva` on the card. |
| The symbols (v10.33) follow | A generator's row and drawer island show Delivery · Install · Pick up; the Demob symbol is gone from generators and VMS boards. Everything else as v10.32 and v10.33 left it. |
| Money | The install line's figure is as the card table holds it — the card's one Labour figure split in half by the page's long-standing convention ($291.48 → $145.74 install for a generator under 150 kVA; $176.97 → $88.49 for a VMS board). Whether the install should now carry the card's whole labour figure is Andrew's call (asked 16 Oct); nothing here changes a rate. The demob half is no longer offered or priced on these two kinds. |
| Footer | v10.34 → v10.35 |

No record value changes in the build. A demob tick already in the record on a generator or VMS board stays in the
record, unread (the test reports any).

## Checks

| Check | Result |
|---|---|
| `check_page.py` | PASS |
| `tests/test_gen_vms1035.cjs` (every write aborted; the survey runs in one held pass like a draw) | ALL 11 PASSED — 16 generators and 7 VMS boards, no demob, no level/steps/clean, install on all 23, both legs on the 14 the card prices transport for (GN20 350 kVA, T0019 and the 7 VMS boards have no card transport figure); FWF and buildings as before; no demob tick withheld; install lines unchanged |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, 0 errors; the one console line is v10.34's picture 404 until the media step runs |

Build `build/GC500_v10.35/` sha256 `baf191943e1bb758…` (18,023,938 bytes), chain v10.32 + v10.33 + v10.34 + v10.35
on the live v10.31 (`e592f9f5…`). Goes live on Andrew's "Upload", with the three before it (v10.34's picture goes
on the service first; see its README).

```sh
toolchain/build.sh v10.35 v10.32_all_today_LIVE/patch_v1032.py v10.33_seven_symbols_LIVE/patch_v1033.py v10.34_barriers_picture_LIVE/patch_v1034.py v10.35_generators_vms_LIVE/patch_v1035.py
BEFORE=build/GC500_v10.34/GC500_Delivery_Control_hosted.html PAGE=build/GC500_v10.35/GC500_Delivery_Control_hosted.html node v10.35_generators_vms_LIVE/tests/test_gen_vms1035.cjs
```
