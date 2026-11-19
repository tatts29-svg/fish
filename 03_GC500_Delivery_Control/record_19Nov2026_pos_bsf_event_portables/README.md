# Four Coates purchase orders on the record: BSF crane demob, two Event Portables orders, and the event-week amount — APPLIED, VERIFIED (19 Nov 2026)

Author: Andrew Fisher. Andrew, 19 Nov 2026 (his Claude chat), with screenshots of eight completed or received Coates purchase orders
and the latest Baseplan SuperCars export: "please check to ensure we dont have these or please update". Each order was checked
against the live record (13435). Two runs on the live v13.09 page (`f3eea79f…`) through the page's own `setPo` in Andrew's name
(`po_fill.cjs`, the 19 Nov copy), each with a dry run, a private backup of the whole record, the page's sha checked and a read-back.
The P&L gate (charged to the V8s, known costs, labour and every branch) did not move in either.

Amounts go on ex GST, as the record's other orders. The order screens' "Ordered" figure includes GST: 4674402's lines add to
42,175.00 ex GST = 46,392.50 inc, and 4647525's unit cost 7,600.00 = 8,360.00 inc.

| PO | Supplier | What | Ex GST | Was on the record | Done |
|---|---|---|---:|---|---|
| 4675281 | BSF Mobile Cranes | GC500 demob (crane), KINP; created 3 Nov, completed 6 Nov, fully invoiced; 2,414.50 inc GST | 2,195.00 | No | Added (run 1) |
| 4674402 | Event Portables | FWF 195 × 105, pee panel 6 × 450, 16-pan toilet 2 × 2,750, transport 2 × 6,750; completed 19 Nov, fully invoiced | 42,175.00 | No | Added (run 1). The same 42,175.00 as quote Q6845, already in the Event Portables estimate, so no cost is added twice |
| 4674399 | Event Portables | Water delivery 1 × 375, hydrostation 6 weeks × 350, transport 2 × 250; partly received, not yet fully invoiced | 2,975.00 | No | Added (run 1). Against quote Q6846 (4,850.00): 1 water delivery where the quote has 6 |
| 4647522 | Advanced | GC500 event week (incl. the race-day crew); completed 9 Nov, fully invoiced; 88,838.20 inc GST | 80,762.00 | Supplied list only, no amount | Saved with its amount, confirmed (run 2) |
| 4647525 | Advanced | GC500 demob week 2; completed 19 Nov; 8,360.00 inc GST | 7,600.00 | Yes, added earlier today | Matches; nothing to do |
| 4647523 | Advanced | GC500 demob week 1; completed 19 Nov; 18,738.50 inc GST | 17,035.00 | Yes, since 16 Nov | Matches; nothing to do |
| 4676389 | Queensland Forklifts | Forklift buggy for Coates' use (9961976), NVAC, ref 'v8's build inv 108362'; received, not yet fully invoiced; 2,299.00 inc GST | 2,090.00 | No | Added (run 3) |
| 4666580 | Queensland Forklifts | 'Gold Coast Supercars Broadcast Slipp…' (cut off on screen), MEAD; completed 3 Nov, fully invoiced; 158.40 inc GST | 144.00 | No | Added (run 4) |
| 4654789 | Queensland Forklifts | Forklift buggy for Coates' use (9961976), MEAD, ref 'v8's build'; completed 8 Oct, fully invoiced; 1,045.00 inc GST | 950.00 | No (in the P&L pack only) | Added (run 5) |

| Run | Spec | Record | Report |
|---|---|---|---|
| 1 | `po_spec.json` (4675281, 4674402, 4674399) | 13435 → 13444, 9 documents | `report_20261119T020859Z.json`, `dryrun_20261119T020840Z.json` |
| 2 | `po_spec_4647522.json` (`po_confirm_source`, source fields asserted) | 13444 → 13447, 3 documents | `report_20261119T021215Z.json`, `dryrun_20261119T021156Z.json` |
| 3 | `po_spec_4676389.json` | 13447 → 13450, 3 documents | `report_20261119T024246Z.json`, `dryrun_20261119T024233Z.json` |
| 4 | `po_spec_4666580.json` | 13450 → 13453, 3 documents | `report_20261119T024332Z.json` |
| 5 | `po_spec_4654789.json` | 13453 → 13456, 3 documents | `report_20261119T024438Z.json` |
| 6 | `po_spec_4647983.json` | 13456 → 13459, 3 documents | `report_20261119T025121Z.json` |

Not known from the screens: the crane order's GL code and line unit cost (2,195.00 is 2,414.50 / 1.1). The whole-record backups are
private, not in the repo.

Of the two earlier Queensland Forklifts orders in the P&L pack, 4654789 is now on the record (run 5, from Andrew's screenshot; the pack labelled it AT009, the order says 'forklift buggey for coates use 9961976'). 4647983 (5 t forklift hire for the fencing, STPS, 2,820.00 ex GST = 3,102.00 inc; partly received 900.00 ex, 1,920.00 ex outstanding, not yet invoiced) is now on the record too (run 6). Both are the same orders the P&L pack carries from the private PO file: the next pack must count each PO number once.
