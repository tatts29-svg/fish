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

## Run 40 - 14 Event Portables toilets left 10:00 and GN23 (150 kVA) left 09:45, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "0116 0692 0123 0426 0699 0622 0679 0293 0280 0070 0279 0592 0432 / Leaving 10am", "0714 is another same time", "150kva left 945am". WC69 7 (2 still to leave), WC71 4 (left in full), WC67 0714 (1 still to leave), WC68 0426 and WC72 0699 (each left in full) at 10:00; GN23 1297157 left in full at 09:45. 0426, 0699 and 0714 sit on the newer unit records (unit925). Spec `left_site_spec_40_wc69_wc71.json`; dry run passed after the page showed WC71 and GN23 leave in full; applied and VERIFIED: record 11643 -> 11649, 6 documents, others unchanged. Charge unchanged $1,025,473.88. Report `report_20261028T000452Z.json`.

## Run 41 - WC69 last two (0958, 0152) left 10:00, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "And 0958 and 0152" - with the 10:00 load; WC69 left in full. Spec `left_site_spec_41_wc69_last.json`; dry run passed, applied and VERIFIED. Report `report_20261028T001206Z.json`.

## Run 42 - SVP01 0939, WC73 0192, T0176 0576, PG03 0100 left 09:45, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "0939 0192 0576 0100 left 945am". Each location left in full. Spec `left_site_spec_42_four_fwf.json`; dry run passed, applied and VERIFIED. Report `report_20261028T005920Z.json`.

## Run 43 - P69 (Coates 107247) left 10:15, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "P69 left 1015am / Make sure you dont mess with the build some areas dropeed from 100%". The departure form offers P69 one unit, Coates 107247; P69 left in full. Dry run and apply: Today groups unchanged (buildings 52/52, toilets 265/265, barriers 311/311, generators 15/15, lighting 6/6 all 100%; VMS 23/24 and equipment 12/13 as before this morning). Build tab re-read after: the only figures under 100% are the event-week day cards 19-22 Oct at day's close (86.1, 91.64, 91.73, 98.19%), unchanged. Record 11654 -> 11655. Report `report_20261028T010728Z.json`.

## Run 45 - WC39 0637/0188, WC38 0183, WC40 0965 left 11:15, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026 (photo of the sent list): "0637 0188 0183 0965 / Leaving 1115am". WC39 and WC38 left in full; WC40 4 FWF still on site. Today groups unchanged. Record 11655 -> 11658. Report `report_20261028T012135Z.json`.

## Run 44 - LT05 1224783 and LT06 1224791 left 12:00, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "1224791 1224783 Leaving 12pm". Both light tower pods left in full; applied at 12:06 from the scheduled check, nothing said to change it. Today groups unchanged (lighting 6/6). Report `report_20261028T020720Z.json`.

## Run 46 - WC41 (10), WC42 (1), WC40 last 4 left 12:15, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "Wc42 wc41 all picked up 12:15pm", then "Picked up.1215pm too" with 0626, 0648, 0433, 0541 (WC40). WC41, WC42 and WC40 each left in full. Today groups unchanged. Report `report_20261028T022023Z.json`.

## Run 47 - P45 (Coates 107135) left 12:40, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "P45 left 1240pm". Left in full. Today groups unchanged. Report `report_20261028T024418Z.json`.

## Run 48 - WC61 all 8 FWF and WC85 0135 left 13:00, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "All Wc61 left at 1pm"; "Lets.do wc85.leave same time as othere". WC61 and WC85 each left in full; applied at 13:03 from the scheduled check. Today groups unchanged. Report `report_20261028T030402Z.json`.

## Run 49 - GN03 (Coates 1320829) left 13:30, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "Gn03 picked.up 130pm". Left in full; applied at 13:34 from the scheduled check. Today groups unchanged. Report `report_20261028T033437Z.json`.

## Run 51 - T0001 VMS 1271129, 1211356, 1182999 left 14:30, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026 (photo with regos F05419, ER9244, 410UFQ): "Left 230pm". Three boards still on T0001. Today groups unchanged. Report `report_20261028T052912Z.json`.

## Run 50 - GN20-A (Coates 1276701) and GN21 (Coates 1261284) left 15:30, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "1276701 and 1261284 leaving at 330pm". Each left in full; applied at 15:37 from the scheduled check (record 11688 -> 11690). Today groups unchanged (generators 15/15). No distribution board is on either record; the only one on the record is 1189078 at GN23 - awaiting Andrew's word on which board went with these. Report `report_20261028T053758Z.json`.

## Run 52 - GN23 distribution board 1189078 left with the 150 kVA at 09:45, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026: "yes its that one" - the distribution board that went back is 1189078 (Lifeguard 17) on GN23's units, which left with generator 1297157 at 09:45 (run 40). GN23's departure form offers only the generator, so the board's departure is added to GN23's note (`note_append`). Today groups and P&L unchanged. Report `report_20261028T055339Z.json`.

## Run 53 - Build back to 100%: VMS 1211356 on T0001, EQ0007 complete dated to its arrival, 28 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026, on Today reading 98.31% (VMS 23/24, Equipment 12/13): "this needs to be fixed".
- VMS: board 1211356 (contract 9961265 line 43) was on no delivery, so it read "Still to come". His 20 Oct entry (VMS05, rego ER9244, on T0001) sat under a register key the page does not show. The board's own register entry now carries rego ER9244 on T0001 (`vms_board`, keyed by asset number; the runner's check widened to allow a Coates asset-number key).
- Equipment: EQ0007 (AT009 rough-terrain forklift 2.5t) has been on site since docket 26083924, 17 Sep 2026 13:42 AEST. Complete was pressed only on 27 Oct, after the progress cut-off of Fri 23 Oct. Its complete is dated to that arrival (`date_back`).
Today groups after: all seven at 100%. P&L unchanged at $1,025,473.88. Report `report_20261028T060206Z.json`.

## Run 54 - water barriers WB06 (154), WB01 (12), WB05 (13), WB17 (6) left 19:30 Mon 27 Oct 2026 (APPLIED)

Andrew, 28 Oct 2026, on the barriers Baseplan has off rent on 27 Oct: "lets role with this" (those four), then "7:30PM". 185 barriers, each reference left in full. A barrier reference holds one counted code (ARMORZONMASHTL2, type TL2) plus the rest unnumbered, so each op ticks the code and puts the remainder in the unnumbered count. The runner's asset-number check was widened to 16 characters for that code. Today groups and P&L unchanged; record 11698 -> 11702. Report `report_20261028T063156Z.json`.

## Run 55 - the three Premiair VMS references' Complete dated to their arrival (28 Oct 2026, 23:38 AEST)

Andrew, 28 Oct 2026, late evening: "Things in build are no longer showing 100% please fix." Read-only first (`MS1025.allFacts` at the Fri 23 Oct cut-off on the live page): six of seven areas at 100%; VMS boards had seven references with four Complete, though all 24 boards were on site. Record 11703 had not changed since 18:47, and the live v12.45 build read the same, so the evening's page releases were not the cause. VMS-01 (VMS21), VMS-02 (VMS22) and VMS-03 (VMS24) were added in run 11 on 27 Oct 05:19 and their Complete ticks carry that moment, after the cut-off; the boards were in place on 22 Oct, as their own on-site stamps and Andrew's 27 Oct word ("22 oct", Premiair docket 26143911) say. Spec `left_site_spec_55_vms_premiair_dates.json`: `date_back` on each, complete/receipt/install to the on-site stamp (VMS-01 2026-10-21T22:08:24.160Z; VMS-02 and VMS-03 2026-10-21T14:00:00.000Z). Check-spec, dry run (12 documents, P&L unchanged at $1,011,296.03) and apply: record 11703 -> 11715, other documents unchanged in value. Report `report_20261028T133820Z.json`. Fresh load after: all seven areas reached, the Today bar reads "Build complete · 7 of 7 areas at 100%".

Seen on the same screenshots, not changed here: (a) WB17 on the Build tab reads "In transit" with its delivery booking after leaving site 27 Oct 19:30 - every fully departed reference (GN10, GN13, GN06 too) carries `delivery.state` "in transit" with the departure in its history, so the Build card needs a page change (handed to Codex on PR #1); (b) the laser plane EQ0006 (asset 1065384, rental 9987005 line 8, MEAD, contract start 16 Oct 2026, delivery 26135873) was added on 25 Oct with that day as its on-site stamp, so Today's "Other" card reads 4 of 5 on site at the cut-off; the runner will not re-date a light that is already on site (as with WB03), so its arrival date waits on the page release.

## Runs 56 and 57 - the Questions tab's five open items answered (29 Oct 2026, 00:00-00:05 AEST)

Andrew, 28 Oct 2026, 23:55: "I see there is questions. You should be able to answer all of these." Read from the latest Baseplan export (27 Oct 20:39), the live P&L (money probe) and the record:
- **28 KINP, 1 STPS and 1 MEAD "contract lines still without a rate"**: the check reads Baseplan's hire-rate column (Rate 1), which Baseplan leaves blank on labour, pump-out, cleaning, accommodation and consumable lines; those are priced by Price x Quantity (Prebill Amount). The 21 priced lines are already in the P&L: pump-outs 9968955/141-143 $51,154.74 + $14,990.40 + $6,246.00 = $72,391.14 = P&L 1032 to the cent; accommodation 9968862/140 + 9968955/163 = $27,700.00 = the P&L accommodation line to the cent; the install, demob and event-labour lines sit in 1047 Installation ($107,918.24). The $0 lines are spares (9968929/8-12), the extinguisher stillage (9968862/137), consumables billed on 10000506 (9968955/150), cable inside the generator rate (9994954/12) and the laser plane 9987005/8 (own use, $0 on Baseplan).
- **EQ0007 "needs a fleet number"**: Baseplan 9961976/34 carries AT009 as a miscellaneous item at $0 with no number; the docket (26083924) has none either. AT009 is its identity.
- **EQ0002 / EQ0003 "short"**: both booms arrived 21 Oct and left 26 Oct (departures recorded); their quantity records never took a receipt.
Run 56 (`left_site_spec_56_questions_answers.json`): five `answer` notes under br-norate-KINP, br-norate-STPS, br-norate-MEAD, sp-short and sp-nums; record 11715 -> 11727, 12 documents, P&L unchanged. Report `report_20261028T140017Z.json`. Run 57 (`left_site_spec_57_booms_supplied.json`): what turned up recorded as 1 each on EQ0002 and EQ0003 (`supplied`); record 11727 -> 11733, 6 documents, P&L unchanged. Report `report_20261028T140453Z.json`. The notes sit under each question; the questions themselves close only when the page's checks change (handed to Codex): the no-rate check should accept Price x Quantity as the line's rate for non-hire item types, the short check should honour recorded arrivals and departures, and the numbers check should accept an identity Baseplan itself carries without a number.

## Demob figures checked against the raw record (29 Oct 2026, 00:05 AEST)

Andrew, 23:57, with five Demob screenshots: "Please make sure all this data is 100% correct." Independent recount from the record (version 11715, every `delivery` history entry carrying a departure): units departed 31 on Mon 26 Oct, 286 on Tue 27 Oct, 62 on Wed 28 Oct = **379**; references with a departure 74, of which **71 fully gone**; 71 references read in transit. The page's own model (`DemobProgress996.whole`) reads 379 of 795 units, 71 of 186 references, which is what the screenshots show. 379 / 795 = 47.67% (shown 48%); next star at 60% is 12.33% away (shown 12.3%); Day 3 of 15 on Wed 28 Oct with 52.33% over 13 days = 4.02% a day (shown 4.0%); after midnight the page reads Day 4 and 4.4%, as it should. The 795-unit total is the page's unit model (asset register v1 counted 798 before the de-duplications) and was not recomputed here. Cards: 402 all = 203 on site + 199 picked up; 158 not ready + 45 ready + 199 picked up = 402. One thing to look at: the branch chips read KINP 133, NVAC 22, STPS 21 = 176 of the 203 on site; 27 assets sit under no chip (MEAD or unassigned) - noted for Codex, not a record matter.

## Run 58 - the laser plane EQ0006 on site from 16 Oct 2026 (29 Oct 2026, 04:16 AEST)

Andrew, 29 Oct 2026: "Yes it arrived" (the laser plane, 16 Oct). EQ0006 (asset 1065384, rental 9987005 line 8, MEAD, contract start 16 Oct, delivery 26135873, booked back 17 Oct, used by our crew for the V8s install) was entered on 25 Oct with that day as its arrival, so Today's Other card read 4 of 5 at the 23 Oct cut-off and the Thu 22 Oct day card 99.88% at day's close. The page's own `installationOn1098` refuses a day the light moved after, and the runner's dated `light` only dates a light it has just set, so the runner gained **`light_redate`** (ref, at, why): for a reference already on site, its last on-site history entry and `set_at` move to the earlier time with the reason appended to the entry's note; it refuses a future time, a time not earlier than the recorded one, and any reference whose light moved to another state after that time; verified by `set_at`, the entry's time and its note. Spec `left_site_spec_58_eq0006_laserplane_16oct.json`: `light_redate` to 2026-10-15T14:00:00.000Z (16 Oct 00:00 AEST, no time known) and `date_back` complete and receipt to the same (no install stamp exists for it). Dry run: three documents, P&L unchanged, EQ0006 on site at 23 Oct. Apply: record 11733 -> 11736, other documents unchanged. Report `report_20261028T181600Z.json`.


## Run 59 — purchase order 4667755, Job Connect, week ending 18 Oct 2026 (29 Oct 2026 08:32 AEST, record 11934 → 11937)

Andrew, 29 Oct 2026: "4667755" for Eric Lucian's week, then "he uses this too 4667755" for Daniel Gough (one purchase order per person per week). New runner op `po`: the purchase order through the page's own `setPo` (what the Purchase orders card saves), number, supplier, what, period, branches, confirmed; no amount until the invoice. Spec `spec59_po_eric.json`, report `report_20261028T223206Z.json`: `purchaseOrders/4667755` = Job Connect, labour, "Eric Lucian and Daniel Gough - week ending 18 Oct 2026", w/e 18 Oct 2026, KINP, confirmed; three documents written, verified, every other document unchanged in value. Open: Daniel's hours for that week are not on the record (only his 30 Sep and 26 Oct shifts are); Kyle's purchase order for the same week (52.5 h) is still to come.


## Runs 60 and 61 — purchase orders 4670882 (Daniel Gough) and 4671825 (Kyle Gover), Job Connect, week ending 25 Oct 2026 (29 Oct 2026 08:34 AEST, record 11937 → 11940 → 11943)

Andrew, 29 Oct 2026: "this will be daniel next week 25/10/2026 4670882"; "and this will be Kyle Week Ending 25/10/2026 4671825". Specs `spec60_po_daniel_w25oct.json` and `spec61_po_kyle_w25oct.json`, reports `report_20261028T223401Z.json` and `report_20261028T223506Z.json`: each a `po` op through the page's own setPo, KINP, confirmed, no amount until the invoice; three documents written per run, verified, every other document unchanged in value. Kyle's week on the record: 19–22 Oct days, 23–25 Oct nights, 78.78 h. Daniel's race-week hours are not yet on the record (his accommodation 22–25 Oct is).


## Run 62 — purchase order 4668970, Kyle Gover, Job Connect, week ending 18 Oct 2026 (29 Oct 2026 08:53 AEST, record 11943 → 11946)

Andrew, 29 Oct 2026: "Kyle week Ending 18/10/2026 P/O 4668970". Spec `spec62_po_kyle_w18oct.json`, report `report_20261028T225339Z.json`: `po` op through setPo, KINP, confirmed, no amount until the invoice; three documents written, verified, every other document unchanged in value. Kyle's week on the record: 12–16 Oct, 52.5 h.


## Run 63 — purchase order 4665091, Daniel Gough, Job Connect, week ending 11 Oct 2026 (29 Oct 2026 09:28 AEST, record 11946 → 11949)

Andrew, 29 Oct 2026: "4665091 Daniel Sun 11 Oct 6–9 Oct". Spec `spec63_po_daniel_w11oct.json`, report `report_20261028T232819Z.json`: `po` op through the page's own setPo, KINP, confirmed, no amount until the invoice; three documents written, verified, every other document unchanged in value; P&L unchanged (charge $1,007,518.57, cost $448,019.57). Daniel's week on the page's roster: 6–9 Oct, 42 h. Live page at the run: v12.54.1 `20a81f75…`. Clock note: the AEST times in the run 59–62 headings above were written up to two hours ahead and are corrected here to the report clocks (08:32, 08:34, 08:53).


## Run 64 — purchase order 4647509 (Advanced Temporary Fencing, construction week 5) matched to the invoice (29 Oct 2026 09:55 AEST, record 11949 → 11952)

Andrew, 29 Oct 2026: "Match ours to the cent" — Advanced's invoice GC220926 (22 Sep 2026) is $33,670.50 ex GST; the order and receipt 4922398 held $33,670.00. Spec `spec64_po_4647509_invoice.json`, report `report_20261028T235455Z.json`: `po` op through the page's own setPo, amount $33,670.00 → $33,670.50 and the invoice noted on the order; receipt, programme sheet and supplier pricing kept (setPo merges). Three documents written, verified, every other document unchanged in value. P&L: known cost $448,019.57 → $448,020.07 (+$0.50), charge unchanged. Runner: a `po` op may now carry `revenue_branch: null`, as the fencing orders hold it.


## Run 65 — receipt IDs on the three construction-week fencing orders (29 Oct 2026 09:58 AEST, record 11952 → 11960)

Andrew, 29 Oct 2026: "Receipt ID 4929277 for 4647515, Receipt ID 4936461 for 4647519, Receipt ID 4934877 P/O 4647520". Spec `spec65_po_receipts_w1_w2_w3.json`, report `report_20261028T235800Z.json`: three `po` ops through the page's own setPo, each setting the receipt ID (the card's "receipt ID no." box, held as `invoice_no`) and `receipted: full` as the Finance card's select holds it — the invoices GC071026, GC141026 and GC121026 match these orders to the cent, so the receipt is the full order amount. Amounts, periods, sheets, supplier pricing and notes untouched; each order's "checked" tick cleared itself (the page's rule when a checked order changes). Eight documents written, verified, every other document unchanged in value. P&L: known cost $448,020.07 → $447,970.07 (−$50.00) — a receipted order stands at its amount (Andrew's rule, 23 Oct), and 4647520 now stands at $66,272.00 where the page had carried its week 1 dockets at Advanced's sheet rates, $50.00 more; 4647515 and 4647519 moved nothing. The Rehire basis now reads five orders matched to the cent, $205,038, and the receipted orders $2,577.00 under the sheet rates (was $2,527.50). Runner: a `po` op may carry `invoice_no` and `receipted`, and the final verify compares amount, note, receipt ID and receipting when the op names them.


## Run 66 — three Premiair VMS boards left site 12:00 (29 Oct 2026 12:31 AEST, record 11964 → 11967)

Andrew, 29 Oct 2026 12:28 AEST, photo of the three plates: "Picked up 12pm". Spec `spec66_vms_boards_left_1200.json`, report `report_20261029T023144Z.json`: through the page's own Record departure form at 2026-10-29 12:00 AEST — VMS-01 (97T, T16922, VMS21) and VMS-02 (445T, TE99CL, VMS22) left in full, lights in transit; T0158 part: 453T (TF54CQ, VMS23) left, the rest of T0158 (475T VMS20, 487T VMS19, 472T VMS18, 1201864 VMS14, 1191957) still on site. Three delivery documents written, verified, every other document unchanged in value; P&L unchanged.


## Runs 67 and 68 — VMS19 (487T) left 12:40 and VMS14 (1201864) left 12:00 (29 Oct 2026 12:41–12:42 AEST, record 11967 → 11968 → 11969)

Andrew, 29 Oct 2026: "Picked up 487T at 1240pm"; "1201864 picked up 12pm". Specs `spec67_vms19_left_1240.json` and `spec68_vms14_left_1200.json`, reports `report_20261029T024112Z.json` and `report_20261029T024217Z.json`: through the page's own Record departure form on T0158 — 487T (TE02H0, VMS19, Premiair) at 12:40, 1201864 (TD98VJ, VMS14, Coates) at 12:00; T0158 stays part, with 475T (VMS20), 472T (VMS18) and 1191957 still on it. One delivery document written per run, verified, every other document unchanged in value; P&L unchanged.


## Run 69 — VMS23 (453T) re-dated: left Friday 23 Oct 12:00, not 29 Oct (29 Oct 2026 13:04 AEST, record 11969 → 11970)

Andrew, 29 Oct 2026 12:50 AEST: "453t left friday 12pm friday gone". Run 66 had recorded 453T off T0158 at 29 Oct 12:00 from the plate photo. Spec `spec69_vms23_left_fri_23oct.json`, report `report_20261029T030345Z.json`: new runner op `collection_redate` — the one recorded collection on T0158 carrying 453T keeps its id and units and gets `departedAt1211` 2026-10-23T12:00:00+10:00 and `date` 2026-10-23, with the reason and the old time noted on the entry, as `light_redate` re-dates an arrival. One delivery document written, verified; every other document unchanged in value; P&L unchanged.


## Run 70 — VMS11 (467T) left site 12:30 (29 Oct 2026 13:14 AEST, record 11970 → 11971)

Andrew, 29 Oct 2026 13:12 AEST: "Picked up 467T at 1230pm". Spec `spec70_vms11_left_1230.json`, report `report_20261029T031351Z.json`: through the page's own Record departure form on T0128 — 467T (TE97G, VMS11, Premiair) at 12:30; T0128 stays part, with 1211646 (VMS12, Coates) still on it. One delivery document written, verified, every other document unchanged in value; P&L unchanged.


## Run 71 — 1191957 on T0158: not a VMS board, Ready tick off (29 Oct 2026 13:30 AEST, record 11971 → 11972)

Andrew, 29 Oct 2026 13:35 AEST: "Remove this its not part of a vms". 1191957 was entered on T0158 on 16 Oct as VMS13 (rego EN3803) and its unit record was set aside by Andrew on 19 Oct; the leftover was its Ready tick on T0158. Spec `spec71_t0158_1191957_off.json`, report `report_20261029T032950Z.json`: new runner op `unit_ready_off` — the tick comes off through the Demob cards' own writer (Singles1238.setUnitReady, off, with the reason), read against the raw delivery document because the page's deliveryOf view leaves out a tick whose unit record is set aside. One delivery document written, verified, every other document unchanged in value; P&L unchanged. Still on the page, for Codex: the VMS plan's default identity for position 13 names 1191957 (page data, not the record).


## Run 72 — VMS18 (472T) and VMS20 (475T) left site Monday 26 Oct (29 Oct 2026 13:32 AEST, record 11972 → 11973)

Andrew, 29 Oct 2026 13:31 AEST (the spec's wording says 13:42; the message came at 13:31): "472 and 475 log as picked up. Put down monday please." Spec `spec72_vms18_vms20_left_mon.json`, report `report_20261029T033154Z.json`: through the page's own Record departure form on T0158 — 472T (TE58GZ, VMS18) and 475T (TE88HN, VMS20), Premiair, at 2026-10-26 12:00 AEST; no time was given, so 12:00 is a nominal time and the spec says so. T0158 stays part: the Coates race-day boards VMS15 (1211348), VMS16 (1211376) and VMS17 (1211364) are still on it. One delivery document written, verified, every other document unchanged in value; P&L unchanged.

## Run 73 — 450T, 472T and 475T off hire 29 Oct; VMS24 (450T) leaves the record (29 Oct 2026 13:44 AEST, record 11973 → 11978)

Andrew, 29 Oct 2026 13:35 AEST: "450. 472.475 off hire as of today please." Spec `spec73_vms24_vms18_vms20_off_hire.json`, report `report_20261029T034420Z.json`. The page has no typed off-hire day for a sub-hired board: a reference's off-hire is read from the schedule's removal rows, the rental system's off-hire date on the contract line, or the recorded departure, and a hire start is the only hire date a person can type (`setHireStart`). So the off-hire day went on the record the two ways the page has: (1) VMS-03 — 450T (TE94CL, VMS24), Premiair, left site 2026-10-29 12:00 AEST through the page's own Record departure form; no time was given, so 12:00 is a nominal time, as for 472T and 475T, and the spec says so; VMS-03 has left in full, light in transit. (2) A dated note on each reference through the delivery note writer: VMS-03 "Off hire Thu 29 Oct 2026 - Premiair board 450T (VMS24) …" and T0158 "Off hire Thu 29 Oct 2026 - Premiair boards 472T (VMS18) and 475T (VMS20) … both left site Mon 26 Oct 2026 (12:00 nominal)". The departures of 472T and 475T stay at Monday 26 Oct as Andrew asked in run 72; the off-hire day is the later Thursday. Five documents written (delivery/VMS-03, delivery/T0158 and their stamps), verified, every other document unchanged in value; P&L unchanged — the contract lines 9961265/24, /26 and /31 charge the customer to the contract's own term, and Premiair's account is costed from its invoice when it comes. The spec file's "why" was corrected after the run from 14:47 AEST to 13:35 AEST (the clock time of Andrew's message); the report carries the earlier wording. Nothing on the page reads the spec's "why".

## Run 74 — the post-event VMS plan on T0001 and T0158: seven boards stay to 15:00 Fri 13 Nov (29 Oct 2026 14:26 AEST, record 11978 → 11982)

Andrew, 29 Oct 2026 14:20 AEST: "these are the new numbers and new Asset numbers to the vms" — seven Coates boards remain in place with their notices and come out after 15:00 Fri 13 Nov 2026: VMS #1 1211354 EX0017 (GC Highway north of Sundale bridge), #2 1191957 EN3803 (Waterways Drive / Club 500), #3 1211348 ER9217 (GC Highway, Tedder Ave / Gate 1 external, "Construction Works - 50km/hr"), #4 1191877 EM6306 (GC Highway / Admiralty Drive), #6 1211359 ER9247 (GC Highway northbound median, the Marriott), #7 1211364 ER9410 (Main Beach Parade southbound, caravan park crossing), #8 1211376 ES3211 (Esplanade south of Staghorn Ave); the rest show "GC500 Works - Expect Delays". Andrew's word verbatim and the mapping to the record are in `review_29Oct2026_vms_postevent/README.md`. Every rego already matches the VMS register (the 16 and 18 Oct runs), so nothing to correct there; the page has no post-event plan phase (asked of Codex as v12.58), so the plan went on as dated notes on the two references the boards sit on, through the delivery note writer. Spec `spec74_vms_postevent_plan_notes.json`, report `report_20261029T042542Z.json`: four documents written (the two notes and their stamps), verified, every other document unchanged in value; P&L unchanged — the VMS lines on 9961265 already run to the rental system's 13 Nov off-hire. 1191957 is on the record as VMS13 on T0158 (register row); its unit record was set aside 19 Oct as a duplicate entry; run 71's "not a VMS board" wording is superseded by this later word, and its Ready tick rightly stays off — the board stays to 13 Nov. The three T0001 boards (1211354, 1191877, 1211359) never left, so their missing departures were right. VMS pick-ups still outstanding: VMS09 1211404 (T0103), VMS10 120T (T0103, Ready since 08:20), VMS12 1211646 (T0128).

## Run 75 — VMS09 (1211404) Ready for pick-up; VMS10 and VMS12 already Ready (29 Oct 2026 14:31 AEST, record 11982 → 11983)

Andrew, 29 Oct 2026 14:29 AEST: "these are ready for pick up", with the three-board table (VMS09 1211404 and VMS10 120T on T0103; VMS12 1211646 on T0128). Spec `spec75_vms09_vms10_vms12_ready.json`, report `report_20261029T043105Z.json`: each unit's own Ready tick through the Demob cards' writer — 1211404 ticked Ready; 120T (ticked by Andrew at 08:20) and 1211646 were already Ready and were left as they were. One document written (delivery/T0103), verified, every other document unchanged in value; P&L unchanged. The three VMS pick-ups outstanding are all Ready; each departure goes on when it leaves.

## Run 76 — eight Coates water barrier runs left site at the programme's dates (30 Oct 2026 04:27 AEST, record 11984 → 11992)

Andrew, 30 Oct 2026 03:0x AEST and again 04:2x AEST: "All barriers should now be off hired apart from s08 is that correct looking at this. But you should be showing correct areas on maps where these are." Before the run the record held departures for WB01, WB05, WB06 and WB17 only (run 54, 27 Oct 19:30); the other Coates runs still read Still to leave. Spec `spec76_wb_off_hire.json`, report `report_20261029T182707Z.json`: each reference leaves in full through the page's own Record departure form, in Andrew's name, at the removal date and time on the water barrier programme (TP02-26003-03, 29/10/26 updates).

| Reference | What left | Left site (AEST) | Programme row |
|---|---|---|---|
| WB14 MP4.0 Turn 4 Drivers Right | 2 × TL2 (ARMORZONMASHTL2 + 1) | Sun 25 Oct 2026 19:00 | removal 25 Oct 19:00 |
| WB13 Fence bracing behind S15 | 10 × TL2 (unnumbered) | Mon 26 Oct 2026 10:00 | removal 26 Oct 10:00 |
| WB15 Turn 11 runoff HVM | 4 × TL2 (ARMORZONMASHTL2 + 3) | Tue 27 Oct 2026 07:00 | removal 27 Oct 07:00 |
| WB04 Helen Park HVM | 14 × TL2 (ARMORZONMASHTL2 + 13) | Tue 27 Oct 2026 09:00 | removal 27 Oct 09:00 |
| WB07 Admiralty Drive intersection | 17 × TL2 (unnumbered) | Tue 27 Oct 2026 09:00 | removal 27 Oct 09:00 (moved into the turning lane) |
| WB16 Gate 2 HVM | 13 × TL2 (ARMORZONMASHTL2 + 12) | Tue 27 Oct 2026 17:00 | removal 27 Oct 17:00 |
| WB18 Racing kerbs T2 | 2 × TL2 (ARMORZONMASHTL2 + 1) | Tue 27 Oct 2026 17:00 | removal 27 Oct 17:00 |
| WB03 Gold Coast Highway Turn 2 | 30 × TL2 (ARMORZONMASHTL2 + 29) | Thu 29 Oct 2026 19:00 | stored behind the T2 circuit barriers from 19 Oct 22:00, put back out as WB20 26 Oct, removed 29 Oct 19:00 |

- WB03 carries the real departure of its 30 (the same barriers as WB20); WB20 was never recorded as delivered (not on site on the record) so there was nothing to depart there and it is left as it is.
- S08 left alone, as Andrew said: WB02 (34) still on site with no collection recorded; WB19 (34) not on site, programme 3–6 Nov. Which 34 is on Main Beach Parade today is Andrew's to say.
- WB13 and WB07 carry no asset number on the record, so their count went in unnumbered; the other six tick the one TL2 code plus the rest unnumbered, as run 54.
- Dry run first on the live v12.56 page (`cb27d7c5…`): 8 documents planned, nothing sent. Apply: whole-record backup kept private (scratchpad `record_26Oct2026_departures/backup_state_20261029T182707Z.json`), page guard held, 8 documents (`delivery/` WB03, WB04, WB07, WB13, WB14, WB15, WB16, WB18) acknowledged 200, every op verified on the service, every other document unchanged in value. P&L unchanged (charge 998,997.00, cost 447,970.07; KINP 284,587.62 · STPS 79,773.44 · NVAC 44,272.04 · MEAD 25,660.25). Today unchanged (Barriers 311/311).
- Read back (`check_after.cjs`, fresh load of the live page): the eight in transit, Left site, 0 still to leave, recorded by Andrew Fisher at the times above; WB02 on site 34 still to leave; WB19 and WB20 not on site; errors 0, writes 0.
- Twelve of the fifteen Coates water barrier references on the register now read Left site (runs 54 and 76); WB02, WB19 and WB20 do not.

## Run 77 — Event Portables toilets 0146 (WC44) and 0435 (WC19) left site 30 Oct 09:40 (30 Oct 2026 09:56 AEST, record 12117 → 12119)

Andrew, 30 Oct 2026 09:4x AEST: "Picked up 940am" with twelve Event Portables toilet numbers (0065, 0651, 0517, 0518, 0643, 0191, 0682, 0521, 0669, 0996, 0146, 0031), then "Another is 0435". Spec `spec77_ep_pickups_30oct_0940.json`, report `report_20261029T235545Z.json`, backup `backup_state_20261029T235545Z.json`. Through the page's own Record departure form in Andrew's name: 0146 off WC44 (0037 stays, WC44 stays on site), 0435 off WC19 (its only toilet; WC19 left in full, light in transit). Dry run first, page guard `ddd1bd7a…` held, 2 documents written, both verified on the service, every other document unchanged in value, P&L unchanged.

Not recorded, for Andrew:

1. The ten numbers 0065, 0651, 0517, 0518, 0643, 0191, 0682, 0521, 0669 and 0996 are WC41's ten FWF, which the record already holds as left site Tue 28 Oct 12:15 (Andrew's own entry through the page at 12:20 that day, complete). Their redate to 30 Oct 09:40 was written as `spec78_wc41_redate_HELD.json` (now `spec78_wc41_redate_30oct_0940.json`, run 78) and held. The dry run (09:23–09:55 AEST, with a scratch copy of this runner whose P&L probe also prints the cost breakdown) showed the redate alone does this: moved to 29 Oct or 30 Oct the page stops treating WC41 as an Event Portables location — 900.70 of its revenue moves from Rehire (1010) to Hire (1005), the Event Portables supplier estimate turns incomplete (rehire 101,747.00 → 81,272.00 known; P&L known cost 455,995.07 → 435,520.07, the 20,475.00 shown as unknown, not as saved) and the 3325 pump-out and 2144 water lines fold into the one rehire line. Moved to another time on 28 Oct (12:16) nothing changes; the two departures of this run change nothing. So the day WC41's toilets left is tied, somewhere in the page, to its identity as an Event Portables location. Resolved by run 78 below: the ten left today, and the P&L movement was a reading artefact of the redate, fixed in the runner.
2. 0031 is on no reference on the record and has never been a toilet number on the page (the only "0031"s anywhere are a fence-docket id and task T0031). WC44's other toilet, still on site, is 0037. Andrew asked.

## Run 79 — Event Portables toilet 0285 left PG01 at 30 Oct 09:40 (30 Oct 2026 10:08 AEST, record 12119 → 12120)

Andrew, 30 Oct 2026 10:1x AEST: "Here is another that can go 0285". PG01 (Toilet, Pit Garage: one FWF, Event Portables 0285, Ready since 26 Oct, emptied 26 Oct). Spec `spec79_pg01_0285_30oct_0940.json`, report `report_20261030T000733Z.json`, backup `backup_state_20261030T000733Z.json`. Recorded at the same time as the 09:40 pick-up it was named with, through the page's own Record departure form in Andrew's name; PG01 left in full, light in transit. Dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value.

## Run 78 — WC41's ten Event Portables toilets redated to Thu 30 Oct 09:40 (30 Oct 2026 10:15 AEST, record 12120 → 12121)

Andrew, 30 Oct 2026 09:4x AEST: "Picked up 940am" listing WC41's ten (0065, 0651, 0517, 0518, 0643, 0191, 0682, 0521, 0669, 0996); 10:1x AEST, to the pricing warning: "It should not change any pricing". Spec `spec78_wc41_redate_30oct_0940.json` (held as `_HELD` during run 77), report `report_20261030T001457Z.json`, backup `backup_state_20261030T001457Z.json`. The one recorded collection carrying 0521 (WC41's ten, entered by Andrew through the page 28 Oct 12:20 as left 12:15) now reads left 30 Oct 09:40; the earlier time stays in the entry (`redated1211` with `entryWas`, note "(entered 2026-10-28T12:15:00+10:00)"). Dry run first: P&L identical, every Event Portables quote complete, WC41 still 10 collected and complete; applied, 1 document written, verified on the service, every other document unchanged in value.

**Why run 77's dry run moved the P&L, and the runner change.** The page reads a recorded departure only once it is no earlier than the entry that recorded it (a departure cannot be recorded before it happened). The 29 Oct redate op kept the entry's own time (28 Oct 12:20), so a departure moved to 29 or 30 Oct was read as not yet valid: the page dropped WC41's departure, counted the ten toilets as still on site, took contract line 9968955|59 out of the Rehire group (900.70 Rehire → Hire) and could no longer reconcile hire quote Q6845 (28,675.00 → 8,200.00 known), so the supplier estimate fell incomplete and known cost read 455,995.07 → 435,520.07. A reading artefact, not a price: the same redate to 28 Oct 12:16 changed nothing, and the 453T redate (to an earlier day, 23 Oct) never could. `left_site.cjs` now re-records the entry at the time of the correction when the new departure is later than the entry (the entry's earlier time kept as `entryWas`); a redate to an earlier time is unchanged. The scratch diagnostics (a copy of the runner whose P&L probe also printed `moneySummary().cost`, `pl770Model`, `rh766Model`, `Departure1211.status('WC41')` and the Q68xx quote states before and after the stage, run on the redate alone, the two departures alone, the redate to 29 Oct, to 28 Oct 12:16, and with the entry re-recorded) stayed in `/tmp/gc500-scratch/diag77`, not in the repo.

## Run 81 — WC43's ten Event Portables toilets were the Tue 28 Oct 12:15 load (30 Oct 2026 10:51 AEST, record 12122 → 12123)

Andrew, 30 Oct 2026 10:4x AEST, when asked whether WC41's ten went today or on the 28th: "No i had another 10 left on the 28th then"; 10:5x: "And wc43 should be all gone. So lets swap that with the 10 from 28th then". The departure he recorded on Tue 28 Oct 12:15 through WC41's form was therefore WC43's ten Event Portables FWF (Toilets, Island north by FREIGHT: 0056, 0161, 0182, 0420, 0528, 0581, 0646, 0696, 0723, 0961, Ready since 26 Oct, emptied 26 Oct), the only other block with exactly ten FWF still on the record; WC41's own ten are on his truck today (run 78). Spec `spec81_wc43_ten_28oct_1215.json`, report `report_20261030T005117Z.json`, backup `backup_state_20261030T005117Z.json`. Through the page's own Record departure form in Andrew's name, dated 28 Oct 12:15; WC43 left in full, light in transit. Dry run first (10:46, P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value.

Today's load, as Andrew counted it on the truck (23 FWF): WC41's ten, 0146 (WC44), 0435 (WC19) and 0285 (PG01) at 09:40 (runs 77–79), and WC09's ten at 11:00 ("Im grabbing all fwf from wc09", "Left at 11am"): the runner refuses a departure still in the future, so `spec80` waits in scratch with a check-in armed for 11:02 AEST. The numbers 0031 and 0531 he read this morning were misreads of toilets already in the 23 (the record has 0531 leaving WC71 on 27 Oct; 0551 is among WC09's ten). After WC09's ten, six Event Portables FWF remain on the record: WC10 three (0119, 0488, 0677), WC44 0037, WC81 0124, T0024 0164, plus WC09's six pee-panel slots.

## Run 80 — WC09 pumped out, and its ten Event Portables toilets left site at 30 Oct 11:00 (30 Oct 2026 11:09 AEST, record 12123 → 12124)

Andrew, 30 Oct 2026: 10:2x AEST "0585 0450 0085 0531 - Left at 11am"; 10:3x "Im grabbing all fwf from wc09"; 11:1x, asked whether WC09's ten were pumped out before loading: "Really.. all toilets have been pumped out this was done on sunday night via servicing". Spec `spec80_wc09_all_fwf_30oct_1100.json`, report `report_20261030T010918Z.json`, backup `backup_state_20261030T010918Z.json`. The runner refused the departure while 11:00 was still in the future (10:24), and the 11:03 dry run stopped at the page's emptied gate ("the Record departure form did not open for WC09": WC09 had no Emptied tick). On his word WC09 got the tick through the page's own setEmptied816 (the final-night pump-out, Sun 25 Oct) and all ten of its numbered Event Portables FWF (0081, 0085, 0089, 0140, 0450, 0551, 0553, 0584, 0585, 0993) left at 11:00 through the Record departure form in his name; the six pee-panel slots PP01–PP06 and the two Coates toilet blocks (1268858, 1311146) stay, so WC09 stays on site. Dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value. 0531 was not a WC09 number (the record has it leaving WC71 on 27 Oct); 0551, one digit away, is among the ten.

With this, today's load as Andrew counted it on the truck (23 FWF) is on the record: WC41's ten at 09:40 (run 78), 0146, 0435 and 0285 at 09:40 (runs 77 and 79), WC09's ten at 11:00. Six Event Portables FWF remain: WC10 three (0119, 0488, 0677), WC44 0037, WC81 0124, T0024 0164, plus WC09's six pee panels and WC31's two sixteen-pan blocks.

**Still open — WC41's duplicate entry.** At 10:34 AEST, between runs 78 and 81, another copy of the page (Andrew's phone) merged a stale WC41 document and wrote the superseded 28 Oct 12:15 entry back beside the corrected one: the page's `mergeRecords` merges a document's history as a union keyed by `state|at`, the merging side winning on a shared key, so the entry re-recorded at a later time (run 78) did not replace the old one on that copy. Both entries carry the same collection id; `Departure1211` reads the first, so the page shows WC41 leaving 28 Oct again (the P&L is unaffected either way). `left_site.cjs` has a `collection_remove` op for exactly this duplicate (the entry at the old time goes, the corrected entry stays and notes the removal; checked on the service); its dry run passed with the P&L identical (`/tmp/gc500-scratch/spec82_wc41_duplicate_removed.json`, parked). It is applied once Andrew has refreshed his page, so the stale copy cannot merge the entry back.

## Run 83 — 0037 left WC44 at 30 Oct 09:40; WC44 empty (30 Oct 2026 11:23 AEST, record 12125 → 12126)

Andrew, 30 Oct 2026 11:2x AEST: "0031 looks like it should of been 0037". 0031 was the one number of his 09:40 list that matched nothing on the record; 0037 is WC44's other Event Portables FWF (0146 left at 09:40, run 77). Spec `spec83_wc44_0037_30oct_0940.json`, report `report_20261030T012240Z.json`, backup `backup_state_20261030T012240Z.json`. Through the page's own Record departure form in Andrew's name, dated 09:40 with the rest of that load; WC44 left in full, light in transit. Dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value. Today's load is therefore 24 FWF: WC41's ten, 0146 and 0037 (WC44), 0435 (WC19), 0285 (PG01) at 09:40, WC09's ten at 11:00. Event Portables still on the record: WC10 three (0119, 0488, 0677), WC81 0124, T0024 0164, WC09's six pee panels, WC31's two sixteen-pan blocks.

## Run 84 — P57 left site 30 Oct 10:30 and P52 at 10:45 (30 Oct 2026 11:30 AEST, record 12126 → 12128)

Andrew, 30 Oct 2026 11:3x AEST: "P57 left 1030 p52 left 1045". P57 (Radio Distribution Office, Building 9.6m 1268888, Helen Park drop point) and P52 (Gate 1 Volunteer Check-In, Building 12m 1327211, Helen Park drop point), each its reference's only unit, each left in full. Spec `spec84_p57_p52_30oct.json`, report `report_20261030T012950Z.json`, backup `backup_state_20261030T012950Z.json`. Through the page's own Record departure form in Andrew's name, as the earlier building departures (P60, P62, P63, P25, P66, P65) were; dry run first (P&L identical), applied, 2 documents written, verified on the service, every other document unchanged in value.

## Run 85 — the event container T0023 ("aircon container") left site 30 Oct 11:30 (30 Oct 2026 11:32 AEST, record 12128 → 12129)

Andrew, 30 Oct 2026 11:3x AEST: "Aircon container left 1130am". The only container on the record is T0023, the Event Container from EAGS (Coates 1257261, island west parkland entry by the merch strip, on site since 15 Sep 2026); read as the aircon container, it left in full at 11:30. Spec `spec85_t0023_container_30oct_1130.json`, report `report_20261030T013147Z.json`, backup `backup_state_20261030T013147Z.json`. Through the page's own Record departure form in Andrew's name; dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value. Andrew, 11:4x: it was the refrigerator container, T0266 - run 87 records T0266 and run 88 withdraws this departure; T0023 is on site.

## Run 86 — P54 left 11:00, P56 11:15, P55 11:30; Premiair board 120T (VMS10) left T0103 at 10:00 (30 Oct 2026 11:34 AEST, record 12129 → 12133)

Andrew, 30 Oct 2026 11:4x AEST: "P54 left 11 p56 left 1115 p55 left 1130" and "120t left at 10am". P54 (Accred Centre BOH, Building 6m 1327219), P56 (Gate 1 Ticket BOH, Building 3.6m 1268865) and P55 (Gate 1 Ticket Box, Ticket Box 6m 172114), all at the Helen Park drop point, each its reference's only unit, each left in full. 120T is Premiair Hire's VMS10 on T0103 (pit lane entry), Ready since 29 Oct 08:20; it left at 10:00 and VMS09 (1211404) stays on T0103. Spec `spec86_p54_p56_p55_120t_30oct.json`, report `report_20261030T013411Z.json`, backup `backup_state_20261030T013411Z.json`. Through the page's own Record departure form in Andrew's name; dry run first (P&L identical), applied, 4 documents written, verified on the service, every other document unchanged in value.

## Run 87 — the aircon container was T0266, the 6.0 m Refrigerator Container, left site 30 Oct 11:30 (30 Oct 2026 11:48 AEST, record 12133 → 12134)

Andrew, 30 Oct 2026 11:4x AEST, after run 85 had read his "Aircon container left 1130am" as the EAGS event container T0023: "Recrigertor building it should be u should have a record do you not". The record has T0266, the 6.0m Refrigerator Container (United Rentals / Royal Wolf unit 920584, Helen Park, pit lane entry area), its reference's only unit: it left in full at 11:30. Spec `spec87_t0266_refrigerator_container_30oct_1130.json`, report `report_20261030T014803Z.json`, backup `backup_state_20261030T014803Z.json`. Through the page's own Record departure form in Andrew's name; dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value.

## Run 88 — T0023's departure of run 85 withdrawn; T0023 back on site (30 Oct 2026 11:50 AEST, record 12134 → 12135)

T0023 (Event Container from EAGS, Coates 1257261) did not leave: run 85's reading was wrong, the container that left was T0266 (run 87). Spec `spec88_t0023_departure_withdrawn.json`, report `report_20261030T015002Z.json`, backup `backup_state_20261030T015002Z.json`. `left_site.cjs` gains a `collection_withdraw` op for a departure recorded in error: the reference's one recorded collection (its id named in the spec) goes, the light returns to on site at its earlier time (15 Sep 07:15), and the Complete, Levelled and Steps ticks the departure took off go back on as they were (their "in transit" history entries of that moment go too); the withdrawal is kept on the document (`withdrawn1211`) and in its note, and the service is checked for all of it. Dry run first (P&L identical; the page read T0023 on site, complete, number 1257261), applied, 1 document written, verified, every other document unchanged in value. The same caution as run 78 applies: a copy of the page holding the withdrawn entry could merge it back (histories merge as a union, the merging side winning on a shared key), so Andrew's phone should be refreshed before he next works on the page.

## Run 89 — T0258, the 3.0 m container at Helen Park, left site 30 Oct 11:00 (30 Oct 2026 11:53 AEST, record 12136 → 12137)

Andrew, 30 Oct 2026 11:5x AEST: "To258 left 11am". T0258 (3.0m Container, Coates 1134386, Helen Park, craned in 7 Oct), its reference's only unit, left in full at 11:00. Spec `spec89_t0258_container_30oct_1100.json`, report `report_20261030T015326Z.json`, backup `backup_state_20261030T015326Z.json`. Through the page's own Record departure form in Andrew's name; dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value. The record between runs 88 and 89 (12134 → 12136) changed only by run 88 itself: the T0023 withdrawal held, and the 11:52 write from another copy of the page changed no document in value.

## Run 82 — WC41's duplicate 28 Oct entry removed; the page reads WC41 left 30 Oct 09:40 (30 Oct 2026 11:55 AEST, record 12137 → 12138)

Andrew, 30 Oct 2026 12:0x AEST: "Ilve.done the page refresh on my phone". With his copy of the page fresh (so it cannot merge the stale entry back), the duplicate described under run 80 came out with the `collection_remove` op: the entry at 2026-10-28T02:20:44Z (departed 28 Oct 12:15, the superseded reading) is gone; the entry at 2026-10-30T00:15:13Z (departed 30 Oct 09:40, run 78) stays and carries the removal (`duplicateRemoved1211`, note). Spec `spec82_wc41_duplicate_removed.json`, report `report_20261030T015526Z.json`, backup `backup_state_20261030T015526Z.json`. Dry run first (P&L identical), applied, 1 document written, verified on the service, every other document unchanged in value. Read back from the live page afterwards: WC41 one collection, 10 collected, complete, stamp "30/10/2026, 09:40:00 AEST"; known cost 455,995.07, Event Portables estimate complete.

## Run 90 — WC20's two toilet blocks left site 30 Oct 12:30; its two waste tanks stay (30 Oct 2026 12:48 AEST, record 12139 → 12140)

Andrew, 30 Oct 2026 12:4x AEST: "2.x.toilet blocks wc20 have left at 1230pm the waste tanks have not left yet". WC20 (Coates, Toilets & amenities; the pair craned in on 7 Oct after Helen Park) holds two Toilet Block 6m (1327228 Set 1, 1327225 Set 2) and two waste tanks (1311341 Set 1, 1328982 Set 2). Spec `spec90_wc20_two_blocks_30oct_1230.json`, report `report_20261030T024812Z.json`, backup `backup_state_20261030T024812Z.json`. First the Emptied tick through the page's own setEmptied816 in his name, on his word of 11:1x today that all toilets were pumped out on Sunday night 25 Oct by the servicing (the page's emptied gate keeps a toilet's departure form shut until it is ticked; the same word carried WC09's tick in run 80); then the two toilet blocks left at 12:30 through the Record departure form in his name. The two waste tanks stay, so WC20 stays on site and complete, "still to leave: 2 x Waste tank". Dry run first (12:46, P&L identical: charge 1,011,691.46, known cost 455,995.07), applied 12:48, 1 document written, acknowledged 200, verified on the service, every other document unchanged in value.

**WC41's duplicate is back.** Before this run the record moved 12138 → 12139 (12:42:58 AEST) and the only document that changed in value was delivery/WC41: the superseded 28 Oct 12:15 entry that run 82 removed at 11:55 was merged back by a copy of the page that still held it (signed Andrew Fisher, as every copy of the page is); the run-78 entry (30 Oct 09:40) is still there too, same collection id `14c64f48…`. The page reads the first, so WC41 shows leaving 28 Oct again; the P&L is not affected (known cost 455,995.07 either way, Event Portables estimate complete). Some other device or tab is still on a stale copy of the page: `collection_remove` goes again once every open copy has been refreshed, or it merges back once more. A durable fix would be a page change — the surviving entry already carries the removal (`duplicateRemoved1211`), and the merge and `Departure1211` could be taught to drop a history entry it names — a release on Andrew's word.

## Run 91 — WC41's duplicate 28 Oct entry removed a second time, after every device was refreshed (30 Oct 2026 13:06 AEST, record 12142 → 12143)

Andrew, 30 Oct 2026 13:0x AEST: "Pages refreshed on all devices, take the wc41 duplicate out". The superseded 28 Oct 12:15 entry that a stale copy of the page merged back at 12:42 (see run 90) is out again with the same `collection_remove` op as run 82: the entry at 2026-10-28T02:20:44Z is gone; the entry at 2026-10-30T00:15:13Z (departed 30 Oct 09:40, run 78) stays and now carries both removals (`duplicateRemoved1211`, two entries, and the note). Spec `spec91_wc41_duplicate_removed_again.json`, report `report_20261030T030620Z.json`, backup `backup_state_20261030T030620Z.json`. Dry run first (13:03, P&L identical: charge 1,011,691.46, known cost 455,995.07), applied 13:06, 1 document written, acknowledged 200, verified on the service, every other document unchanged in value. The record's other movements since run 90 (12140 → 12142, about 12:58, the refreshed devices saving) changed no document in value: between 12139 and 12143 only delivery/WC20 (run 90) and delivery/WC41 (this run) differ. If the entry comes back a third time, a copy of the page is still unrefreshed somewhere, and the durable fix is the page change noted under run 90.

## Run 93 — VMS12 (1211646) left T0128 at 30 Oct 10:00, with 120T; T0128 empty (30 Oct 2026 13:28 AEST, record 12143 → 12144)

Andrew, 30 Oct 2026 13:2x AEST, after the read-only answer that VMS09 (1211404, T0103) and VMS12 (1211646, T0128) were the two boards still on site and ticked Ready: "I have asset no 1211646 off site same time as vms 120t please". 1211646 is VMS12 (Coates, rego TF59LR), the second board on T0128 at the pit lane entry drop; 120T (Premiair's VMS10) left T0103 at 10:00 today (run 86), so 1211646 left at 10:00 too. T0128's other board 467T (VMS11) left 29 Oct 12:30 (run 70), so T0128 leaves in full, light in transit. Spec `spec93_t0128_1211646_30oct_1000.json`, report `report_20261030T032814Z.json`, backup `backup_state_20261030T032814Z.json`. Through the page's own Record departure form in Andrew's name; dry run first (13:26, P&L identical: charge 1,011,691.46, known cost 455,995.07), applied 13:28, 1 document written, acknowledged 200, verified on the service, every other document unchanged in value. VMS boards now: 16 left site; on site VMS09 (1211404, Ready since 29 Oct 14:31) and the seven post-event boards that stay to 15:00 Fri 13 Nov (1211354, 1191957, 1211348, 1191877, 1211359, 1211364, 1211376), none of them ticked Ready.

## Run 92 — WC10's three Event Portables toilets left site 30 Oct 13:30; WC10 empty (30 Oct 2026 13:30 AEST, record 12144 → 12145)

Andrew, 30 Oct 2026 13:1x AEST: "Leaving at 130pm / 0677 / 0048 / 0119"; 0048 matched nothing on the record and WC10's third toilet is 0488, so he was asked: "Yes its 0488". WC10's three Event Portables FWF (Toilets, Ready and Emptied since 26 Oct) — 0677, 0488 and 0119 — left at 13:30 through the page's own Record departure form in his name; WC10 left in full, light in transit. The runner refuses a departure still in the future, so the spec was parked in scratch at 13:08 with a check-in armed for 13:31 and the three-number version written at 13:23 on his answer; the 13:29 dry run was refused ("departure time is in the future") and the 13:30:03 one passed. Spec `spec92_wc10_all_three_30oct_1330.json`, report `report_20261030T033046Z.json`, backup `backup_state_20261030T033046Z.json`. Dry run first (P&L identical: charge 1,011,691.46, known cost 455,995.07), applied 13:30, 1 document written, acknowledged 200, verified on the service, every other document unchanged in value. Event Portables still on the record: WC81 0124, T0024 0164, WC09's six pee-panel slots, WC31's two sixteen-pan blocks.

## Run 94 — GN01, the 60 kVA generator at the median strip meet-up, left site 30 Oct 14:30 (30 Oct 2026 14:32 AEST, record 12156 → 12157)

Andrew, 30 Oct 2026 14:1x AEST: "Gn01 leaving at 230pm". GN01 (Generator 60 kVA, Coates 1276507, median strip meet-up by FOAM, on site since 28 Sep), its reference's only unit, left in full at 14:30, light in transit. The runner refuses a departure still in the future, so the spec was parked in scratch at 14:11 with a check-in armed for 14:31; dry run 14:31:31 (P&L identical: charge 1,011,691.46, known cost 455,995.07), applied 14:32. Spec `spec94_gn01_30oct_1430.json`, report `report_20261030T043238Z.json`, backup `backup_state_20261030T043238Z.json`. Through the page's own Record departure form in Andrew's name; 1 document written, acknowledged 200, verified on the service, every other document unchanged in value. Baseplan (11), received 14:2x, terms GN01's line (9961976/16) at 30 Oct 16:00, Off Rent, return docket 26163652 — the same day as the departure recorded here.

## Run 95 — WC41's duplicate out with its tombstone; T0023's withdrawn entry tombstoned (30 Oct 2026 16:47 AEST, record 12167 → 12172)

With v12.63 and v12.64 live at 16:45 (Andrew, 16:44: "Go live"), the parked spec ran. `collection_remove` on WC41 took the superseded
28 Oct 12:15 entry out a third time (same collection id as the corrected 30 Oct 09:40 entry, which stays and carries all three removals)
and, through the page's own `tomb()` in Andrew's name, wrote the tombstone `deleted['hist/WC41/in transit|2026-10-28T02:20:44.187Z']`
that the v12.63 merge honours; `hist_tomb` wrote `deleted['hist/T0023/in transit|2026-10-30T01:32:03.637Z']` for the departure
withdrawn in run 88, so no copy of the page can merge that one back either. Spec `spec95_wc41_duplicate_tombstoned_t0023_tombstoned.json`,
report `report_20261030T064726Z.json`, backup `backup_state_20261030T064726Z.json`. Dry runs at 15:0x (on v12.61, 5 documents planned)
and 16:46 (on v12.64), P&L identical both times (charge 1,012,101.16 after v12.64); applied 16:47 with the page guard `afbbc0d1…`,
5 documents written (delivery/WC41, the two tombstones in `deleted`, their names in `by`), acknowledged 200, verified on the service
including both tombstones, every other document unchanged in value. From here a copy of the page that still holds WC41's 28 Oct entry
drops it the first time it loads v12.64 and saves the cleaned document; the P&L was never affected by the duplicate.

## Run 96 — 1247787 (forklift, T0005) and 1276416 (generator, GN19) left site 2 Nov 08:15 (2 Nov 2026 08:19 AEST, record 12767 → 12769)

Andrew, 2 Nov 2026 08:1x AEST: "1276416 and 1247787 picked up 8:15am". 1247787 is the Forklift 2.5T RT on T0005 (Coates; back out
20 Oct on docket 26142467, 9961976 line 35; pick-up booked for 2 Nov 09:30). 1276416 is GN19's 60 kVA generator (Coates; ticked Ready
30 Oct). Spec `spec96_t0005_gn19_2nov_0815.json`, report `report_20261101T221858Z.json`; the whole-record backup is kept privately
outside the repo. Through the page's own Record departure form in Andrew's name, on the live v12.81 page (`3b17c3de…`).

- **Dry run first** (every write aborted): T0005 holds two Forklift 2.5T RT, 1247787 and 1312577. Only 1247787 left, so T0005 stays on
  site with one forklift still to leave. GN19's only unit is 1276416, so GN19 leaves in full. P&L identical (charge 1,012,101.16, known
  cost 456,889.59, every branch unchanged); Today unchanged.
- **Applied:** backup, page sha checked, 2 documents acknowledged 200 (delivery/T0005, delivery/GN19), record 12767 → 12769, every other
  document unchanged in value, verified on the service.
- **Read back** (`check_after.cjs`, fresh load of the live page): T0005 "1 left · 1 to leave", last 02/11/2026 08:15:00 AEST, 1 × Forklift
  2.5T RT 1247787, light on site, still to leave 1 × Forklift 2.5T RT; GN19 "Left site" 02/11/2026 08:15:00 AEST, 1 × 60kva 1276416, light
  in transit, nothing to leave; 97 of 186 demob references left in full; errors 0, writes 0.
- Between v12.81's upload (record 12749) and this run the record moved to 12767 through other writes; this run changed only its 2 documents.

## Run 97 — 1262224 (fork extensions, EQ0005) and 1272166 (forklift, T0085) left site 2 Nov 07:30 (2 Nov 2026 08:25–08:27 AEST, record 12769 → 12771)

Andrew, 2 Nov 2026 08:2x AEST: "1262224 and  1272166 left at 730am". 1262224 is EQ0005's Fork Extensions 2.4m (Coates); 1272166 is
T0085's forklift (Coates; the page lists it as 3.5T Forklift Std; contract 9987005 line 1, MEAD). Each is its reference's only unit, so
both references leave in full. Specs `spec97_t0085_eq0005_2nov_0730.json` and `spec97b_t0085_2nov_0730.json`, report
`report_20261101T222719Z.json`; the whole-record backups are kept privately outside the repo. Through the page's own Record departure form
in Andrew's name, on the live v12.81 page (`3b17c3de…`).

- **Dry run first** (every write aborted): both leave in full; P&L identical (charge 1,012,101.16, known cost 456,889.59, every branch
  unchanged); Today unchanged.
- **First apply (08:25):** backup and page sha checked; EQ0005's write landed (record 12769 → 12770, light in transit, departed 07:30),
  but the page's write of delivery/T0085 did not land and the page tried to send it again, which the runner refuses by design ("automatic
  retry refused"), so the run stopped there and wrote no report. A read of the service straight after showed only delivery/EQ0005
  changed and T0085 still on site, as before.
- **Second apply (08:27), T0085 alone** (`spec97b`): dry run passed (P&L identical), backup, sha checked, delivery/T0085 acknowledged 200,
  record 12770 → 12771, every other document unchanged in value, verified on the service.
- **Read back** (`check_after.cjs`, fresh load of the live page): T0085 "Left site" 02/11/2026 07:30:00 AEST, 1 × 3.5T Forklift Std
  1272166, light in transit; EQ0005 "Left site" 02/11/2026 07:30:00 AEST, 1 × Fork Extensions 2.4m 1262224, light in transit; nothing
  still to leave on either; 99 of 186 demob references left in full; errors 0, writes 0.

## Run 98 — EQ0001, the 43 ft scissor lift (1220903), left site 2 Nov 10:15 (2 Nov 2026 10:28 AEST, record 12782 → 12783)

Andrew, 2 Nov 2026 10:2x AEST: "Scissor lift left at 1015am". The only scissor lift on the record is EQ0001, Scissor Lift With Operator
Protection 43ft (13.0M) - Diesel, Coates 1220903 (contract 9992300 line 4; ticked Ready 30 Oct; pick-up booked for 2 Nov 09:00), its
reference's only unit, so EQ0001 leaves in full. Spec `spec98_eq0001_scissor_2nov_1015.json`, report `report_20261102T002804Z.json`; the
whole-record backup is kept privately outside the repo. Through the page's own Record departure form in Andrew's name, on the live v12.81
page (`3b17c3de…`). Dry run first (P&L identical: charge 1,012,101.16, known cost 456,889.59, every branch unchanged); applied with the
backup and page sha check; delivery/EQ0001 acknowledged 200; every other document unchanged in value; verified on the service. Read back
(`check_after.cjs`, fresh load of the live page): EQ0001 "Left site" 02/11/2026 10:15:00 AEST, 1 × Scissor Lift … 1220903, light in
transit, nothing still to leave; errors 0, writes 0.

## Run 99 — GN18, the 50 kVA generator (1261273), left site 2 Nov 11:00 (2 Nov 2026 11:14 AEST, record 12783 → 12784)

Andrew, 2 Nov 2026 11:xx AEST: "Gn18 left at 11AM". GN18 is the 50 kVA generator, Coates 1261273, its reference's only unit, so GN18
leaves in full. Spec `spec99_gn18_2nov_1100.json`, report `report_20261102T011447Z.json`; the whole-record backup is kept privately outside
the repo. Through the page's own Record departure form in Andrew's name, on the live v12.81 page (`3b17c3de…`). Dry run first (P&L
identical: charge 1,012,101.16, known cost 456,889.59, every branch unchanged); applied with the backup and page sha check;
delivery/GN18 acknowledged 200; every other document unchanged in value; verified on the service. Read back (`check_after.cjs`, fresh
load of the live page): GN18 "Left site" 02/11/2026 11:00:00 AEST, 1 × 50kva 1261273, light in transit, nothing still to leave; 101 of
186 demob references left in full; errors 0, writes 0.

(Not recorded, 2 Nov: Andrew's "24 water barrier left at 800am" — not S08, and the record holds no other barriers on site; Andrew, later:
"All good my mistake if s08 are only left thats ok". Nothing written.)

## Run 100 — WC01's accessible toilet (1317644) left site 2 Nov 11:45; WC01's two FWF stay (2 Nov 2026 11:48 AEST, record 12787 → 12788)

Andrew, 2 Nov 2026 11:3x AEST: "Leaving at 1145 / 1317644". 1317644 is WC01's Accessible Toilet (Coates); WC01 also holds two FWF,
1211958 and 1211967, which stay, so WC01 stays on site. Spec `spec100_wc01_accessible_2nov_1145.json` (parked and committed at 11:38 while
11:45 was still in the future), report `report_20261102T014803Z.json`; the whole-record backup is kept privately outside the repo. On the
live v12.81 page (`3b17c3de…`), in Andrew's name.

- **The emptied gate.** The 11:46 dry run stopped: "the Record departure form did not open for WC01" (no Emptied tick). WC01 got the tick
  first through the page's own setEmptied816, on Andrew's word of 30 Oct 11:1x AEST, "Really.. all toilets have been pumped out this was
  done on sunday night via servicing" — the word that carried WC09's tick (run 80) and WC20's (run 90). WC01 and all three of its units are
  on the servicing tracker (area 4, Commodore Park & The Hill entry), covered by the final-night pump-out of Sun 25 Oct.
- **Dry run** (11:47, every write aborted): Emptied, then 1 × Accessible Toilet 1317644 left 11:45, still to leave 2 × FWF; P&L identical
  (charge 1,012,101.16, known cost 456,889.59, every branch unchanged).
- **Applied** 11:48: backup, page sha checked, delivery/WC01 acknowledged 200, record 12787 → 12788, every other document unchanged in
  value, verified on the service.
- **Read back** (`check_after.cjs`, fresh load of the live page): WC01 "1 left · 2 to leave", last 02/11/2026 11:45:00 AEST, 1 × Accessible
  Toilet 1317644, light on site, still to leave 2 × FWF; errors 0, writes 0.
- Brenden Meek's booked pick-up on the record for 1317644 reads 2 Nov 01:00 (entered 2 Nov 09:45 AEST); left as it is.

## Runs 101–104 — WC51 and WC86 accessible toilets, WC09's six pee panels, and 0164 off T0024 (2 Nov 2026 11:50–11:57 AEST, record 12788 → 12797)

All through the page's own forms in Andrew's name, on the live v12.81 page (`3b17c3de…`), each with a dry run first (P&L identical:
charge 1,012,101.16, known cost 456,889.59, every branch unchanged), a private whole-record backup, the page sha check, one document
acknowledged 200, every other document unchanged in value, and verification on the service. Reports beside each spec.

| Run | Andrew, 2 Nov | What left | Left site | After | Record |
|---|---|---|---|---|---|
| 101 | "wc51 accesable toilet picked up 11AM" | WC51's Accessible Toilet, Coates 1197174 (its only unit; WC51's six Event Portables FWF left 27 Oct) | 11:00 | WC51 left in full, in transit | 12788 → 12789 |
| 102 | "wc86 left at 1130AM" | WC86's Accessible Toilet, Coates 1296899 (its only unit) | 11:30 | WC86 left in full, in transit | 12789 → 12790 |
| 103 | "Event Portable 6 x pee Panels left at 9:30AM" | WC09's six Event Portables pee panels, PP01–PP06 | 09:30 | WC09 stays on site: 2 × Toilet Block 6m (Coates 1268858, 1311146) | 12792 → 12793 |
| 104 | "0164 left at 9:30AM" | T0024's Event Portables FWF 0164 (the EVL toilet) | 09:30 | T0024 stays on site: Coates FWF 1211968 (the Coates office toilet) | 12796 → 12797 |

- **Emptied gate.** WC86 and T0024 had no Emptied tick, so their departure forms would not open (first WC86 dry run: "the Record departure
  form did not open for WC86"). Both got the tick first through the page's own setEmptied816, on Andrew's word of 30 Oct 11:1x AEST,
  "Really.. all toilets have been pumped out this was done on sunday night via servicing" — as WC09 (run 80), WC20 (run 90) and WC01
  (run 100). Both are on the servicing tracker (WC86: Island north, by FREIGHT; T0024: area 3, EVL / Coates compound). WC51 and WC09 were
  already ticked (27 Oct and 30 Oct).
- **Run 103's first apply stopped** with "the record changed before release - nothing sent" (another device saved to the record during the
  run, 12790 → 12792); the apply was run again, re-staged and gated, and went through.
- **Run 104:** T0024's delivery document carries no light field on the record (the page reads it as on site), so the runner's check that a
  partial departure leaves the light "on site" could not pass; the spec leaves `complete` out, which skips only that check. The departure is
  the same, and the read-back shows 1 left, 1 still to leave.
- **Read back** (fresh load of the live page, every reference still to leave): WC51 and WC86 gone; WC09 still to leave 2 × Toilet Block 6m;
  T0024 still to leave 1 × FWF; WC01 still to leave 2 × FWF; 103 of 186 demob references left in full; errors 0, writes 0. One accessible
  toilet is still on site: WC31's (Coates 1317645).

## Run 105 — every toilet still on site recorded as pumped out (2 Nov 2026 12:28 AEST, record 12809 → 12826)

Andrew, 2 Nov 2026 12:xx AEST: "All Toilets are meant to be stated as Puimped out already" (after his 30 Oct word, "all toilets have been
pumped out this was done on sunday night via servicing"). Read from the live record (12802): 23 toilet and waste-tank references still on
site; six already carried the Emptied tick (WC01, WC09, WC20, WC67, WC81, T0024). The other 17 got it through the page's own setEmptied816
in his name: WC02, WC04, WC05, WC06, WC07, WC100, WC11, WC12, WC15, WC16, WC17, WC21, WC27, WC31, WC50, WC60, T0243. The page's emptied
gate no longer holds any toilet's departure form shut. Spec `spec105_all_toilets_emptied_2nov.json`, report
`report_20261102T022802Z.json`; the whole-record backup is kept privately outside the repo.

- Dry run: the first stopped before staging ("somebody is editing": WC09 changed on the record during the read); the retry passed —
  17 Emptied ticks staged, P&L identical (charge 1,012,101.16, known cost 456,889.59, every branch unchanged), 17 documents planned.
- Applied 12:28 on the live v12.81 page (`3b17c3de…`): backup, page sha checked, 17 delivery documents acknowledged 200, record
  12809 → 12826, every other document unchanged in value, verified on the service. A fresh read shows all 17 emptied; WC09's history
  (its 30 Oct FWF and 2 Nov pee-panel departures) intact.

## Run 106 — FL03, the broadcast 5 t forklift (1321364), left site 2 Nov 13:30, with its fork extensions (2 Nov 2026 13:37 AEST, record 12843 → 12844)

Andrew, 2 Nov 2026 13:xx AEST: "The big forkift they used for broadcast has gone now. Do you know the number did it have tynes too",
then "130pm and yes tynes went too". FL03 is Coates 1321364, Forklift Rough Terrain 5.0t 4WD Diesel (TV compound; contract 9992300
line 1, MEAD, hired 17–27 Oct), its reference's only unit, so FL03 leaves in full. The 2.4 m fork extensions on the same contract
(9992300 line 3, MISCITEM, 17–27 Oct) went with it; they are not a reference on the record, so nothing is departed for them.
Spec `spec106_fl03_2nov_1330.json`, report `report_20261102T033718Z.json`; the whole-record backup is kept privately outside the repo.
Through the page's own Record departure form in Andrew's name, on the live v12.81 page (`3b17c3de…`): dry run first (P&L identical:
charge 1,012,101.16, known cost 456,889.59, every branch unchanged), backup, page sha checked, delivery/FL03 acknowledged 200, every
other document unchanged in value, verified on the service. Read back (fresh load of the live page): FL03 "Left site" 02/11/2026
13:30:00 AEST, 1 × Forklift 5T 1321364, light in transit; FL04 (the 2.5 t, 1298390) still on site; 104 of 186 demob references left in
full; errors 0, writes 0.

## Run 107 — WC20's two waste tanks (1311341, 1328982) left site 2 Nov 15:00; WC20 left in full (2 Nov 2026 15:02 AEST, record 12844 → 12845)

Andrew, 2 Nov 2026 13:4x AEST: "2 x waste tanks will be leaving today at 3:00pm you know the ones we took the toilets off". WC20's two
toilet blocks (1327228, 1327225) left 30 Oct 12:30 (run 90) and its two waste tanks stayed: Coates 1311341 (Set 1) and 1328982 (Set 2),
WC20's only units still on site (Emptied since 30 Oct). Spec `spec107_wc20_tanks_2nov_1500.json` (parked and committed at 13:51 while
15:00 was still in the future), report `report_20261102T050213Z.json`; the whole-record backup is kept privately outside the repo.
Through the page's own Record departure form in Andrew's name, on the live v12.81 page (`3b17c3de…`): dry run at 15:01 (P&L identical:
charge 1,012,101.16, known cost 456,889.59, every branch unchanged), applied 15:02 with the backup and page sha check, delivery/WC20
acknowledged 200, every other document unchanged in value, verified on the service. Read back (fresh load of the live page): WC20 "Left
site" 02/11/2026 15:00:00 AEST — 2 × Toilet Block 6m (30 Oct) and 2 × Waste tank 1311341, 1328982 (2 Nov), light in transit, nothing still
to leave; 105 of 186 demob references left in full; errors 0, writes 0.

## Run 108 — GN?, the two 200 kVA concert generators (1316182, 1316183), left site 2 Nov 15:15; GN? left in full (2 Nov 2026 15:30 AEST, record 12845 → 12846)

Andrew, 2 Nov 2026 15:2x AEST: "2 x 200kva generators leaving at 315pm". The two 200 kVA concert generators are reference GN?
("Concert", 2 × 200kva & cables; contract 9994954, KINP): Coates 1316182 and 1316183, its only units, both ticked Ready on 2 Nov. Spec
`spec108_concert_gens_2nov_1515.json`, report `report_20261102T052942Z.json`; the whole-record backup is kept privately outside the repo.
GN? is stored on the record as `GN~3f~` (the "?" encoded), so `left_site.cjs` now lets the depart step take "GN?" (as the branch step
already did) and reads its entry back under the encoded name. Through the page's own Record departure form in Andrew's name, on the live
v12.81 page (`3b17c3de…`): dry run (P&L identical: charge 1,012,101.16, known cost 456,889.59, every branch unchanged), applied 15:30
with the backup and page sha check, delivery/GN~3f~ acknowledged 200, every other document unchanged in value, verified on the service
(version 12846, GN~3f~ in transit). Read back (fresh load of the live page): GN? "Left site" 02/11/2026 15:15:00 AEST — 2 × 200kva &
cables 1316182, 1316183, light in transit, nothing still to leave; 106 of 186 demob references left in full; errors 0, writes 0.

## Run 109 — P39 Building 6m 1327216 left site 09:00 Thu 5 Nov; P39 left in full (5 Nov 2026 09:03 AEST, record 13047 → 13048)

- **What:** Andrew, 5 Nov 2026 08:2x AEST: "P39 leaves at 9am". 1327216 is P39's only unit (Building 6m, Coates; ticked Ready 4 Nov; Brenden Meek's booking for 4 Nov 12:30 did not happen; read 08:24 AEST, not already left), so P39 left in full at 09:00 AEST. Its two air conditioners 1272737 and 1327936 and its fire extinguisher stay listed on P39 as gear that goes with it.
- **Applied:** 09:03 AEST on Andrew's word, after 09:00 (a departure is only recorded once its time has come). Rehearsed at 08:24 on the live v13.00 page with a past time (dry run, nothing sent); at 09:02:54 the live page sha `6b57277f…` was checked, then a dry run (passed, nothing sent) and `left_site.cjs --spec left_site_spec_59_p39_1327216.json --apply`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 13047 → 13048. 1 document (delivery/P39) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261104T230331Z.json`.

## Run 110 — P17 Building 9.6m 1268887 left site 09:00 Thu 5 Nov; P17 left in full (5 Nov 2026 09:07 AEST, record 13048 → 13049)

- **What:** Andrew, 5 Nov 2026 09:0x AEST: "P17  leaving at 9am". 1268887 is P17's only unit (Building 9.6m, Coates; ticked Ready 3 Nov; Brenden Meek's booking for 5 Nov 10:00 on the record; read 09:06 AEST, not already left), so P17 left in full at 09:00 AEST, an hour before that booking. Its fire extinguisher stays listed on P17 as gear that goes with it.
- **Applied:** 09:07 AEST on Andrew's word, after 09:00: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_60_p17_1268887.json --apply`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 13048 → 13049. 1 document (delivery/P17) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261104T230706Z.json`.

## Run 111 — AA Building 6m 142514 left site 10:00 Thu 5 Nov; AA left in full (5 Nov 2026 10:09 AEST, record 13050 → 13051)

- **What:** Andrew, 5 Nov 2026 10:0x AEST: "Leaving at  10am  142514". 142514 is AA's only unit (Building 6m, Coates; ticked Ready 4 Nov; no booking on the record; read 10:08 AEST, not already left), so AA left in full at 10:00 AEST. Its fire extinguisher stays listed on AA as gear that goes with it.
- **Applied:** 10:09 AEST on Andrew's word, after 10:00: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_61_aa_142514.json --apply`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 13050 → 13051. 1 document (delivery/AA) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T000921Z.json`.

## Run 112 — P19 Building 4.8m 1110619 and P20 Building 4.8m 1097339 left site 10:30 Thu 5 Nov; both left in full (5 Nov 2026 10:35 AEST, record 13052 → 13054)

- **What:** Andrew, 5 Nov 2026 10:3x AEST: "P20   and p19 leave at 1030am". 1110619 is P19's only unit (Building 4.8m, Coates; ticked Ready 3 Nov; Brenden Meek's booking for 5 Nov 11:00) and 1097339 is P20's only unit (Building 4.8m, Coates; ticked Ready 4 Nov; booking for 5 Nov 12:00); read 10:34 AEST, neither already left, so P19 and P20 each left in full at 10:30 AEST, ahead of their bookings. Their air conditioners (P19 1295810, P20 1180683) and fire extinguishers stay listed as gear that goes with them.
- **Applied:** 10:35 AEST on Andrew's word, after 10:30: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_62_p19_p20_1030.json --apply`, through the page's own Record departure form, in Andrew's name. Lights in transit.
- **Record:** version 13052 → 13054. 2 documents (delivery/P19, delivery/P20) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T003517Z.json`.

## Run 113 — P18 Building 4.8m 1097343 and P21 Building 4.8m 1327220 left site 13:30 Thu 5 Nov; both left in full (5 Nov 2026 13:46 AEST, record 13054 → 13056)

- **What:** Andrew, 5 Nov 2026 13:4x AEST: "P18.and p21 left 130pm". 1097343 is P18's only unit (Building 4.8m, Coates; ticked Ready 3 Nov; Brenden Meek's booking for 5 Nov 11:30) and 1327220 is P21's only unit (Building 4.8m, Coates; ticked Ready 4 Nov; booking for 5 Nov 10:30); read 13:44 AEST, neither already left, so P18 and P21 each left in full at 13:30 AEST. P18's fridge and fire extinguisher and P21's fire extinguisher stay listed as gear that goes with them.
- **Applied:** 13:46 AEST on Andrew's word: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_63_p18_p21_1330.json --apply`, through the page's own Record departure form, in Andrew's name. Lights in transit.
- **Record:** version 13054 → 13056. 2 documents (delivery/P18, delivery/P21) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T034544Z.json`.

## Run 114 — WC60's two 6 m toilet blocks (1119489, 1087500) and two waste tanks (1328980, 1328981) left site 14:20 Thu 5 Nov; WC60 left in full (5 Nov 2026 14:26 AEST, record 13056 → 13057)

- **What:** Andrew, 5 Nov 2026 14:2x AEST: "Wc60 toilets and tanks leave at 220pm". WC60 holds two Coates Toilet Block 6m units (1119489, 1087500; ticked Ready 27 Oct; Brenden Meek's bookings for 5 Nov 12:00) and their two waste tanks (1328980, 1328981); read 14:25 AEST, none already left, so WC60 left in full at 14:20 AEST.
- **Applied:** 14:26 AEST on Andrew's word, after 14:20: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_64_wc60_1420.json --apply`, through the page's own Record departure form, in Andrew's name. Light in transit.
- **Record:** version 13056 → 13057. 1 document (delivery/WC60) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T042621Z.json`.

## Run 115 — WC15's Toilet Block 6m 1303835 left site 15:00 Thu 5 Nov; WC15's other block 1327226 still on site (5 Nov 2026 15:03 AEST, record 13057 → 13058)

- **What:** Andrew, 5 Nov 2026 15:0x AEST: "1303835   toilet picked.up.left at.3pm". 1303835 is one of WC15's two Coates Toilet Block 6m units (both ticked Ready 4 Nov; Brenden Meek's booking for it was 5 Nov 08:30); read 15:01 AEST, not already left. 1303835 left at 15:00 AEST; 1327226 stays, so WC15 is not left in full (the form reads "still to leave: 1 x Toilet Block 6m").
- **Applied:** 15:03 AEST on Andrew's word, after 15:00: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_65_wc15_1303835_1500.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13057 → 13058. 1 document (delivery/WC15) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T050250Z.json`.

## Run 116 — WC31's Accessible Toilet 1317645 left site 15:20 Thu 5 Nov; WC31 left in full (5 Nov 2026 15:33 AEST, record 13058 → 13059)

- **What:** Andrew, 5 Nov 2026 15:2x AEST: "Disabled toilet left at 320pm". The record carries four accessible toilets (WC86 1296899, WC01 1317644, WC51 1197174, WC31 1317645); the first three are recorded as left on 2 Nov, so WC31's 1317645 (ticked Ready; Brenden Meek's booking was 2 Nov 01:00) was the only one still on site, read 15:30 AEST. It left at 15:20 AEST; WC31's two 16-pan blocks (12, 74) left 3 Nov 09:30, so WC31 has left in full (light in transit).
- **Applied:** 15:33 AEST on Andrew's word, after 15:20: the live page sha `6b57277f…` (v13.00) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_66_wc31_1317645_1520.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13058 → 13059. 1 document (delivery/WC31) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T053309Z.json`.

## Run 117 — the EAGS event container T0023 (Coates 1257261) left site 08:30 Fri 6 Nov; T0023 left in full (6 Nov 2026 08:56 AEST, record 13059 → 13060)

- **What:** Andrew, 6 Nov 2026 08:5x AEST: "We had the coates event container leaving at 830am". T0023 is the Event Container from EAGS (Coates 1257261, island west parkland entry by the merch strip, on site since 15 Sep 2026) and the only container still on site: T0258 and T0266 left 30 Oct, and T0023's own 30 Oct entry was withdrawn (run 88) because the container that left that day was T0266. Read 08:55 AEST, not already left. It left in full at 08:30 AEST (light in transit).
- **Applied:** 08:56 AEST on Andrew's word, after 08:30: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_67_t0023_1257261_0830.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13059 → 13060. 1 document (delivery/T0023) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T225606Z.json`.

## Run 118 — HRP, the Hire Republic Crib Room (Building 6m 1189410), left site 09:00 Fri 6 Nov; HRP left in full (6 Nov 2026 09:09 AEST, record 13060 → 13061)

- **What:** Andrew, 6 Nov 2026 08:5x AEST: "Hrp leaving at 9am". HRP is the Hire Republic Crib Room, a Coates Building 6m, asset 1189410, its reference's only unit, complete on the record; read 09:07 AEST, not already left. It left in full at 09:00 AEST (light in transit). The two air conditioners the page lists with it (1189901, 1127305) and its fire extinguisher stay listed with it.
- **Applied:** 09:09 AEST on Andrew's word, after 09:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_68_hrp_1189410_0900.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13060 → 13061. 1 document (delivery/HRP) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261105T230902Z.json`.

## Run 119 — T0022, the Lunchroom 4.8x3 (Coates Building 4.8m 960634), left site 10:00 Fri 6 Nov; T0022 left in full (6 Nov 2026 10:07 AEST, record 13061 → 13062)

- **What:** Andrew, 6 Nov 2026 09:1x AEST: "Coates 4.8 lunch room leaving at 10am". T0022 is the Lunchroom 4.8x3, a Coates Building 4.8m, asset 960634, its reference's only building, complete on the record (the other 4.8 m, T0021 the Office 4.8x3 960639, stays). Rehearsed 09:11 as a dry run with a past time (the form offers 960634, nothing sent). It left in full at 10:00 AEST (light in transit); its fire extinguisher, two fridges (1272753, 1254399), folding table, sink, chairs and microwave stay listed with it.
- **Applied:** 10:07 AEST on Andrew's word, after 10:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_69_t0022_960634_1000.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13061 → 13062. 1 document (delivery/T0022) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261106T000657Z.json`.

## Run 120 — the four loose fridges left site 10:00 Fri 6 Nov with the lunchroom: P26 1311992, P28 1283996, FR01 1129733, FR02 1157786, each in full (6 Nov 2026 10:08 AEST, record 13062 → 13066)

- **What:** Andrew, 6 Nov 2026 09:2x AEST: "Any loose fridges at same time as the lunch room too". The loose fridges are the fridges that are references of their own (not listed inside a building) and still on site on the record: P26 Fridge Delivery (Fridge Lge 1311992), P28 Fridge Delivery (Fridge Lge 1283996), FR01 Fridge at the TV compound (1129733) and FR02 Fridge at the TV compound (1157786). The OP42 fridge row T0265 was already deleted on 17 Oct (cancelled on Andrew's word of 15 Oct; its four 14 Oct fridges live on as P26, P28 and P46's two police fridges) and is not a page asset, so it is not touched; Andrew, 09:3x: "If it does not exist or have anything against it delete it" - nothing is charged against it and nothing was left to delete. Fridges listed inside buildings leave with their buildings. Rehearsed 09:19 as a dry run with a past time (each form offers its unit, nothing sent). All four left in full at 10:00 AEST (lights in transit).
- **Applied:** 10:08 AEST on Andrew's word, after 10:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_70_loose_fridges_1000.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13062 → 13066. 4 documents (delivery/P26, delivery/P28, delivery/FR01, delivery/FR02) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261106T000728Z.json`.

## Run 121 — T0243, the WCTV toilet block (Toilet Block 6m 1311144), left site 09:00 Mon 9 Nov; T0243 left in full (9 Nov 2026 09:10 AEST, record 13067 → 13068)

- **What:** Andrew, Mon 9 Nov 2026 09:0x AEST: "1311144 left at 9am", sent again as "Do again". 1311144 is T0243, the WCTV Toilet Block Male Female Cyclone Rated 6m x 3m at the TV compound (sewer connect), contract 9973977, its reference's only unit. It left in full at 09:00 AEST (light in transit).
- **Applied:** 09:10 AEST on Andrew's word, after 09:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_71_t0243_1311144_0900.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Read-back from the history:** T0243 is an added reference whose quantity the page counts from its complete tick, which the departure form takes off. The first dry run read the departure reading and stopped with nothing sent; the spec then took `readback: "history"`, as EQ0002 did on 26 Oct (fifth run), and the second dry run passed. The departure is on the record with its time, unit and recorder; the page's departure reading for T0243 shows "not complete", the same known quirk.
- **Record:** version 13067 → 13068. 1 document (delivery/T0243) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0); Today counts unchanged. Backup kept private. Report `report_20261108T231055Z.json`.
- **Version 13067:** the record stood at 13067, not the 13066 run 120 left. That write was at 10:28 AEST on 6 Nov and changed no document's value: the only differences between the backup taken before run 120 and today's backup are run 120's four fridge departures.

## Run 122 — P04, the SCA Sales & Marketing Office (Building 12m 1327213), left site 10:00 Mon 9 Nov; P04 left in full (9 Nov 2026 10:02 AEST, record 13069 → 13070)

- **What:** Andrew, Mon 9 Nov 2026 09:5x AEST: "P04.leaving at.10am". P04 is the SCA Sales & Marketing Office, a Portable Building 12m, asset 1327213, its reference's only building; what is listed with it (fridge 1328954, air conditioners 1327955 and 1327956, fire extinguisher) leaves with it. Rehearsed 09:5x as a dry run with a past time (the form offers 1327213, P04 leaves in full, P&L unchanged, nothing sent). P04 left in full at 10:00 AEST (light in transit).
- **Applied:** 10:02 AEST on Andrew's word, after 10:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_72_p04_1327213_1000.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13069 → 13070. 1 document (delivery/P04) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0); Today counts unchanged. Backup kept private. Report `report_20261109T000242Z.json`.
- **Version 13069:** a write at 09:49 AEST, after run 121, changed no document's value: between the backups taken before run 121 and before this run, the only difference is run 121's T0243 departure. It is the second such write (the first was 6 Nov 10:28, see run 121).

## Run 123 — WC27, the tank-mounted toilet (Toilet Block 6m 1119484 and Sewage Holding Tank 1328979), left site 10:30 Mon 9 Nov; WC27 left in full (9 Nov 2026 10:32 AEST, record 13070 → 13071)

- **What:** Andrew, Mon 9 Nov 2026 09:5x AEST: "Wc27 both leave 1030am". WC27 is the tank-mounted toilet: the Toilet Block 6.0M x 3.0M 1119484 and the Sewage Holding Tank 6.0M x 2.4M 1328979 it sits on (contract 9968955 line 54), the reference's two units, so both is the block and its tank. Rehearsed 09:5x as a dry run with a past time (both offered, WC27 leaves in full, P&L unchanged, nothing sent). WC27 left in full at 10:30 AEST (light in transit).
- **Applied:** 10:32 AEST on Andrew's word, after 10:30: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_73_wc27_both_1030.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13070 → 13071. 1 document (delivery/WC27) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0); Today counts unchanged. No other write since run 122. Backup kept private. Report `report_20261109T003248Z.json`.

## Run 124 — T0243's departure counted: its arrival put on the history (9 Nov 2026 20:08 AEST, record 13190 → 13191)

- **What:** Andrew, 9 Nov 2026 16:3x AEST: "Is all ok please fiz anything you know how everything works". A read-only check of every departed reference on the live page (all 162) found T0243 (run 121, WCTV toilet block 1311144, left 09:00 today) reading as still to leave although its light is in transit. Its record had no on-site entry: the page held it on site only through its complete tick, from the arrival 2026-09-22T14:00:00.000Z (23 Sep 2026 AEST, the schedule's Week 4 day), and the departure was recorded against that arrival. The departure form takes the complete tick off, so the page's departure reading (which counts a departure only against a dated on-site arrival) found none and counted nothing.
- **The step:** `left_site.cjs` gets `arrival_backfill`: for a departed reference with no on-site entry, an on-site entry goes on its history at exactly the arrival its departure holds, in Andrew's name, with the reason. It refuses a reference that already has an on-site entry, has no departure, or whose departure holds another arrival; the service check reads the one entry back. Nothing else changes: not the light, the departure, the ticks or the numbers.
- **Applied:** 20:08 AEST: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_74_t0243_arrival.json --apply`.
- **Record:** version 13190 → 13191. 1 document (delivery/T0243) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0); Today counts unchanged. Backup kept private. Report `report_20261109T100821Z.json`. A fresh read of the live page: T0243 left in full (1 departure); 151 of 162 departed references left in full, the other 11 part-departures with units still on the record.
- **Still on site the same way:** P36, T0002, T0003 and T0004 are on site only through their complete ticks. When one leaves, its departure goes through the form as usual (with `readback: "history"`) and this step follows it.

## Run 125 — WB02, the S08 water barriers (34 TL2), left site 14:00 Mon 9 Nov; WB02 left in full (9 Nov 2026 21:12 AEST, record 13191 → 13192)

- **What:** Andrew, Mon 9 Nov 2026 21:0x AEST: "S08 water barriers left at 2pm today". The S08 water barriers are WB02, 'S08 - Pedestrian Pathway along Main Beach Parade', 34 TL2 barriers installed Mon 21 Sep 2026, the one Coates water barrier run still on site (Andrew, 30 Oct: "All barriers should now be off hired apart from s08"). Recorded as the earlier barrier runs were (spec 54): the TL2 line's plant number ARMORZONMASHTL2 and 33 unnumbered. WB02 left in full at 14:00 AEST (light in transit); every Coates water barrier run on the record has now left.
- **Applied:** 21:12 AEST on Andrew's word, after 14:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_75_wb02_s08_1400.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13191 → 13192. 1 document (delivery/WB02) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0); Today counts unchanged. Backup kept private. Report `report_20261109T111157Z.json`.

## Run 126 — WC15's last toilet block (Toilet Block 6m 1327226) left site 12:00 Tue 10 Nov; WC15 left in full (10 Nov 2026 12:03 AEST, record 13228 → 13229)

- **What:** Andrew, Tue 10 Nov 2026 11:5x AEST: "wc15 left at 12PM". WC15 is Toilets (Sewer Connect), two Toilet Block 6m: 1303835 left 15:00 Thu 5 Nov (run 115) and 1327226 was the one still on site, so WC15 leaves in full with it. Read as 12:00 today, the message having come at 11:5x. WC15 left in full at 12:00 AEST (light in transit).
- **Applied:** 12:03 AEST on Andrew's word, after 12:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_76_wc15_1327226_1200.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13228 → 13229. 1 document (delivery/WC15) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261110T020245Z.json`. A fresh read of the live page: WC15 left in full (2 departures); 153 of 163 departed references left in full, the other 10 part-departures with units still on the record.

## Runs 127–128 — ten FWF (WC21 six, WC06 two, WC11 one, WC01 one) left site 14:00 Tue 10 Nov, each reference in full; WC67's FWF 172824 moved to the Coates compound (11 Nov 2026 05:09–05:11 AEST, record 13229 → 13242)

- **What:** Andrew, received 04:53 AEST Wed 11 Nov 2026: "10 toilets fwf left yesterday. 2pm" and "2 fwf are left one in the coates compound and 1.left.at.helen park. Both are now at coates compound". The record held 12 FWF on site: WC21 six (1002747, 1103497, 1211964, 1211971, 1211977, 1212172), WC06 two (1195658, 1212523), WC11 one (1211969), WC01 one (1211967), T0024 one (Coates 1211968, the Coates compound toilet) and WC67 one (Coates 172824, Helen Park). The two that stay are T0024's 1211968 and WC67's 172824; the other ten are exactly WC21, WC06, WC11 and WC01's FWF. WC100's two FWF trailers are another item and stay.
- **Run 127 (applied 05:09 AEST):** `left_site_spec_77_fwf_ten_0911_1400.json` through the page's own Record departure form in Andrew's name, after a dry run (passed, nothing sent): WC21, WC06, WC11 and WC01 each left in full (light in transit), and WC67's note gets "FWF 172824 moved from Helen Park to the Coates compound …". Record 13229 → 13236, 7 documents acknowledged 200 and verified; every other document unchanged; P&L and branch totals unchanged. Report `report_20261110T190911Z.json`. **It dated the ten at 14:00 Mon 9 Nov, a day early:** "yesterday" was read from the date in UTC, not AEST.
- **Run 128 (applied 05:11 AEST), the correction:** `left_site_spec_78_fwf_ten_redate_1011_1400.json`: each of the four departures re-dated to 14:00 Tue 10 Nov with the reason (`collection_redate`, the entry keeping its id and units), and WC67's note corrected to Wed 11 Nov (`note_replace`). Dry run passed, then applied: record 13236 → 13242, 6 documents acknowledged 200 and verified; every other document unchanged; P&L and branch totals unchanged (charge 0, cost 0). Report `report_20261110T191119Z.json`. Backups kept private.
- **Read back** (fresh load of the live page): WC21, WC06, WC11 and WC01 left in full; the FWF still on site are T0024's 1211968 and WC67's 172824, both at the Coates compound (plus WC100's two FWF trailers). 157 of 164 departed references left in full.

## Run 129 — WC16's Toilet Block 6m 1322587 left site 10:40 Wed 11 Nov; WC16's other block 1322588 still on site (11 Nov 2026 10:42 AEST, record 13242 → 13243)

- **What:** Andrew, Wed 11 Nov 2026 10:3x AEST: "1322587 leaving  at 1040am". 1322587 is a Toilet Block 6m on WC16 (Coates, sewer-connected), which holds two blocks, 1322588 and 1322587, both on site since 14 Sep 2026. 1322587 left at 10:40 AEST; 1322588 stays, so WC16 is a part-departure.
- **Applied:** 10:42 AEST on Andrew's word, after 10:40: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_79_wc16_1322587_1040.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13242 → 13243. 1 document (delivery/WC16) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T004219Z.json`.

## Run 130 — P09, the Iedm Safety Office (Building 6m 1268824), left site 12:30 Wed 11 Nov; P09 left in full (11 Nov 2026 12:35 AEST, record 13243 → 13244)

- **What:** Andrew, Wed 11 Nov 2026 12:0x AEST: "1268824 leaving at 1230pm". 1268824 is the Building 6m on P09, Iedm Safety Office, its only unit, so P09 leaves in full (light in transit); its air conditioner 1270403, fridge 1328958, urn 1284061, zip boiler 1254390 and sink with tap are listed with it. Rehearsed at 12:0x as a dry run with a past time (P09 leaves in full, P&L unchanged, nothing sent).
- **Applied:** 12:35 AEST on Andrew's word, after 12:30: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_80_p09_1268824_1230.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13243 → 13244. 1 document (delivery/P09) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T023504Z.json`.

## Run 131 — P06, the Wilclean Crib Room (Building 6m 1087453), left site 13:00 Wed 11 Nov; P06 left in full (11 Nov 2026 13:22 AEST, record 13245 → 13246)

- **What:** Andrew, Wed 11 Nov 2026 13:2x AEST: "P06 left at 1pm". P06 is the Wilclean Crib Room, a Building 6m (1087453 on the record), its only unit, so P06 left in full (light in transit); its air conditioner 1097209, fridge 1272749, microwave 1284012, zip boiler 1173374 and sink with tap are listed with it.
- **Applied:** 13:22 AEST on Andrew's word: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_81_p06_1087453_1300.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13245 → 13246. 1 document (delivery/P06) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T032222Z.json`. (Version 13244 → 13245 at 13:18 AEST was another writer's, before this run.)

## Run 132 — P33, Race Medical (Building 9.6m 453375), left site 10:00 Tue 10 Nov; P33 left in full (11 Nov 2026 13:24 AEST, record 13246 → 13247)

- **What:** Andrew, Wed 11 Nov 2026 13:2x AEST: "P33 left yesterday at 10am", read as 10:00 AEST Tue 10 Nov 2026 (yesterday from the message's time). P33 is Race Medical, a Building 9.6m (453375), its only unit, so P33 left in full (light in transit); its air conditioners 1286611 and 1127296, fridge 1238952, zip boiler 1066777 and sink with tap are listed with it.
- **Applied:** 13:24 AEST on Andrew's word: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_82_p33_1011_1000.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13246 → 13247. 1 document (delivery/P33) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T032358Z.json`.

## Run 133 — P34, the police swivel chairs (Pad Chair x 2), left site 10:00 Fri 6 Nov with the fridges; P34 left in full (11 Nov 2026 13:26 AEST, record 13247 → 13248)

- **What:** Andrew, Wed 11 Nov 2026 13:2x AEST: "P34 went back when fridges went back". P34 is the police swivel chairs, Pad Chair x 2 (unnumbered), on site since 14 Oct 2026. The fridges went back at 10:00 AEST Fri 6 Nov 2026: the four loose fridges, P26 1311992 and P28 1283996 (the police fridges) and FR01 1129733 and FR02 1157786, left together with the lunchroom (run 120); no other fridge return is on the record. So P34's two chairs left in full at 10:00 AEST Fri 6 Nov (light in transit).
- **Applied:** 13:26 AEST on Andrew's word: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_83_p34_chairs_0611_1000.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13247 → 13248. 1 document (delivery/P34) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T032622Z.json`.

## Run 134 — WC16's other Toilet Block 6m 1322588 left site 14:00 Wed 11 Nov; WC16 left in full (11 Nov 2026 14:07 AEST, record 13248 → 13249)

- **What:** Andrew, Wed 11 Nov 2026 14:0x AEST: "1322588 leaving at 2pm". 1322588 is WC16's other Toilet Block 6m (Coates, sewer-connected); its pair 1322587 left 10:40 today (run 129), so WC16 left in full at 14:00 AEST (light in transit). Rehearsed as a dry run with a past time first.
- **Applied:** 14:07 AEST on Andrew's word, after 14:00: the live page sha `2f6bc154…` (v13.01) checked, a dry run (passed, nothing sent), then `left_site.cjs --spec left_site_spec_84_wc16_1322588_1400.json --apply`, through the page's own Record departure form, in Andrew's name.
- **Record:** version 13248 → 13249. 1 document (delivery/WC16) acknowledged 200, verified on the service; every other document unchanged in value; P&L and branch totals unchanged (charge 0, cost 0). Backup kept private. Report `report_20261111T040710Z.json`.
