# v10.84 — Servicing tab, servicing tracker v2, Andrew's pins lead, radios R&M off

LIVE 20 Oct 2026 11:46 AEST. Page sha256 `396ea971e968e55182b054a936de316a82fa3751df6ba6d7cc566973d578bc0b`
(18,527,956 bytes), on v10.83 `fe480d51…`. Guarded upload, the view link serves it byte for byte. Author: Andrew Fisher.

## What Andrew asked (20 Oct 2026)
- "this will need its own area and tab on GC500": the servicing tracker gets a **Servicing** tab after Event nights.
  On the edit link it holds the read-only progress, the tracker list and the crew-card maker. On the view link it says
  they are on the edit link. Event nights no longer carries the panel.
- Servicing tracker v2 (`servicing_tracker_DRAFT`): a Pump out code and a Clean & restock code per reference
  (`#r=REF.sig~pump` / `~clean`); Complete logs the time; Save & close; Refilled ticked but never counted; Fri, Sat and
  Sun nights only; Sunday one "Pump out, clean & lock" for FWF, accessible and 16-pan; the view-only card lists areas
  ready to audit and every completion with its time. No names. Server unchanged (v5.91 takes any plain task word).
- "please make sure we update this" (Event Portables inventory): a place recorded from Andrew's own pin (how "Andrew
  Fisher's …", by Andrew Fisher: PG01/03/05/29, WC85, BJR01, T0162, T0176, SVP01, T0024, WC31, LT05/06) now leads
  Navigate, drop cards and the supplier inventory, named "Andrew's pin". The 33 master-plan tags are unchanged. A stray
  `false` location text (T0024) no longer prints.
- "also delete the Total Repairs & Maintenance $578.00 charge please": the cost tracker's Equip R&M line
  W-E-20260914-1 (Radios, $578.00, 14 Sep) is removed, along with expenses 718.70 → 140.70, week 2 other 653.20 → 75.20
  and total 2,596.88 → 2,018.88, and tracker other 718.70 → 140.70 and total 15,375.35 → 14,797.35.

## Record, same morning (record_18Oct2026_vms_regos, all VERIFIED, 10051 → 10065)
WC31 1317645 retyped as the Accessible Toilet (12 and 74 now read 2 on site / 2 received); T0024 quantity 2, supplied 2,
complete again (0164 reads 1 on site / 1 received); WC31 steps ticks off ("nothing there has stairs").

## Checks
- `tests/test_v1084.cjs` on the live record, read-only: 17/17.
- Sweeps desktop and phone: 25 tabs, Servicing shown, 0 page errors (`evidence/`).
- Crew card: `test_card_v2.cjs` 45/45. On the v1 snapshot `fixtures/tracker_data_v1_18Oct.json`: `test_card.cjs`
  154/158, `test_state.cjs` 46/51 (the misses are hard-coded counts from before the record changed). Also
  `test_reliability` 18/18, `test_offline_tabs` 18/18, `test_worker` 14/14.
- The tracker block regenerates byte for byte from the v10.83 sources before the v2 changes
  (`patch_v1084.tracker_block`, the v10.67 recipe).
- The build's name scrub rewrites the literal name in code, so the pin match is written `Andrew\sFisher`.

## Still to do
The print pack needs two QRs per reference (Pump out / Clean & restock) for the real pack. Also needed: a TEST tracker
rehearsal, the servicing contact, and then Create event tracker.
