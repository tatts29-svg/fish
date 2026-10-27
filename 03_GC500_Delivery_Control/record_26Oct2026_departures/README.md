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
- **Applied:** 27 Oct 2026 04:18 AEST on Andrew's word ("Yes, restore now"), on the live v12.42.1 page (`85826c9b…`), dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_10_restore_ready.json`. The same 177 Event Portables units as run 9 (Andrew, 26 Oct 18:30), and Andrew's own Ready ticks on GN25 (16:13), LT05 and LT06 (13:48), now as unit ticks: 180 units at 54 references, through the page's own Ready.
- **Record:** version 11319 → 11373. 54 documents acknowledged 200, every op verified on the service; every other document unchanged in value. Backup kept private. Report `report_20261026T181818Z.json`.
- **Read back fresh:** 180 units Ready on the Demob tab; WC31's 16 Pans and the other Coates units Not ready.
- **Not in this run:** what a laptop wrote between 21:56 and 22:13 on 26 Oct to T0001, T0002, T0128, T0158, P25, P45, P60, P62, P63, P65, P66, P67, P69, WC51 and WC60. No copy is held here; on Andrew's word it is to be read from the service's 03:00 snapshot (server v5.94, read-only) and put back on his word.

## Eleventh run: VMS-01, VMS-02, VMS-03, and the VMS plan's arrival for VMS22 and VMS24 — APPLIED, VERIFIED

- **Applied:** 27 Oct 2026 05:18 AEST on the live v12.42.1 page (`85826c9b…`), after the dry run (passed, nothing sent) and Andrew's answers to both questions with it: the mapping "Yes, apply it"; the board-sheet note "No, keep sheets clean" (so no `notes_ok`; the reason stays in this report and in VMS-02's and VMS-03's light history).
- **Record:** version 11428 → 11488. 60 documents acknowledged 200, every op verified on the service; every other document unchanged in value. P&L gate passed: charged to the V8s $996,131.92 and known costs $448,019.57 unchanged, labour $72,974.51 unchanged, every branch total unchanged; the stand-alone VMS installs list lost VMS21, VMS22 and VMS24 (their $88.49 installs now sit on their references). Backup kept private. Report `report_20261026T191839Z.json`.
- **Read back fresh:** the Demob tab shows VMS-01 (Premiair 97T, label VMS21), VMS-02 (445T, VMS22) and VMS-03 (450T, VMS24) as unit cards, Not ready; the three plan-only board cards are gone; 180 units Ready as before.
- **The plan below is kept as written before the run.**

### As planned

- **State:** spec `left_site_spec_11_vms_refs.json` written and checked offline (`test_left_site_spec.cjs` 93/93; `--check-spec` passes). No dry run yet. No `--apply` until Andrew has seen the dry run and answered the two questions below.
- **To ask Andrew with the dry run:**
  1. Is the mapping below right?
  2. May the reason for the 22 Oct correction print on the VMS board sheets for VMS 22 and VMS 24, in the NOTES · SPECIAL INSTRUCTIONS box? That box is for the crew placing the board. If he says yes, add his words to both `vms_arrival` ops as `notes_ok` and dry run again. If he says no, the spec stays as it is.
- **Andrew:**
  - 26 Oct: "Im happy with new referenwces referencws should be vms-01   vms-02  etc  simple".
  - 27 Oct, asked whether VMS22 and VMS24 came on 21 Oct (the VMS plan) or 22 Oct (Premiair docket 26143911): "22 oct".
- **The mapping to show Andrew with the dry run (not yet confirmed by him):**

  | Reference | Board | Fleet | Rego | Contract 9961265 | In from |
  |---|---|---|---|---|---|
  | VMS-01 | VMS21 | 97T | T16922 | line 28 | 22 Oct 08:08 AEST (its VMS plan time) |
  | VMS-02 | VMS22 | 445T | TE99CL | line 29 | 22 Oct (docket 26143911; no time, so 00:00 AEST) |
  | VMS-03 | VMS24 | 450T | TE94CL | line 31 | 22 Oct (docket 26143911; no time, so 00:00 AEST) |

- **What the run does,** through the page's own functions, in Andrew Fisher's name:
  1. **The VMS plan, positions 22 and 24** (new op `vms_arrival`, through the plan's own writer `VMS1024.write`):
     - the 21 Oct arrival entry is withdrawn ("not confirmed" on 21 Oct, as VMS21's own 21 Oct entry was);
     - the board goes on site and in place from 22 Oct;
     - the board is ticked complete again, because the page takes the complete tick off with a withdrawal.
     - The 21 Oct entries stay in the history.
     - **The reason stays out of the board's Notes for now.** The reason is "Arrived 22 Oct 2026 by Premiair docket 26143911 (Andrew, 27 Oct 2026: "22 oct"); the 21 Oct arrival entry is withdrawn."
       - On the VMS tab that box is "Notes · special instructions" ("anything the crew placing it must know"), and the board sheet prints it under NOTES · SPECIAL INSTRUCTIONS.
       - So the reason goes there only with Andrew's OK (`notes_ok`). Until then the reason is kept in this run's report and in VMS-02's and VMS-03's light history.
       - Positions 22 and 24 have no notes on the record now (backup 27 Oct 04:18), so the box prints empty. With his OK it would print the reason alone.
  2. **VMS-01, VMS-02 and VMS-03** through the Add form:
     - trade Variable message signs, item type VMS, no number, in from 22 Oct, branch STPS, the contract line as the note;
     - each with its one Premiair unit, labelled by its register name (VMS21, VMS22, VMS24);
     - on site from the time in the table, received, complete, install ticked;
     - quantity 1 (set 2 then 1 at the end, as GN20-A).
  3. **`expect`:** charged to the V8s and known costs unchanged to the cent, and no branch total moves. Otherwise nothing is sent.
- **Runner changes (27 Oct):**
  - stricter checks before any page opens: a dated light, a sub-hired VMS board's add_ref (no number, in and out days), unit labels and notes, the new op, and `expect`;
  - one day everywhere: a reference's in day is the AEST day of its light, and a corrected plan arrival is that same day;
  - the register must give the board the fleet number being identified, and the unit must come out physical;
  - the P&L reading is fixed (it read null before; only branch totals were compared), with the `expect` gate;
  - a read-only probe of each new reference (units, charge span, arrival, departure reading, Demob cards, Questions) and of the VMS plan boards before and after;
  - `--check-spec` checks a spec and stops, with no page and no service.
  - `vms_arrival` writes the plan's notes only with `notes_ok`, which must be Andrew's words quoted with the day he said them (`Andrew, 27 Oct 2026: "..."`). Without it the notes are left as they were, and the checks after the stage and on the service fail if they changed. Either way the stage line says what the board sheet prints, and what it would print with his OK.
  - Every earlier spec passes unchanged and names the same references.
- **What the dry run should show** (any difference: stop and look):
  - 60 documents planned: 18 per reference and 3 per VMS plan position;
  - the P&L gate passed (charge, cost and branches unchanged), with VMS21, VMS22 and VMS24 gone from the stand-alone VMS installs;
  - each VMS-0n unit card reads Premiair, its fleet number, its board label, Not ready; each stand-alone plan card (VMS21#vms:21, VMS22#vms:22, VMS24#vms:24) is gone after the stage;
  - VMS plan 22 and 24: 21 Oct reads "not confirmed", 22 Oct onwards on site, in place and complete;
  - VMS plan 22 and 24 notes unchanged: `sheetPrints` reads "" before and after the stage, and the stage line reads "the reason kept out of its notes (no notes_ok) ... with Andrew's OK (notes_ok) it would print" followed by the reason;
  - Today unchanged; page errors 0.
- **Known effects to tell Andrew:**
  - The VMS tab shows VMS 22 and VMS 24 "In place" and "Complete" by Andrew Fisher, entered 27 Oct.
  - 21 Oct readings show two boards fewer on site.
  - The references' complete ticks are dated today.
  - The register's "On delivery" stays empty for the three boards.
  - **Only with Andrew's OK (`notes_ok`):** the board sheets for VMS 22 and VMS 24 print the correction reason under NOTES · SPECIAL INSTRUCTIONS, the box for the crew placing the board. It would read "Arrived 22 Oct 2026 by Premiair docket 26143911 (Andrew, 27 Oct 2026: "22 oct"); the 21 Oct arrival entry is withdrawn." Without his OK the box stays as it is (empty now).
  - **The closed 22 Oct Build day card gains VMS-01, VMS-02 and VMS-03.** An added reference's in day (22 Oct) goes on that day's work as a placement, so a day card already closed shows three more.
  - **Three "Hire" holds on Costs.** The "Actual onsite equipment" card (`onsiteComplete979`) gets one per reference until an off day is recorded, and Pricing's card-hire line reads "no day to charge to". What is charged to the V8s does not move. This is the design's reading of the page code; the dry run has not shown it yet.

```
node record_26Oct2026_departures/test_left_site_spec.cjs
node record_26Oct2026_departures/left_site.cjs --spec record_26Oct2026_departures/left_site_spec_11_vms_refs.json --check-spec
node record_26Oct2026_departures/left_site.cjs --spec record_26Oct2026_departures/left_site_spec_11_vms_refs.json   # dry run
```

## Twelfth run: Andrew's 26 laptop Ready ticks put back from the service's own copy, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** the stale page at 03:59:55 also took the Ready ticks Andrew made on his laptop between 21:56 and 22:13 on 26 Oct, which no file here held. With server v5.94 live, the edit key read the service's hourly copy `records-2026102617.json` (03:45:33 AEST, record 11251, 14 minutes before the wipe; the same as every hourly copy back to 22:45). It held exactly 26 unit ticks, all Andrew's: T0001 three VMS boards, T0002 five light towers, T0128 two boards, T0158 four boards, buildings P25, P45, P60, P62, P63, P65, P66, P67, P69, WC51's Coates accessible toilet 1197174 and WC60's two Coates toilet blocks.
- **Applied:** 27 Oct 2026 06:16 AEST on Andrew's word ("Yes, put them back"), dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_12_restore_laptop_ready.json`, through the page's own per-unit Ready, in Andrew's name; their first ticks were 21:56-22:13 on 26 Oct.
- **Record:** version 11491 → 11506. 15 documents acknowledged 200, every op verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261026T201603Z.json`.
- **Read back fresh:** 206 units ticked Ready on the record, the same count the page showed at 23:01 on 26 Oct before the wipe.

## Thirteenth run: WC54 picked up 08:30, then 14 Event Portables toilets 08:50, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Wc54 can we have picked up at 830am today please. All asset in this area to that reference. 8:50am Then 0915 0949 0472 0075 0969 0992 0008 0492 0970 0294 0190 0491 0721 0064". WC54's six Event Portables FWF (0007, 0071, 0087, 0186, 0295, 0619), every unit on that reference, left at 08:30 AEST. The fourteen numbers are Event Portables FWF, each on exactly one reference on the record (read 08:58 AEST: every one Ready, its location Emptied, none already left), and left at 08:50 AEST: WC57 0915, 0008; WC47 0949; WC25 0472; WC26 0075; WC23 0969, 0992 (last two of five); WC59 0492, 0064 (last two of seven); WC56 0970, 0294, 0190, 0491, 0721 (last five of twelve). Each unit is recorded on the reference it is on; nothing moved between references.
- **Applied:** 27 Oct 2026 08:59 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_13_wc54_0850_pickups.json`, through the page's own Record departure form, in Andrew's name. All eight references left in full; lights in transit.
- **Record:** version 11530 → 11538. 8 documents acknowledged 200, every op verified on the service; every other document unchanged in value; P&L and branch totals unchanged ($996,131.92 charged, $448,019.57 cost). Backup kept private. Report `report_20261026T225902Z.json`.
- **Read back fresh:** the eight references in transit with departures at 08:30 (WC54) and 08:50 (the rest), 20 units; 201 units ticked Ready on the record before and after (the 206 of the twelfth run less T0002's five light towers, which Andrew set Not ready by hand at 06:20-06:21 AEST).

## Fourteenth run: P60 Gate 5 Ticket Box 1015699 picked up 09:00, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Picked up 900AM   asset no 1015699". 1015699 is P60's only unit (Gate 5 Ticket Box 4.8m, Coates portable building, ticked Ready by Andrew) and the only place the number is on the record (read 09:07 AEST, not already left), so P60 left in full at 09:00 AEST. Its departure form offers the building alone; the air conditioner 1267597 and four swivel chairs stay listed on P60 as gear that goes with it.
- **Applied:** 27 Oct 2026 09:08 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_14_p60_1015699.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11538 → 11539. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261026T230818Z.json`.
- **Read back fresh:** P60 in transit, one departure at 09:00 holding 1 x Ticket Box 4.8m 1015699 (the whole reference); 201 units ticked Ready before and after.

## Fifteenth run: WC29 four Event Portables toilets picked up 09:27, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Picked up 927am 0079 0564 0546 0441". All four are Event Portables FWF on WC29 only (read 09:28 AEST: seven FWF 0044, 0079, 0441, 0546, 0564, 0598, 0707, every one Ready, the location Emptied, none already left). The four left at 09:27 AEST; 0044, 0598 and 0707 stay, so WC29 stays on site.
- **Applied:** 27 Oct 2026 09:29 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_15_wc29_0927.json`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 11539 → 11540. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261026T232944Z.json`.
- **Read back fresh:** WC29 on site with one departure at 09:27 holding 0079, 0546, 0564, 0441 (not the whole reference); 201 units ticked Ready before and after.

## Sixteenth run: WC33's last eleven Event Portables toilets picked up 10:00, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026 (before 09:38 AEST): "Pur these as picked up 10am todau please. 0554 0920 0971 0586 0487 0790 0597 0938 0297 0456 0012". All eleven are Event Portables FWF on WC33 only, every one Ready, the location Emptied, none already left; they are the last eleven of its seventeen (0634, 0582, 0548, 0782, 0657, 0912 left 26 Oct 11:58). They left at 10:00 AEST, so WC33 left in full.
- **Applied:** rehearsed at 09:38 as a dry run with that time (passed, nothing sent); the 10:00 time is refused until it has come, so the record was read again at 10:01 (still on site, not recorded), dry run with 10:00 (passed), then applied 10:02 AEST: `left_site.cjs --spec left_site_spec_16_wc33_1000.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11540 → 11541. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T000201Z.json`.
- **Read back fresh:** WC33 in transit: 26 Oct 11:58 six units, 27 Oct 10:00 eleven units (the whole reference); 201 units ticked Ready before and after.

## Nineteenth run: P62 Gate 5 QFES Office 1189409 left 10:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "1030Am 1189409 has just left". 1189409 is P62's only unit (Gate 5 QFES Office, Building 6m, Coates; ticked Ready and booked by Andrew for 27 Oct 09:00) and the only place the number is on the record (read 10:36 AEST, not already left), so P62 left in full at 10:30 AEST. Its departure form offers the building alone; air conditioners 1189912 and 1189908, the fire extinguisher and fridge 1254221 stay listed on P62 as gear that goes with it.
- **Applied:** 27 Oct 2026 10:37 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_19_p62_1189409.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11541 → 11542. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T003752Z.json`.
- **Read back fresh:** P62 in transit, one departure at 10:30 holding 1 x Building 6m 1189409 (the whole reference); 201 units ticked Ready before and after.

## Twentieth run: P63 Gate 5 Volunteer Sign On 960719 left 10:45, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "1045am 960719 is leaving". 960719 is P63's only unit (Gate 5 Volunteer Sign On, Building 6m, Coates; ticked Ready by Andrew) and the only place the number is on the record (read 10:41 AEST, not already left), so P63 left in full at 10:45 AEST. Its air conditioners 1219157 and 1219156 and the fire extinguisher stay listed on P63 as gear that goes with it.
- **Applied:** rehearsed at 10:42 as a dry run (passed, nothing sent); after 10:45 a fresh dry run with 10:45 (passed), then applied 10:46 AEST: `left_site.cjs --spec left_site_spec_20_p63_960719.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11542 → 11543. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T004602Z.json`.
- **Read back fresh:** P63 in transit, one departure at 10:45 holding 1 x Building 6m 960719 (the whole reference); 201 units ticked Ready before and after.

## Seventeenth run: WC28 0102 and WC29's last three picked up 11:00, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026 (before 10:28 AEST): "11am can we do picked up 0102 0598 0044 0707". All four are Event Portables FWF, each on one reference only, every one Ready, its location Emptied, none already left. 0102 is WC28's only unit; 0598, 0044 and 0707 are the last three of WC29's seven (four left 09:27). They left at 11:00 AEST, so WC28 and WC29 both left in full.
- **Applied:** rehearsed at 10:28 as a dry run (passed, nothing sent); at 11:02 the record was read again (all four still on site, not recorded), a dry run with 11:00 passed, then applied 11:02 AEST: `left_site.cjs --spec left_site_spec_17_wc28_wc29_1100.json`, through the page's own Record departure form, in Andrew's name. Lights in transit.
- **Record:** version 11543 → 11545. 2 documents acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T010250Z.json`.
- **Read back fresh:** WC28 in transit (11:00, 0102, the whole reference); WC29 in transit (09:27 four units; 11:00 0707, 0044, 0598, the rest); 201 units ticked Ready before and after.

## Eighteenth run: WC30's eight and WC62 0976 picked up 11:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026 (before 10:31 AEST): "1130AM 0976 0024 0419 0440 0428 0963 0545 0043 0681". All nine are Event Portables FWF, each on one reference only, every one Ready, its location Emptied, none already left. 0024, 0419, 0440, 0428, 0963, 0545, 0043 and 0681 are all eight of WC30's units, so WC30 left in full; 0976 is one of WC62's two, so WC62 stays on site with 0103. They left at 11:30 AEST.
- **Applied:** rehearsed at 10:31 as a dry run (passed, nothing sent); after 11:30 a fresh dry run with 11:30 (passed), then applied 11:31 AEST: `left_site.cjs --spec left_site_spec_18_wc30_wc62_1130.json`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 11545 → 11547. 2 documents acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T013100Z.json`.
- **Read back fresh:** WC30 in transit (11:30, all eight, the whole reference); WC62 on site (11:30 0976 gone, 0103 stays); 201 units ticked Ready before and after.

## Twenty-first run: P25 Support Category Stewards 1189408 left 11:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026 (before 11:21 AEST): "1189408 leaving 1130AM". 1189408 is P25's only unit (Support Category Stewards, Building 4.8m, Coates; ticked Ready and booked by Andrew for 27 Oct 10:30) and the only place the number is on the record (read 11:21 AEST, not already left), so P25 left in full at 11:30 AEST. Air conditioners 1189951 and 1189950, the fire extinguisher and fridge 1260174 stay listed on P25 as gear that goes with it.
- **Applied:** rehearsed at 11:22 as a dry run (passed, nothing sent); after 11:30, straight after the eighteenth run, a fresh dry run with 11:30 (passed), then applied 11:32 AEST: `left_site.cjs --spec left_site_spec_21_p25_1189408.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11547 → 11548. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T013211Z.json`.
- **Read back fresh:** P25 in transit, one departure at 11:30 holding 1 x Building 4.8m 1189408 (the whole reference); 201 units ticked Ready before and after.

## Twenty-second run: P66 Support Category Scrutineers 1327222 left 12:00, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026 (before 11:39 AEST): "1327222 leaving 12PM". 1327222 is P66's only unit (Support Category Scrutineers, Building 6m, Coates; ticked Ready by Andrew; read 11:39 AEST, not already left); the number was taken off P53 and P36 earlier, so P66 is the only reference holding it. P66 left in full at 12:00 AEST. Air conditioner 1372940, the fire extinguisher and fridge 131190 stay listed on P66 as gear that goes with it.
- **Applied:** rehearsed at 11:39 as a dry run (passed, nothing sent); after 12:00 a fresh dry run with 12:00 (passed), then applied 12:01 AEST: `left_site.cjs --spec left_site_spec_22_p66_1327222.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11548 → 11549. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T020058Z.json`.
- **Read back fresh:** P66 in transit, one departure at 12:00 holding 1 x Building 6m 1327222 (the whole reference); 201 units ticked Ready before and after.

## Twenty-fourth run: WC51 Emptied and its six FWF, and WC49's three, left 13:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Wc51 left leaves at 130pm"; asked whether all seven at WC51 were pumped out: "Only the 6 Event Portables"; then "Only the fwf though / Yes pumpee out you know this / You gave me document qll.was done / Leaving at 130pm 0919 0084 0907" (the document: the Servicing night report for 25 into 26 October, final night, pump out 250 of 250 units, all 74 locations, finished 01:39); asked which left at 13:30: "Both: WC51's 6 FWF and WC49's 3". WC51 was left without an Emptied tick in the seventh run because it holds Event Portables and Coates units together (asked of Andrew); this is that answer.
- **Applied:** rehearsed at 13:28 as a dry run (passed, nothing sent); after 13:30 a fresh dry run with 13:30 (passed), then applied 13:31 AEST: `left_site.cjs --spec left_site_spec_24_wc51_wc49_1330.json`, through the page's own Emptied tick and Record departure form, in Andrew's name. WC51 Emptied; WC51's six Event Portables FWF (0028, 0136, 0167, 0453, 0653, 0991) left 13:30, its Coates accessible toilet 1197174 stays on site; WC49's three Event Portables FWF (0919, 0084, 0907, all of WC49) left 13:30, light in transit.
- **Record:** version 11552 → 11554. 2 documents acknowledged 200, every op verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T033102Z.json`.

## Twenty-fifth run: WC48's four FWF left 13:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Here is some more 0050 0471. 0486 0289"; asked the time: "13:30, same truck". All four are Event Portables FWF on WC48 only, all of WC48 (read 13:29 AEST: Emptied, every one Ready, none already left).
- **Applied:** dry run (passed, nothing sent), then applied 13:32 AEST straight after the twenty-fourth run: `left_site.cjs --spec left_site_spec_25_wc48_1330.json`, through the page's own Record departure form, in Andrew's name. WC48 left in full at 13:30, light in transit.
- **Record:** version 11554 → 11555. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Report `report_20261027T033239Z.json`.
- **Read back fresh (both runs):** WC51 on site, Emptied by Andrew Fisher, one departure at 13:30 holding the six FWF (not the whole reference); WC49 and WC48 in transit, each one departure at 13:30 holding the whole reference; 201 units ticked Ready before and after.

## Twenty-sixth run: WC13's two FWF picked up 13:40, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "140pm picked up. 0444 and 0036". Both are Event Portables FWF on WC13 only, both of WC13's units (read 13:43 AEST: Emptied, both Ready, neither already left), so WC13 left in full at 13:40 AEST.
- **Applied:** 13:43 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_26_wc13_1340.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11556 → 11557. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T034351Z.json`.
- **Read back fresh:** WC13 in transit, one departure at 13:40 holding 0036 and 0444 (the whole reference); 201 units ticked Ready before and after.

## Twenty-third run: P65 Support Categories Race Secretary 1327217 left 14:00, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "1327217 leaving at 2pm". 1327217 is P65's only unit (Building 6m, Coates; ticked Ready; booked earlier for pick-up 28 Oct 09:00; not already left), so P65 left in full at 14:00 AEST, the day before that booking. Its air conditioner 1327935, fire extinguisher and fridge 1283982 stay listed on P65 as gear that goes with it.
- **First try, 14:00:57 AEST:** dry run passed; the apply staged the departure on the page, then stopped before sending because the record changed under it (another person's booking saved at 14:01, record 11560 → 11561). Nothing was sent: "STOP: the record changed before release - nothing sent".
- **Applied:** 14:02 AEST on Andrew's word, dry run first again (passed, nothing sent): `left_site.cjs --spec left_site_spec_23_p65_1327217.json`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11561 → 11562. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T040231Z.json`.
- **Read back fresh:** P65 in transit, one departure at 14:00 holding Building 6m 1327217 (the whole reference); 201 units ticked Ready. The Demob tab reads 69 units off site today, 100 of 794 off site.

## Twenty-eighth run: WC53's three FWF left 13:30 on the 18 truck, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Ilve done 2 x trucks so far of 24. And another truck of 18". The record held 24 (08:30–09:27), 24 (10:00–11:30) and 15 (13:30–13:40: WC51 6, WC49 3, WC48 4, WC13 2), so the third truck was 3 FWF short. "We are missing 3 fwf what else is in that same area of fwf": the only FWF still on site in servicing area 10 (Main Beach Seaside — South, with WC48, WC49 and WC51) were WC53's three, 0952, 0951 and 0074, 43 m from WC51 (Emptied, all Ready). Asked to record them at 13:30 on the 18 truck: "Rhey are the ones". So WC53 left in full at 13:30 AEST.
- **Applied:** 14:12 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_28_wc53_1330.json`, through the page's own Record departure form (live v12.42.4), in Andrew's name. Light in transit.
- **Record:** version 11569 → 11570. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T041142Z.json`.
- **Read back fresh:** WC53 in transit, one departure at 13:30 holding 0952, 0951 and 0074 (the whole reference). Today: 66 FWF picked up (24 + 24 + 18, Andrew's three trucks), 72 units in all.

## Twenty-seventh run: P67 Building 6m 421107 left 14:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "421107 leaving at 230pm". 421107 is P67's only unit (Building 6m, Coates; ticked Ready; read 13:55 AEST, not already left, no booking), so P67 left in full at 14:30 AEST. Its air conditioner 1300541 and fire extinguisher stay listed on P67 as gear that goes with it.
- **Applied:** after 14:30 AEST on Andrew's word (a departure is only recorded once its time has come). Rehearsed first on the live v12.42.4 page with a past time (dry run, nothing sent, 14:06); at 14:30:20 the live page sha was checked, then a dry run (passed, nothing sent) and `left_site.cjs --spec left_site_spec_27_p67_421107.json --apply`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 11570 → 11571. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T043108Z.json`.
- **Read back fresh:** P67 in transit, one departure at 14:30 holding Building 6m 421107 (the whole reference). Today: 66 FWF and 7 buildings and the ticket box, 73 units.

## Twenty-ninth run: WC62 0103, WC35 0284 and WC34 0526 picked up 14:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "0103 and 0284 is next"; asked the time, "230pm and 0526". All three are Event Portables FWF (read 14:32 AEST: Emptied, every one Ready, none already left, no booking): 0103 is WC62's last unit (0976 left at 11:30), 0284 is WC35's only unit, 0526 is WC34's only unit. So all three left at 14:30 AEST and WC62, WC35 and WC34 are each off site in full.
- **Applied:** 14:34 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_29_wc62_wc35_wc34_1430.json`, through the page's own Record departure form (live v12.42.4), in Andrew's name. Lights in transit.
- **Record:** version 11571 → 11574. 3 documents acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T043344Z.json`.
- **Read back fresh:** WC62 in transit (0976 at 11:30, 0103 at 14:30), WC35 in transit (0284 at 14:30), WC34 in transit (0526 at 14:30). Today: 69 FWF, 76 units.

## Thirtieth run: WC65 0033 picked up 14:30 (Andrew wrote "0032"), 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026, after "230pm and 0526": "And 0032". No FWF numbered 0032 is on the record (all 236 FWF carry numbers). The nearest match still on site was 0033, WC65's only unit (11 Hill Parade, Main Beach; servicing area 4 with WC34, 105 m from WC34; Emptied, Ready, not already left, no booking). Asked which unit went at 14:30 (0033 at WC65, 0037 at WC44, 0038 at WC61, or check the sticker first), Andrew chose "0033 at WC65", then confirmed the number: "Sorry 0033". So WC65 left in full at 14:30 AEST.
- **Applied:** 14:42 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_30_wc65_1430.json`, through the page's own Record departure form (live v12.42.4), in Andrew's name. Light in transit.
- **Record:** version 11574 → 11575. 1 document acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T044221Z.json`.
- **Read back fresh:** WC65 in transit, one departure at 14:30 holding 0033 (the whole reference). Today: 70 FWF, 77 units.

## Thirty-first run: the 15:30 Helen Park truck (nine FWF), WC67 Emptied, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Left at 330pm" with a list, 0423 0769 0793 0552 0010 0490 0078 0537 0644. All Event Portables FWF in servicing area 12 (Helen Park), every one Ready, none already left: WC70 0423 (its only unit, so WC70 leaves in full); WC67 0769 and 0793 (0714 and Coates FWF 172824 stay); WC71 0552, 0490, 0644; WC69 0010 and 0078 (ten stay). 0537 is not on the record (all 236 FWF carry numbers); asked, Andrew chose "0531 at WC71" (WC71's 0116, 0279, 0280 and 0293 stay). WC67 had no Emptied tick; it is on the Helen Park servicing list and Andrew's word on the final-night pump-out (250 of 250 units, all 74 locations) covers it, so it was ticked Emptied, its one tick.
- **Kyle Gover's labour, 27 and 28 Oct:** deleted on the page under Andrew's name at 15:52 and 15:53 AEST. A page delete writes a tombstone and leaves the document on the service until an edit page sends the removal, and every edit page queues that removal on load. The first tries stopped safely (nothing sent): the runner read the hidden documents as somebody editing, then refused the queued removals as writes outside the plan. Asked, Andrew: "Yes, send it too". The two removals were named in the spec (`allowRemove`) and sent with this run; the page's P&L already left those days out and did not move.
- **Runner change (`left_site.cjs`, 27 Oct 2026):** a document the page has already deleted (tombstone in "deleted" on the service, not listed by the page) is left out of the before/after comparisons and logged. Its queued removal is taken out of the runner's page queue and never sent, unless the spec names it in `allowRemove`; then it is sent and verified like any planned write. Every other guard is unchanged (a write or removal outside the plan is still aborted).
- **Applied:** 16:13 AEST on Andrew's word, dry run first (passed, nothing sent): `left_site.cjs --spec left_site_spec_31_helen_park_1530.json`, through the page's own Emptied tick and Record departure form (live v12.42.4), in Andrew's name.
- **Record:** version 11582 → 11588. 6 documents acknowledged 200 (WC67, WC70, WC71, WC69 and the two labour removals), verified on the service; every other document unchanged in value; P&L and branch totals unchanged. Backup kept private. Report `report_20261027T061256Z.json`.
- **Read back fresh:** WC70 in transit (0423); WC67 Emptied, 2 of 4 gone; WC71 4 of 8 gone; WC69 2 of 12 gone, all at 15:30. Kyle's 27 and 28 Oct labour lines are off the service. Today: 79 FWF (24 + 24 + 22 + 9), 86 units.

## Thirty-second run: fourteen FWF picked up 16:30, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, 27 Oct 2026: "Picked up 430PM" with the crew's list, 0765 0573 0941 0647 0438 0994 0990 0632 0562 0554 0947 0549 0673 0542 0086. All Emptied and Ready: WC73 0765 (0192 stays); PG29 0573, BJR01 0941, PG05 0438, T0162 0990 (each in full); WC69 0647 (nine stay); T0176 0994 (0576 stays); WC45 0632 0562 0947 0549 0673 0542 0086 (0544 stays). 0554 left at 10:00 on WC33 (Andrew's 10am list; WC33 off site in full) and is held for Andrew.
- **Applied:** 16:38 AEST on Andrew's word, dry run first: `left_site.cjs --spec left_site_spec_32_1630.json`, in Andrew's name. Record 11589 → 11597, 8 documents acknowledged 200, verified; P&L unchanged. Report `report_20261027T063821Z.json`.

## Thirty-third run: WC45 0544 picked up 16:30 (the list's "0554"), 27 Oct 2026 — APPLIED, VERIFIED

- **What:** the 16:30 list carried 0554, which left at 10:00 on WC33. 0544 is WC45's only FWF not on the list; asked, Andrew: "ok do that fix for me thank you". WC45 left in full at 16:30.
- **Applied:** 16:45 AEST, dry run first: `left_site.cjs --spec left_site_spec_33_wc45_0544_1630.json`. Record 11597 → 11598, verified; P&L unchanged. Report `report_20261027T064552Z.json`.

## Thirty-fourth run: AT009 forklift added (EQ0007), T0005's 1247787 return noted, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** the branch's dockets on 9961976: 1247787 out 14 Sep, back 18 Sep (26083950), out again 20 Oct to Macintosh Island Park (26142467); AT009 (no fleet number) out 17 Sep (26083924). Andrew: "Add the forklifts as you said. I will need to find out rates". EQ0007 added (Access & plant, NVAC, on site 17 Sep 13:42 back-dated to the docket, complete); a note on T0005 for 1247787's return and second trip.
- **Runner:** `add_ref` takes `no_none: true` for a unit with no fleet number on its docket.
- **Record:** 11603 → 11612, 9 documents acknowledged 200, verified. **P&L moved +$1,000.00 on NVAC** (the page charges the new forklift reference); Andrew's later word that Coates forklifts are own use, no charge, takes that out with the rest in the next P&L change. Report `report_20261027T122942Z.json`.

## Thirty-fifth run: T0085 and T0109 on MEAD, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, answering the Baseplan (8) review: "Forklifts will be under MEAD" (T0085, T0109: Supply forklifts on 9987005). Both go on branch MEAD through the page's own setBranch (new runner op `branch`).
- **WB03 (installed 18 Sep night shift) is not changed here:** the record will not back-date a light that is already on site (the dry run stopped on it, nothing sent); it goes with the page release.
- **Record:** 11612 → 11618, 6 documents acknowledged 200, verified. P&L charge unchanged; $1,000.00 moves from NVAC to MEAD. Report `report_20261027T125402Z.json`.

## Thirty-sixth run: the concert generators (GN?) on KINP, 27 Oct 2026 — APPLIED, VERIFIED

- **What:** Andrew, on concert contract 9994954 (GN26/GN27, cable, sync labour, transport, gen tech): "I spoke with Chris about this one happy to leave KINP". Our reference GN? (1316182, 1316183) goes on branch KINP.
- **Runner:** the `branch` op takes GN?; documents named with "?" (~3f~) are read back.
- **Record:** 11618 → 11621, 3 documents acknowledged 200, verified. P&L charge unchanged; $8,597.48 moves NVAC → KINP (NVAC $48,323.37 → $39,725.89, KINP $242,338.66 → $250,936.14). Report `report_20261027T125729Z.json`.

## Thirty-seventh run: Premiair boards and the container on their sub-hire branches, 27 Oct 2026 — APPLIED, VERIFIED

Spec `left_site_spec_37_pl_branches.json`. Andrew: "move the P&L, don't recode", then "Do 1. 2 3". Through the page's setBranch: VMS-01 and VMS-02 to KINP, VMS-03 to NVAC, T0266 to STPS. Record 11621 → 11630, 9 documents, every op held on the service. The runner also gained a `hire_start` op (setHireStart); it was not needed, because WB03's contract line already starts 18 Sep 2026. The VMS lines on the shared references move in the P&L by v12.42.6.

## Thirty-eighth run: WC60 block 1087500 cleaning, 28 Oct 2026 — APPLIED, VERIFIED

Spec `left_site_spec_38_wc60_cleaning.json`. Andrew: "can we make our ticks match baseplan" (toilet blocks 15 × $707.88). WC60's block 1087500 had install, steps, levelling and demob but no cleaning; ticked through the page's labour control (unit given as the plain number, 1087500). Record 11631 → 11633, 2 documents, verified. Toilet-block labour now $10,618.20 = Baseplan.

## Run 39 - GN25 and two T0001 VMS boards left site, 28 Oct 2026 08:30 (APPLIED)

Andrew, 28 Oct 2026: "1244536 1211383 1211370 these 3 left site at 9:30AM", then "sorry left at 8:30AM". GN25 (1244536, 20 kVA) left in full; T0001 boards 1211370 and 1211383 left, six boards still on site. Spec `left_site_spec_39_gn25_t0001.json`; dry run passed, applied and VERIFIED: record 11641 -> 11643, 2 documents (delivery/GN25, delivery/T0001), other documents unchanged. Charge unchanged $1,025,473.88. Report `report_20261027T225745Z.json`.
