# Demob weeks 2 and 3 on the record: service notes 24006 and 24008, POs 4647525 and 4647527 — APPLIED, VERIFIED (19 Nov 2026)

Author: Andrew Fisher. Andrew, 19 Nov 2026 (his Claude chat): "approved", after the review of Advanced's DECON WK3 invoice-totals
sheet (PO 4647527, dated 17/11/2026, $8,800.00) against his signed service notes 24008 and 24006 (his scan of 18 Nov), and of the
DECON WK2 sheet (PO 4647525, dated 10/11/2026, $7,600.00), whose Phillip Park loading is now covered by the signed 24006. Both
approved as invoiced, the same way as week 1 (`../record_16Nov2026_decon_wk1_po/`). Then: "please ensure we are updating GC500 with
data". Four runs on the live v13.09 page (`f3eea79f…`), each a dry run or practice first, a private backup of the whole record, the
page's sha checked, the page's own functions in Andrew's name, and a read-back.

| Run | Through the page's own | What | Record | Report |
|---|---|---|---|---|
| 1 | `recordServiceNote` (`papers_fill.cjs`, `papers_spec.json`) | 24006 → N-AF-0030 (Advanced Compound, preparing and loading stock for departure, 2–6 Nov: 8 + 6 + 10.5 + 9.5 + 10.5 = 44.5 h, under 2 Nov); 24008 → N-AF-0031 (Advanced Compound, 9–13 Nov: 11 + 9.5 + 11.5 + 10.5 + Daniel 10.5 + 9 = 62.0 h, under 9 Nov) | 13420 → 13426, 6 documents | `report_20261119T011052Z.json` |
| 2 | `setPo` (`po_fill.cjs`, `po_spec.json`) | PO 4647525 (Advanced, STPS, fencing, Demob week 2, DECON WK2) **$7,600.00, confirmed**; PO 4647527 (Demob week 3, DECON WK3) **$8,800.00, confirmed**; each with the sheet's make-up in its note. P&L gate: charged, known costs, labour and every branch unchanged | 13426 → 13432, 6 documents | `report_20261119T011136Z.json`, `dryrun_20261119T011120Z.json` |
| 3 | `setPo` supplier pricing (`record_pricing.cjs`, `native_pricing.cjs`, `spec_4647527.json`) | Week 3's sheet on 4647527 line by line: 24008 62.0 h ($6,200.00), 24006's Tue 3 Nov 6.0 h ($600.00, "time sheet missed from PW2"), team leader 2 a day × 9–13 Nov ($2,000.00) = **$8,800.00**, difference $0.00 | 13432 → 13435, 3 documents, 30 of 30 checks | `runs/apply_spec_4647527_…/` |
| 4 | Documents, kind docket (`upload_originals.cjs`, unchanged) | Andrew's scan of 24006 and 24008 (18 Nov), turned the right way up, as `24006.jpg` and `24008.jpg` with previews, byte for byte | files 752 → 754 | `photo_upload_20261119T011440Z.json` |

**Week 2's sheet is not yet on its order line by line.** The week 2 sheet PDF was read on 11 Nov (`../review_11Nov2026_decon_invoices/`)
but its file did not survive in the session's private space, and the pricing runner needs the source file's sha256. PO 4647525 is on the
record at the approved $7,600.00 with the make-up in its note: 36785 and 36786 $1,450.00 (36785's 2 gates at $50), service notes 24003,
24004 and 24005 5.0 h $500.00, Phillip Park loading 2, 4, 5 and 6 Nov 36.5 h $3,650.00 (on 24006), team leader $2,000.00. The breakdown
goes on when Advanced's week 2 sheet is re-supplied.

**What moved on the page's working figures** (the P&L at the top of Costs is pinned to pack v1.26 and did not move):
- Run 1: the page charges service-note hours to the V8s at $142.00/h, so its working "charged to the V8s" rose $15,123.00 (106.5 h);
  costs at record rates rose $10,650.00.
- Run 3: direct costs −$1,850.00 (24006 now carries only the 6.0 h priced on 4647527; its other 38.5 h return when week 2's sheet is
  priced), working charge to the V8s −$3,467.00 (38.5 h × $142.00 out, team leader $2,000.00 in), by the page's v12.19 rule.
- This loading was Advanced packing up its own stock at its own compound. It is not in the V8s correction for contract 9990776
  (`STATUS.md`, 18 Nov), which charges event labour on L14 only. Nothing invoiced to the V8s changed.

**Signed but not billed:** 24006 Thu 5 Nov 2.0 h (9.5 signed, 7.5 billed on week 2). Daniel on 24008 is Advanced's man, not Coates'
(Andrew, 13 Nov). Full-record copies the runners keep (backups, before/after pages, proposals) are private, not in the repo.
