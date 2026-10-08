# v9.09 part E — WC09: a line for each 6 m toilet block (DRAFT, not READY)

Author: Andrew Fisher · 8 Oct 2026 · built and tested on live v9.10, not uploaded · review findings fixed (see the end)

## What Andrew asked

On site, 14:40 AEST, 8 Oct 2026: *"WC09 We need to have a line for each as each will have a install and level and
stairs each one of those assets that go there."*

## What was wrong

WC09 orders 4 FWF, 6 Pee Panel and 2 Toilet Block 6m. At 13:52 AEST Andrew recorded two asset numbers on WC09:
**1268858** and **1311146**. These are the two 6 m toilet blocks: Coates buildings, typed on the Change form, with two
drop photos on the record for unit 1268858. The page already gives each building its own Install, Steps and
Levelling ticks (plus Cleaning and Demob) when a reference carries more than one building number. That came in at
v5.55 and works on WC15, WC16, WC17 and WC20.

On WC09, though, the v7.32 split (`lineNumbersOf`) dealt numbers that nobody had placed biggest order first. Both
numbers went to **Pee Panel** (×6). So:

- the toilet blocks had one set of ticks for the whole reference ("× 2");
- the pee panels had three empty unit headings (two numbers and "1 more with no number yet");
- Equipment counted the two numbers as Pee Panels;
- the Change form's "counts as" showed Pee Panel.

WC09's FWF and pee panels are **Event Portables Load 1 (Fri 9 Oct)**. v8.86's plan correction moved exactly those two
schedule rows (T0101 FWF, T0259 Pee Panel) onto the supplier's load. It left the blocks (T0102, SFL dockets, Thu 8 Oct)
where they were. Event Portables units carry no Coates number.

## The rule (in the automatic deal only)

> When the page deals out Coates numbers that nobody has placed, it skips any line whose schedule rows are **all** on an
> Event Portables load (v8.86: `date_correction.plan886` on every row for that item that is not a removal).

- **A Coates number** is the page's own test from v7.36 (`locNums`): 5 to 8 digits. Anything else (an Event Portables
  fleet number such as "12" typed as an asset number) goes by v7.32's room order, as before.
- **A line with a Coates row beside an Event Portables row is not skipped.** The page cannot tell what supplies it.
  WC67's FWF is this shape: T0081 (Thu 1 Oct, Coates) and T0262 (Event Portables Load 2).
- **When the lines that can take a Coates number are full** (or counted as none arrived), the number goes by v7.32's room
  order: a line counted as none takes none while another line has room, and never more than its order while another has
  room.
- If every line on a reference is an Event Portables line, nothing is skipped, so no number is ever left without a line.

Everything else in v7.32 stays as it was:

- a person's choice comes first and always wins (Change form, "counts as": `setNumberItem`, `localSupplied(...).items[].nums`);
- v7.68's noted waste tanks come next;
- the rest are dealt by room (what turned up where it was counted, otherwise the order), biggest first, and an ancillary
  line loses a tie.

**"Ancillary lines dealt last" was surveyed and not adopted.** On its own it hands WC09's two numbers to FWF (×4),
which is also wrong. Alongside the rule above it changes nothing on the record. The Event Portables rule is the
smallest rule that is right.

### And one read, so a recorded door side keeps showing

WC09's loading record says **Toilet Block 6m: door to passenger side** (recorded against the line, 22:34 AEST 7 Oct, by
the project manager). Once the blocks are numbered, the loading section draws one row per block (`u1268858`,
`u1311146`) and no longer draws the line's row, so without a fix both blocks would read "Door side not set" on the
drawer, the drop page, the truck sheet, the demob sheet and the driver checks. That would hide a record.

So `loading872Side` now reads a door side recorded against a line for each numbered unit of that line, until the unit
has its own. A unit's own side, set or cleared, still wins. The read is limited to references with an Event Portables
line (where this part's deal applies), so WC09 is the only reference whose door sides change.

## Survey (live v9.10, record 4504; rechecked on record 4508, read-only)

To compare rules, the page's function was swapped in memory for one synchronous run and then put back. Eight references
carry more than one charge-line item. "EP" marks a line whose rows are all on an Event Portables load. The labour lines
listed are the ones each unit is offered.

| ref | items (qty) | building numbers | split now (v7.32) | Event Portables rule | ancillary last | both | verdict |
|---|---|---|---|---|---|---|---|
| WC01 | Accessible Toilet 1, FWF 2 | 1211958, 1211967, 1317644 | Acc: 1317644; FWF: 1211958, 1211967 (install, demob each) | same | same | same | unchanged |
| WC05 | Waste tank 1, Toilet Block 6m 1 | 1097377 (tank 1328978 is a unit, not a building) | TB: 1097377; tank piece 1328978 | same | same | same | unchanged |
| **WC09** | FWF 4 EP, Pee Panel 6 EP, Toilet Block 6m 2 | 1268858, 1311146 | **Pee Panel: both + 1 rest; TB: one set for the reference** | **TB: 1268858, 1311146, each install, steps, levelling, cleaning, demob; FWF and Pee Panel: none** | FWF: both + 1 rest; TB one set (wrong) | as the EP rule | **correction** |
| WC20 | Toilet Block 6m 2, Waste tank 2 | 1327225, 1311341 (+ tanks 1327228, 1328982) | person's choice: TB 1311341, 1327225; tanks 1327228, 1328982 | same | same | same | unchanged |
| WC27 | Toilet Block 6m 1, Waste tank 1 | 1119484, 1328979 | TB: 1119484; tank: 1328979 | same | same | same | unchanged |
| WC31 | Accessible Toilet 1, 16Pan Block 2 | none (one Event Portables unit, "12") | no split | same | same | same | unchanged |
| WC51 | Accessible Toilet 1, FWF 6 | none | no split | same | same | same | unchanged |
| WC60 | Toilet Block 6m 2, Waste tank 2 | 1087500, 1119489, 1328980, 1328981 | person's choice: TB 1119489, 1087500; tanks 1328980, 1328981 | same | same | same | unchanged |

On record 4508, the built page and the base give the same split and labour units on **all 182 references except WC09**,
and the same door-side rows and sides on every reference with a door side on the record (15 of them) except WC09.

The evidence that WC09's change is a correction:

- the item types: the two 6 m blocks are Coates buildings;
- the supplier: the page's v8.86 plan puts the FWF and pee panels on Event Portables Load 1 and the blocks on SFL dockets, Thu 8 Oct;
- the numbers: both are 7-digit Coates numbers typed on WC09;
- the photos: two are for the reference and two for unit 1268858.

WC09 has no labour ticks and no "counts as" choice on the record, so no tick or choice moves. In DATA, WC09 is the only
reference with more than one item where an Event Portables line sits beside other lines. The patch refuses to run if
that ever changes. That guard runs only when the patch is built; a later data release (Schedule 6 is pending) must
rebuild and rerun it.

## What WC09 shows after (built page, record 4508)

- **Toilet Block 6m: 2 units, 1268858 and 1311146.** Each has its own Install, Steps, Levelling, Cleaning and Demob
  ticks in the drawer's labour section (the Charges fold, which shows on the edit link). There is no reference-level
  set any more.
- **FWF:** one set for the reference (Install, Demob), as before. **Pee Panel:** "no labour priced on the card",
  as before. Neither has any Coates units now.
- **"Counts as" on the Change form:** Toilet Block 6m for both numbers.
- **Inventory type of each number:** Toilet Block 6m.
- **Drop photo groups:** one per number, the same as before (they follow the numbers, not the items).
- **Loading door side:** both blocks read "Door to passenger side" (drawer, drop page, truck and demob sheet, driver and
  demob checks), from the side recorded against the line. FWF and Pee Panel read "Door side not set", as FWF did on the
  base; nothing was recorded for them.
- **A person's choice still wins.** This was simulated in memory and put back. With 1268858 set to Pee Panel, the pee
  panels keep it and the blocks show 1311146 plus 1 with no number yet. With both set to FWF, both go to FWF. A unit's
  own door side, set or cleared, wins over the line's.

### Every count that moves, all part of the same correction (record 4508)

- **Equipment (inventory), Toilet Block 6m:** Coates 13 → 15, no number 2 → 0.
- **Equipment (inventory), Pee Panel:** Coates 2 → 0, no number 4 → 6.
- **Costs pricing pane, labour card:** Toilet Block 6m Install, Steps and Levelling go from "13 of 14" to "13 of 15".
  Cleaning and Demob go from "14 entries on 9 references" to "15 units on 9 references" (the word changes to "units"
  because the count now equals the 15 ordered). The money cells are unchanged. WC09's two blocks were counted as one
  entry; now they are two.
- **Demob:** WC09's Coates stream goes from 2 to none, and "owner to confirm" from 8 to 10. Knock-on load: Tue 10 Nov's
  Coates toilet run (coates1) drops from 4 units (WC01 ×2 + WC09 ×2) to 2 (WC01 ×2 only); the Demob tab's day cell reads
  "WC 2" where it read "WC 4". No other reference's demob date, portion or load changes.
- **Labour plan line counts (not money):** expected 100 → 103 (+3: Install, Steps, Levelling), later 271 → 273 (+2:
  Cleaning, Demob). By line: Install, Steps, Levelling, Cleaning and Demob +1 each. By branch: KINP expected +3, later +2.
- **Labour line counts in the accounting view (`acc761Labour`, not money):** install group +4, cleaning +1, demob +1,
  per-piece lines +5.
- **Effort tally's "offered" count:** up 5.
- **WC09's loading row ids:** `item:FWF`, `item:Pee Panel`, `u1268858`, `u1311146` (base: `item:FWF`, `u1268858`,
  `u1311146`, `item:Toilet Block 6m`). The record is not changed; the line's side reads for both blocks.

## Money

Every money figure is identical, page against page, on the same record. That covers:

- the P&L summary;
- Costs to job end;
- the Finance handover;
- the P&L;
- the business's lines;
- Transport;
- the 17 tie-outs;
- Rehire by branch;
- the labour plan.

These are the same models `compare_money895.cjs` reads. Its walk reports two figures that differ, both counts of lines
and not money: the labour plan's `all.n.expected` (100 → 103) and `all.n.later` (271 → 273). The other counts above
move for the same reason. The money behind them is the same, because the card's labour per block is now two sets of
one where it was one set of two. WC09 has no labour ticks, so nothing charged moves.

## For the project manager (not changed by this part)

- **WC86's door side is not being read, and has not been since 1296899 was typed.** Its loading record says
  `item:Accessible Toilet` "Door side not applicable", but the row is now drawn as `u1296899`, which reads "Door side not
  set". This is already so on live v9.10. A general fallback would show it, but it would change WC86, so it needs your
  word first.
- **WC09's 10 Event Portables units (FWF ×4, Pee Panel ×6) now ride on neither demob run; they read "owner to
  confirm".** The demob planner (`owner816`) does not read v8.86's Event Portables plan rows. Recording them as sub-hire
  on WC09 would put them on the sub-hire run.

## Results (candidate on live v9.10, record 4508)

- **Base:** live v9.10, `838a45559ac0d184186f37bd5fa2b4ebf518ca63c8d3ddda8bec041bf738587f`. Unchanged when the build
  fetched it.
- **Candidate:** `build/GC500_v909_lines/GC500_Delivery_Control_hosted.html`,
  `cad1972fe0d4b526a68b92fcecdf12244adb77506ef96ce6010ed2d15fac8685`, 11,531,307 bytes. Footer ` · v9.10` (untouched).
  DATA is byte for byte the base's, and `check_page.py` passes.
- **The patch makes two page edits** (`lineNumbersOf`'s deal and `loading872Side`) **and adds one helper**
  (`epLine909`). It refuses to run twice. It does not touch v9.10's name selector (`StaffNames910`), which the test
  confirms is byte for byte the base's and reads the same day model.
- **`tests/test_lines900.cjs`:** 43/43 on laptop and 43/43 on phone (MOB=1), record 4508. No page or console errors,
  and `counts.blocked` 0. The same test on the previous candidate (`6bc7cfa6…`) fails 9: the door sides, the overflow
  what-ifs and WC67's mixed line.
- **`harness/sweep.js`:** laptop 21 tabs, 0 errors, 0 console errors, 0 blocked. Phone 21 tabs, 0 errors, 0 blocked.
  On the phone, one network line: the weather service's fetch failed through the rig (`net::ERR_FAILED`). It is not a
  page error.
- **Phone screenshot** of WC09's loading section checked: four rows (FWF, Pee Panel, Toilet Block 6m · Asset 1268858,
  Toilet Block 6m · Asset 1311146), both blocks with passenger side selected.

```
cd 03_GC500_Delivery_Control && toolchain/build.sh v909_lines v9.00_crew_vms_counts_DRAFT/patch_v900_lines.py
PAGE=build/GC500_v909_lines/GC500_Delivery_Control_hosted.html [MOB=1] node v9.00_crew_vms_counts_DRAFT/tests/test_lines900.cjs
```

## Review findings fixed (8 Oct 2026)

- **Blocking — a recorded door side was hidden on WC09.** Fixed: `loading872Side` reads the line's side for its numbered
  units (scoped to references with an Event Portables line). Tested: rows, compact, sheet, driver and demob checks, a
  unit's own side winning, and every other reference with a door side unchanged (WC86 included).
- **A line with a Coates row and an Event Portables row counted as Event Portables.** Fixed: a line counts only when
  every non-removed row of its item is a plan row, mirrored in the patch's DATA guard. Tested with WC67's mixed FWF line
  in memory.
- **Overflow went past lines with room.** Fixed: a Coates number goes to a line that can take it while one has room;
  anything else by v7.32's room order. Tested with a third Coates number, a fleet number "12", and the blocks counted as
  none.
- **Test gaps, README counts, pricing pane, demob load and money wording:** all covered above.

## Where it is up to

The part is built and tested on its own, on live v9.10. It has not been chained with the other v9.09 parts (crew,
broadcast, split, VMS). None of them edits `lineNumbersOf` or `loading872Side`. The fixes have not had a second
review. It is not READY TO UPLOAD.
