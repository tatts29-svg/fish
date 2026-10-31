# v10.46 — every barrier docket carries its event or demarcation category from the schedule — LIVE 16 Oct 2026 17:43 AEST

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Stop asking demarc or event, you should know based off request in schedule."

The six pending barrier dockets are decided from the fencing programme's requests and added to the barrier review with
the programme and the signed paper as sources, matched to the record exactly:

| Docket | Category | Programme request |
|---|---|---|
| 36603 | Demarcation | CON WK1 rows 17, 18, 23, 26 (Cable St–Breaker, Ocean Isles, Norfolk–Decks, Ocean Resort–Sunbird) |
| 36608 | Demarcation | CON WK1 row 11 Ferny Ave (East); paper "Demarcation - S05 to Ferny Ave" |
| 36610 | Demarcation | CON WK1 row 33 Aloha Lane to T12 Runoff; paper says the same |
| 36613 | Event | CON WK1 rows 39/65 Porsche Lounge CZ / BOH & compound (works barrier, as PB01 stands) |
| 36595 | Event | rear of S20, back of house (CON WK2 rows 20–21), not a spectator route |
| 36619 | Event | CON WK1 row 63 Pacific Plaza to The Triangle, 285 m Event |

All 25 barrier dockets now read confirmed; "needs category review" is gone from the Fencing tab. Footer v10.45 → v10.46.
Built from live v10.44 with v10.45 and v10.46: sha256 `0b2e1a2c0c0babc957619d48f2770087c2d182159ec0621359fa5a9314d4579c`, check_page PASS. `tests/test_ccb1046.cjs` 15/15;
v10.45's test 9/9. Sweeps desktop and phone: 18 tabs shown, 0 errors, 0 console.

    bash toolchain/build.sh v10.46 v10.45_scrim_bill_check_LIVE/patch_v1045.py v10.46_ccb_from_schedule_LIVE/patch_v1046.py
    python3 toolchain/upload_page.py build/GC500_v10.46/GC500_Delivery_Control_hosted.html
