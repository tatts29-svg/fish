# Company On-Hire Report → Activity & Accountability Report

**Data mapping and feasibility, before we build anything**
Coates | Cement Australia K2 Shutdown 2026 — Gladstone
Author: Andrew Fisher | POWERED BY SITEIQ | 25 Jul 2026

---

## The verdict in one line

**About 80% of the spec is buildable today from real data.** Three things in the
mock-ups can't be computed from anything we hold, and I'm not going to
manufacture them.

---

## 1. Which existing fields support each section

### The backbone I didn't know we had

`TRANSACTIONS.xlsx → TRANSACTION_CHARGES` carries **`TRAN_START_DATE` and
`TRAN_END_DATE` per asset per hirer**. That single pair gives you the entire
top row of transaction cards, at company *and* hirer level. It's already loaded
by `load_transactions()` — it just isn't being used this way.

| Your card | Field / rule | Real? |
|---|---|---|
| Active hirers | `ON_HIRE.HIRER_NAME` distinct | ✅ 21 site-wide, all with `EXTERNAL_ID` |
| Equipment issued | `TRAN_START_DATE` in window | ✅ |
| Equipment returned | `TRAN_END_DATE` in window | ✅ |
| Returned same day | `TRAN_END_DATE == TRAN_START_DATE` | ✅ already the suite's definition |
| Not returned same day | see §3 — needs your call | ⚠️ definition |
| Previously outstanding recovered | end in window AND start **before** window | ✅ |
| Currently still on hire | `ON_HIRE` row count | ✅ |
| Oldest item | `max(today − START_DATE)` | ✅ |
| Replacement-cost exposure | `MASTER.price(ITEM_NUMBER)` → schedule fallback | ✅ unpriced excluded, shows TBC |
| Items requiring confirmation | — | ❌ no such field |
| Active return requests | — | ❌ no such field |
| Age 1–7 / 8–30 / 30+ | `today − START_DATE` | ✅ (replaces the current 0-2 / 3-4 / 5+) |
| Equipment mix | `MASTER.EQUIPMENT_CATEGORY` + `is_radio_handset()` / gas / Milwaukee predicates | ✅ |

### Consumables — `SALES_STOCK.xlsx`

| Your field | Source | Real? |
|---|---|---|
| Consumable transactions | row count | ✅ 20 site-wide this window |
| Total units taken | `SALES_QUANTITY` | ✅ |
| Different products | distinct `SKU_DESCRIPTION` | ✅ 13 |
| Usage by hirer | `HIRER` | ✅ 7 people |
| Date / time | `SALES_DATE` / `SALES_TIME` | ✅ |
| Material number | `SKU_NUMBER` | ✅ |
| **Estimated value** | — | ❌ **no price anywhere** |
| Unit of measure | — | ❌ not in the export |
| Location | `STORAGE_UNIT` (shelf, not work front) | ⚠️ partial |

### Damage — `CHARGE_REGISTER.xlsx → Damage - Breakdown`

This sheet is almost a perfect match for your spec — it already has
`Location`, `Person using / returning item`, `Found during`, `Operational
status`, `Out-of-service tag`, `Off-hired`, `Replacement-cost exposure`,
`Repair / quoted cost`, `Cost status`, `Coates owner`.

Every field you listed exists. **There is exactly one record in it today**
(DMG-20260721-001, High Risk Solutions, Motorola radio, $600, Approved). So the
section will be honest but nearly empty until more get raised.

---

## 2. Which calculations already exist

| Already built | Where |
|---|---|
| Same-day / hold time / issue-return series | `tx_analytics()` line 3337 |
| Per-company issued / returned / outstanding / late | `company_return_stats()` line 3414 |
| Company score /100 | `contractor_scores()` line 3454 |
| **Per-person** activity, same-day, consumables | `load_person_history()` line 5664 |
| Per-person score /100 | inline at line 5784 — needs lifting out |
| Aging buckets | inline in `build_company_model` line 1102 — needs lifting out |
| Replacement exposure + TBC handling | `build_company_model` line 1090 |
| Damage counts by company | inline in `render_exec_html` line 7629 — needs lifting out |
| Compliance flags per asset | `equipment_compliance.py` (new today) |
| Page / PDF / .eml emission | `emit_report()` line 2693 |

**We're reusing, not rebuilding.** The four "inline" items get lifted into
shared helpers so the company page and the hirer page compute from the same
code — that's what makes the totals reconcile.

---

## 3. New calculations required

1. **A reporting window.** The suite is "as at today" everywhere. SiteIQ
   declares its own period in `TRANSACTIONS → REFERENCE_INFO`
   (currently `13/07/2026 05:00 – 24/07/2026 04:59`). I'd read that rather than
   hardcode, so the header period is always true to the export.

2. **Per-hirer model.** `models[company]["hirers"]` is a flat list of names
   today — no metrics. New `build_hirer_model()` producing one dict per person,
   with the company figure defined as the sum of them.

3. **"Not returned same day" — needs your definition.** Yours is "expected back
   that day but not returned by cut-off". Nothing in the data says what's
   *expected* back. My proposal: use the `RETURN_REQUIREMENT` column we built
   this morning — gas monitors, radios and Milwaukee gear are the daily-return
   items. Everything else is authorised long-term hire and is never counted
   late. That's defensible, it's already in the master, and you can change it
   per-asset in one cell.

4. **Recovered.** Returned in window, started before it. Straightforward.

---

## 4. How double-counting is prevented

Four real risks, all found in the audit:

| Risk | Control |
|---|---|
| `load_transactions()` reads **two sheets** (`TRANSACTION_CHARGES` + `CUSTOMER_CONTRACTOR_EQUIP`) and concatenates with **no dedupe** — callers each dedupe separately today | Dedupe **once**, centrally, on `TRANSACTION_ID` (fallback `barcode+start+end+hirer`) |
| One asset bills across several shifts = several rows | Count **distinct `TRANSACTION_ID`**, never rows |
| Site Plant Equipment holds **296 of 500** on-hire items under "COATES" | Excluded by the existing `is_site_plant_equipment()` — it's Coates' own gear, not a contractor's |
| Consumables inflating equipment counts | Structurally impossible — different source file (`SALES_STOCK`), never touches `models[c]["rows"]` |

---

## 5. How company totals reconcile to hirer pages

One rule: **the company figure is never computed independently.** Every card on
the Level 1 page is `sum(hirer[metric] for hirer in company)`. It cannot drift,
because there's no second calculation to drift from.

A `reconcile()` self-check runs at the end of every build and prints a PASS/FAIL
line per company per metric. If any company total ≠ the sum of its hirer pages,
the run says so loudly rather than shipping a report that doesn't add up.

**Proven against today's data** (window 20–26 Jul, Coates' own gear excluded):

| Company | Hirers | Issued | Returned | Same-day | Later |
|---|---|---|---|---|---|
| DGH Engineering | 7 | 174 | 12 | 11 | 1 |
| Cement Australia Holdings | 9 | 60 | 7 | 3 | 4 |
| Xtreme Engineering | 2 | 26 | 1 | 1 | 0 |
| Dark Knight Engineering | 3 | 16 | 10 | 10 | 0 |
| Veolia | 3 | 9 | 1 | 1 | 0 |
| High Risk Solutions | 3 | 4 | 0 | 0 | 0 |
| Programmed | 3 | 3 | 1 | 1 | 0 |

DGH broken to Level 2 — and 120 + 27 + 10 + 9 + 4 + 2 + 2 = 174. It ties.

| Hirer | Issued | Returned | Same-day |
|---|---|---|---|
| Bradley Logiudice | 120 | 2 | 2 |
| Nathan Bartlett | 27 | 3 | 2 |
| Benjamin Derksen | 10 | 0 | 0 |
| Luke Keevers | 9 | 0 | 0 |
| Rodney Hird | 4 | 4 | 4 |
| Adrian Letchford | 2 | 1 | 1 |
| Coben De Roode | 2 | 2 | 2 |

---

## 6. How consumables stay separate

They already are, structurally — and that's stronger than a flag:

- Hire equipment → `RENTAL_STOCK.xlsx` → `models[c]["rows"]`
- Consumables → `SALES_STOCK.xlsx` → `models[c]["consumables"]`

Two different files, two different pipelines. A consumable **cannot** reach
"still on hire", "not returned same day", "overdue", "recovered" or
"outstanding" because it never enters the list those are counted from. The
section keeps its own header — *USAGE DATA — NO RETURN REQUIRED*.

---

## 7. How it fits without breaking what works

New report, new flag: `--activity`. The existing `--all` company report stays
exactly as it is until you're happy to retire it. Nothing currently working gets
touched. Same `emit_report()` plumbing, so it lands in `Reports\<date>\` with
HTML + PDF + Outlook draft like everything else.

---

## The three things I won't fake

| Mock says | Why it can't be computed |
|---|---|
| **"2 CURRENT • 0 CHECK REQUIRED"** (rigging tags) | No test date or next-due date exists in any export or in the master. We know an item **needs** a blue tag. We cannot say its tag **is** current. |
| **"2 CONFIRMED • 1 NOT CONFIRMED"** (logbooks) | Nothing anywhere captures a pre-start. The logbook is a paper book on the machine. Every plant item would read "not confirmed" — which is noise, and you already said don't call it "not completed" without proof. |
| **"$186.40 EST. VALUE"** (consumables) | `SALES_STOCK` has no price column. `SALE ($)` in the transactions export is **zero on all 625 rows**. The contracted-rates file is equipment hire rates by Product Variant ID, not consumable sell prices. |

Same problem, smaller: **BUMP TEST CURRENT** as a badge (no per-asset bump
date), **active return requests**, **items requiring confirmation**, and
**location** for on-hire gear (we only know which shelf it came off).

Each of these is fixable — but by **capturing the data**, not by guessing it in
a report. Options are in the covering message.
