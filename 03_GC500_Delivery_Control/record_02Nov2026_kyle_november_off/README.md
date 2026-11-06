# Kyle Gover's November shifts taken off — 2 Nov 2026

Author: Andrew Fisher. Andrew, 2 Nov 2026 (this chat): "Kyle wont be doing any works in november".

The running sheet held five November day shifts for Kyle Gover (labour hire, Job Connect), 2–6 Nov, 06:30–17:00, 10.5 h each, with the
note "Back on days for demob, 27–30 Oct and 2–6 Nov 2026. Confirmed by Andrew Fisher, 25 Oct 2026." All five come off. His October
shifts are not touched.

## Applied

2 Nov 2026 05:27 AEST (1 Nov 19:27 UTC), on the live v12.80 page (`3f31d69e…`), by Andrew Fisher, through the running sheet's own
`runShiftOff867` (its Take off button). Each shift gets a removal mark (a tombstone) and its author; the line can be put back with the
row's Put back button.

Runner: `labour_fill.cjs`, a copy of `../record_02Nov2026_alfie_5_oct_off/labour_fill.cjs`. Spec: `labour_spec.json`, five `shift_off`
operations, each carrying Andrew's words.

1. **Dry run** (`dryrun_20261101T192608Z.json`): five shifts found, 10 documents planned; nothing sent.
2. **Backup:** the whole record was backed up first. It is kept privately and **not committed**.
3. **Write:** the public page's sha256 was checked, then the 10 documents were written, each acknowledged 200:
   `deleted/W-L-kyle-gover-20261102` … `20261106` and their five author documents.
4. **Read back** (`report_20261101T192701Z.json`): record version 12739 → 12749; every planned document is as sent; no other document
   changed; verification OK.

## What it means for the figures

- **Hours:** Kyle Gover's 1–13 Nov hours go from 52.5 worked (50 paid) to none.
- **Labour hire:** his w/e 8 Nov week on the running sheet (3,023.85) is no longer a cost. That week is Daniel Gough's alone, at his
  PO 4674224 (3,052.60).
- November's labour is carried in October (Andrew, 1 Nov), so October's costs and the job's costs each fall by 3,023.85, all on KINP,
  Installs – Temp Staff. Nothing was accrued for the week, so the accruals do not move.

The next pack (v1.25) carries this; its audit checks each figure.
