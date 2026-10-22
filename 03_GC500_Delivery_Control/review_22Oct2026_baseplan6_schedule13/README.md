# Source review, 22 Oct 2026: Baseplan SuperCars (6, with the delivery dockets) and Schedule 13 against the record

Author: Andrew Fisher · 22 Oct 2026, 12:00 AEST

Status: **READ AND COMPARED — no import, no page release.** Live record 10509 (GET only for the comparison). One record
change came out of it, run separately: the Costs tab's Steps labour tick off P60, P62 and P63
(`../record_22Oct2026_steps_ticks/`). Andrew, 22 Oct 2026: "our data is truth"; "we charge for the works we do we cant
charge for things that have not been done"; "we should be able to work out pump outs from my data and what we have onsite".

| Source | Private file (not committed) | SHA256 |
|---|---|---|
| Baseplan SuperCars (6), 15 contract sheets + Delivery Dockets (258 rows) | `c4f013c9-Baseplan_SuperCars.xlsx` (22 Oct, the one with the dockets) | `4ca05a51…` |
| the same export a few minutes earlier, dockets not yet refreshed | `283702db-Baseplan_SuperCars.xlsx` | `1088a6e7…` (contract lines identical) |
| Compared with Baseplan (5), 16 Oct | `740be303-Baseplan_SuperCars.xlsx` | `a424e52d…` |
| GC500_26_Schedule_13.xlsx (Andrew's schedule, 22 Oct) | `c5aea3e7-GC500_26_Schedule_13.xlsx` | — |

Deliverable: **`GC500_Baseplan_vs_Record_22Oct2026.xlsx`** — Fix list; 9968862 buildings (one row a building);
9968955 toilets by reference; 9968955 service lines; 9961265 VMS boards; Charged before done; Access & plant; New /
Changed lines since 16 Oct; Dockets since 16 Oct. Built by `build_review.py` from the export, the schedule, the live
record (`/api/state`, view token) and the live page's own unit model (`financeScopes1013`, read-only), which is where
"our asset number" comes from. `evidence/counts.json` has the counts.

## What changed in Baseplan since 16 Oct

56 lines added, 4 gone, 67 changed; 54 dockets added. Three new contracts: 9994248 STPS (35 m temp fence, 45 m crowd
control, 24 stacking chairs, 20 Oct), 9994996 STPS (WFB install & removal labour $7,700 + transport $17,900, pending
from 23 Oct), 9994954 KINP (three 6 m shells, three fridges, two 200 kVA generators, 23–26 Oct, pending). The toilets
contract gained its nine servicing/labour/transport lines (141–149, $138,279.62, all Pending, dated 18 Oct). VMS gained
labour and transport (40–42) and the one-day VMS05a board (43–44). GN24's 80 kVA line went; the 60 kVA trailer line is
off rent 26 Oct. The two "Steps Toilet Block" lines went.

## The three contracts Andrew asked about — the short version

**9968862 buildings.** Baseplan charges one $655.83 labour package on 45 buildings (install + steps + levelling +
cleaning + fire extinguisher + demob) = $29,512.35. The record has 47 buildings on site with install, levelling, cleaning
ticked; steps on 40 (none on P06, P38, P39, P42, P60, P62, P63); a fire extinguisher on all 47 (recorded 20 Oct as an
accessory quantity, which is how the Costs tab charges it). At the card that is $29,730.96 — Baseplan is $218.61 under in
total, but on 45 buildings not 47, with steps on 45 not 40, and with demob in the package before it is done. Transport: Baseplan 72 small legs + 18 large; the
record ticks 76 + 18. Lines to fix: 93 is HRP's building (1189410), not P36 — P36 is 1282487 and has no line; 59 is P58's
building (1273656), labelled P44; AA (142514) has no hire line at all. (Line 64 P06 carried 1087453 against a site number of 1097453 until 12:08, when Andrew settled P06 as 1087453 and the record was changed: `../record_22Oct2026_p06_number/`.)
Demob ($6,558.30) and the return legs ($25,200) are charged before the work.

**9961976 generators** (added 13:00). `GC500_9961976_Generators_DayByDay_22Oct2026.xlsx`: a column a day from 28 Sep to 25 Oct
(standby rate to 22 Oct, full rate on 23-25 Oct) and a Labour & transport sheet, one row a set. 14 sets (GN20 off the
list on Andrew's word; GN24 the 60 kVA 1277089 from 19 Oct): hire $26,491.52, install + demob $4,205.64, transport both
legs $11,700. Baseplan: hire $20,450.61 with wrong sizes and dates on several lines, labour and transport on 15 sets
(GN20's 1276701, which never came) with demob and pickup charged before the work, GN24 line 49 Off Rent at $0.

**AA and HRP** (13:22): tracked only, each customer pays on its own contract (HS 9968926, HS 9974238); the Costs tab's charge
ticks came off both (`../record_22Oct2026_aa_hrp_tracking_only/`), the branch building list is 45 charged + 2 tracked, and
9968862 line 93 (1189410) comes off that contract.

**9968955 toilets.** The pump-out line (141) is 678 = 226 units × 3 nights. The servicing tracker has 231 FWF and 4
accessible units placed (= 705 services over Fri, Sat, Sun), and the by-reference sheet names where Baseplan's hire
list is short: PG01, PG03, PG05, PG29, WC42, WC53, WC81 missing; WC12 3 v 4; WC67 2 v 4; WC21 7 v 6; WC01 3 v 2. Tank
pump-outs (142: 6 tanks + 2 sixteen-pan × 3 = 24), sewer-connect cleans (143: 8 × 3 = 24), block install/demob (144: 16),
accessible (145: 4 × 2) and block/accessible transport (147, 148) agree with the record. FWF install/demob and transport
(146, 149) are on 222 FWF; the record has 231 — and whether the Event Portables units carry a Coates transport charge is
Andrew's call. None of the 678 services has happened yet: the count to invoice is the tracker's ticks after each night.
Two asset numbers on Baseplan are on no unit of ours (WC21 1083399, WC07 1317643).

**9961265 VMS.** 24 boards agree. Fix: line 28 VMS21 has no fleet number (97T, rego T16922). Lines 32–39 VMS13–17 start
19 Oct; the dockets put 13/14/15 out on 16 Oct (26134263) and the record has all five in on 16 Oct. Line 31 VMS24 starts
19 Oct but its docket is 22 Oct (26143911, today's delivery with VMS21 and VMS22) — and our record says 21 Oct for
VMS22 and VMS24, which Andrew's word today overrides. Line 43–44 VMS05a 1211356 (20–21 Oct, $107.22 + $289.52 delivery)
is a board our record has never seen. Labour 24 × $176.97 is the card's figure; transport 48 × $150 and 8 site shifts ×
$150 are Baseplan's figures (the card says POA). Our gap: VMS10's fleet 120T is not on our register.

**Access & plant.** The Phillip Park and Macintosh forklifts (11 and 14 Sep) are Coates' own for the build (schedule
customer "Coates"), on 9961976 at $0 — right. Customer machines: Supply forklift 9987005 line 1 1272166 at $150/day from
5 Oct, but the schedule says 1210921 ex Eagleby went to Supply on 6 Oct and 9961976 line 27 now has 1210921 pending from
21 Oct at $0 — which forklift is at Supply, and since when? The 2.5T STD for Events on 12 Oct (schedule 1274555, our
T0109 1214298) has no Baseplan line. 1281615 (13 Oct, 9987005 line 7, $185.40/day) agrees. Broadcast: 5t RT 1321364 and
2.5t RT 1298390 start 17 Oct on Baseplan, dockets 16 Oct; scissor, knuckle and straight booms agree (straight boom's rate
changed 459.55 → 310.95).

## Charged before the work is done

$256,174.16 sits on pending charge lines dated 16–23 Oct; $85,572.93 of it is work done at 22 Oct and $170,601.23 is
demob, return transport, race-night servicing and the WFB removal still to come. The sheet "Charged before done" splits
each line.

## Still to answer (Andrew)

1. Which forklift is at Supply (1272166 5t from Mead, or 1210921 3.5t), and from when?
2. VMS05a 1211356 for one day — real, or a wrong entry?
3. VMS transport at $150 a leg and 8 site shifts — agreed figures, or to be set from the card (POA)?
4. Transport on the Event Portables FWFs — charged to the customer at the Coates $47.50 a leg, or inside the rehire?
5. VMS22 and VMS24: on site 22 Oct (today's dockets), not 21 — change our record?
