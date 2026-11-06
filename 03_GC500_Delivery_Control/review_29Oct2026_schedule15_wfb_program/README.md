# Source review, 29 Oct 2026: Schedule 15 and the WFB program against the page and the record

Author: Andrew Fisher · 29 Oct 2026 10:30 AEST · read only (no import, no page release, no record change). Live page
v12.50.1 (`69bf04e7…`), record 11847.

Andrew: "this is a record i had for coates" (the WFB program); "lets also look in here to capture any costs" (Schedule 15).

| Source | Private file (not committed) | SHA256 | Size |
|---|---|---|---|
| GC500_26_Schedule_15.xlsx (Andrew's schedule, 29 Oct) | `1aab2dde-GC500_26_Schedule_15.xlsx` | `28e05dfb…` | 267,983 bytes, 14 sheets |
| TP02-26003-03 GC500 WFB PROGRAM (the customer's water-filled barrier program, updated 7 Oct) | `f17ef34a-TP02-26003-03_-_GC500_WFB_PROGRAM.xlsx` | `2dc3530d…` | 28,628 bytes |

## WFB program against Baseplan 9972648 and the record

The program is what 9972648 was keyed from. It settles three of the four water-barrier flags from the (9) review:

| Flag | Program | Verdict |
|---|---|---|
| WB02 term 25 Sep | 34 barriers, S08 pedestrian pathway, 21–25 Sep, removed 25 Sep 17:00; WB19 is the same 34 back 2–6 Nov | Baseplan right; the record never had the 25 Sep pick-up (correction on Andrew's word) |
| WB06 keyed twice at 60 | WB06 is 154 barriers, Macintosh Island, 15–27 Oct, 13 days | not a double: 60 + 60 + 34 = 154; 154 × 13 × $1.18 = $2,362.36, Baseplan to the cent |
| WB07 17 on site, no line | WB07 and WB21 are Coates quantity 0 (Coates moves them in Downer's closure); the 17 at Admiralty Drive are Downer's WB08 | no Coates hire; the record tracks them, nothing to bill |
| WB22 $4.72 | 4 barriers, 18–27 Oct, 10 days, 40 barrier-days | Baseplan one day short: $47.20 on the program ($42.48 light) |

Also from the program, no action unless Andrew says: WB03 programmed out 19 Oct, Baseplan bills to 29 Oct and the record
still has it on site; WB13 (on 9990776) programmed 8 days, Baseplan 7. Everything else matches: WB01 44 days, WB04 and
WB05 12 days, WB14–WB18 at the 7-day minimum, WB17 6 barriers across lines 12 and 21, WB20 and WB19 Pending as the
dismantle-period reinstatements. The program does not price the WFB labour ($7,700) or transport ($17,900) lines.

## Schedule 15: transport cost figures not yet on the page

The page's transport cost side reads the schedule's own TPORT COST column (the figure written on the load brief is what
Coates pays the carrier; v5.83). The page carries 55 such figures, $30,892.05, from the schedule copy it was loaded with,
and none later than Week 2 (8 Oct). Schedule 15 carries 74 figures, $37,490.09. Matched by date, item and amount: 52 are
the same; three are the same money under a different date key (WC01 accessible $570 is 30 Sep on Schedule 15 and
28 Sep on the page; WC60's $290 + $580 are two undated rows on Schedule 15 and one 1 Oct row on the page; the 2 Oct
fencing $576.31 is "Friday 2nd October" on Schedule 15). **Nineteen figures, $6,598.04, are on Schedule 15 and not on
the page:**

| Week | Date | Load | Figure |
|---|---|---|---|
| Week 6 | 7 Sep | VMS, 8 boards | $100+ |
| Week 6 | 11 Sep | light towers × 5 to Molendinar | $580+ |
| Week 6 | 11 Sep | forklift 2.5 t to Phillip Park | $646.32+ |
| Week 5 | 14 Sep | forklift 2.5 t RT to Macintosh | $646.32+ |
| Week 5 | 15 Sep | lunchroom 4.8 × 3 (T0021/T0022) | $290+ |
| Week 4 | 23 Sep | WC-TV toilet block (T0243) | $290+ |
| Week 2 | 7 Oct | 3.0 m container to Helen Park (T0258) | $275.40+ |
| Week 2 | 8 Oct | WC09 toilet block | $580+ |
| Week 1 | 12 Oct | GN26/GN27 200 kVA and cables | $580+ |
| Week 1 | 12 Oct | GN13 45 kVA | $290+ |
| Week 1 | 12 Oct | P69 and P45 buildings | 2 × $290+ |
| Week 1 | 13 Oct | forklift 2.5 t RT (T0109's machine) | $290+ |
| Week 1 | 16 Oct | 2 × VMS and 10 trackmats | $290+ |
| Week 1 | 16 Oct | WB04 and WB05 barriers | 2 × $290+ |
| Week 1 | 16 Oct | forklift 5 t RT (FL03) | $290+ |
| Week 1 | 16 Oct | forklift 2.5 t RT (FL04) | $290+ |

Event Week, Demob Week 1, 2 and 3 carry no dollar figures (Demob Week 1's "cost" column holds the carriers' names).
Loading the nineteen lifts the known transport cost from $33,150.09 (the page's count includes six unreferenced rows
and the fencing rows) towards $39,748.13; the job-end figure moves less, because the page already forecasts loads
without a figure at the card and the average so far ($23,661) and an actual figure replaces that forecast.

Method: `page_schedule_tasks.json` extracted from the live build's schedule data (335 tasks, `transport_cost_text`),
`s15_costs.json` from the Schedule 15 sheets (dollar figures only: a cell with `$`, a trailing `+` or two decimals;
load times and load-order words excluded), diffed on (date, item, amount). Both private, in the session scratchpad.

## For the page (Codex)

Load Schedule 15's TPORT COST cells as the successor to the schedule copy the page carries, under the existing v5.83
rule (the figure written, counted on the cost side; `+` noted; `na` and `Internal` as now), and re-key the three
date-moved rows so they are not doubled. Hire, servicing and every charge line are untouched by this; it is cost only.
