# v8.71 — the 6 Oct Baseplan export and Schedule 4 on the page (READY)

Author: Andrew Fisher · 6 Oct 2026

Andrew (6 Oct, Claude chat), with `Baseplan_SuperCars.xlsx` and `GC500_26_Schedule_4.xlsx`: "Please review and Update and go Live when done".

Base: live v8.70 `b6475604`. Candidate SHA-256 `4cf2b81951057498e4fe3506295d990ef05719fbc736b8c4eb16f6819f91334c`, 11,091,670 bytes (rebuilt after Andrew's word below; supersedes `7b72f561`). Claude built and tested it; Codex publishes it and reads it back.

## What changed on the page

### 1. Contracts: the 6 Oct Baseplan export replaces the 24 Sep one

The page's contract source (`DATA.rental_on_hire`) was the 24 Sep export plus Codex's 1 Oct accessory supplement. It now reads the 6 Oct export:

- **11 contracts, 321 lines**, up from 10 and 308.
- **15 lines added:**
  - New contract **9987005-MEAD** (5 lines): the 5 t forklift 1272166 (delivered 5 Oct), fork extension 1262224, event forklift 1214298, and two transport charges.
  - Two VMS boards on SUB-2631 (VMS22/23, Premiair).
  - Forklift 1272166 on 9968726 (event week).
  - P08's building shell and fridge.
  - Two toilet-block step sets.
  - WC01 FWF 172824.
  - Two cleaning fees.
- **2 lines gone:** VMS 1191889 (9961265/10) and the 80 kVA generator 1276416 (9961976/40). That generator is now line 7, as GN19.
- **88 lines changed:**
  - 66 status moves, mostly to Delivered or Del Req, with 49 new dockets and 37 booked dates.
  - 32 asset numbers.
  - **12 VMS lines moved to sub-hire.** The item code is now SUB-17093 or SUB-2631 and the code KINP-SUB, so they count as Rehire. Their terms are now 19–28 Oct, where they were 7 Sep–13 Nov.
- **29 lines re-joined to their reference.** Each joins by Andrew's recorded number first (see "Andrew's matches win"), then by a number the register alone holds, then, for a line with no plant number, by its delivery docket:
  - WC01, WC02, WC04, WC06, WC11, WC12, WC27, WC50 and WC60 follow Andrew's numbers.
  - P13, P15, P41, P44, P46 and P51 follow Andrew's numbers, and GN01 follows his 1276507.
  - GN19 and GN04 follow Schedule 4's numbers.
  - WC20, WC86, P52, P57, the Helen Park container (T0258) and the 8 Oct VMS pair (T0103) follow their dockets.
- **The source's own rules apply.** A delivered or returned line is on hire from its booked delivery date. Demob is the booked pick-up date. A rate of 0 is no rate. An item code starting SUB is sub-hired. The reference at the head of a description is never evidence.
- **Lines whose number did not change keep their join.** The patch's `what` rule reproduces the source's own on all 308 earlier lines.

### 2. Schedule 4 on the register (against Schedule 3)

- **Transport costs (TPORT COST) on the Week 3 and Week 2 loads.** These are carrier charges Coates pays:
  - P06, P38, P39, P42, P08, P46, P51, P55, P56: $290+ each.
  - WC01 accessible $570+; GN20 $570+; GN21, GN23, GN03 $290+ each.
  - WC60 $290+ + $580+; WC20 $580+ and $290+.
  - P52 and P57 $652.37+ each; P54 $310.70+; the Helen Park container $275.40+.
  - "na" rows (no separate carrier charge) count as $0.
- **Four new fencing semi loads** to Phillip Park: 30 Sep and 1 Oct (2 semis, $1,152.62+ each); 2 Oct and 6 Oct (1 semi, $576.31+ each).
- **Dockets, carriers and load times** written where the register had none.
- **Generator numbers as Schedule 4 names them:**
  - GN01 1276507 (as Andrew recorded on 6 Oct)
  - GN04 1277400 (ex EAGS)
  - GN13 1261271
  - GN18 1261273 (ex REED)
  - GN19 1276416 (80 kVA, ex EAGS)
  - GN25 1244536 (ex NVAC)

## Andrew's matches win

Andrew (6 Oct, after the first candidate): "Just a fyi good chance baseplan and spreadsheet allocation of asset numbers are wrong. What i have matched up and cimpleted is correct."

So the asset numbers Andrew has put on each reference are the authority. The patch carries them as the record held them at version 4126 (6 Oct 13:56 AEST): 24 references, no number on two.

- A number of his comes off any other reference the schedule gave it to. That happens on P13, P51, P58 and P65.
- A contract line carrying his number joins his reference, and no other.
- Baseplan writes some numbers on two lines: 1189410, 1189412, 1211404, 1272166 and 1327213. Where that happens, only the delivered line follows the number, and the other keeps its own join.
- A numbered line never joins by docket; only lines with no plant number do.

On v8.70, 10 numbers on the files contradicted his record. On v8.71 none do. The transport forecast's holds for P41/P65 (a shared number) clear, and no new hold appears for WC01, WC42, WC50, P06 or P52.

## Money, live v8.70 against v8.71, on record 4126

| | v8.70 | v8.71 | Change |
|---|---|---|---|
| Revenue on the record | $622,429 | $593,925 | −$28,504 |
| of which contracts | $277,016 | $248,512 | −$28,504 |
| of which subhired (Rehire Revenue) | $1,437 | $6,959 | +$5,522 |
| Transport still to come (revenue) | $108,690 | $109,690 | +$1,000 |
| Revenue to job end | $1,008,055 | $980,552 | −$27,504 |
| Costs to date | $275,238 | $286,947 | +$11,709 |
| Costs to job end | $503,237 | $505,959 | +$2,723 |

**Why contracts fall.** The 12 VMS boards were hired 7 Sep–13 Nov on the old export and are now 19–28 Oct sub-hires, about −$41,000. Partly offsetting it is about +$13,600 from the new MEAD contract and lines.

**Why costs rise.** The Schedule 4 loads add $11,709 to date, and the transport forecast for those same loads comes off.

**Transport still to come.** It rises by $1,000: P41 and P65 are no longer held, and T0109's estimate is held now that the new MEAD contract carries its own transport.

## For Andrew to settle (the page holds these; it does not guess)

1. **Five numbers sit on two priced lines in Baseplan.** Each is either two machines with one misnumbered, or one machine charged twice.
   - **1272166, forklift:** 9987005/1, delivered, 5–30 Oct; and 9968726/10, 19–27 Oct. You have it on T0085, so the delivered line follows it.
   - **1211404, VMS:** line 1, on hire since 7 Sep; and line 12, VMS09, 8–27 Oct.
   - **1327213:** P04 (line 7) and P46 (line 94).
   - **1189412:** P41 (line 63) and the P65 booth (line 110).
   - **1189410:** P36 (line 93) and the P67 booth (line 108).
2. **VMS:** 19–28 Oct, sub-hired from Premiair and RPM. Is that the final plan for all 12 boards? The rehire cost is not on the record yet.
3. **MEAD transport charges** (9987005 lines 3 and 5, quantity 2): they carry a price but no rate. Confirm the figure.

## Inputs (private, bound by SHA-256)

The two workbooks carry contract rates, so they are not in this public repository in the clear. `inputs_v871.zip.enc` is AES-256-CBC with PBKDF2 (300,000 iterations), salted, and uses **the same password as the 2 Oct signed papers**, which Andrew gave Codex directly.

| File | SHA-256 |
|---|---|
| `inputs_v871.zip.enc` | `3ecc0570d786e1180d7b1f213011712a69b10c9aadb6b704d51eddc0a7195e96` |
| Baseplan_SuperCars_2026-10-06.xlsx | `5f9e83aa63a76c31bc974d85d963800d7872191ffc18ef4e9ee255339aece090` |
| GC500_26_Schedule_4.xlsx | `129d27290d6a86aa44dc3a933eca41086f7005e7138919fad20087a077c985c7` |

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in v8.71_baseplan_schedule4_DRAFT/inputs_v871.zip.enc -out /tmp/inputs_v871.zip   # asks for the password
unzip -d /tmp /tmp/inputs_v871.zip && (cd /tmp/inputs_v871 && sha256sum -c SHA256SUMS)
V871_BASEPLAN=/tmp/inputs_v871/Baseplan_SuperCars_2026-10-06.xlsx V871_SCHEDULE4=/tmp/inputs_v871/GC500_26_Schedule_4.xlsx \
  toolchain/build.sh v8.71 v8.71_baseplan_schedule4_DRAFT/patch_v871.py      # -> 4cf2b819...
```

Every change the patch made is listed in `evidence/changes_v871.json`.

## Checks on the candidate (fresh cache, every write aborted)

| Check | Laptop | Phone |
|---|---|---|
| `tests/test_v871.cjs` (new) | 12/12 | 12/12 |
| Numbers against Andrew's record (4126) | 0 contradictions (v8.70: 10) | |
| v8.70 supplier | 17/17 | 17/17 |
| v8.69 allocation | 17/17 | — |
| v8.66 Finance handover | 24/24 | 24/24 |
| v8.62 finance preservation | pass (1366) | pass (390) |
| Route sweep | 15 tabs, 0 errors, 0 blocked | 15 tabs, 0 errors, 0 blocked |

On live v8.70, `test_v871.cjs` passes only 4/12, so it detects the release.
