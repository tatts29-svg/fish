# Demob week 1 on the record and on PO 4647523, matched to the cent — APPLIED, VERIFIED (16 Nov 2026)

Author: Andrew Fisher. Andrew, 16 Nov 2026 (his Claude chat), after the review of Advanced's updated DECON WEEK 1 invoice-totals
sheet (`../review_16Nov2026_decon_wk1_update/`) and the team leader question: "Ok.approved.  make sure it matches". Approved:
$17,000.00 of the sheet's $17,035.00 — the signed papers, the Phillip Park loading on his signed 24007 and the team leader (2 a day,
26–30 Oct) — with $35.00 on 36779 held to ask why. Three runs on the live v13.09 page (`f3eea79f…`), each a dry run first, a private
backup of the whole record, the page's sha checked, the page's own functions in Andrew's name, and a read-back.

| Run | Through the page's own | What | Record | Report |
|---|---|---|---|---|
| 1 | `recordHireAgreement`, `recordServiceNote` (`papers_fill.cjs`, `papers_spec.json`) | Hire agreements 36772 (F-AF-0085, S15 C.Z., 107.5 m, 43 panels), 36773 (F-AF-0086, S19 - S20, 20 m, 8 panels), 36774 (F-AF-0087, Pit Entry & Exit Zone, 52.5 m, 21 panels), all 26 Oct; service note 24007 (N-AF-0029, Phillip Park loading/unloading 28–30 Oct, 12.5 + 11 + 8.5 = 32.0 h, under 28 Oct) | 13404 → 13410, 6 documents | `report_20261116T024129Z.json` |
| 2 | `setPo` (`po_fill.cjs`, `po_spec.json`) | PO 4647523 saved from the page's supplied order list (Advanced, STPS, DECON WK1) with fencing, "Demob week 1", **$17,000.00, confirmed**, and the approval note. P&L gate: charged, known costs, labour and every branch unchanged | 13410 → 13413, 3 documents | `report_20261116T024312Z.json`, `dryrun_20261116T024256Z.json` |
| 3 | `setPo` supplier pricing (`record_pricing.cjs`, `native_pricing.cjs`, `spec_4647523.json`) | The sheet on the order line by line: 11 hire agreements (clean $9,950.00 + 19 vehicle gates $950.00), 8 service notes (41.0 h, $4,100.00), team leader 2 a day × 5 days ($2,000.00) = **$17,000.00**; the $35.00 on 36779 a review item outside the allocation | 13413 → 13416, 3 documents, 30 of 30 checks | `runs/apply_spec_4647523_…/` |

**Read back on the live page:** PO 4647523 $17,000.00, confirmed, its sheet valid — total $17,000.00, difference $0.00, red $10,900.00,
green $4,100.00, team leader $2,000.00, no errors. The Purchase orders card reads it matched to the cent.

**What moved on the page's working figures** (the P&L at the top of Costs is pinned to pack v1.26 and did not move):
- Fencing supplier costs, STPS: 301,044.70 → 304,419.70 (+3,375.00): the record had these papers at $13,625.00 by its own rates; the
  approved sheet is $17,000.00 (gates at $50, 36782's 140 m on its 56 panels, the team leader; 24007 at the 27.0 h billed, not 32.0 h).
- Charged to the V8s: 1,023,683.98 → 1,027,236.44 (+3,552.46), by the page's rule since v12.19 (Andrew, 25 Oct 2026) that the V8s are
  charged on Advanced's sheet quantities. Nothing here changes what was invoiced to the V8s ("v8s stay as is", 31 Oct).

**Held and noted on the order:** 36779 billed 258.5 m against 255.0 m on its signed panels ($35.00, ask why); 36780 not billed
("possible duplication", Advanced to confirm); the sheet's dates sit a day before the papers (the papers' dates are used, the sheet's
kept beside them); 24007's 5.0 h signed beyond the 27.0 h billed are not billed.

**Sources and gaps:** 36772–36774 were read on 11 Nov from Advanced's head-office scanned copies (our own copies never photographed),
so their bases, clamps and wheels are not carried. 24007 was read three times from Andrew's photograph of 13 Nov. Those photographs
and scans were in the session's private scratch space, which was cleared by a machine restart, so they are not yet filed as Documents;
they go up when re-sent.

**Runner changes** (copies of the earlier runners): `po_fill.cjs` gains `po_confirm_source`, saving an order the page carries only from
its supplied list with its source fields asserted and kept. `native_pricing.cjs`'s "customer Revenue unchanged" check becomes "changes
by exactly the stated amount" (`expected.revenue_delta`), since v12.19 charges the V8s on the sheet's quantities. Full-record copies the
runners keep are private, not in the repo.
