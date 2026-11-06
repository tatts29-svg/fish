# A labour-hire row for Friday 30 Oct taken off — 31 Oct 2026

Author: Andrew Fisher. Andrew, 31 Oct 2026 ~04:2x AEST (this chat): "Also no kyle friday either." The Job Connect person's
Friday 30 Oct row (10.5 h on days, entered 25 Oct from the demob roster "back on days for demob, 27–30 Oct and 2–6 Nov") is
taken off: he did not work that day.

## Applied

31 Oct 2026 04:08 AEST on the live v12.65 page (`10e8e8c2…`), through the page's own `removeOurCost` (the row is kept with a
tombstone so the removal travels with the record and can be put back), by Andrew Fisher, with `labour_fill.cjs` (the runner
gains `labour_remove`) and `kf_spec.json`: dry run first (3 documents planned, nothing sent), backup
(`backup_state_20261030T180831Z.json`), the public page's sha checked, the row taken off with its tombstone and author
document (3 documents, each acknowledged 200), read back: record version 12493 → 12496, every other document unchanged
(`report_20261030T180831Z.json`). The KINP note written on that row earlier today goes with it; the other three people
rostered that Friday keep theirs.

## What it means for the figures

Labour hire is priced by the run rules, so 10.5 h at the person's rate comes off the labour hire cost on the P&L
(about 557, so far and at job end); the charge to the V8s is unchanged. The week-ending 1 Nov hours against the Job Connect
purchase orders drop by the same 10.5 h.
