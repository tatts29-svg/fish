# KINP labour to whoever was on the roster; the generators an hour each in and out — 31 Oct 2026

Author: Andrew Fisher. Andrew, 31 Oct 2026 ~03:4x AEST (this chat), on the list of per-piece labour charged to the V8s with no
person against it: "Kinp is easy just assign who ever is working to that" and "The generators. Is just an hour each from
aaron mob and demob for each generator". Two rules, applied to the record exactly as given; nothing inferred beyond them.

## Applied

31 Oct 2026 03:57 AEST on the live v12.65 page (`10e8e8c2…`), through the page's own Workforce costs function `setOurCost`
(a note added to a person's labour row for the day; the row's hours, start and finish untouched), by Andrew Fisher, with
`labour_fill.cjs` (the water-barrier runner, the spec name and a 300 s settle window changed) and `kg_spec.json`: dry run first on
the live page (passed; 265 documents planned, nothing sent; `dryrun_20261030T175523Z.json`), then the whole record backed up
(`backup_state_20261030T175607Z.json`), the public page's sha checked, 95 notes written with their stamp and author documents
(265 documents, each acknowledged 200), read back: record version 12224 → 12489, every other document unchanged
(`report_20261030T175607Z.json`). No new rows, no hours changed.

- **KINP, 23 days from 14 Sep to 30 Oct.** For every day a KINP unit came on site (its install, levelling, steps and cleaning)
  or left (its demob), every person on the roster that day got the note "KINP labour, the rest of the day · <contract> in:
  <units> · <contract> out: <units>" — contracts 9968862 (the buildings), 9968955 (the toilet blocks, tanks and amenities),
  9968929, 9973977 and 9994954. "The rest of the day" means the day's hours after any hours already noted against another
  contract (the water barriers on 9972648, the generators). Four notes name the contracts only, where the units would not fit
  in the page's 240-character note; one labour-hire row (15 Oct) already carries a note at that limit and takes no KINP words —
  its KINP share is the rest of that day by the same rule, recorded here instead.
- **The generators, 12 days.** One person, one hour per generator on the day it came on site ("mob") and one on the day it left
  ("demob"): 14 generators in from 28 Sep to 19 Oct, 11 out on 26, 28 and 30 Oct, 25 hours in all, noted on that person's rows as
  "Generators <contract> <branch> · <n> h · <units> mob/demob" — contract 9961976 (NVAC) and the one KINP generator on 9994954.
  Each of those days already had a roster row, so no hours were added.

## What it means for the figures

Nothing on the P&L moves: the charge to the V8s is unchanged, Coates wages are hours only, and no hours were added or changed.
Finance now has, on every rostered person's row, which branch and contract the day's hours belong to: the water barriers
(9972648, STPS) and the generators (9961976, NVAC) by the hour, KINP installs for the rest of the day.

## Still to come

- The KINP units still on site get the same note on the day they leave, as each departure is recorded.
- The S08 run's demob on Tue 3 Nov (the water barriers). The race-weekend shifts still marked planned (who worked, hours).
- A labour-by-contract register on the page so this is read off the record rather than written as notes, mock-up first.
