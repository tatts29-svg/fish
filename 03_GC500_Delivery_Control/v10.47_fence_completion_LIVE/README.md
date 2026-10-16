# v10.47 — fencing completion read like for like, schedule against dockets — LIVE 16 Oct 2026 17:43 AEST

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Please ensure we audit the numbers for fencing. You should know by the
schedule what's been done already, and by dockets we've done. Common sense. We need the completion percentage accurate."

| | Was | Now | Why |
|---|---|---|---|
| Fencing headline | 71.75% (16,045 of 22,363 m) | **81.28%** (16,452.5 of 20,241 m) | installation only: fence + CCB event, demarcation, flat feet; scrim, relocations and removals no longer added on top |
| Clean fence | 131.41% (10,805 of 8,222.5 m) | **Temporary fence 85.64%** (10,805 of 12,617 m, 1,812 m left) | dockets put every fence on the clean line and add scrim on the same metres; the schedule splits clean / braced-for-scrim. Compared like for like. On the schedule to date (+10 m) |
| Braced for scrim | 35.9% | Scrim fitted 35.9% (1,577.5 of 4,394.5 m) | same numbers, now plainly a measure on the fence above; braced fences IEDM asked not to scrim count as fence |
| Vehicle gates | 0 of 135 | **102 of 135 (75.56%)** | dockets record gates as wheels, one per gate panel (as Advanced bill them, agreeing on every docket with both); schedule gates are openings of two panels (36618 2 gates/4 wheels, 36622 3 gates/6 wheels). 204 wheels on programme dockets |
| Pedestrian gates, CCB event 58.6%, demarcation 81.56%, relocations 37.41% | — | unchanged | already like for like; CCB categories confirmed in v10.46 |

Event-week work (19–22 Oct) is in the totals but not due yet. Against the schedule to date: fence +10 m, CCB event 112.5 m
and demarcation 36 m to come, 14 pedestrian gates to come. Record, charges ($288,657.86) and costs ($177,300.70)
unchanged. Footer v10.46 → v10.47.

Built from live v10.44 with v10.45, v10.46, v10.47: sha256 `fb68b94d48e639a809ea860fcc9cb9c150022d7af6a5eb72ad7e0386f4beb704`, check_page PASS. `tests/test_fence1047.cjs` 11/11;
v10.46's 14 checks other than its footer pass on this build. Sweeps desktop and phone: 18 tabs shown, 0 errors, 0 console.

    bash toolchain/build.sh v10.47 v10.45_scrim_bill_check_LIVE/patch_v1045.py v10.46_ccb_from_schedule_LIVE/patch_v1046.py v10.47_fence_completion_LIVE/patch_v1047.py
    python3 toolchain/upload_page.py build/GC500_v10.47/GC500_Delivery_Control_hosted.html
