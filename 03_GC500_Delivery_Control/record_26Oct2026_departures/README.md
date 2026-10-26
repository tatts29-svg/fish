# Record: GN10 generator 1283681 left site, 26 Oct 2026 07:40 — APPLIED, VERIFIED

Author: Andrew Fisher.
- **Applied:** 26 Oct 2026 07:58 AEST, on the live v12.28 page (`c8057284…`).
- **Made by:** Andrew Fisher via Claude, through the page's own Record departure form.
- **Record:** version 10993 → 10994. One document (`delivery/GN10`) acknowledged 200. Every other document unchanged in value.
- **Backup:** the whole record before the run, kept private outside the repo (scratchpad `record_26Oct2026_departures/backup_state_20261025T215817Z.json`).
- **Report:** `report_20261025T215817Z.json`.

Andrew, 26 Oct 2026: "1283681 generatpr and 5 water barriers picked up left at 7:40AM".

| Reference | What left | Left site | After |
|---|---|---|---|
| GN10 Generator (pit lane entry) | 1 × 20 kVA, 1283681 (Coates) — its only unit | 26 Oct 2026 07:40 AEST | Left site in full; light in transit; nothing still to leave |

- The complete tick came off with the light, on the record, as the page does when equipment leaves.
- The demob plan had GN10 for 27 Oct (schedule removal row); contract 9961976 line 13 expected off-hire 26 Oct 08:00.
- P&L by branch unchanged (KINP $242,338.66, NVAC $81,995.19, STPS $73,942.65, MEAD $17,859.02). Today unchanged (Generators 15/15; progress views cut off at Fri 23 Oct).
- **The 5 water barriers are not recorded yet.** No run on the record holds exactly 5, so they wait until Andrew names the run.

**How:**
- `left_site.cjs` is the 25 Oct runner (`../record_25Oct2026_gn20_back/gn20.cjs`) with one more operation, `depart` (reference, actual time in AEST, asset numbers, unnumbered quantities, whether the reference leaves in full).
  - It opens the page's own Record departure form (`DemobCollection996.open`), ticks the units that left, types the date and time and presses Confirm. The form's submit validates and saves through `setLight(ref, 'in transit', request)`.
  - It refuses a unit already recorded as left, and a unit the form does not offer.
  - The write gate lets through only the reference's own documents.
- The dry run came first on the live page: every write aborted, 1 document planned.
- Then `--apply`:
  - the full backup;
  - the public page's SHA-256 checked;
  - the PUT acknowledged;
  - the departure verified on the service, and every other document compared unchanged.
- `check_after.cjs` read it back on a fresh load of the live page: GN10 Left site 26/10/2026 07:40:00 AEST, 1 × 20kva 1283681, recorded by Andrew Fisher, 0 still to leave; 1 of 182 demob references left in full; errors 0, writes 0.

```
node record_26Oct2026_departures/left_site.cjs            # dry run (from 03_GC500_Delivery_Control/)
node record_26Oct2026_departures/left_site.cjs --apply    # GC500_EDIT_TOKEN, GC500_EXPECTED_PAGE_SHA, GC500_PRIVATE_DIR
PAGE=<live page> REFS=GN10 node record_26Oct2026_departures/check_after.cjs
```

## Second run: GN24 generator 1277089 left site, 26 Oct 2026 08:10 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 10:36 AEST, on the live v12.31 page (`ab553fe3…`).
- **Made by:** Andrew Fisher via Claude, through the page's own Record departure form (`left_site.cjs --spec left_site_spec_2_gn24.json`).
- **Record:** version 10994 → 10995. One document (`delivery/GN24`) acknowledged 200. Every other document unchanged in value.
- **Backup:** the whole record before the run, kept private outside the repo (scratchpad `record_26Oct2026_departures/backup_state_20261026T003612Z.json`).
- **Report:** `report_20261026T003612Z.json`.

Andrew, 26 Oct 2026: "Asset no 1277089 left 60kva trailer left 810AM".

| Reference | What left | Left site | After |
|---|---|---|---|
| GN24 Generator | 1 × 60 kVA, 1277089 (Coates) — its only unit | 26 Oct 2026 08:10 AEST | Left site in full; light in transit; nothing still to leave |

- **Dry run first,** on the live page: every write aborted, 1 document planned.
- **P&L by branch unchanged:** KINP $242,338.66, NVAC $81,995.19, STPS $73,942.65, MEAD $17,859.02.
- **Today unchanged:** Generators 15/15.
- **The demob plan** had GN24 for 13 Nov (proposed).
- **Read back** (`check_after.cjs`, fresh load of the live page): GN24 Left site 26/10/2026 08:10:00 AEST, 1 × 60kva 1277089, recorded by Andrew Fisher, 0 still to leave; 2 of 182 demob references left in full; errors 0, writes 0.

## Third run: 23 Event Portables toilets and GN06, 26 Oct 2026 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 12:20 AEST, on the live v12.33 page (`c6b8141c…`). The first attempt at 12:12 stopped untouched when v12.33 went live mid-run (the page guard); the dry run was repeated on v12.33 before the apply.
- **Made by:** Andrew Fisher via Claude, through the page's own Emptied tick (`setEmptied816`, a new `emptied` op in `left_site.cjs`) and Record departure form (`left_site.cjs --spec left_site_spec_3_toilets.json`).
- **Record:** version 10995 → 11003. Eight documents (`delivery/` WC55, WC46, WC24, WC23, WC59, WC56, WC33, GN06) acknowledged 200. Every other document unchanged in value.
- **Backup:** the whole record before the run, kept private outside the repo (scratchpad `record_26Oct2026_departures/backup_state_20261026T021703Z.json`).
- **Report:** `report_20261026T021703Z.json`.

Andrew, 26 Oct 2026, with Event Portables' trucks collecting:
- 11:04 "Picking up now 0650 0525 0489 0968 0960 0107 / Here is more 0935 0497 0442 0988 0445 0004 0009 0533 0974 0066 0633 0003"
- 11:58 "Things are being picked up. Eeek. Next lot 0634 0582 0548 0782 0657 0912"
- 12:06 "Gn06 left site demob 12pm"

| Reference | What left | Left site | Still on site |
|---|---|---|---|
| WC55 | 1 × FWF 0650 (its only unit) | 11:04 | none, left in full |
| WC46 | 1 × FWF 0525 (its only unit) | 11:04 | none, left in full |
| WC24 | 1 × FWF 0489 (its only unit) | 11:04 | none, left in full |
| WC23 | 3 × FWF 0968, 0960, 0107 | 11:04 | 2 (0992, 0969) |
| WC59 | 5 × FWF 0935, 0497, 0633, 0066, 0533 | 11:04 | 2 (0492, 0064) |
| WC56 | 6 × FWF 0974, 0004, 0003, 0445, 0442, 0009 | 11:04 | 6 (0721, 0491, 0190, 0294, 0970, 0088) |
| WC33 | 6 × FWF 0634, 0582, 0548, 0782, 0657, 0912 | 11:58 | 11 |
| GN06 | 1 × 50 kVA generator 1320828 (Coates, its only unit) | 12:00 | none, left in full |

- **The pick-up times** are when Andrew sent each lot.
- **0988 is not on the record**, so it is not recorded. It waits for Andrew to say which unit it is.
- **Emptied (pumped out).** The page keeps a toilet's departure form shut until it is ticked. The servicing tracker holds the final night's pump-out, clean and lock-up at all seven toilet locations, each done and not undone, on service night 25 Oct after the last race day:

  | Location | Final pump-out |
  |---|---|
  | WC56 | 20:00 |
  | WC23 | 20:20 |
  | WC46 | 20:39 |
  | WC59 | 21:10 |
  | WC24 | 21:30 |
  | WC55 | 22:05 |
  | WC33 | 01:39 on 26 Oct |

  Each was ticked Emptied on that record before its departure. The read-back is `probe_final_pumpouts.cjs`, read only on the edit link, kept private.
- **Dry runs first,** on the live page: every write aborted, 8 documents planned.
- **P&L by branch unchanged:** KINP $242,338.66, NVAC $81,995.19, STPS $73,942.65, MEAD $17,859.02.
- **Today unchanged.**
- **Read back** (`check_after.cjs`, fresh load of the live page): every departure above as recorded, by Andrew Fisher. WC55, WC46, WC24 and GN06 are in transit; WC23, WC59, WC56 and WC33 are on site with what is still to leave. 6 of 182 demob references have left in full. Errors 0, writes 0.

## Fourth run: GN04 generator 1277400, 26 Oct 2026 12:42 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 12:45 AEST, on the live v12.33 page (`c6b8141c…`), dry run first. Made by Andrew Fisher via Claude through the page's own Record departure form (`left_site.cjs --spec left_site_spec_4_gn04.json`).
- **Record:** version 11010 → 11011. One document (`delivery/GN04`) acknowledged 200. Every other document unchanged in value. Backup kept private (scratchpad `record_26Oct2026_departures/backup_state_20261026T024414Z.json`). Report `report_20261026T024414Z.json`.
- **Andrew, 12:42:** "Picked up now 1277400 60kva generator". 1277400 is GN04's only unit (contract 9961976 line 14), so GN04 left in full at 12:42 AEST.
- **Size to confirm:** the record and the contract have GN04 as a 30 kVA, not a 60 kVA. The size is left as recorded and asked of Andrew.
- P&L by branch and Today unchanged.

## Fifth run: EQ0002 knuckle boom 1300290, 26 Oct 2026 12:47 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 12:54 AEST, on the live v12.34 page (`3625dd96…`), dry run first. Made by Andrew Fisher via Claude through the page's own Record departure form (`left_site.cjs --spec left_site_spec_5_eq0002.json`).
- **Record:** version 11011 → 11012. One document (`delivery/EQ0002`) acknowledged 200. Every other document unchanged in value. Backup kept private (scratchpad `record_26Oct2026_departures/backup_state_20261026T025315Z.json`). Report `report_20261026T025315Z.json`.
- **Andrew, 12:47:** "Also picked up now 1300290". 1300290 is EQ0002's only unit: Knuckle Boom 61ft (18.6M) - Diesel, rental 9992300 line 5, MEAD, on site since its arrival was recorded on 22 Oct. EQ0002 left in full at 12:47 AEST.
- **A page quirk for added references.** The page counts an added reference's quantity from its complete tick, and the departure form takes that tick off, as it does for everything that leaves. EQ0002's departure reading then finds no quantity to match the departure and says "Departure record needs review". The departure itself is on the record (the light in transit, and the departure in the history with its time, unit and recorder).
  - The runner's new `readback: "history"` reads it back from the history, as the service check does.
  - The page reading needs a fix for added references, recorded as a follow-up.
- P&L by branch and Today unchanged.

## Sixth run: GN13 generator 1276503, 26 Oct 2026 13:02 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 13:08 AEST, on the live v12.34 page (`3625dd96…`), dry run first. Made by Andrew Fisher via Claude through the page's own Record departure form (`left_site.cjs --spec left_site_spec_6_gn13.json`).
- **Record:** version 11012 → 11013. One document (`delivery/GN13`) acknowledged 200. Every other document unchanged in value. Backup kept private (scratchpad `record_26Oct2026_departures/backup_state_20261026T030807Z.json`). Report `report_20261026T030807Z.json`.
- **Andrew, 13:02:** "Gn13 1276503 has left site". 1276503 is GN13's only unit on the record (the replacement generator delivered 12 Oct, contract line 44). No time was given, so it is recorded at 13:02 AEST, when Andrew sent it.
- **Read back fresh:** GN13 reads Left site, 26/10/2026 13:02 AEST, 1 x 45kva 1276503, whole, by Andrew Fisher; light in transit. The Demob tab: 8 of 181 references have left in full.
- P&L by branch and Today unchanged.

## Seventh run: 43 Event Portables toilet locations Emptied (Ready), WC56 0088 and EQ0003 boom 1286482, 26 Oct 2026 — APPLIED, VERIFIED

- **Applied:** 26 Oct 2026 15:28 AEST, on the live v12.35 page (`10a21fc0…`), dry run first (15:06–15:19, passed, nothing sent). Made by Andrew Fisher via Claude through the page's own Emptied tick and Record departure form (`left_site.cjs --spec left_site_spec_7_eq0003_wc56_emptied.json`).
- **Record:** version 11024 → 11069. 45 documents acknowledged 200, every op verified on the service; every other document unchanged in value. Backup kept private (scratchpad `record_26Oct2026_departures/backup_state_20261026T051918Z.json`). Report `report_20261026T051918Z.json`.
- **Andrew, 26 Oct:**
  - "Yes its that number": the 0988 in his 11:04 list is 0088, a WC56 Event Portables FWF. It left with the other six WC56 units at 11:04; WC56 now 7 of 12 gone.
  - "Picked up 130PM / Asset no 1286482": EQ0003's only unit (Straight Boom 60ft - Diesel, Coates). EQ0003 left in full at 13:30.
  - "recors shows 100% done", with the Servicing night report for Sunday 25 into Monday 26 October (final night: pump out 250 of 250 units, all 74 locations, finished 01:39). Then "i want all Event Portaloo's Showing Ready part from the 16Pan. this is organised through Eventportaloos to pick up not coates".
- **Emptied:** the 43 locations whose every unit is Event Portables', with the final night's pump-out done and not undone on the servicing tracker, no Emptied tick yet and not left (none had a Ready or Not ready tick). Each now reads Ready for collection; Event Portables collect with their own transport.
- **Not ticked:** WC31 (the 16Pan Block, Andrew's exception); WC09, WC51, WC67 and T0024, which hold Event Portables and Coates units together (asked of Andrew); Coates' own toilets; and Coates' sewer-connected blocks WC15, WC16, WC17 and T0243, which had a clean and no pump-out on the night.
- **Read back fresh:** EQ0003 Left site 26/10/2026 13:30 AEST, 1 of 1, light in transit; WC56 7 left, 5 to leave, last 11:04. The Demob tab: 10 of 182 references have left in full.
- P&L by branch and Today unchanged.

## Tenth run: Ready ticks put back after a stale page wiped them, 27 Oct 2026 — APPLIED, VERIFIED

- **What happened:** at 03:59:55 AEST an edit-link page that had sat open on a phone since before 10:29 on 26 Oct (older than v12.31, so it does not know the Ready fields) woke up, read the record and wrote back 68 delivery documents within the second. Each lost `ready1231*`, `ready1238_units`, `ready1238_history`, `pickup1238_units` and `pickup1238_history`. Every other field matched the 20:25 backup exactly. Nothing on the record carried a Ready tick or a booking afterwards (Demob: 0 ready). Found by the v12.42.1 live tests (Everything: 0 ready, 370 not ready) and traced through the service's request log (one phone, 68 PUTs in 0.6 s, three seconds after it woke; its fresh page loaded only 40 s later).
- **Applied:** 27 Oct 2026 04:48 AEST on Andrew's word ("Yes, restore now"), on the live v12.42.1 page (`85826c9b…`), dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_10_restore_ready.json`. The same 177 Event Portables units as run 9 (Andrew, 26 Oct 18:30), and Andrew's own Ready ticks on GN25 (16:13), LT05 and LT06 (13:48), now as unit ticks: 180 units at 54 references, through the page's own Ready.
- **Record:** version 11319 → 11373. 54 documents acknowledged 200, every op verified on the service; every other document unchanged in value. Backup kept private. Report `report_20261026T181818Z.json`.
- **Read back fresh:** 180 units Ready on the Demob tab; WC31's 16 Pans and the other Coates units Not ready.
- **Not in this run:** what a laptop wrote between 21:56 and 22:13 on 26 Oct to T0001, T0002, T0128, T0158, P25, P45, P60, P62, P63, P65, P66, P67, P69, WC51 and WC60. No copy is held here; on Andrew's word it is to be read from the service's 03:00 snapshot (server v5.94, read-only) and put back on his word.
