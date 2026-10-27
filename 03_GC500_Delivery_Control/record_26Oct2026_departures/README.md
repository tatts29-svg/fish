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
