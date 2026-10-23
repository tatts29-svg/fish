# v11.59 — the forecast on the project manager's six rulings of 23 Oct — DRAFT

Author: Andrew Fisher. Built on live v11.58 `50ae2d0ff89b57cf83ed3f896adecb2d6b66d4f3760a3e78d232201d6e9786a7`.
(LIVE hash, bytes and time: see STATUS.md once uploaded.)

## Andrew's words, 23 Oct 2026

> "Wages and salary we will only track hrs no hrly rate. Event portaloos we do what we know. Damage waiver etc we dont worry
> about unless I tell you different when they invoice. Fix the timeline. You should know this: Alfie's 20 accommodation
> nights, Kyle Gover's 3 shifts without hours. No sheet for week 6: amount and dockets should be what it is. Make it work."

## The record first (through the page's own functions, backups beside each runner)

| Change | Folder | Record |
|---|---|---|
| Kyle Gover's three shifts without hours take his own times: 20 Oct 06:30–17:00 (10.5 h), 21 Oct 06:30–17:00 (10.5 h), 25 Oct 18:00–06:00 (12 h) — his weekday build pattern and his 24 Oct night | `record_23Oct2026_kyle_shift_hours/` | 10566 → 10575 |
| Week 5's supplier sheet (CW5, 22 Sep 2026, $33,670.50) on order 4647509, receipted $33,670 | `record_23Oct2026_fencing_po_sheets/` (`spec_4647509.json`) | 10575 → 10578 |

## What the page does now (`patch_v1159.py` + `forecast1159.js`)

1. **Coates wages and salary are hours, not dollars.** The running sheet's Coates people (CNA wages and salary) are tracked
   in hours only — no hourly rate goes on anyone, nothing is "unpriced", no gap, no "set a rate". The hired-in people
   (Job Connect and the race crew) stay priced at the rates on the record; the typed salary allowance forecast stays. Every
   card says it that way: Costs to job end, At a glance, the P&L in the business's lines, the Whole-job operational forecast
   (a new "Coates wages and salary · hours only" line), Labour — the whole job, Month-end control, the accruals, the event
   crew card, and the Finance CSV/text exports.
2. **The gaps that were not gaps are gone**: the card's POA work charges (Armorzone TL2 labour on WB01–WB18, WC100, T0258 —
   not charged unless the project manager says otherwise when they invoice), CW1's prior task allowances, the ended-week
   programme quantities, Event Portables' invoice/PO documents (we carry the approved quotes and the site count — what we
   know), Alfie's 20 nights (priced at his own average, said on the Accommodation line) and the base salary cost. The one
   fencing unknown stays, reworded: Advanced bills relocation and removal by the hour; the dockets will carry the hours.
3. **Damage waiver**: $0 on the P&L — not charged unless the project manager says otherwise when the V8s are invoiced.
4. **The fencing forecast carries only the weeks still to come.** An ended week is done: the dockets are the truth for what
   was done and the invoice for what it cost; its leftover programme quantities are no longer carried as "behind".
5. **The Timeline tie-out ties**: the Timeline side now counts each reference's own loads, the basis the Transport side has
   always counted on. A supplier delivering its own gear (Event Portables' toilets) is a receipt on the Timeline, not a
   load, so it is on neither side.
6. **A receipted fencing order stands at its amount.** 4647508 (week 6, no sheet): $8,992 with its 6 dockets as recorded;
   4647509 (week 5, sheet 50 cents over): $33,670. The difference against the sheet rates is carried on Rehire and said on
   every card; the Purchase orders card gains the "receipted — the order stands" state and counts them in its header.
7. Footer v11.58 → v11.59. The two Questions the rulings settle (the wage rates; Alfie's nights) read done, with the rule.

## The figures (dry build on the live record, 23 Oct 2026 ~16:40 AEST)

| | Before (v11.58) | After (v11.59) |
|---|---|---|
| Not priced yet (gaps) | 26 | 5 — four transport items and the fencing hours still to come |
| Coates wages and salary | 1,005.5 h "with no wage rate" (+ Andrew's 466 salary hours priced at $0) | 1,471.5 h, hours only |
| Wages priced (hired-in + salary allowance) | $82,964.27 | $82,964.27 (unchanged) |
| Fencing still to come — cost / revenue | $108,525.40 / $153,470.29 (incl. $63,019 / $67,291.20 of ended weeks) | $45,506.40 / $86,179.09 |
| Fencing cost to date (Advanced's sheet rates + receipted orders) | $216,842 | $213,589.50 (−$1,877 on 4647508, −$1,375.50 on 4647509) |
| Timeline tie-out | 134 vs 89 — did not tie | 89 vs 89 |
| Damage waiver | unpriced | $0 |

Docket 36524 (17 Sep, $1,375 at the sheet rates) is on the record for week 5 but not on Advanced's CW5 sheet; with the order
receipted at $33,670 it is inside the −$1,375.50. Week 6's six dockets come to $10,869 at the sheet rates against the
receipted $8,992; the workbook row with no docket number ($2,475) reads like a copy of 36501 ($2,475) — not changed, said
here for Andrew.

## Tests

`tests/test_v1159.cjs` — 23 checks: the gaps, the hours-only model and words on every card, the fencing weeks, the receipted
orders on every card and the P&L reconciling to the cent, the waiver, every tie-out tying, the Purchase orders card as
rendered, Alfie's nights, the Questions, the record untouched, no page errors. Desktop 23/23 and phone on the dry build;
sweeps desktop and phone (27 tabs, 0 errors, 0 console) — evidence in `evidence/`. Live results after the upload below.

## Not changed, for Andrew

- The 15 POA/work-charge rows are out of the gaps as "etc" of the damage-waiver ruling; say the word and they come back.
- Green note 24490 (labour on docket 36758) is not in hand; the EVENT WEEK dockets are a separate record folder.
- Week 6's sheet, if it ever comes, goes on 4647508 as the others did; the order amount would still stand.
