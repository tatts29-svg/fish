# Source review, 30 Oct 2026: Baseplan SuperCars (11) against (10) and the site record

Author: Andrew Fisher · 30 Oct 2026 14:45 AEST · read only (no import, no page release, no record change). Live
page v12.61 (`ddd1bd7a…`), record 12157.

Andrew, 30 Oct 2026 14:2x AEST: "see attached the updated baseplan. we are still waiting on invoices so we can update
number on this contract 9990776".

| Source | Private file (not committed) | SHA256 | Size |
|---|---|---|---|
| Baseplan SuperCars (11), 19 contract sheets + Delivery Dockets | `6706bb57-Baseplan_SuperCars.xlsx` (staged as `Baseplan_SuperCars_11.xlsx`) | `6c812e40…` | 147,210 bytes |
| Compared with Baseplan (10), 29 Oct 14:31 | `09fa801a-Baseplan_SuperCars.xlsx` (`Baseplan_SuperCars_10.xlsx`) | `b98caacf…` | 146,273 bytes |

Method: the tools in `review_29Oct2026_baseplan9/` (`to_json.py`, `diff67.py`) on both exports; the record as read at
14:34 (runs 76–94, the departures of 26–30 Oct).

## The numbers

| | (10) | (11) | Change |
|---|---|---|---|
| Contract sheets | 19 + Delivery Dockets | 19 + Delivery Dockets | same contracts |
| Lines (keyed by contract and line) | 659 | 659 | 1 added · 1 gone · 170 changed (14 billing columns only) |
| Export rows | 661 | 659 | the two repeated rows on 9961265 (lines 43 and 44) are gone |
| Delivery Dockets | 258 | 258 | unchanged |
| **Billed Amount, all contracts (ex GST)** | 852,281.58 | **932,742.33** | +80,460.75: 9972648, 9961265, 9994248 and 9997711 now carry billed amounts |
| Prebill Amount still queued | 929,716.95 | 728,998.68 | 9968862 and 9961976 cleared to nought (invoiced); 9961265 +807.36; 9972648 −397.66; 9994248 cleared |
| Tot (inc. SD, DW & GST) | 1,005,285.81 | 1,094,732.31 | +89,446.50 |

**What (11) is.** The month-end billing run has happened since (10). Every contract now carries billed-to dates
(22 Sep to 13 Nov) and a Billed Amount; two contracts show nothing left to pre-bill — the buildings 9968862 (151,338.10
billed; the P29 and P53 fridges, cancelled buildings, correctly at nought) and the generators and lights 9961976
(48,739.96 billed, with one new pick-up charge of 839.07 still queued). That reads as those two invoices having been
raised. The VMS, barrier, 9994248 and 9997711 contracts are pre-billed and queued. Anything to correct on those goes to
the branch now, not after the 31st.

**Billed by branch (11), ex GST:** KINP 442,208.45 · STPS 417,133.67 · NVAC 48,739.96 · MEAD 24,660.25 = 932,742.33.
The page's charge to the V8s stands at 1,011,691.46 on the record today; the gap to Baseplan's billing is 78,949.13,
the same shape as the 29 Oct bridge (fencing 9990776 the bulk of it, then the 34 differing lines, the per-piece
labour and the transport legs with no contract line).

## 9990776 fencing: unchanged, as Andrew said

All 11 lines identical to (10): 335,180.04 billed to 13 Nov. The page charges Advanced's dockets at the 2026 card,
365,341.63 plus the race crew. Andrew: the number on this contract moves once Advanced's invoices are in.

## What moved, by theme

### 1. VMS 9961265 (STPS): re-rated to fixed amounts; two Premiair boards zeroed. Net +807.36 → 47,331.87

| Line | Board | (10) | (11) | Change | Note |
|---|---|---|---|---|---|
| 3 | VMS01 REED (construction) | 2,734.11 | 3,538.77 | +804.66 | Rate 1 now the fixed amount, not 53.61/day; Returned, termed 28 Oct 06:00 |
| 4 | VMS02 MARS | 3,645.48 | 3,431.54 | −213.94 | fixed amount |
| 5 | VMS03 | 2,787.72 | 3,002.60 | +214.88 | Returned, termed 28 Oct |
| 6 | VMS04 | 3,645.48 | 3,538.77 | −106.71 | |
| 7 | VMS06 | 3,645.48 | 3,538.77 | −106.71 | |
| 8 | VMS07 | 2,734.11 | 3,109.83 | +375.72 | Returned, termed 28 Oct |
| 9 | VMS08 colour | 2,787.72 | 3,646.01 | +858.29 | Returned, termed 28 Oct |
| 25 | VMS19 487T Premiair | 428.88 | **0.00** | −428.88 | Rate 1 set to 0; on our record on site 19–26 Oct, left 29 Oct 12:40 |
| 26 | VMS20 475T Premiair | 428.88 | **0.00** | −428.88 | Rate 1 set to 0; on our record on site 19–26 Oct, left 26 Oct 12:00 |
| 29 | VMS22 445T Premiair | 268.05 | 428.88 | +160.83 | start moved to 21 Oct 15:00 |
| 30 | VMS23 453T Premiair | 268.05 | 321.66 | +53.61 | |
| 32, 35, 37, 39 | VMS13, 15, 16, 17 (post-event, to 13 Nov) | 428.94 each | 428.88 each | −0.06 each | expected off-rental time 15:00 → 07:00 |
| 43 | VMS05a | 375.27 | **0.00** | −375.27 | Returned, termed 26 Oct |

The construction boards keep Andrew's 29 Oct ruling (the four that left 28 Oct are termed 28 Oct), but their amounts
are now keyed as fixed figures that differ from 53.61 × days in both directions. The two zeroed Premiair boards
(VMS19 487T, VMS20 475T) are real hires on the record, the same week as VMS22 and VMS23 which are still priced: a
question for the branch before the invoice goes.

### 2. Barriers 9972648 (STPS): every run now Off Rent with a term date. Net −397.66 → 31,044.52

| Line | Run | Baseplan (11) term | Our record (run 76 and earlier) | Money |
|---|---|---|---|---|
| 9 | WB14 | 25 Oct 18:00 | 25 Oct 19:00 | — |
| 10 | WB15 | 27 Oct 06:00 | 27 Oct 07:00 | — |
| 5 | WB04 | 27 Oct 08:00 | 27 Oct 09:00 | 184.08 → 168.74 (−15.34) |
| 18 | WB22 | 27 Oct 08:00, delivered 14 Sep (was 18 Oct), 4 barriers | not on the register | 4.72 unchanged |
| 13, 21 | WB18, WB17 | 27 Oct 14:00 | WB18 27 Oct 17:00 · WB17 27 Oct 19:30 | — |
| 11 | WB16 | 27 Oct 16:00 | 27 Oct 17:00 | — |
| 1 | WB01 | 27 Oct 18:30 | 27 Oct 19:30 | 637.20 → 608.88 (−28.32) |
| 2 | WB03 | **19 Oct 21:00** (was 29 Oct 18:00) | 29 Oct 19:00 (the 30 stored behind the T2 barriers from 19 Oct) | 1,451.40 → 1,097.40 (−354.00) |
| 14 | WB20 | 29 Oct 18:00; start 26 Oct; delivered 14 Sep (was 26 Oct) | never recorded as delivered (WB03's 30 put back out) | 247.80 unchanged |
| 15 | WB19 | **6 Nov 16:00, Off Rent already**; start 3 Nov; delivered 14 Sep (was 2 Nov) | not on site; S08 programme 3–6 Nov | 280.84 unchanged |
| 3 | WB02 | 25 Sep 16:00 (unchanged) | on site since 21 Sep, 34 barriers | 280.84 — Baseplan 1,083.24 under the record, still open |

Baseplan's term times run about an hour ahead of the record's departure times (ours are the times the trucks left).
WB03 is the one that moves money: Baseplan now ends it on 19 Oct, the night the 30 went into storage; the record has
them leaving the site on 29 Oct. Andrew's call (flagged 30 Oct 04:52: "WB03's departure stays 29 Oct unless he wants
19 Oct"). WB19 is keyed off rent at a future date (6 Nov) with a return docket already.

### 3. Generators and lights 9961976 (NVAC): invoiced; three generators and two forklifts termed 30 Oct

GN18 (line 11), GN01 (16) and GN19 (7) are Off Rent, termed 30 Oct 16:00, return dockets 26163672, 26163652 and
26163660; the two Coates forklifts (lines 35 and 37) Off Rent, termed 30 Oct 06:00, return docket 26161662. On our
record GN01 left 14:30 today (run 94), GN18 and GN19 were ticked Ready by Andrew at 14:16 and are still on site. GN03,
GN20, GN21, LT05/06 moved from Off Rent / Return Pending to Returned. Every line's amount went through to billing
unchanged from (10).

**New line 61: "Pickup Charge, 29 Oct 2026", 839.07, NVAC-FRI, Applied, return docket 26161066 (return 21973094),
still queued.** No line on the contract names the asset it belongs to, and the record has no generator or light
leaving on 29 Oct (that day's departures were VMS boards and WB03). To ask the branch: which pick-up is this?

### 4. Buildings 9968862 (KINP): invoiced, 151,338.10

Prebill cleared to nought on every line; fourteen lines went Off Rent → Returned under return number 21974155 (P69,
P25 and its fridge, P67, P65 and its fridge, P66 and its fridge, P60, P62 and its fridge, P63, P45) — the buildings
that left 28–29 Oct on the record. P34's padded chair termed 30 Oct 09:46. The P29 and P53 fridges (cancelled
buildings) billed at nought, correctly.

### 5. Toilets 9968955 (KINP): WC20 and WC86 keyed to 13 Nov, pick-up booked today

| Line | Unit | (11) | Our record |
|---|---|---|---|
| 47, 48 | WC20 toilet blocks | Off Rent, termed 13 Nov 16:00, billed to 13 Nov (3,227.41 each), pick-up booked 30 Oct | both blocks left 12:30 today (run 90) |
| 49, 50 | WC20 sewage holding tanks | Off Rent, termed 13 Nov 16:00, pick-up booked 30 Oct, no charge | still on site |
| 51 | WC86 accessible toilet (1296899) | Off Rent, termed 13 Nov 16:00, billed to 13 Nov (337.75), pick-up booked 30 Oct (was 13 Nov) | on site, no departure recorded |
| 111 | WC51 accessible toilet | Off Rent, termed 26 Oct 06:00 (unchanged) | — |

Baseplan bills WC20 and WC86 to the post-event date while booking their pick-up for today. For the revenue that is
Andrew's "Baseplan is what invoices on the 31st" rule; for the record, WC86: is it leaving today?

### 6. Small contracts

- **9994248 (STPS)**: lines 1–3 Delivered and billed (35 m temporary fence 612.50, 45 m crowd barrier 630.00, 24
  chairs 52.80, to 26 Oct); the transport line is now quantity 2 (delivery and pick-up, 500.00) and the separate
  "Pickup" quote line is gone. Billed 1,795.30.
- **9997711 (KINP)**: billed 289.06 (was unbilled).
- **9961265 lines 3 and 8**: booked pick-up date now 13 Nov although termed and billed to 28 Oct — a date field only.

## Against the page

v12.55 pinned every contract line that Baseplan (10) priced differently to the (10) figure. (11) has since moved:
the VMS lines above (net +807.36, the page now under Baseplan by that on those lines) and WB01, WB03, WB04 (net
−397.66, the page over). Nothing else the page pins moved in (11): every other change is a status, a term date or
the billing columns. WB02 stays as it was (page 1,364.08 against Baseplan 280.84). Re-pinning the page to (11) is a
data release on Andrew's word, after he settles WB03 and the two zeroed Premiair boards with the branch.

## For Andrew

1. **VMS19 487T and VMS20 475T at nought** — real hires 19–26 Oct; raise with the branch before the invoice, or confirm
   the nought is deliberate.
2. **WB03: 19 Oct or 29 Oct?** Baseplan now bills to 19 Oct (−354.00). The record says the barriers left 29 Oct.
3. **WB19 / WB20 / WB22** keyed delivered 14 Sep; WB19 off rent at 6 Nov already. The S08 question (WB02's 34 or
   WB19's) still stands.
4. **WC86**: leaving today, or staying to 13 Nov with the post-event boards?
5. **The 839.07 pick-up charge on the generators contract (29 Oct)**: which asset?
6. **9990776**: unchanged, waits for Advanced's invoices, as he said.
