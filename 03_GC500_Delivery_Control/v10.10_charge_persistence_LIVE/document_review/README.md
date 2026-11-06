# Programme and Schedule review — 14 October 2026

Author: Andrew Fisher

Read-only source comparison. No operational records, arrivals, quantities, rates or charges were changed.

- The supplied Programme differs from the prior reviewed original in **three cells only**: `CON WK 2!I101:I103` now says `Complete` for GN13, P69 and P45. Each already has one received unit and an on-site/complete record in snapshot version 5796. Actual quantities do not change.
- The supplied Schedule 6 was modified on **30 September**; Schedule 8 was modified on **12 October**. The older attachment must not overwrite newer planning or confirmed site records.
- Both schedule versions have identical BOQ, Labour and all three Demob tabs. No revised rate or pickup programme is provided by these differences.
- Existing Programme conflicts are separately labelled in the workbook. They were not introduced by the three new completion flags.

Deliverable: `/workspace/output/GC500_Programme_Schedule_Review_14Oct2026.xlsx`, with exactly **Existing** and **Needs fixing** tabs. Each has nine concise review rows. It mentions the baseplan contract where the building description needs checking; it is not a replacement baseplan or a claim that every charge is complete.

`source-review.json` preserves original filenames, SHA-256 hashes, document metadata, exact Programme changes, unchanged Schedule sheets and the snapshot identity. Full cell differences remain outside Git at `/workspace/private-gc500-documents1010/full-cell-comparison.json`.

The review script reads the originals with openpyxl, checks the exact three-cell Programme change and the current received/complete records, then builds and reopens the two-tab workbook. It does not connect to the application or write its native record.
