# Record: the supplier's Commercial Approval sheets for construction weeks 3 and 4 on their purchase orders

Author: Andrew Fisher. Applied 23 Oct 2026 14:48 AEST on the live v11.55 page (`7262dbfc…`) for weeks 3 and 4, and 16:01 AEST on the live v11.58 page
(`50ae2d0f…`) for week 5, by Andrew Fisher via Claude, through the page's own purchase-order control (`setPo`): record 10560 → 10563
(4647515) → 10566 (4647517), then 10575 → 10578 (4647509), three documents an order
(the order, its stamp, its name). Full-record backups before each write: `runs/apply_spec_4647515_…/before-public.json`,
`runs/apply_spec_4647517_…/before-public.json`; readbacks, planned and actual writes, and the verification in the same folders.

Andrew, 23 Oct 2026: "this is another job fencing i want everything matching to the cent.. every schedule to the map to the dockets to
purchase order total.. everything must matched and i know it matches as the dockets add up to what we have been charged" — and the
five sheets supplied at 13:50: weeks 1 to 5 (`P003-25003-01-GC600 2026 Coates Hire Fencing Programme - WEEK n - INV TOTALS - Commercial
Approval.pdf`). The PDFs stay out of the repository (supplier documents); each is named by file and SHA-256 on the record.

## What is on the record now

| Week | Purchase order | Sheet dated | Invoice total | PO value on the page | Breakdown recorded | Supplier cost moved by |
|---|---|---|---|---|---|---|
| CW1 | 4647520 | 19 Oct | $66,272.00 | $66,272.00 | already there (20 Oct) | — |
| CW2 | 4647519 | 13 Oct | $28,246.50 | $28,246.50 | already there (14 Oct) | — |
| **CW3** | **4647515** | 6 Oct | **$50,154.00** | $50,154.00 | **21 dockets, 5 team-leader days — this record** | **+$6,110.00** |
| **CW4** | **4647517** | 29 Sep | **$26,695.00** | $26,695.00 | **31 dockets, 5 team-leader days — this record** | **+$1,417.00** |
| **CW5** | **4647509** | 22 Sep | **$33,670.50** | $33,670.00 (receipted in full, receipt 4922398) | **33 dockets and notes, 5 team-leader days — this record, 16:01 AEST** (the sheet is 50 cents over the receipted order; the order stands as the cost, v11.59) | **+$1,050.00** |
| CW6 | 4647508 | — | — | $8,992.00 | no sheet supplied | — |

Every sheet re-adds to the cent: quantity totals, the rate line, the money totals and the invoice total (`parse_sheets.py` in the
session scratchpad; the parsed rows are reproduced in `sheets_vs_record.md`). The breakdown saved on each order is the sheet, line by
line: hire agreements (red book), labour notes (green), collections (blue, counts only, no charge), and the team-leader daily charge as a
dated extra, as weeks 1 and 2 were saved. Clean credits ("as above panels already installed — deducted") stay on their docket as
negative clean lines, as printed. The supplier cost on the page moves from the tracker-rate estimate for those dockets to the sheet.

Read from the sheets, stated on the record (`supplier_pricing.source.notes`):
- CW3's sheet prints its PO as **464517** (a digit short); the amount, the period and the page's confirmed pairing make it 4647515.
- CW3's row "S01 to Gate 6 Beach Run 327.5 m, 29 Sep" prints docket **36532**; 36532 is the S10 compound docket of 18 Sep (already on the
  CW5 sheet). The docket this row describes is **36562** (29 Sep, S.01 to Gate 6 beach run, 327.5 m clean) — recorded against 36562
  with the printed number kept beside it.
- 24463 (CW3) and 24455 (CW5) print **0.8 h**; the sheets' own money ($375.00, $425.00) and our notes make them **0.75 h**.
- Where the sheet lists a docket under a different day from the signed paper (24465 in CW3; six in CW5), the signed paper's date is
  used and the sheet's day kept beside it.

The page's review rule cleared Andrew's recorded "checked" tick on 4647515 and 4647517 when their orders changed; both need **Mark
checked** again after he has looked. 4647515's run also logged one blocked non-document request (the map tile session the writer always
refuses); no document write was refused.

## What the sheets say about our dockets

`sheets_vs_record.md` compares every sheet row with our record. The supplier's columns and ours differ in kind on most hire agreements:
our dockets carry one clean figure (all panel metres, gates at 2.5 m each) and rarely a scrim figure; the sheets split clean, braced
for scrim, vehicle gates and pedestrian gates. Scrim on the sheets for weeks 1–5: 3,000 m; on our record for all weeks: 1,725 m.
Several dockets the supplier billed as scrim carry no scrim (or nothing) on our record — 36560 (427.5 m), 36566 (270 m, "brace
existing fence"), 36544, 36547, 36518, 36513, 36506, 36514, 36519, 36520, 36523, 36531, 36532 ("not scrimmed as requested from iEDM"
on the paper, yet 132.5 m billed). Those are Andrew's to rule on; nothing on the customer side was changed here.

## Files

- `spec_4647515.json`, `spec_4647517.json`, `spec_4647509.json` — what was written (the sheet, line by line). Week 5 went on at 16:01 AEST on the
  live v11.58 page (`50ae2d0f…`): record 10575 → 10578, three documents; `runs/apply_spec_4647509_…/` holds the backup, the read-back and the
  verification (pass). Its order is receipted in full ($33,670, receipt 4922398) and the sheet reads $33,670.50: the writer asserts the receipt
  fields unchanged and the stated 50-cent difference; the page (v11.59) carries the receipted amount as the cost and says so on the order.
  Docket 36524 (17 Sep, $1,375 at the sheet rates) is on our record for week 5 but not on the sheet.
- `record_pricing.cjs`, `native_pricing.cjs`, `readonly_page.cjs` — the 14 Oct writer, copied: runs kept beside the spec; operator name;
  a receipted order may take its sheet (its receipt fields are asserted and must not move); the dockets of weeks 3–6 are the page's
  captured dockets, so identity is checked against the same rows the page matches (one row by book and id, the same by number, same
  day, usable). Practice runs (no writes) in `runs/practice_*`; the applies in `runs/apply_*`. The key is never printed, logged or stored.
- `sheets_summary.json`, `sheets_vs_record.md` — the comparison.
