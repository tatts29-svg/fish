# v9.09 part E — WC09: a line for each 6 m toilet block (DRAFT, not READY)

Author: Andrew Fisher · 8 Oct 2026 · built and tested on live v9.10, not uploaded

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

## The rule (one change, in the automatic deal only)

> When the page deals out numbers that nobody has placed, it skips any line whose schedule row is on an Event
> Portables load (v8.86: `date_correction.plan886` on a row for that item).

Everything else in v7.32 stays as it was:

- a person's choice comes first and always wins (Change form, "counts as": `setNumberItem`, `localSupplied(...).items[].nums`);
- v7.68's noted waste tanks come next;
- the rest are dealt by room (what turned up where it was counted, otherwise the order), biggest first, and an ancillary line loses a tie.

If every line on a reference is an Event Portables line, nothing is skipped, so no number is ever left without a line.
The plan-moved row is the only way the page can tell, line by line, that Event Portables supplies it. A line it cannot
tell about is not skipped. Item type alone is not proof: WC01's two FWF are Coates-numbered.

**"Ancillary lines dealt last" was surveyed and not adopted.** On its own it hands WC09's two numbers to FWF (×4),
which is also wrong. Alongside the rule above it changes nothing on the record. The Event Portables rule on its own is
the smallest rule that is right.

## Survey (live v9.10, record 4504, read-only)

To compare rules, the page's function was swapped in memory for one synchronous run and then put back. Eight references
carry more than one charge-line item. "EP" marks a line with an Event Portables plan row. The labour lines listed are
the ones each unit is offered.

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

The evidence that WC09's change is a correction:

- the item types: the two 6 m blocks are Coates buildings;
- the supplier: the page's v8.86 plan puts the FWF and pee panels on Event Portables Load 1 and the blocks on SFL dockets, Thu 8 Oct;
- the numbers: both are 7-digit Coates numbers typed on WC09;
- the photos: two are for the reference and two for unit 1268858.

WC09 has no labour ticks and no "counts as" choice on the record, so nothing recorded moves. In DATA, WC09 is the only
reference with more than one item where an Event Portables row sits beside other lines. The patch refuses to run if
that ever changes.

## What WC09 shows after (built page)

- **Toilet Block 6m: 2 units, 1268858 and 1311146.** Each has its own Install, Steps, Levelling, Cleaning and Demob
  ticks in the drawer's labour section (the Charges fold, which shows on the edit link). There is no reference-level
  set any more.
- **FWF:** one set for the reference (Install, Demob), as before. **Pee Panel:** "no labour priced on the card",
  as before. Neither has any Coates units now.
- **"Counts as" on the Change form:** Toilet Block 6m for both numbers.
- **Inventory type of each number:** Toilet Block 6m. **Equipment's count:** 2 Coates on Toilet Block 6m, 0 on Pee Panel.
- **Drop photo groups:** one per number, the same as before (they follow the numbers, not the items).
- **A person's choice still wins.** This was simulated in memory and put back. With 1268858 set to Pee Panel, the pee
  panels keep it and the blocks show 1311146 plus 1 with no number yet. With both set to FWF, both go to FWF.
- **Demob (a consequence, for Andrew):** the run planner used to count 2 of WC09's event portables as Coates (the two
  numbers it took to be pee panels). Now it counts none, and all 10 read "owner to confirm". Recording WC09's Event
  Portables units on the reference would put them on the sub-hire run.

## Money

Every figure is identical, page against page, on the same record. That covers:

- the P&L summary;
- Costs to job end;
- the Finance handover;
- the P&L;
- the business's lines;
- Transport;
- the 17 tie-outs;
- Rehire by branch;
- the labour plan.

These are the same models `compare_money895.cjs` reads. The one count that moves is the labour plan's number of tick
sets, up by five: WC09's second block's five lines. The money behind them is the same, because the card's labour per
block is now two sets of one where it was one set of two. WC09 has no labour ticks, so nothing charged moves.

## Results (candidate on live v9.10)

- **Base:** live v9.10, `838a45559ac0d184186f37bd5fa2b4ebf518ca63c8d3ddda8bec041bf738587f`. Unchanged when the build
  fetched it.
- **Candidate:** `build/GC500_v909_lines/GC500_Delivery_Control_hosted.html`,
  `6bc7cfa6e47367741c6a93521a33a692b72f90bfd5c18fbdb79d7f3ef5138b1b`, 11,530,247 bytes. Footer ` · v9.10` (untouched).
  DATA is byte for byte the base's, and `check_page.py` passes.
- **The patch changes one page edit and adds one helper (`epLine909`).** It refuses to run twice. It does not touch
  v9.10's name selector (`StaffNames910`), which the test confirms is byte for byte the base's and reads the same day model.
- **`tests/test_lines900.cjs`:** 28/28 on laptop and 28/28 on phone (MOB=1), record 4506. No page or console errors,
  and `counts.blocked` 0.
- **`harness/sweep.js`:** laptop 21 tabs, 0 errors, 0 console errors, 0 blocked. Phone 21 tabs, 0 errors, 0 blocked.
  On the phone, one network line: the weather service's fetch failed through the rig (`net::ERR_FAILED`). It is not a
  page error.

```
cd 03_GC500_Delivery_Control && toolchain/build.sh v909_lines v9.00_crew_vms_counts_DRAFT/patch_v900_lines.py
PAGE=build/GC500_v909_lines/GC500_Delivery_Control_hosted.html [MOB=1] node v9.00_crew_vms_counts_DRAFT/tests/test_lines900.cjs
```

## Where it is up to

The part is built and tested on its own, on live v9.10. It has not been chained with the other v9.09 parts (crew,
broadcast, split, VMS). None of them edits `lineNumbersOf`. It has had no independent review. It is not READY TO
UPLOAD.
