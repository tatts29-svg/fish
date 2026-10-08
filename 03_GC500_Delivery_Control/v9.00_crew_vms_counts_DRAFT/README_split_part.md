# v9.00 part C — the WC09 count: split rows count from their own day (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**, built and tested, not uploaded, not committed by this part ·
publishes in the next release of this folder (agreed as v9.05; the footer step takes the next free number after the live page)

## What happened, and what Andrew said

At **11:23 AEST on Thu 8 Oct** Andrew set WC09 on site on the live record, and ticked it Complete ten seconds later (then
positioned-and-levelled and steps at 11:24), for its **two 6 m toilet blocks** (schedule row T0102, due Thu 8 Oct, the SFL
bookings). WC09's **4 FWF** (T0101) and **6 pee panels** (T0259) are **Event Portables Load 1 on Fri 9 Oct**: v8.86 moved
those two rows with its plan correction (`date_correction.plan886`, load 1) and left the toilet blocks on Thu 8 Oct.

The record holds one state per reference, so on the live page Today's Toilets work rows read WC09 as **12 of 12, "Recorded
complete"** — ten units a day early. Andrew confirmed, about 11:40 AEST in the v9.00 chat: "pee panel tommorrow".

Read with GETs only (records 4469 and 4471, 8 Oct): WC09 `on site` set 2026-10-08T01:23:46Z, `done` 01:23:56Z, no day
recorded on the reference. Nothing on the record was changed.

## The rule

Where the plan has split one reference's delivery rows across days — some rows moved to a later day by v8.86's correction,
others not — **a Complete tick, or the on-site light, recorded at a time counts only the rows due on or before that time's
day (AEST)**.

- A row due after that day is **not** counted when its day comes. It counts once a record made **on or after its day** says
  so: the reference set on site again, or ticked Complete again, that day or later. Until then it reads as **due**, never done.
- **The page keeps no delivered record of its own for an Event Portables load**, so nothing else counts for them. Checked on
  v9.04 and v9.07: the shared `loads` collection holds drop cards (`keys`, `drop`, `card`), crew planning (`crew883`),
  unloading windows and load order (`flow891`) and the traffic-control status (`traffic903`: To confirm / Not required /
  Required / Arranged). None says a load was delivered. The page's `delivered` flag belongs to the Coates rental contract
  lines, which do not carry Event Portables rehire.
- A row's day is its own day on the plan (the schedule's, or v8.86's correction). A day recorded on the reference is one day
  for every row and cannot say which rows it means, so it moves no row for this count. (On the Timeline a recorded day still
  moves the whole reference, as v8.86 set; that is untouched.)
- If a later row has no quantity, everything not already covered is held back (unknown stays unknown). A tick with no time
  on it covers the first day's rows only. A reference whose order quantity is already covered by the rows due by the record's
  day holds nothing back.
- A partly counted split row is a known part, not a conflict: it is **not** flagged "Requiring review" and does not turn the
  group's percentage into an "at least".

**How the FWF and pee panels get counted on Fri 9 Oct:** once Load 1 is in, set WC09 on site again (the light writes a new
time even when it is already green — `setLight` stamps `set_at` every time), or take the Complete tick off and put it back.
Either record, made on or after Fri 9 Oct, counts all twelve.

## Where it lives (`patch_v900_split.py`)

One helper, `split900(a, d, lines)`, in its own script before the last `</body>`. It returns `null` for every reference
without split rows and for a split reference whose rows are all covered, so those rows are the base's byte for byte. It is
read at the one place the page derives a reference's completed quantity for work progress, and by the two breakdowns that
re-derive it, so all of Today agrees:

| function | what reads the rule | edits |
|---|---|---|
| `todayWorkMetrics840` | Today's work rows: `done`, `complete`, `remaining`, the status ("Recorded complete for the rows due by Thu 8 Oct"), and the reason once, on the row's own sub-line: "2 of 12 · 4 FWF, 6 Pee Panel due Fri 9 Oct (Event Portables Load 1)." A partly counted row has `recordedComplete: false` and carries `split900` (the rows held back). Where we are, the summaries and the Today scene read their figures from here. | 5 |
| `todayGroupDetails841` | the group card's item types: each item's complete quantity less what is held back | 2 |
| `todayTypeMetrics843` | the type breakdown's reference rows (FWF 0 of 4, Pee Panel 0 of 6, "due Fri 9 Oct (Event Portables Load 1)"; 6 m blocks 2 of 2), so they reconcile with the group card | 3 |

Every edit is a `rep()` that must match exactly once. The patch reads the base's own text: DATA must round-trip; the three
functions and the helpers it reads must each be there once; it refuses to run twice (`function split900(`); it never asserts
a base hash. It also reads the plan from DATA and **stops if the split references are not exactly WC09 and WC67**, and checks
WC09's rows (T0102 2 × Toilet Block 6m Thu 8 Oct unmoved; T0101 4 × FWF and T0259 6 × Pee Panel Fri 9 Oct, Load 1) and its
order (4 + 6 + 2). DATA and the footer are proved unchanged after the edits.

**Not touched:** DATA, the record (read-only), the Timeline (placement and its own completion state), the maps, money, hire
dates, the footer (the footer step does it), every pin, `MASTER_LOC` entry and marker, no CSS, no Today or Timeline styling.

## The references the rule touches, on the live record today

Found by reading every reference on the built page (record 4469; the enumeration in the results below), on 8, 9, 13 and 20 Oct:

| reference | rows on the plan | record | Today work row, before → after (8 Oct) |
|---|---|---|---|
| **WC09** | T0102 2 × Toilet Block 6m Thu 8 Oct · T0101 4 × FWF and T0259 6 × Pee Panel Fri 9 Oct (Event Portables Load 1) | on site and Complete, Thu 8 Oct 11:23 | **12 of 12, recorded complete → 2 of 12, 10 due Fri 9 Oct** |
| WC67 | T0081 2 × FWF Thu 1 Oct · T0262 2 × FWF Tue 13 Oct (Event Portables Load 2) | on site and Complete, Thu 1 Oct 15:06; day recorded Tue 13 Oct | 2 of 2, recorded complete → **unchanged** (its order line on the page is 2 FWF, already covered by the 1 Oct row) |
| WC29 | T0148 7 × FWF Tue 13 Oct (Load 2) and a removal on Mon 26 Oct | in transit | not split (one delivery row) — unchanged |

No other reference has split rows. **Nothing moved unexpectedly.** Only WC09 holds anything back, on every day checked.

What follows from WC09, on 8 Oct (same record on both pages; the same figures on the v9.07, v9.08 and v9.10 bases):

| reading | base (live) | candidate |
|---|---|---|
| Toilets work: confirmed complete | 139 of 254 toilet units, at least 54.72% | 129 of 254, at least 50.78% (the "at least" comes from other references' reviews, unchanged) |
| Toilets group card, item types | FWF and Pee Panel include WC09's 4 and 6 as complete | FWF −4, Pee Panel −6; 6 m blocks unchanged |
| Where we are, whole job | at least 62.37% (range to 68.84%) | at least 61.81% (range to 68.84%) |
| every other group, reference, type, summary | — | identical (tested) |
| money | — | identical (tested) |

For Andrew, separately from this release: WC67's schedule carries two drops of 2 FWF (4 in all, per v8.86), but its order
line on the page is 2 FWF. If WC67 is 4 FWF, the order quantity is its own question; this release does not change it.

## Build

`cd 03_GC500_Delivery_Control && toolchain/build.sh v905_split v9.00_crew_vms_counts_DRAFT/patch_v900_split.py`

**Live moved three times during the work**, and each time this part was rebuilt on the new live page and the tests rerun:
the base named for it was v9.04 (`d0d63004…`); then v9.07 (Today clean-up), v9.08 (Timeline centred cards) and v9.10
(the name selector) went live. The patch applies unchanged to all four (on v9.04 to a scratch copy, `check_page` PASS). The
current build:

| | |
|---|---|
| base (live at build, v9.10) | `838a45559ac0d184186f37bd5fa2b4ebf518ca63c8d3ddda8bec041bf738587f`, 11,528,818 bytes, footer ` · v9.10` |
| candidate | `3c92d176e4c39b1665edc83da1e2517964e644b314b0fd4ae676320f3adeeb48`, 11,534,988 bytes, footer ` · v9.10` (untouched) |
| check_page | PASS: 26 inline scripts parse, no new keys, author line present; the scrub's code-mention count rises by one (this script's Author line) |
| patch run twice | refused: "v9.00 split part already applied" |
| earlier builds | on v9.07 `25826d5e…` → `a99e098c…`; on v9.08 `aa1480bd…` → `34edd058…` (re-applying the final patch to the v9.08 base reproduced `34edd058…` byte for byte) |

## Tests

`tests/test_split900.cjs` opens the base and the candidate one after the other at the live address, reading the live record;
every write is aborted by the harness and the simulations never leave the page. Page clock: `Date.now` set in the page
(the way earlier audits set it), inside one synchronous run, then put back.

    PAGE=build/GC500_v905_split/GC500_Delivery_Control_hosted.html [MOB=1] node v9.00_crew_vms_counts_DRAFT/tests/test_split900.cjs

It checks: the record is as found (WC09 on site and Complete, both Thu 8 Oct); base 12 of 12 (the fault); on Thu 8 Oct
WC09 2 of 12, 10 left, not complete, not a review, the status and the reason once on its own sub-line, the rows due named
(T0101, T0259, Load 1); the type breakdown and group card agree; **the whole Today work model, every group, identical to the
base apart from WC09** (every other reference's work row and type row, every other group card, the summaries, Where we are;
Toilets moves by WC09's ten only); on Fri 9 Oct with the record unchanged WC09 still 2 of 12 with the rows due; simulated
records: set on site on Fri 9 Oct → 12 of 12, re-ticked Complete on Fri 9 Oct → 12 of 12, set in transit on Fri 9 Oct →
still 2 of 12, and the record is as read afterwards; Today as drawn (Fri 9 Oct clock, and the real day): the Toilets
breakdown shows WC09 with 10 not confirmed complete, the reason once, no "Requiring review", and 2 confirmed complete (base
12); money identical (`moneySummary()`, `cj764Model()`, `fh866Model()`, `pl770Model()` as JSON); same record version on
both; no page or console errors; no writes.

| base | record | test_split900 laptop 1440 | test_split900 phone (MOB=1) | sweep laptop | sweep phone |
|---|---|---|---|---|---|
| v9.07 | 4469, then 4471 | **28/28**, **28/28** | **28/28**, **28/28** | 21 tabs, 15 shown, 0 errors, 0 console, 0 writes | 21 tabs, 15 shown, 0 errors, 0 writes; one console line, a failed fetch to the public weather service (the rig's network; it did not recur) |
| v9.08 | 4504 | **28/28** | **28/28** | 21 / 15 shown, 0 / 0 / 0 | 21 / 15 shown, 0 / 0 / 0 (base page the same) |
| **v9.10 (current)** | 4504 | **28/28** | **28/28** | SWEEP910_LAPTOP | SWEEP910_PHONE |

The enumeration (every reference on the built page, 8, 9, 13 and 20 Oct, record 4469): split references WC09 and WC67;
only WC09 holds rows back.

Looked at: the Toilets "not confirmed complete" breakdown with WC09's row, laptop and phone — "10 toilet units not confirmed
complete · Recorded complete for the rows due by Thu 8 Oct · 2 of 12 · 4 FWF, 6 Pee Panel due Fri 9 Oct (Event Portables
Load 1). FWF, Pee Panel, Toilet Block 6m Positioned and levelled recorded. Steps installed recorded."

## Open

1. **Outside the count, WC09 still reads finished**: the Timeline's completion state, the maps' completion tick (v8.97) and
   the breakdown's "Current shared record" panel ("Finished · Recorded complete") read the reference-level tick — the record
   as it stands. Not changed here: the Timeline has its own release in flight (v9.08) and the record panel reports the record.
2. **On site / on hire** in the group card's item types comes from the native Equipment reading (`dsnState`), which also
   feeds the Equipment tab and the money splits; it still counts WC09's FWF and pee panels as on site. Left alone to keep
   this release to the work-progress model; a follow-up if Andrew wants the on-site counts split the same way.
3. The summary's definition text ("it does not infer partial installation") is unchanged; WC09's 2 come from its own record
   and the plan's rows, not an inference about how much was installed.
