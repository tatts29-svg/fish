# Claude → Codex handover, 9 Oct 2026 about 02:15 AEST

Author: Andrew Fisher.

**Why:** Andrew told Codex directly (PR #1, comment 6063801522): "make sure Claude is done and we are live with everything
from him. as he is running out of credits your take over again with everything for a while". Earlier, at 23:30 on 8 Oct, he
had told Claude: "This task can be given to codex … your credits are getting to low."

**What Claude has done:**
- Stopped every Claude workflow that writes source.
- Frozen and pushed everything below.
- Will make no further source mutations unless Andrew asks.

**Private files:** two bundles here are encrypted with the **papers password**, the same method as `inputs_07Oct2026` and
`inputs_08Oct2026`:

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in <file>.zip.enc -out /tmp/<file>.zip
```

## 1. v9.21 pins: READY; Codex is publishing it

- **Source:** commit `b600d7cba836e6d736fc7e91a61de2d9514faf76`, folder `v9.17_pins_master_DRAFT/`.
- **Hashes:** candidate `d8bb1311…` on v9.20 `93c3bab1…`; manifest `680bd788…` (media first).
- **Approval:** Andrew approved it at about 00:25 on 9 Oct. Full READY note on PR #1 (6063700104) and in the README.
- **Follow-ups once live:**
  - Rename the folder to `_LIVE`.
  - The map explorer's machine bundle (`plan_items.json`) still holds the old points for the 57 pins until the machine set
    is rebuilt. Navigation is not affected.

## 2. v9.22 = v9.14 fire extinguishers + v9.13 VMS register: approved, not yet stacked

Andrew said "Yes proceed and approved" at about 01:00 on 9 Oct. Each release passed separately on v9.18; the stacked build
was never made.

- **v9.14:** `v9.14_fire_ext_DRAFT/patch_v914_fire_ext.py` and `tests/test_fire_ext914.cjs`.
  - Candidate `10593ecd…` on v9.18: 61/61 on laptop and phone, both sweeps clean, money rerun unchanged (`v9.14_fire_ext_DRAFT/tests/money/run_money_review.sh` with `review_money914.cjs`).
  - Andrew's decisions:
    - The rate is the card's Fire Ext. figure.
    - It is a one-off charge per piece.
    - No year appears on the page.
  - Still open:
    - Q3: the rate where the card has none (shows "rate to confirm").
    - Q4: where and how many.
- **v9.13:** `v9.13_vms_rego_DRAFT/patch_v913_vms_rego.py` and `tests/test_vms_rego913.cjs`.
  - Candidate `d8ccda88…` on v9.18: 68/68 on laptop and phone, sweeps clean, `compare_money895` 0 differ.
  - Andrew's decisions:
    - 1211404 is VMS09.
    - VMS09 moved from T0001 to T0103 ("take off that location and put on new location").
    - VMS10 is PremAir Hire 120T, rego V14221.
  - Still open:
    - Andrew is to remove 1211404 from T0001's asset numbers on the Change form.
    - Contract 9961265 line 1 vs line 12: check whether line 1 was off-hired or transferred, or the board is charged twice.
    - T0001's schedule row still reads "VMS × 8".
    - The company name: PremAir or Premiair.
- **To build:** `toolchain/build.sh <ver> v9.14_fire_ext_DRAFT/patch_v914_fire_ext.py v9.13_vms_rego_DRAFT/patch_v913_vms_rego.py` on whatever is live after the pins.
- **To check:** both suites, both sweeps, and the money compare against the pins-live page.

## 3. v9.15 master shapes, every item: partly built, UNTESTED; Codex takes it over

**Last tested state:** commit `7b52f75`.
- Built on v9.18 as `9d767e74…`, 31/31 on laptop and phone.
- At that point each reference's drawn components had a shape, but 54 references had none.

**Current folder state:** the builder was stopped mid-build at about 02:00, and these files have NOT been tested:
- `patch_v915_shapes.py`, `footprints_v915.json`, `shapes_v915_traced_8oct.json`, `build_all.py` and `tests/`.
- The draft marker sheet `evidence/markers_items_laptop.png` shows the intended look: waste tanks greyed under their blocks
  with "+ WASTE TANK", barriers as yellow and white lines, VMS, LT and GEN items, and the accessible toilet with its door.

**Survey results, finished and copied to `handover_09oct/`:**
- `inventory.json` and `coverage.md`: 393 physical units on the ground.
  - 294 have a traced shape.
  - 8 are drawn on the master but have no shape yet.
  - 91 are not on the master.
- `catalogue_drawings.json`: 38 types measured off the drawings.
- `catalogue_documents.json`: 43 types from written sources, with no sizes from memory.
- `doors_check.json`: **all 117 door arcs agree** in an independent re-read of the PDF (the lost door check is now done).
- `traced_new.json`: 32 new parts on 14 references, plus 28 drawn parts not tied to any reference.
- `wfb_runs.json`: the water-barrier runs.
- `scripts/`: the code that produced all of the above.
- `spec_every_item_shape.workflow.js`: the full brief and acceptance checks.

**Andrew's decisions (8–9 Oct):**
- **Every item has a shape,** each unit and not one per reference: FWF, accessible ("disabled") toilets and generators included.
- **Water barriers** are the master's white and yellow long lines, drawn as line shapes.
- **Waste tanks** take the same footprint as their toilet block and sit UNDER it ("you won't see on master"). They are greyed
  and labelled "WASTE TANK". In Arrange loads a tank is its own item.
- **Arrange loads:** each unit offers the existing per-unit door choice (driver / passenger / n/a) through `loading872Set`, on
  the same record, so the drawer, sheets and driver checklist follow. It is never set automatically, and it is read-only on
  the view link.
- **Shapes are not load specs:**
  - no change to `FLOW891.specs`;
  - no masses, axle or deck data;
  - no combined-load suggestions.

  This is your load-restraint work.

## 4. Schedule 6 review: sent to Andrew 8 Oct about 14:00; nothing applied

- **Where:** `sched6_review_08oct.zip.enc` here (the review, findings, challenges and scripts; 144 files).
- **What:** 17 questions to Andrew. The six that matter before Mon 12 Oct are:
  - the T0109 unit;
  - the Concert sets;
  - GN13 (one load or two);
  - the P67 and P63 units;
  - the Helen Park rehire;
  - WC67 (4 or 6).
- **Proposed release, data only:**
  - 12 Oct carriers, dockets and loading times (GN13's time held);
  - T0266's loading time on its no-reference row;
  - the 15 Oct departure order.
- **Record wins:** where the record and the schedule disagree, the record wins (see `STATUS.md`, 8 Oct about 14:00).

## 5. VMS plan VMS001-26003-01: board-by-board reconciliation

- **Where:** `vms001_reconciliation_08oct.zip.enc` here (`result.json`: two independent transcriptions, the disagreements,
  facts, the reconciliation and verdicts).
- **Status:** the board-by-board table has not yet gone to Andrew.
- **Input:** `inputs_08Oct2026` (the VMS plan PDF).

## 6. Unit slots ("WC50 1|5"): designed and reviewed; not built

- **Where:** `unit_slots_design_08Oct2026/` (SURVEY, DESIGN, REVIEW).
- **Andrew's answer:** "Yes we still charge v8s", so Coates labour on Event Portables units is in scope.
- **The review's simpler design:**
  - a unit goes by number or by slot, never both;
  - nothing is written to the site counts;
  - numbered boxes only where units are marked on site, otherwise counters.
- **Next:** a phone mock-up on the real page and Andrew's yes. It feeds your units and sub-hire task.

## 7. Already with Codex (for completeness)

- **v9.09 integration** (crew, race call, split counting, part E WC09 per-block lines, VMS counts, part F Truck flow one line): `v9.00_crew_vms_counts_DRAFT/`, per PR 6061461101.
- **Units and sub-hire clean-up** (PR 6061302551), with the quotes in `inputs_09Oct2026/`.
- **Showcase audit evidence** (stopped) in `v9.16_showcase_audit_DRAFT/`, for reference only.

## 8. Andrew's open questions (as of 02:15)

1. **WC31's second 16Pan:** which quote is it on, and what is its number? Q6845 covers one.
2. **WC31's accessible toilet:** asset 1317645 is not on the record yet.
3. **WC09:** the Event Portables numbers for the pee panels and FWF.
4. **VMS 1211404:** take it off T0001's Change form, and check contract line 1.
5. **WC09's unloading method** was cleared at 00:53 (it was tilt-tray).
6. **The Schedule 6 questions** (item 4).

## 9. Recurring check

- **What:** the hourly sync routine `trig_01HAnxbMNkTk5GmBYEiTWpXd` ("GC500 hourly sync with Codex") still fires into
  Claude's session.
- **Scope:** it is GET-only plus board and PR notes, and changes no source.
- **Owner:** Andrew decides whether to keep it.
