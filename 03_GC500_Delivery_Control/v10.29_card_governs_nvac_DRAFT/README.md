# v10.29 — the card governs NVAC's generator and tower lines (READY, not live)

Author: Andrew Fisher. Data-only patch on the live v10.28. Andrew, 15 Oct 2026, in Claude's chat: **"We go by our
rate cards at the moment."**

## What was wrong on v10.28

The 15 Oct 2026 Baseplan export carried, for the first time, the weekly rates NVAC keyed on its generator and
lighting-tower lines (contract 9961976, 24 lines). Until then those lines had no Rate 1 and the page filled them from
the card. The page's charge rule prices a line by its own Rate 1 when one is written (the v10.04 generator rule:
"whole-event Rate 1 ÷ race days"), so v10.28 priced the 24 lines at the branch's figures and NVAC's priced total moved
from **$64,801.78** (card, live v10.27) to **$113,560.44**. That is the +$50,837.73 on generators and +$2,637.53 on
towers the v10.28 README reported as the export's movement. It was the branch's keying, not the card, and the settled
rules (generator standdown, 12 Oct; card daily rate for a tower over the three event days; generator pricing by the
size asked for, 1 Oct) say the card.

Second, the same export booked a **SPARE 60 kVA** against two references' register numbers: line 13 (1283681, the
number the register planned for GN06) and line 45 (1261271, the number the register planned for GN13). On site GN06 is
1320828 (line 48, turned up 15 Oct) and GN13 is 1276503 (line 44, delivered 12 Oct), both matched on site and on the
record. The join rule put the spares on GN06 and GN13 by the register's numbers, so each reference held two lines for
a quantity of one and the page priced **neither** ("Contract quantity needs allocation") from v10.28.

## What v10.29 does

| Change | Lines | Effect |
|---|---|---|
| Keyed Rate 1 set aside, kept on the line as `rate_1_keyed1029` with the reason | 24 NVAC generator and tower lines | Rate 1 empty again; the card fills each line exactly as on v10.27 (generators: standby rate to 22 Oct then the daily rate for 23–25 Oct; towers: day rate × 3) |
| Spare lines unjoined from the references (`unjoined1029` keeps what they were joined to) | 9961976/13 (off GN06), 9961976/45 (off GN13) | GN13 prices again (actual, delivered 12 Oct, $1,494.68); GN06 prices again ($1,275.95); the spares stay on the page as the branch's Pending lines with no reference |
| `DATA.rate_hold1029` review block, same in `data_log_1029.json` | — | every keyed rate beside the card's figure, the day-count reading, the two unjoins, GN24 left as a question |
| Footer | — | v10.28 → v10.29 |

Nothing else moves: 274 of the 299 contract lines charge to the cent what v10.28 charged (the other 25 are the 24
held lines and the unjoined line 45; line 13 is also a held line). No position, quantity, status, date, join other than
the two, or record value changes. GN24 is left as it is: line 17 (1276412, the 80 kVA asked for) and line 49 (1277089,
a 60 kVA trailer), both booked 19 Oct and both naming GN24, one unit on the schedule; which comes is the branch's to
say, so GN24 stays "quantity to allocate" and unpriced.

## What the keyed figures are (Andrew asked: labour or install on top?)

No. Each keyed figure is the **card's daily rate for the unit × a count of days**, keyed as a Weekly rate:

| Reference | Keyed Rate 1 (W) | Card daily, size asked | = days |
|---|---|---|---|
| LT01–LT04 and the fifth Molendinar tower | $643.30 | $64.33 | 10.0 |
| LT05/06 pods | $385.98 | $64.33 | 6.0 |
| GN23 150 kVA | $2,412.54 | $268.06 | 9.0 |
| GN01 60 kVA, GN03 30 kVA, GN13 (45 kVA asked) | $1,544.00 / $1,132.28 / $1,406.72 | $193.00 / $141.53 / $175.84 | 8.0 |
| GN25 20 kVA, GN27 200 kVA | $855.63 / $2,551.92 | $122.23 / $364.56 | 7.0 |
| **GN06 (50 kVA asked)**, GN04, GN10 (45 asked), GN19 (60 delivered), the spare | $1,184.82 / $919.97 / $1,142.96 / $1,254.50 | $182.28 / $141.53 / $175.84 / $193.00 | 6.5 |
| GN26 200 kVA | $2,005.08 | $364.56 | 5.5 |
| GN21 60 kVA, GN24 (80 kVA asked, both lines) | $868.50 / $984.33 | $193.00 / $218.73 | 4.5 |
| GN18 60 kVA | $2,187.36 | $193.00 | 11.33 (10.0 at the 80 kVA rate) |
| GN20 365 kVA | $6,260.40 | no card line | — |

The half days read as standdown days at half rate. **GN06 as the example, turned up 15 Oct:** the card's 50 kVA line
is $182.28 a day, standby $91.14. NVAC keyed $1,184.82 = $182.28 × 6.5 (three race days at the full rate plus seven
standdown days at half). The page charges $1,275.95 = eight standdown days (15–22 Oct) at $91.14 plus three race days
at $182.28, which is the same card and the same arithmetic one standdown day apart ($91.14). Six 60 kVA lines carry
six different figures, several below the card, which no labour or installation uplift produces. The thing to settle
with NVAC is not the rate but the **rate type**: a whole-hire lump keyed as W bills again every week the line stays
open. Labour on the page is separate (per piece, ticked on the Pricing tab) and is untouched by this patch.

## Money

| | v10.27 (live before 15 Oct) | v10.28 (live now) | v10.29 (this build) |
|---|---|---|---|
| NVAC contract lines priced | $64,801.78 | $113,560.44 | **$60,085.18** |
| All contract lines priced | $258,884.00 | $307,920.67 | **$254,445.41** |
| Forecast P&L · Hire Revenue | $233,349.92 | $288,619.97 | **$233,786.64** |
| Forecast P&L · Total Revenue priced | $1,069,600.99 | $1,107,684.97 | **$1,052,851.64** |

NVAC v10.27 → v10.29, line by line: GN13 moves from line 12 to line 44 (same $1,494.68); the spare on line 13 ($1,275.95
on v10.27 as GN06) gives way to GN06's own line 48 ($1,275.95); the export re-dated two pending forklifts (line 27
−$1,726.34, line 35 −$1,854.00) and dropped line 30 (−$1,726.34); it added the concert cable set (+$230.28) and a
transport line (+$359.80). Net −$4,716.60, none of it rates.

## Build and checks

```sh
toolchain/build.sh v10.29 v10.29_card_governs_nvac_DRAFT/patch_v1029.py
PAGE=build/GC500_v10.29/GC500_Delivery_Control_hosted.html node v10.29_card_governs_nvac_DRAFT/tests/test_rates1029.cjs
```

| Check | Result |
|---|---|
| `check_page.py` against the live base v10.28 (`665f8d1b…`) | PASS, no secrets; DATA round-trips byte for byte before the change |
| Page outside DATA | identical to the live base except the footer line |
| DATA | one key added (`rate_hold1029`); in `rental_on_hire` only `rows` (25), `assignments` (GN06, GN13) and the 9961976 contract's matched count (28 → 26) change |
| `tests/test_rates1029.cjs` (every write aborted) | ALL 14 CHECKS PASSED: 24 lines card-filled, none at the keyed figure, spares unjoined, GN13 and GN06 priced with no allocation issue, GN24 and GN21 as before, 274 other lines to the cent as v10.28, the 13 held lines whose status did not change charge what v10.27 charged, the whole NVAC movement is on the 24 lines |
| `harness/sweep.js` desktop and phone | 24 tabs, 18 shown, no page or console errors, no deep-link errors |

Built page: 17,982,435 bytes, SHA-256 `2d28d2a4b1810e64c003893901eacb3b9bbbdcc9f9086cddeaae038e13d1bc14`. Not uploaded;
goes live on Andrew's "Upload".
