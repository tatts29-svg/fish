# v8.95 — the 7 Oct Baseplan export on the page (DRAFT, candidate)

Author: Andrew Fisher · 8 Oct 2026

Andrew supplied a fresh Baseplan export on 7 Oct 2026 (`Baseplan_SuperCars_07Oct.xlsx`, in the encrypted `inputs_07Oct2026/`). The page's contract source (`DATA.rental_on_hire`) was still the 6 Oct export, applied by v8.71. Codex's independent review asked for a source-freshness disposition: the costs must read the latest source. Andrew: "all cost align and correct" and "everything must talk".

This release is **data only**: the contract source moves from the 6 Oct export to the 7 Oct export, with v8.71's own rules; two contract lines join the references Andrew's record puts their numbers on, under his rule; and one register number he corrected (P52) is put right. Nothing else on the page changes — no code, no master, no media. Every figure the costs views show comes from the same page logic as before, reading the new lines.

## What changed, contract by contract

The two exports were compared cell by cell. **Eight contracts are identical.** Three change:

### 9961976-NVAC — two lines added, one description fixed

| Line | What | Change |
|---|---|---|
| **42** (new) | GN CONCERT Generator 200 kVA, asset **1316182** | **Pending**, booked in Mon 12 Oct, out Mon 26 Oct, no rate on the line ("no rates") |
| **43** (new) | GN CONCERT Generator 200 kVA, asset **1316183** | as line 42 |
| 27 | SUPPLY forklift 3.5 t, asset 1210921 | the description typo is fixed ("orklift" → "Forklift"); the page now calls it **Forklift 3.5t Diesel**. Nothing else on the line moved |

Both new lines **join the Concert generator reference** the schedule writes as **GN?**, because the register already carries 1316182 and 1316183 on it ("brand new units"). GN? is still the schedule's placeholder, not a resolved reference — see the decisions below.

**How the page treats a Pending line (v8.71's rule, unchanged).** Baseplan has booked it; it has not gone out. So the line is *not delivered* and has *no start date*: it puts nothing on site and nothing on the Timeline or Today. Its demob is the booked pick-up date (26 Oct). It is still a contract line, so it is **charged by the contract rule**: a generator with no rate on the line goes at **the card's line for what was asked for, once, for the three event days** (23, 24 and 25 Oct, both ends billed — the branch's rule). The card has a 200 kVA line, so no size-down applies. The two lines are marked **"card"** (an estimate until the branch puts a rate on the line) and appear on the Costs card *Contract lines with no rate — charged from the card*. The Status column itself is never evidence; the page reads delivered and start date, as it always has.

### 9968862-KINP — one line delivered; two lines join under Andrew's rule

| Line | What | Change |
|---|---|---|
| 89 | P56 Gate 1 Ticket BOH — building 3.6 m, asset 1268865 | **Del Req → Delivered**; booked delivery **14 Sep → 7 Oct**. The rental system now puts P56 on hire from 7 Oct (a light set on the ground still overrides it). Still joined to P56. Charged once (whole event), as before |
| 50 | P37 Oz Wide Audio Crib Room — building 6 m, asset **1105053**, Delivered 17 Sep on docket 26077069 | the export did not touch it; it **joins P37** because Andrew's record carries 1105053 on P37 (see *Andrew's matches win*). P37 is on hire from 17 Sep in the rental system's name. Charged once (whole event), unchanged |
| 79 | P52 Gate 1 Volunteer Check-In — building 12 m, asset **1327211**, Del Req on docket 26112762 | the export did not touch it; it **joins P52** because Andrew's record carries 1327211 on P52, beside line 81, which P52 already held by the same docket. Not on hire (Del Req). Charged once (whole event), unchanged. The register had P52's number with one digit too many; Andrew confirmed 1327211 and the register is corrected (see *Andrew's matches win*) |

### 9968955-KINP — 23 lines move

| Lines | What | Change |
|---|---|---|
| **24–43** (20 lines) | WC07 Toilets – Merch Area, 20 FWF | **Del Req → Delivered**; booked delivery **14 Sep → 22 Sep**; each line now carries an **asset number** (and a serial) where it had none; docket 26081411 unchanged. Lines 24 and 39 lose the "WC07" prefix in the description; the thing itself reads the same |
| 97 | WC31 Toilet – Accessible | **Pending → Del Req** on docket **26115307** |
| 103, 105 | WC09 Toilet Block 6 m × 2 | **Pending → Del Req** on dockets **26115312** and **26115316** |

- **WC07 — Andrew's matches win, and he settled the one difference.** Andrew recorded 20 asset numbers on WC07 on 22 Sep (the as-supplied record, in his name). Baseplan's 20 numbers agreed with his on 19 lines; on line 38 (serial F4790) Baseplan had **1317643** where his record had 1317743, one digit apart. Andrew, 8 Oct 2026 (~09:30 AEST): "1317643 is the correct number Remove 1317743", confirmed at ~10:10 ("1317643 is correct"). The patch corrects his as-supplied record to 1317643 (the one place DATA held the other number), so **all 20 lines join WC07** and 1317743 appears nowhere on the page. WC07's drawer shows Rental 9968955 and "on hire from 22 Sep" in the rental system's name — the schedule had already placed it on 22 Sep, so nothing moves on the Timeline.
- **WC31 and WC09.** The three dockets are the 8 Oct SFL dockets the register already carries on WC31 (T0096) and WC09 (T0102), so the lines join those references by docket. Del Req is not delivered: nothing goes on hire until the next export says Delivered.
- **Charges.** Every toilet and building line is charged once at its whole-event rate, so a status, date or join change moves no money on these 23 lines, nor on P56, P37 or P52.

### What did not change

- No line removed; **no rate changed on any line**; no transport or delivery charge line changed.
- The five numbers Baseplan writes on two priced lines are the same five v8.71 flagged (1189410, 1189412, 1211404, 1272166, 1327213); the two-line numbers rule keeps those lines where they were.
- The refresh carries the same fields v8.71's refresh carried; the lines' other columns are as v8.71 left them.

## What that does to the money

Measured on the live record (version 4370) with the chain through v8.94 as the base and this candidate against it — figures as direction or percentage only. Measured twice: on the chain through the earlier v8.94 and again on the chain through the new v8.94 (the lighting scope projection, landed 8 Oct 19:51); v8.95 moves the same 35 figures on both, by the same amounts.

| View | Effect |
|---|---|
| **P&L — Revenue on the record** | **up 0.37%**. Of which the contracts: up 0.88%. **Hire Revenue by branch: NVAC up 4.79%** — the two Concert generators at the card's 200 kVA line for the three event days, 4.57% of NVAC's contract revenue, 0.87% of the contracts total. KINP, STPS and MEAD: same to the cent |
| **P&L — Rehire Revenue** | same. The toilet lines (Event Portables rehire at our rates) are whole-event lines and did not move; WC07's 20 lines are 1.28% of KINP's contract revenue, unchanged. KINP's toilet lines carrying a Coates plant number: 38 → 58, all still counted as Event Portables rehire under the toilets rule |
| **P&L — Transport Revenue, labour, servicing** | same |
| **In the business's lines** | 1005 Hire Revenue up 1.45%; 1010, 1030 · 1031, 1032, 1047 and every cost line: same |
| **Costs to job end** | Direct costs known today: same. Direct costs to job end: same (every cost row and the wages: same). Revenue to job end: **up 0.22%** (the two generators and nothing else). Transport still to come: same |
| **Finance handover** | Costs by branch: same, every branch. Invoice by branch: **NVAC on the record up 4.71%, to job end up 4.24%** (4.00% on the chain through the earlier v8.94, whose NVAC "to come" was larger); KINP, STPS, MEAD, the event labour scope and provisional transport: same. Its checks (costs, invoice, people) hold |
| **Transport view (v8.88)** | every figure same: to date, still to come, by branch, by carrier, the 132 loads, Transport Revenue, provisional revenue, demob. All **17 tie-outs tied** before and after |
| **The two joins from Andrew's record (P37, P52)** | **no money effect at all**: the candidate with those joins and the one without agree on every figure the models give (contract charges, by branch, Costs to job end, the handover, the business's lines, Transport) — both are whole-event building lines whose charge does not depend on their join |
| **The P52 register correction** | **no money effect at all**: the candidate before and after the correction agree on every figure the models give; a reference's number is never a charge |

Why the money moves only on NVAC: the export adds two lines with no rate, and the page charges them from the card as an estimate. Every other change is a status, a date, a docket, an asset number, a join or a register number whose charge does not depend on them.

## Andrew's matches win

Andrew (6 Oct, Claude chat): "good chance baseplan and spreadsheet allocation of asset numbers are wrong. What I have matched up and completed is correct." His record is the authority over Baseplan.

The patch reads his recorded numbers from three places, in this order: the numbers he typed on the shared record and the numbers recorded on site on the shared record (`andrew_4370.json` — record version 4370, 7 Oct 2026 22:40 AEST, read back read-only through the page's own functions; a fresher snapshot may be given as `V895_MATCHES`), then the as-supplied record he committed on 22 Sep (`DATA.ops`, already on the page), which is where WC07's 20 numbers are. The shared record wins where the two disagree, as v8.71 applied it.

The rules, as v8.71 wrote them: a Baseplan number he has recorded on a reference joins that reference and no other; one he has not recorded goes where the register puts it (the two Concert generators), or stays unjoined (1317643). A number Baseplan writes on two lines follows only the delivered line. A numbered line never joins by docket; only a line with no plant number does.

**Applied under his rule, beyond the export's own changes (v8.71's record step, kept on):** a numbered line whose number his record carries on a reference the page did not yet join it to follows his number, even where the export did not touch the line. Against the record of 7 Oct that is exactly two lines, both logged in `evidence/changes_v895.json` as `record_joined` and named in the source's supplement:

| Line | Number | His record says | Was | Effect |
|---|---|---|---|---|
| 9968862/50 — P37 building 6 m, Delivered 17 Sep | 1105053 | P37 (typed on the record) | joined to nothing (by kind only) | joins P37; P37 on hire from 17 Sep by the rental system; no money change |
| 9968862/79 — P52 building 12 m, Del Req | 1327211 | P52 (typed on the record, 7 Oct) | joined to nothing | joins P52 beside line 81 (its docket); no money change |

The patch refuses to run if the record step would move anything else. Checks on the candidate: no contract line joins a reference that contradicts a number on his record (0 contradictions, as on v8.71). The only recorded numbers whose line is not joined are the three two-line numbers v8.71 holds (9961265/12, 9968726/10, 9968862/110).

**Two record corrections, on his word.** First, P52. The schedule's register carried P52's building number with one digit too many (eight digits where the contract line and his typed number have seven). Andrew, 8 Oct 2026 about 05:40 AEST: **"1327211 is correct"**. The patch puts 1327211 in the four places the page's DATA held the wrong number — all on P52: `DATA.assets[P52].asset_numbers[0]`, the booking's `asset_text` and its load's `asset_numbers[0]` (`DATA.assets[P52].events[0].booking801`), and `DATA.ops.rows[P52].asset_numbers_scheduled[0]` — after asserting each reads exactly the wrong value as found, and refuses otherwise; the wrong digits then appear nowhere on the page (the supplement records the correction without repeating them; the exact old value is in `evidence/changes_v895.json` as `register_corrected`). P52's drawer, booking and as-supplied row now all read 1327211, the same number as its contract line. The summary's v8.71 note *numbers the schedule did not have* still lists 1327211 (nothing on the page reads that note; it was true when v8.71 wrote it).

Second, WC07. His as-supplied record of 22 Sep carried one of WC07's 20 FWF numbers one digit out from Baseplan's line 38 (serial F4790). Andrew, 8 Oct 2026 about 09:30 AEST: **"1317643 is the correct number Remove 1317743"**, confirmed about 10:10 (**"1317643 is correct"**). The patch puts 1317643 in the one place DATA held the other number (`DATA.ops.rows[WC07].asset_numbers_supplied[13]`), after asserting it reads exactly the old value as found, once, on WC07, and refuses otherwise. Line 38 then joins WC07 by his number like the other 19, and the old digits appear nowhere on the page. Both corrections are logged in `evidence/changes_v895.json` as `register_corrected` (five entries) with his words.

## The identity proof

`baseplan895.py` is v8.71's contract builder lifted into one module, step for step: reading the export, refreshing the lines field by field, adding new lines, the join (Andrew's number, then the register's number, then the docket), the record step, the per-contract summaries, the assignments, the summary counts and the plant lines' copies of their contract lines.

1. **The same builder on the 6 Oct export reproduces the live DATA exactly.** `tests/test_rebuild6oct895.py` runs it on a page with `Baseplan_SuperCars_2026-10-06.xlsx` (SHA-256 `5f9e83aa…`, asserted) and Andrew's recorded numbers, with the record step held off, and asserts nothing changes. On the chain through v8.94 and on live v8.83 itself: 0 differences across every row, contract summary, assignment, summary count and plant line; no line added, removed, changed or re-joined; the same five two-line numbers. It then runs the record step alone on the same export and proves it moves exactly 9968862/50 to P37 and 9968862/79 to P52 — their join only — with the P37 and P52 assignments, contract 9968862's summary and the summary counts, and nothing else (`evidence/rebuild6oct895_chain.log`, `evidence/rebuild6oct895_live.log`, 10 checks each). On the v8.95 candidate it refuses, because the source there is the 7 Oct export.
2. **Run on the 7 Oct export it changes only what the export changes, plus those two joins and the two corrections (P52, WC07).** `tests/test_identity895.py` compares the base (the chain without v8.95) with the candidate field by field: every DATA key other than `rental_on_hire` identical (schedule rows, plant lines, media, `MASTER_LOC`), the register and the as-supplied record identical once the four corrected P52 values and WC07's corrected as-supplied number are written into the base, the wrong digits in exactly those five places on the base and nowhere on the candidate page; outside DATA the page differs only in the footer; inside `rental_on_hire` only the 25 changed lines, the 2 added ones and the 2 record-joined ones differ — the first in the export's fields and what v8.71 derives from them (join, delivered, start date, the word for the thing; WC07's line 38 now joins too, by his 1317643), the last two in their join alone; the three contract summaries, the six assignments (GN?, WC07, WC09, WC31 from the export; P37, P52 from his record) and the summary counts (323 lines, 164 plant numbers, 142 delivered, 138 joined by number, 30 by docket, 148 unjoined) are recomputed from the candidate's lines in the test and match; the source record and its supplement name the 7 Oct export, its SHA-256, the two record joins by line and the five register corrections by reference, right number and path, with the reason — without the wrong digits, and without the attribution, which the build's scrub (v5.97, Andrew's rule: no "Andrew Fisher said" on the page) lifts from every page string; his words are on `evidence/changes_v895.json`, which the test reads too. With `V895_BASEPLAN` set, every line's carried fields are also checked against the export's cells (323 lines). **139 checks PASS on the final combined candidate `5e786047…`** against the same chain without v8.95 (`../v8.89_full_chain_08Oct2026/evidence_h1final/identity895.log`). On the 7 Oct candidates it failed on an unchanged page (35 findings) and on the candidate without the two joins and the P52 correction (15 findings), so it detects the release, the record step and the corrections.

Beyond `rental_on_hire`, only the four P52 values changed. `plant_lines` is identical because no plant line carries a changed contract line.

## Inputs (private, bound by SHA-256)

The export carries contract rates, so it is not in this public repository in the clear. It is in `inputs_07Oct2026/inputs_07oct.zip.enc` (the papers password).

| File | SHA-256 |
|---|---|
| Baseplan_SuperCars_07Oct.xlsx | `8a18bd1f0df331d339d0fa27d81bdf22b238b1de0f1f5f5c342b208eed4b3bd7` |
| andrew_4370.json (his recorded numbers, record 4370) | `aa78dedb7075…` (asserted by the patch) |

## Build

On live v8.83 `88a3584e`, after the READY full chain and v8.94:

```
V895_BASEPLAN=/path/to/Baseplan_SuperCars_07Oct.xlsx \
toolchain/build.sh v8.95 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
  v8.89_master_map_DRAFT/patch_v889.py v8.94_lighting_basis_DRAFT/patch_v894.py v8.95_baseplan_07oct_DRAFT/patch_v895.py
```

- **Candidate `388292e5947916e35f8d7b8fbb2fc3edf59b1388c56016d0e72456c346c36b54`, 11,292,269 bytes**, on the chain through the new v8.94 (the lighting scope projection, landed 8 Oct 2026 19:51). `check_page.py` PASS (16 inline scripts, no new key).
- Identity base for these checks: the chain through that v8.94, `950b42b8691cac9b810d43c3b79465689da1786614f3a400db75c7c6bf24a704`, 11,287,033 bytes. **The base moved while this release was being checked:** the chain through the earlier v8.94 was `737c1966…` and the candidate on it `8e1a17cf…` (and, before the P52 correction and the two record joins, `37f9af68…` and `82e09276…`). The patch applied cleanly on the new v8.94 without a change: it does not depend on v8.94's internals or on any base hash — its only base checks are the contract source (v8.71's 6 Oct export), P52's four values as found and the single ` · v8.89` … ` · v8.94` footer marker, which it makes ` · v8.95` — and the tests read whatever base and candidate they are given. The identity test and the 6 Oct rebuild proof were re-run on the new base and pass (the new v8.94 changes the register's lighting rows, `docs`, `sheets` and media; `rental_on_hire` is identical between the two chains). The combined suite on the final chain is the coordinator's run.
- v8.93 may sit before this patch and v8.91/v8.92 after it; the patch is data-only on `rental_on_hire`, so it touches no code, `MASTER_LOC` or media.
- The patch refuses to run twice (the v8.95 supplement), refuses a base whose contract source is not v8.71's 6 Oct export, refuses if the record step would move any line other than the two named above, and refuses unless P52's four values read exactly the wrong number as found (and none remains anywhere on the page after).
- Every change is listed in `evidence/changes_v895.json` (field names, statuses, dates, asset numbers and joins; `record_joined` for the two from his record; `register_corrected` for the five corrections — P52 in four places, WC07 in one — each with the wrong digit, the right number, the path and his words with the date; no rates, no money). The copy here is the log of the final combined build `5e786047…` (8 Oct 2026); the earlier copy predated the WC07 correction.
- Files: `patch_v895.py`, `baseplan895.py` (the builder), `andrew_4370.json`, `tests/test_rebuild6oct895.py`, `tests/test_identity895.py`, `tests/test_contracts895.cjs`, `evidence/`.

## Checks on the candidate (every write aborted, fresh cache each run, one browser at a time)

`tests/test_contracts895.cjs` (26 checks) reads: the contracts are the 7 Oct export (323 lines, 11 contracts, the v8.95 supplement bound by SHA-256); the two new NVAC lines are on the page, Pending, no rate, joined to GN?; a Pending line is off hire and the generators are charged at the card's 200 kVA line once for the three event days; the two are a small share of NVAC and of the contracts; WC07's 20 lines are Delivered from 22 Sep with their numbers; Andrew's numbers win (all 20 join after his WC07 correction; the page shows his 20 numbers with 1317643 and never 1317743; WC07 on hire from 22 Sep by the rental system); the toilet charge did not move; P56 on hire from 7 Oct; the three Del Req lines join WC31 and WC09 by docket and are not on hire; the forklift line reads Forklift 3.5t Diesel and still goes by the day rate; no contract line contradicts his record; **his record's two joins: 9968862/50 to P37 (on hire from 17 Sep), 9968862/79 to P52 beside its docket line, both whole-event with no card fill**; **P52 shows 1327211 everywhere — register, booking, as-supplied row, its contract line, the page's own number list and its drawer — and the wrong digits nowhere in DATA or on the page**; every Pending line is off hire; all 17 tie-outs tied; the P&L and the Finance handover's checks hold; Revenue on the record and to job end, Transport to date, to come and Transport Revenue read the same wherever shown; the branches add to the contracts charge; the Costs tab names the 7 Oct export; WC07's drawer shows Rental 9968955 and his numbers; no overflow; a redraw changes no figure; no errors; no writes.

**On the final combined candidate `5e786047…` (8 Oct 2026, ~10:00–10:30 AEST; the chain 884–889 → 893 → 894 → 891 → 892 → 895, with Andrew's WC07 correction and the Lighting wording):** `identity895` **139 PASS** against the same chain without v8.95 (`224bf93b…`), and `contracts895` 26/26 on laptop, with the phone run in the combined suite (`../v8.89_full_chain_08Oct2026/evidence_h1final/`). The suite's first `identity895` run on this candidate reported three findings, all in the test, none on the page: it still excluded WC07's line 38 from joining (Andrew's 1317643 joins it), still expected the counts before that join (137 joined by number, 149 unjoined; now 138 and 148), and expected Andrew's quoted words in the page's supplement, which the build's v5.97 scrub lifts from every page string by his own rule — the words are on the evidence log, which the test now reads. The test was brought to the rules and re-run on the same bytes; nothing was loosened and the page did not change.

**Re-run on the candidate `388292e5…`, on the new chain** (`evidence/rerun895.log`, first block):

| Check | Laptop | Phone | Other |
|---|---|---|---|
| v8.95 identity (`identity895`, chain through the new v8.94 `950b42b8…` → candidate) | PASS (136 checks) | — | the 6 Oct rebuild proof PASS on the new chain base and on live (10 checks each) |
| v8.95 contracts (`contracts895`, new) | 26/26 | 26/26 | |
| v8.66 Finance handover (`finance866`) | 24/24 | — | 24/24 on phone on `37f9af68…` |
| v8.65 Costs (`costs865`) | 33/33 | — | 33/33 on phone on `37f9af68…` |
| v8.88 Transport view (`transport888`) | 29/29 | — | 29/29 on phone and at 2560 px on `37f9af68…` |
| v8.71 (`test_v871`) | 11/12 on `37f9af68…` | — | its first check still asks for the 6 Oct export, which v8.95 supersedes; every other check passes |
| 17 tie-outs | all tied | | on every candidate, before and after |

The same set passed on `8e1a17cf…` (this page on the earlier chain; second block) and `37f9af68…` (before the P52 correction; third block), which differ from `388292e5…` only in v8.94's code and in that correction — neither moves a figure or a contract line.

**The standing regression, run on the earlier candidate `82e09276…`** (`evidence/run_all895.log`; on the earlier chain, and without the two record joins and the P52 correction, which move no figure):

| Check | Laptop | Phone | Other |
|---|---|---|---|
| v8.86 Event Portables days (`ep886`) | 31/31 | 31/31 | |
| v8.87 Map explorer (`explorer887`) | 23/23 | 24/24 | |
| v8.89 master (`master889`) | 16/16 | 16/16 | |
| v8.76 layout (`layout876`) · v8.74 VMS (`vms874`) · v8.73 Equipment (`asset873`) | 18/18 · 18/18 · 40/40 | 18/18 · 18/18 · 40/40 | |
| v8.72 loading (`loading872`) · v8.81 unloading (`unloading881`) · v8.81 paired (`paired881`) | 26/26 · 34/34 · 18/18 | 26/26 · 34/34 · 18/18 | |
| v8.83 crew (`crew883`) | 34/34 | 34/34 | |
| v8.85 Where we are (`where885`) | 24/24 at 1600 · 24/24 at 1440 | 24/24 | 24/24 at 2560 |
| v8.84 wide layout (`wide884`) | 21/21 at 1600 · 21/21 at 1440 | 21/21 | 21/21 at 2560 |
| v8.75 handling (`handling875`, out of date) · v8.79 paired run sheets (`paired879`, out of date) | 22/28 · 17/18 | 22/28 · 17/18 | the same checks fail on the chain without v8.95 |
| v8.70 supplier (`supplier870`) · v8.69 KINP (`kinp869`) | 17/17 · 17/17 | — | |
| 15-tab sweep | 15 tabs shown, 0 errors, 0 blocked | 15 tabs shown, 0 errors, 0 blocked | |
| Chain data accounting | data886 (live → v8.84–v8.88): PASS · identity889 (v8.88 chain → chain through v8.94): PASS | | |

Screenshots (WC07's drawer and the Everything reconciles line, laptop and phone) stay local because they show figures.

## For Andrew to settle (the page holds these; it does not guess)

1. **The Concert generators (GN?).** Two 200 kVA generators, 1316182 and 1316183, Pending for 12–26 Oct on NVAC with no rate. The page charges them at the card's 200 kVA line for the three event days as an estimate. The reference GN? is still the schedule's placeholder: which GN number is it, is the rate right, and do both go in?
3. **WC31 and WC09 on Thu 8 Oct.** Their lines are Del Req with the SFL dockets; once Baseplan has them Delivered, the next export puts them on hire from their booked date.

Not LIVE. Codex does the independent review, publication and public readback once the combined handover is READY. If the chain goes live first, build with `patch_v895.py` alone on the live page: its footer then carries one of ` · v8.89` … ` · v8.94`, which the footer step expects, and its contract source is still v8.71's 6 Oct export, which the base check expects.
