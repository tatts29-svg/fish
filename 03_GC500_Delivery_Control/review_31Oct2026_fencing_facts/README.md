# Review: fencing facts, 31 Oct 2026 (Claude, read only, not live)

Author: Andrew Fisher. Nothing on the record changed; no page was uploaded.

Andrew, in the Claude chat: "please make sure our facts are correct with the fencing no guessing", then "advise what we know
of whats curtrently been invoiced agianst our dockets and what dockets we have left that we have not been invoiuced for . and
what we invoiced v8s for", then "whats the 13k what did we charge the v8s here", then the ruling **"v8s stay as is"**.

Sources: the live record read through page v12.69 (`038bd277…`, the live bytes) on 31 Oct 2026 about 17:00 AEST; Advanced's
approved sheets on the purchase orders (`supplierPricing1014()`); the purchase orders (`poAll()`); invoice 25122628 and the
2025 invoices 24402634 / 24405710 as text (private, not committed). Probes here: `fence_facts.cjs`, `fence_facts2.cjs`,
`fence_raw.cjs`, `adv_cost.cjs` (read only, under the browser lock). `build_fence_facts.py` builds the page sent to Andrew
(`GC500_fencing_facts_31Oct2026.html`, with two CSVs: every docket and every labour note, billed or not; private, not committed).

## 1. What Advanced has billed us (receipted against the purchase orders): $214,225.00

| Week | Order · receipt | Billed | In it |
|---|---|---|---|
| Wk 6 (9–12 Sep) | 4647508 · 4918492 | 8,992.00 | no sheet; our 6 dockets come to 10,144.00 at their rates (1,152.00 not tied to a docket) |
| Wk 5 (14–18 Sep) | 4647509 · 4922398 | 33,670.50 | 28 dockets 31,245.50 · 5 notes 425.00 · team leader 10 days 2,000.00 |
| Wk 4 (21–25 Sep) | 4647517 · 4926209 | 26,695.00 | 23 dockets 24,570.00 · 5 notes 525.00 · team leader 8 days 1,600.00 |
| Wk 3 (28 Sep–2 Oct) | 4647515 · 4929277 | 50,154.00 | 14 dockets 47,504.00 · 7 notes 650.00 · team leader 10 days 2,000.00 |
| Wk 2 (6–9 Oct) | 4647519 · 4936461 | 28,246.50 | 23 dockets 25,396.50 · 7 notes 1,250.00 · team leader 8 days 1,600.00 |
| Wk 1 (12–16 Oct) | 4647520 · 4934877 | 66,272.00 | 27 dockets 59,658.00 · 6 notes 1,250.00 · team leader 10 days 2,000.00 · weed mat 40 rolls 2,580.00 · shade cloth 4 rolls 784.00 |
| Collection | 4658850 · 4922343 | 195.00 | Advanced invoice 93920 |

Their sheet rates: mesh fence 10.00/m, braced for scrim 24.40/m, CCB 5.40/m (one CCB line, no type split), ped gate 61.00,
V gate 50.00, bases 1.00, labour and relocation labour 100.00/h, team leader 200.00/day. Collection forms (blue book) are on
their sheets at 0.00. 115 dockets and 30 notes are on their sheets; every one matches our record to the cent.

## 2. On our record, not billed by Advanced yet: $80,609.70

- Docket 36524 (17 Sep, Race admin, 137.5 m) is not on their week 5 sheet: 1,375.00. Note 24479 (13 Oct, 0.5 h) is not on
  their week 1 sheet: 50.00.
- Event week, 19–25 Oct: 48 dockets 34,568.70; 11 labour notes 24482–24492, 67 h, 6,700.00; the crew notes 24493–24495
  (Fri 72 h, Sat 72 h, Sun 66.5 h), 210.5 h at the quote 27172 rate of 142.00/h, 29,891.00, not yet marked approved.
- Demob week 1, 26–29 Oct: 8 dockets (36775, 36777–36783) 6,625.00; 7 notes 14 h 1,400.00.
- Purchase orders 4647522 (event week) and 4647523 (demob) carry no amount. Owing on what we hold: **79,184.70**; 80,609.70
  with 36524 and 24479; plus the week 6 balance (1,152.00) if they come back for it; demob weeks 2 and 3 have no papers yet
  (the page forecasts 750.00 for week 2).
- Docket numbers inside the runs that are not on our record: 36527, 36641, 36772, 36773, 36774, 36776 (not known why).
- One week 2 entry is set aside on the record (scrim 150 m at S10, note 24472) because its source changed after review.

## 3. What we billed the V8s: invoice 25122628 (9990776, STPS), 28 Oct 2026

Every fencing hire line 19 Oct 09:00 to 13 Nov 17:00, block. 1.8 m security fence 8,609.5 m @ 16.16 = 139,129.52; with
hoarding 110 m @ 23.59 = 2,594.90; fence with scrim 3,143 m @ 16.16 = 50,790.88; scrim (sale) 3,143 m @ 9.34 = 29,355.62;
demarcation CCB 4,603 m @ 13.08 = 60,207.24; crowd control barrier 2,350 m @ 7.51 = 17,648.50; flat feet 220 @ 7.51 =
1,652.20; ped gates 32 @ 36.18 = 1,157.76; fence relocation 1,520 m @ 8.65 = 13,148.00; event labour 213 h @ 91.14 =
19,412.82; WB13 water barrier 10 × 7 days @ 1.18 = 82.60. Hire 286,411.60 + other 48,768.44 = 335,180.04; LTD waiver
35,801.43 (12.5% of hire, within 2 cents); 370,981.47 ex GST; GST 37,098.14; total 408,079.61.

Against Advanced's quantities (their sheets weeks 1–5 + our dockets where they have not billed): mesh fence 8,609.5 m + 110 m
hoarding vs 9,730.5 m; braced for scrim 3,143 vs 3,682.5 m; CCB 7,173 vs 7,460.5 m; ped gates 32 vs 22; relocation 1,520 m
vs 137.5 m on dockets (36510 50 m, 36525 60 m, 36528 27.5 m) and 8.5 h of relocation labour Advanced billed (2 h on those
dockets, 6.5 h on notes 24461–24463, 24469, 24471, 24474: 850.00); event labour 213 h vs the crew notes' 210.5 h. The 2025
invoice carried the same kind of line: "Installation - Relocation of Fence" 1,427 @ 8.40, 11,991.00.

## Ruling

**Andrew, 31 Oct 2026: "v8s stay as is."** The fencing billed to the V8s stays as invoiced on 25122628. The November fencing
forecast (35,371.98 + waiver 4,421.50) is out of the final P&L sheet: job revenue 1,003,876.19, costs 544,097.23, difference
459,778.96 (45.8%); November billing is the 839.07 generator pick-up alone. The page's fencing charge (v12.19: the V8s charged
on Advanced's quantities, now 378,036.09) is to be pinned to the invoice in the final P&L release: previews first, upload on
Andrew's word.

## Corrections to what was said earlier in the chat

- Advanced bills labour notes at 100.00/h; billed so far 30 notes, 41 h, 4,100.00. The 17,395.00 (122.5 h at 142.00) is the
  page's charge to the V8s, not Advanced's bill.
- "C.Z." on note 24496 is only what is written ("Admiralty Dr / S14 C.Z."); its meaning was a guess.
- Not known: whether the 110 m of hoarding sits inside the docket fence metres; where the 9990776 quantities came from (keyed as
  one block from Baseplan (4), 15 Oct, changed later: fence 8,778 to 8,609.5 m in Baseplan (9)); why the waiver is on.
