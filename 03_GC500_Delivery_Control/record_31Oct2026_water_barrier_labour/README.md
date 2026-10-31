# Water barrier labour hours on contract 9972648 (STPS), put against the people who did them — 31 Oct 2026

Author: Andrew Fisher. Andrew, 31 Oct 2026 ~01:xx AEST (this chat): "we are missing labour hours for water barriers … As we
charge V8 labour for the V8s only fair we assign labour hrs to who ever was doing it … ensure these costs go against STPS
… their costs should then be journaled to installs in STPS". He then gave, day by day, who did the Armorzone TL2 water
barriers and their hours, install and demob, and answered the three gaps (who did the three 4 h days; the S08 run comes out
this coming Tuesday; the 27 Oct night). The hours are his word; nothing is inferred and no start or finish time is invented.

## Applied

31 Oct 2026 03:29 AEST on the live v12.65 page (`10e8e8c2…`), through the page's own Workforce costs functions
(`setOurCost` for a person who already had a labour row that day, on the tracker the page carries or on the record;
`addOurCost('labour', …)` for a person with none), by Andrew Fisher, with `labour_fill.cjs` and `wb_spec.json`: dry run first on
the live page (passed; 52 documents planned, nothing sent; `dryrun_20261030T172816Z.json`), then the whole record backed up
(`backup_state_20261030T172850Z.json`), the public page's sha checked, the seventeen rows written with their stamp and author
documents (52 documents, each acknowledged 200), read back: record version 12172 → 12224, every other document unchanged
(`report_20261030T172850Z.json`).

- **Eleven notes on rows that already existed.** Each row's note now carries "Water barriers 9972648 STPS · <hours> h · <the
  runs and their counts> · install or demob · days or nights · Andrew Fisher, 31 Oct 2026". The row's own hours, start and
  finish are exactly as they were; the barrier hours are the share of that day that went on the barriers.
- **Six new rows** for two people who had no labour row on the days named (23 Sep nights, 15 Oct days, 27 Oct nights): 4, 8
  and 8 hours each, 40 hours in all, new to the roster. Two of those days had been set aside on the tracker on 6 and 9 Oct;
  the page's own undo of the set-aside travels with the rows. No start or finish is written; the page grades the rows usable
  on their hours.
- The one labour-hire row carries its note too (its cost sits on the Job Connect purchase order for that week, so it is a
  cross charge to STPS, not wages).

## What it means for the figures

- The charge to the V8s is unchanged. Coates wages are hours only on the page (the project manager, 23 Oct 2026), so the
  P&L's dollars do not move; the internal labour hours rise by the 40 new hours. Finance journals the wages to Installation
  (2143) on STPS from these rows; the labour hire is already journaled to installs.
- The TL2 labour line on the card is POA. What is charged to the V8s for it comes from the invoices Andrew brings on 31 Oct,
  which match Baseplan; the hours here are the cost side to set against that charge.

## Still to come

- The S08 run's demob is this coming Tuesday, 3 Nov 2026: 4 h on days, recorded then with the departure.
- The same sweep across every other contract that carries labour we charge, by branch, and a home for it on the page
  (a labour-by-contract register with the recovery per branch), mock-up first.

## 31 Oct 2026, ~04:1x AEST: Thursday 29 Oct superseded

The 29 Oct barrier work was the night, 8 h, shown as the Friday 30 Oct row (an 8 h day) on Andrew's word; the 4 h "days" note on 29 Oct came off. See `record_31Oct2026_aaron_thu_fri/`.
