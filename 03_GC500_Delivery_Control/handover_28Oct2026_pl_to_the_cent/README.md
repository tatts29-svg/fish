# Handover, 28 Oct 2026: the P&L to the cent, correct allocations, correct wording and locations

Author: Andrew Fisher. Written for the Baseplan SuperCars audit and the next P&L passes (Codex builds and tests;
Claude uploads and makes record writes on Andrew's word). Read with `STATUS.md` and `AGENTS.md`.

Andrew, 28 Oct 2026, late evening: "We need to get P&L look 10/10 to the cent with correct allocations and correct
terminology locations." Then: "Give me recent Baseplan Supercars and I'll give to Codex. Make sure he knows work you've
done and findings and fixes you did."

## The goal, in one line

Every figure on the Costs / P&L tab equals what Coates will invoice (Baseplan SuperCars) and what we pay, to the cent;
every line sits on the right branch (KINP, STPS, NVAC, MEAD); every line is named the way the business names it and
tied to the place it was on site. Site record is truth for what turned up and when; Baseplan is truth for the rate and
the contract line; where they differ, the record wins on dates and quantities and Baseplan is asked to correct.

## Where the live page stands (v12.47, sha256 `1437f564…`, record 11715)

- Charge (headline) $1,011,296.03 = P&L revenue sum (made equal by v12.45.1). Cost $448,019.57.
- Branches at the last record write (run 55): KINP $282,011.86, STPS $82,579.12, NVAC $44,272.04, MEAD $25,851.50
  (money probe `v12.42.6_pl_branches_LIVE/money_probe.cjs`).
- Build bar: 7 of 7 areas at 100% (run 55). Fencing all in: $390,524.21 charge / $274,584.20 cost (v12.42.23).

## The Baseplan exports held privately (never committed)

| Export | Received | SHA256 (first 12) | Used for |
|---|---|---|---|
| Baseplan SuperCars (7) | 25 Oct 01:34 | `0cf90af6…` | review_25Oct2026_baseplan7 |
| Baseplan SuperCars (8) | 27 Oct 06:19 | `13f57669…` | review_27Oct2026_baseplan8; **loaded onto the page's contract lines by v12.42.7** |
| Baseplan SuperCars (8b) | 27 Oct 20:39 | `18ef76c9…` | **not yet reviewed or loaded** — see below |

**(8b) against (8):** identical on every sheet except `9990776-STPS`, where three lines are gone: line 11 Weed Mat 50 m
roll 40 × $79.62 = $3,184.80 (STPS-CON), line 12 Weed Mat 10 × $95 = $950 (STPS-CON, Del Req), line 13 Transport
Charge 10 × rolls $150 (STPS-FRI). Line 14 Event Labour Charge 213 h × $91.14 = $19,412.82 (STPS-INS) stays. Everything
else, all 21 sheets, byte-equal cell for cell. The page's 9990776 lines came from (8); whether the three dropped lines
are charged anywhere on the page needs checking (fencing is charged on Advanced's quantities since v12.19, so they may
be display-only). Andrew has the (8b) file to give to Codex.

## What Claude did on the P&L, in order (all on STATUS.md with hashes)

### Source reviews (read only, deliverables in the repo)
- 12 Oct: Schedule 8 + Baseplan (1) compared. 14 Oct: Baseplan (2). 15 Oct: TV order, Baseplan (3), Schedule 9;
  Baseplan (4) delivery-dockets tab (209 docket lines, 185 fleet numbers). 16 Oct: Baseplan (5) charges check.
- 22 Oct: Baseplan (6) + Schedule 13 against the record (`review_22Oct2026_baseplan6_schedule13/GC500_Baseplan_vs_Record_22Oct2026.xlsx`).
- 25 Oct: **Baseplan (7) full tie-out**, every one of 376 lines matched to what is on site, the day it turned up and
  the branch (`review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx`). Findings then: branch codes (GN26/27
  + cable, sync labour, transport, gen tech coded KINP on 9994954 but NVAC on the P&L; Premiair VMS and the reefer
  container as SUB decisions; T0085/T0109 NVAC on our record, MEAD on theirs), missing lines (water $13,950, fence team
  event labour $19,412.82, WCTV cleans, fence blocks, fencing labour, FR01/FR02, WB07), hours keyed as hours:minutes,
  light towers at three event days, generator standby rates, GN20 and PG29 off, fencing quantities to the dockets,
  start dates that change a charge (VMS14–17, VMS22/24, GN26/27, GN06, WB03). Branch tie-out then: KINP +$14,696.33,
  NVAC −$3,175.12, STPS +$115,865.98, MEAD $0.
- 25 Oct: our record against Coates' own delivery dockets (arrival days and numbers): 38 references on their docket's
  day, 51 closed later by the branch; corrections listed (WC07 1317643, P66 fridge 1311990, P33 fridge 1328952, P05
  boiling-water unit; numbers on two references 1189908, 1197839, 1211404). On dockets but not on our record then:
  P05 microwave, CP1 fridge and urn, P09 boiler, laserplane 1065384.
- 27 Oct: **Baseplan (8) against (7) and the record** (`review_27Oct2026_baseplan8/`, 126-row fix list). 32 lines
  added, 53 changed; off-rent generators/booms/buildings all match Record departures; start dates fixed to arrival for
  GN06, WB06, VMS22/24. Still-to-settle table (11 rows) is in that README; items 1, 2 and 10 were then fixed on the page
  (v12.42.8), items 5–9 are departures Andrew records as they go.

### Andrew's P&L rulings (23–27 Oct) now on the page
Wages hours only; EP servicing as known; waiver not charged; Timeline tie; week 6 fencing order stands; "what we pay
Advanced is what we charge the V8s" (v12.19, Advanced's quantities, $364,816.40); team references on their own hire
schedules held out of every charge (T0024, T0162, T0176, BJR01, SVP01, PG29); waste-tank labour inside the toilet
block; AA and HRP tracked, not charged (own HS 9968926 and 9974238); Coates forklifts own use, no charge (T0003–T0005,
FL01, FL02, EQ0004, EQ0007); water inside the pump-out charge; accommodation $27,700 = Baseplan; "move the P&L, don't
recode" for Premiair VMS (KINP/NVAC-SUB) and the reefer container (STPS-SUB); WB07 inside WB06; WB03 from 18 Sep;
pee panels stay on 9994954.

### Page releases that moved money (Claude, 25–28 Oct; each folder has patch, tests, README)
v12.16 fence charged once + GN20 back · v12.19 V8s charged on Advanced's quantities · v12.27 Advanced race crew
$30,672 cost · v12.42.5 forklifts/water/accommodation (revenue −$39,023.42) · v12.42.6 Premiair VMS and WB07 (branches)
· v12.42.7 **Baseplan (8) onto the contract lines** (21 sheets; cancelled 9973079/9994996 out; 9994248 held out, not
delivered; WFB labour $7,700 on 9972648/19; charge $971,877.96 → $992,642.79) · v12.42.8 WB02 term 25 Oct, FR01/FR02
start 17 Oct, scrim to STPS · v12.42.9 day-rate lines by the day + consumables $8,073.68 · v12.42.10 boom 9992300/12
21–27 Oct · v12.42.11 consumables on line 1020 · v12.42.12 T0085 9987005/1 5–28 Oct $3,600 · v12.42.13 AA/HRP held
out (record run 38 WC60 cleaning tick; toilet blocks = Baseplan $10,618.20) · v12.42.15 event people at Baseplan hours
(PM 30.44 h, toilets 27.15 h, gen tech 31.55 h, VMS 65 h) · v12.42.16 9968955 toilets (tanks 24, sewer-connect 24, FWF
labour $16,762.40) · v12.42.17 accommodation to the cent · v12.42.18 10000523 water $450.34 + site shift $500 ·
v12.42.19 pee panel $672.17 · v12.42.20 scrim rolls 10000484/10000475 · v12.42.21 9994954 GN26 $2,005.08, GN27
$2,551.92, sync labour $1,801.32 · v12.42.22 9961976 NVAC to the cent (lighting towers, generators, labour) ·
v12.42.24 9961265 VMS to the cent (+ line 40 labour $4,247.28) · **v12.45.1 (Codex) headline = P&L; included water out
of the servicing total; FWF install/demob approval applied once; customer fencing hours; held references out of the
labour plan: $1,025,473.88 → $1,011,296.03.**

Contracts that read "at Baseplan to the cent" after those: 9987005, 9968862, 9968955, 9994954, 9961976, 9961265,
10000523, 10000484/10000475, 9972648 (except the HELD patch below), consumables 10000506.

### Record writes on the P&L side (runner `record_26Oct2026_departures/left_site.cjs`, specs and reports kept)
Runs 35–36 T0085/T0109 to MEAD, concert generators GN? on KINP (NVAC $49,323.37 → $39,725.89); run 37 VMS-01/02 KINP,
VMS-03 NVAC, T0266 STPS; run 38 WC60 cleaning tick; runs 50–54 departures (GN20-A/GN21, T0001 VMS, GN23 dist board
1189078, EQ0007 complete dated 17 Sep, water barriers WB06/WB01/WB05/WB17 19:30 27 Oct); run 55 VMS-01/02/03
complete dated 22 Oct. Earlier: P06 1087453, AA/HRP labour off, steps off P60/P62/P63, VMS13 1191957, EQ0005 1262224.

## Held, open, or not yet right (the audit's starting list)

1. `HELD_9972648_baseplan/patch_v124222.py`: a 9972648 (STPS water barriers) patch built on 28 Oct and **held**, not
   released. Needs a decision on what it changes and whether it still applies after v12.45.1.
2. Baseplan (8b) 27 Oct 20:39: the three dropped 9990776 lines (above). Not loaded.
3. 9994248 held out of the page (not delivered) — confirm with Baseplan that it stays off.
4. Baseplan still to correct on their side: WB03 start 18 Sep (they key 23 Sep); WB07 line off; WB02 9972648/3 term
   25 Oct not 25 Sep; FR01/FR02 9997711 start 17 Oct; scrim 10000484/10000475 to an STPS contract; 10000523 trakmat
   quantities v TM01's 10; GN26/GN27 delivered 12 or 13 Oct; P46 fridge 9968862/132 off rent 26 Oct — has it gone?
5. Departures still to record (Andrew): water barriers WB13 (10, probably Mon 26 Oct 14:00), WB02 (34), WB03 (30);
   VMS11 (467T), VMS20 (475T), VMS05a (1211356) when they go; WC51 accessible 1197174.
6. Laser plane EQ0006 (asset 1065384, rental 9987005 line 8, MEAD, contract start 16 Oct, delivery 26135873, booked
   back 17 Oct): on our record from 25 Oct only; Today's "Other" reads 4 of 5 on site at the 23 Oct cut-off. The runner
   cannot re-date a light already on site; needs the page release path (as WB03). Andrew to confirm 16 Oct and whether
   it is still on site.
7. Open from the (7) review, never closed: generator standby rates; light towers at three event days; hours keyed as
   hours:minutes; 17 demob + 36 planned transport movements without a rate (v11.94); Event Portables servicing cost on
   our on-site count ($42,234 v quote $46,545, task v10.62); fencing weeks 3–6 dockets revenue ≠ PO value (9 POs, 6 of
   9 pairings confirmed).
8. Wording and locations ("correct terminology locations"): the P&L lines should carry the business's names (Baseplan
   description + our reference + the map location) consistently; the Demob/Build cards already carry "Near Stand S04 ·
   35 m · Macintosh Island" style locations — the P&L lines do not yet. Design for Codex.
9. Record version moved 11702 → 11703 at 18:47 AEST 28 Oct by no run of Claude's; unexplained (asked on PR #1).

## Page bugs seen tonight (Andrew's screenshots, 23:38–23:44), for Codex
- Build cards show fully departed references (WB17, GN10, GN13, GN06) as "In transit" with the delivery booking.
- Map explorer on the phone: the map panel is stuck short (about a third of the screen) with "Fit screen" selected and
  the page cannot be scrolled; the whole map must be visible and the page must scroll (task #92, open since v11.95).
- Map explorer: departed items need their own description icon plus a departed icon, with the quantity in brackets,
  e.g. "WB17 (6)".
- Andrew's question: should the Demob "Picked up" stamp be Coates orange instead of green? Claude recommended green
  (done) with an optional orange accent; preview only if Andrew asks.

## Rules that bind this work
Site record is truth; record writes only on Andrew's word, through the page's own functions, in his name; Baseplan
files private and uncommitted; no crew names in commits; the edit key only in the environment; money-moving releases
need Andrew's word before upload; Codex builds and tests, Claude uploads and verifies bytes.
