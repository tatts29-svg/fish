# The generators at 3 hours each: 1.5 h in, 1.5 h out (31 Oct 2026)

Author: Andrew Fisher. Andrew, 31 Oct 2026 ~13:1x AEST (this chat), after the generator contract's labour and transport lines
were set out in the chat: "Lets go 1.5 hrs for generator so total for each we can allocate 3 hrs. If aaron is not on that day we use
alfie" and "Lets allocate 3 hrs to each use alfie or if no alfie use daniel. This is is labour to install and demob this is the
labour charge why should kinp get the lot. Other branches need that share".

The rule as applied: each generator 1.5 h on the day it came on site and 1.5 h on the day it left, noted against its own
contract and branch. The person is the first of the three people Andrew named, in that order, rostered that day with room in
the day. It replaces this morning's one hour per move (`record_31Oct2026_kinp_generator_labour/`) on the same rows. The
contract's "Labour Charge Generator" line is the install and the demob together (Andrew's words).

## Applied

31 Oct 2026 13:36 AEST on the live v12.69 page (`038bd277…`), through the page's own Workforce costs function `setOurCost`, by
Andrew Fisher, with `labour_fill.cjs` and `gen3h_spec.json`. The runner is this morning's, with one addition: `labour_set` takes
`from_note` and refuses a row whose note no longer reads as the spec was built from. Steps:

- `make_spec.py` built the spec from the record as read (version 12600). Every note stays within the page's 240 characters and
  never notes more hours than the row holds.
- Dry run on the live page: passed, 22 documents planned, nothing sent (`dryrun_20261031T033551Z.json`).
- The whole record backed up (`backup_state_20261031T033614Z.json`) and the public page's sha checked.
- 11 notes written with their stamps: 22 documents, each acknowledged 200.
- Read back: record version 12600 → 12622, every other document unchanged (`report_20261031T033614Z.json`).

No hours, starts or finishes changed; only the notes.

| Day | Generators | On the row | Hours noted |
|---|---|---|---|
| Mon 28 Sep | GN01 in | first named | 1.5 (was 1) |
| Wed 30 Sep | GN20-A, GN21, GN23 in | first named | 4.5 (was 3, two notes made one) |
| Thu 1 Oct | GN03 in | first named | 1.5 (was 1) |
| Wed 7 Oct | GN18 in | first named | 1.5 (was 1) |
| Mon 12 Oct | GN13 in (NVAC); the concert pair GN? in, two units (KINP) | first named | 1.5 + 3 (was 1 + 1) |
| Thu 15 Oct | GN06 in | first named | 1.5 (was 1) |
| Mon 19 Oct | GN04, GN10, GN19, GN24, GN25 in | first named | 7.5 (was 5) |
| Mon 26 Oct | GN04, GN06, GN10, GN24 out | first named | 6 (was 5 for five) |
| Mon 26 Oct | GN13 out (13:02) | second named | 1.5 (new) |
| Wed 28 Oct | GN03, GN21, GN23, GN25, GN20-A out | first named | 7.5 (was 5, two notes made one) |
| Fri 30 Oct | GN01 out (14:30) | second named | 1.5 (unassigned since this morning) |

Two calls made inside the rule:

- **Monday 26 Oct.** The first person named was on, but the day was full: 11 h with 4 h already on the water barriers
  (Andrew's figure). Five demobs at 1.5 h (7.5 h) would note 11.5 h on an 11 h row. Four stay on that row (6 h, leaving 1 h for
  KINP), and the fifth, GN13 (the last to leave), goes to the second person named, on 06:00–17:00 that day.
- **Friday 30 Oct.** The first person named did not work that day (Andrew, 31 Oct 2026: "Aaron didnt work friday"; that
  Friday row stands for the Thursday night on the barriers), so GN01's demob goes to the second, on 06:30–17:00.

The third person named was not needed on any day.

## What it means for the figures

On the record now: 36 h on 9961976 (NVAC) for the generators, 19.5 h in and 16.5 h out (6 h in September, 30 h in October),
and 3 h on 9994954 (KINP) for the concert pair in. The rest of each day stays KINP by Andrew's KINP rule. The labour-hire
dollars do not move ($34,926.79): both people carrying the generator hours are Coates wages, which the page keeps in hours only
(Andrew's ruling of 23 Oct 2026). For NVAC to carry dollars for these hours, the wage hours would need a rate; that is
Andrew's call.

## Still to come

- GN18 and GN19 out (1.5 h each, NVAC) and the concert pair out (3 h, two units, KINP), noted by the same rule on the day each
  one leaves.
- The S08 run's demob on Tue 3 Nov (the water barriers, STPS).
