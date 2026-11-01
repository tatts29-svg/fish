# Alfie Harris's 5 Oct shift and 5 Oct night taken off — 2 Nov 2026

Author: Andrew Fisher. Earlier that morning, Alfie Harris's 5 Oct shift was put on the record (`../record_02Nov2026_alfie_5_oct/`).
Andrew then corrected it, 2 Nov 2026 (this chat): "No he diid not work kings bdat", "No one did", "Alfie did not work the 5th",
"Alfie did not stay 5th either for the night".

Mon 5 Oct 2026 was the King's Birthday, a Queensland public holiday. Nobody worked that day. So both lines come off:

- Alfie's 5 Oct labour row, `W-L-alfie-harris-20261005`;
- his 5 Oct accommodation night, `W-A-alfie-harris-20261005`, 223.63.

## Applied

2 Nov 2026 02:36 AEST (1 Nov 16:36 UTC), on the live v12.79 page (`73df88ae…`), by Andrew Fisher, through the page's own
`removeOurCost`. This is the same as clearing each line on the Costs tab. Each line is set aside with a tombstone, so it can be put
back.

Two runs, each with its own spec carrying Andrew's words:

| Run | Runner and spec | Dry run | Report | Record | Documents |
|---|---|---|---|---|---|
| The shift | `labour_fill.cjs`, `labour_spec.json` (`labour_remove`) | `dryrun_20261101T163…` (first) | `report_20261101T163623Z.json` | 12734 → 12736 | 2 |
| The night | `accom_fill.cjs`, `accom_spec.json` (`accom_remove`) | `dryrun_20261101T163…` (second) | `report_20261101T163641Z.json` | 12736 → 12739 | 3 |

For each run:

1. The dry run found the line and planned its documents; nothing was sent.
2. The whole record was backed up first. The backup is kept privately and **not committed**.
3. The public page's sha256 was checked, then the documents were written, each acknowledged 200.
4. Read back: every planned document is as sent, no other document changed, verification OK.

A separate read of the service at record 12739 found:

- neither line live;
- no labour or accommodation line live for anyone on 5 Oct;
- Alfie's live nights: 14–17, 21–24 and 28 Sep–1 Oct; 6–9, 19–21 and 26–29 Oct; 2–5 and 9–12 Nov.

One line dated 5 Oct is still live: a meals line for Andrew Fisher, `W-M-andrew-fisher-20261005`, 50.40, recorded on 13 Oct. It is left as
it is for Andrew to say.

## What it means for the figures

- **Labour:** as in pack v1.19. Alfie has no 5 Oct hours.
- **Accommodation:** Alfie's October night (5 Oct, 223.63, accrued in v1.19) is gone. His four 9–12 Nov nights, 894.52, stay as the
  November forecast. October costs and the October accrual each fall by 223.63.
