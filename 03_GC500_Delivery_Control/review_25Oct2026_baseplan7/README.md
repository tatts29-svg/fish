# Source review, 25 Oct 2026: Baseplan SuperCars (7) against the site record and the P&L

Author: Andrew Fisher · 25 Oct 2026

Status: **READ AND COMPARED — no import, no page release, no record change.** Live record 10816 and live page v12.10.1
(`4e53b9dc…`), read only. Andrew, 25 Oct 2026: "Remember what i have onsite is truth and when it turned up. now we need
things to match up correctly and sign to correct branch so align to P&L".

| Source | Private file (not committed) | SHA256 |
|---|---|---|
| Baseplan SuperCars (7), 15 contract sheets + Delivery Dockets (258 rows) | `535e04ad-Baseplan_SuperCars.xlsx` | `0cf90af6…` |
| Compared with Baseplan (6), 22 Oct | `c4f013c9-Baseplan_SuperCars.xlsx` | `4ca05a51…` |

Deliverable: **`GC500_Baseplan7_vs_Site_25Oct2026.xlsx`**. Its sheets:

| Sheet | What it holds |
|---|---|
| Fix list | Every change, sorted: branch codes, missing lines, hours, rates, quantities, removals, numbers, start dates that change a charge. Each row says who acts: Baseplan (the branch), Our record, Decision or Ask Andrew. |
| Every line | All 376 lines, each with the reference it matches on site, the day that turned up, and the P&L branch. |
| Toilets by reference | Toilet hire per reference against the site count. |
| Water barriers | Barrier counts per reference against the site count. |
| Charge lines | Labour, transport and servicing quantities against the counts the P&L charges. |
| Event labour | The C004 scope hours and branches against the lines. |
| Fencing (9990776) | The 9990776 lines against the signed dockets. |
| Generators | Each set's Baseplan rate against the P&L charge. |
| On site, no line | Units on site that no line carries. |
| Branch tie-out | What each branch's Baseplan has to move by to reach the P&L, split between fixes and decisions. |
| Start dates | Every start against the day the item turned up. |
| Since 22 Oct | What changed between (6) and (7). |
| Arrivals vs dockets | Our record's arrival days and numbers against Coates' own delivery dockets: what to correct, what to confirm. |

How the comparison works:
- The site record and the P&L are read from the live page's own models, read only: `financeScopes1013`, `deliveryOf` (first on-site stamp), the VMS model, `ONHIRE_ROWS` with `contractCharge`, `servicing748`, `scopeFigures` and the fencing dockets.
- Scripts:
  - `dump_site.cjs`, `dump_lines.cjs`, `dump_service.cjs`, `dump_vms.cjs`, `dump_fence.cjs` read the page;
  - `to_json.py` and `diff67.py` read the export;
  - `build_review7.py` builds the workbook;
  - `dump_fence_detail.cjs` and `fencing_source.py` trace where the 9990776 quantities come from;
  - `arrivals_check.py` checks our record against Coates' delivery dockets. Run it before `build_review7.py`.
- `evidence/summary.json` has the counts.

## What changed since 22 Oct

32 lines added, 18 gone, 75 changed.

- **New contract 9994954 KINP (the concert):**
  - P38, P39 and P42 with their fridges, moved from 9968862;
  - GN26 and GN27 (200 kVA) with cable, sync labour and transport, moved from 9961976 NVAC;
  - WC09 (two blocks, 10 FWF) and WC10 (3 FWF), moved from 9968955;
  - six pee panels;
  - 4.5 h each of gen tech and toilet tech.
- **Toilets 9968955:**
  - added PG01, PG03, PG05, PG29, WC42, WC53 (3) and WC81, plus WC12's fourth FWF;
  - WC21's 1083399 gone;
  - new lines for 16-pan install and demob, and waste-tank transport;
  - PM hours (50%) and toilet event hours;
  - accommodation and meals, 50%, $13,850.
- **Buildings 9968862:** install and demob is now 38 with steps plus 4 without; accommodation 50% $13,850; PM event hours.
- **NVAC 9961976:** gen tech event hours added.
- **VMS 9961265:** line 44 is now the event labour, 65 h.

## Where it already agrees (the 22 Oct fixes went in)

- **Toilets:**
  - FWF and accessible pump-outs, 702 = 234 units × 3 nights, match the P&L to the cent ($51,154.74);
  - every install, demob and transport count matches the units on site (blocks 12, 16-pan 2, accessible 4, FWF 217, waste tanks 6, concert 2 blocks and 13 FWF).
- **Buildings:**
  - 45 charged on site (AA and HRP tracked only) = 38 with steps + 4 without on 9968862, + 3 on 9994954;
  - transport 66 + 18 + 6 legs.
- **VMS:** labour 24 boards, transport 48 legs.

## What needs to change, by branch (the fix list has every line)

| Branch | P&L, job total | Baseplan to move (fixes) | Waiting on a decision |
|---|---|---|---|
| KINP | $414,788.80 | +$14,696.33 | −$8,598.40 (accommodation) |
| NVAC | $85,964.01 | +$3,418.40 | +$28,671.82 (Coates forklifts) · −$600 (transport legs, ask) · −$6,593.52 (GN20's line and labour, ask) |
| STPS | $503,580.90 | +$115,865.98 | — |
| MEAD | $18,628.72 | $0 (plant start dates to confirm) | — |

**Branch codes ("sign to correct branch"):**
- **9994954 lines 10–14 and 25:** GN26 and GN27, their cable, sync labour, transport and the 4.5 h of gen tech are coded KINP. In the P&L, generators and gen tech are NVAC, so code them NVAC.
- **Decision, 9961265:** the Premiair VMS boards (lines 13, 15, 24–26, 28–30) are coded KINP-SUB and VMS24 (line 31) NVAC-SUB. The P&L carries every VMS board on STPS. The sheet's own notes name the sub-hire account each code follows, so either recode STPS-SUB and book the Premiair cost to STPS, or keep the codes and the P&L moves.
- **Decision, 9974042 line 2:** the refrigerated container is coded STPS-SUB; the P&L has it on KINP.
- **Our record:** T0085 and T0109 are tagged NVAC, but their contract lines (9987005) and the P&L hire are MEAD.

**Missing from Baseplan:**
- water at what Event Portables charge us, $13,950;
- the fence team's event labour, 213 h, $19,412.82;
- the WCTV block's cleans, $780.75;
- fence blocks, $652.32;
- fencing labour, $1,207;
- FR01 and FR02, the broadcast fridges;
- WB07's 17 barriers.

**Fencing (9990776) against the signed dockets:**

| Category | Signed dockets | Baseplan |
|---|---|---|
| Fence, no scrim | 13,270 m | 8,888 m |
| Fence with scrim | 3,977.5 m | 2,775 m |
| Demarcation CCB | 5,062.5 m | 4,603 m |
| Crowd control barrier | 2,195 m | 2,350 m |
| Flat feet | 270 | 220 (and the rate is $7.51, not the card's $9.65) |
| Pedestrian gates | 22 | 32 |
| Relocation | 137.5 m so far | 1,520 m |

- The categories tie to the P&L's $405,150.96 to the cent.
- Baseplan, at its own rates, is $309,106.83. Corrected 25 Oct: the first workbook priced the 110 m with hoarding at $16.16 instead of its own $23.59 and showed $308,289.53. The fix list and the branch tie-out were already right.
- Demob weeks are still to come.

**Where Baseplan's fencing numbers come from.** Andrew, 25 Oct: "where is baseplan getting numbers from have not seen the new dockets is that why". `fencing_source.py` → `evidence/fencing_source.json`.
- **Not from the dockets, old or new.**
  - 9990776 is one block of Pending lines keyed for the event week (19–26 Oct, weekly rate).
  - The fence quantities are the same in (4) 15 Oct, (5) 16 Oct, (6) 22 Oct and (7). No one has changed them since the contract first appeared.
- **No docket date gives them.** Baseplan has more crowd control barrier and more ped gates than every signed docket to date: 2,350 m against 2,195 m, and 32 against 22. It has less fence, scrim and demarcation.
- **The early dockets alone are more than the contract.**
  - The 116 dockets worked to 15 Oct come to $332,558.49 at the card. That's more than the whole contract.
  - The 51 dockets since (16–23 Oct) add $72,592.34.
- **Not the 2026 fencing programme (9 Oct) either.** It's close, but no category matches. Build and event weeks:
  - clean 8,458.5 m, scrim 3,554.5 m, demarcation 5,168 m;
  - CCB 2,375 m, flat feet 256, ped gates 33, hoarding 137 m.

  The lines read as an estimate keyed in once.
- **Not copied from our page.** On 16 Oct, the day after (4), our page had:
  - 10,335 m clean, 1,427.5 m scrim, 4,315 m demarcation;
  - 885 m CCB, 135 flat feet, 17 ped gates, 137.5 m relocation.

  That's the page's 58 embedded dockets plus the 53 on record 7185, none counted twice. Baseplan's 2,350 m CCB, 32 gates, 1,520 m relocation and 110 m hoarding appear nowhere in our data.
- **The export's Delivery Dockets sheet is Coates' own truck dockets**, not Advanced's fencing dockets.
  - It's unchanged since 22 Oct: 258 rows, last 22 Oct.
  - Its one row on 9990776 is delivery 26138423 (19 Oct, out): the ten WB13 water barriers on line 1.
- **Same rates as the P&L's card, except flat feet** ($7.51 against $9.65). Scrim is split $16.16 fence + $9.37 shade cloth = $25.53, which is the P&L's scrim rate. So the gap is quantities.
- **To fix:** the branch (STPS) re-keys 9990776 from the signed docket totals on the Fencing sheet. Demob relocation follows.

**Hours keyed as hours:minutes:** 27.15 h is 27 h 15 min (27.25 h) and 15.22 is 15 h 22 min (scope 15.375 h). VMS event labour is 65 h against the scope's 65.33 h.

**Rates:**
- **Light towers:** three event days at the card ($192.99); Baseplan has $643.30 and $385.98.
- **Generators:** the standby rate from the day they turned up, then the daily rate for 23–25 Oct. Net +$6,040.92 over 14 sets; per set on the Generators sheet.

**Remove:**
- PG29 (9968955 line 154). It's on Tickford's own hire schedule.
- **Ask Andrew first:** GN20's 365 kVA (9961976 line 6, $6,260.40) and one of the two large-set labour lines (line 52). On 22 Oct Andrew said it never came to site, but Coates' docket 26102821 has it out on 30 Sep (see the arrivals check below).

**Numbers:** WC07 line 38 carries 1317643 and our record has 1317743. Coates' delivery docket 26081411 also says 1317643, so ours is the likelier slip. Check the unit and correct our record, not the line (corrected 25 Oct; the first workbook had it the other way round).

**Start dates that change a charge:**
- **VMS:**
  - VMS14–17 went in 16 Oct, not 19 Oct;
  - VMS22 and VMS24 went in 22 Oct.
- **Generators:**
  - GN26 and GN27 went in 12 Oct, not 23 Oct;
  - GN06 went in 15 Oct, not 19 Oct.
- **Barriers:** WB03 went in 23 Sep, not 18 Sep.
- **Plant (to confirm):** some machines changed on the same reference.

147 more start dates are record-only. Those items are charged over the event; see the Start dates sheet.

**For our own P&L:** the two 16-pan blocks at WC31 are pumped out every night. Baseplan line 142 charges them as tank pump-outs; the P&L counts them as sewer-connect cleans. That's +$2,186.10 to the P&L.

## Our record against Coates' own delivery dockets (Andrew, 25 Oct)

Andrew: "what else needs to be fixed we just want to make sure what we have is right as we are truth when things turned
up". `arrivals_check.py` → `evidence/arrivals_check.json` and the **Arrivals vs dockets** sheet. The site record stays
the truth. Where a Coates docket disagrees, it's raised as a question; nothing on the record changes without Andrew's word.

**Agrees:**
- 38 references turned up on the day their docket says.
- On 51 more, our date is earlier than the docket. The branch closes dockets a day or more after the truck has been: a batch is dated Mon 12 Oct for things on site 6–8 Oct, and Tue 15 Sep for 14 Sep.
- 13 of the 14 barrier dockets match the day a barrier reference went in.
- 22 VMS boards agree, or their docket is later.

**Numbers to correct on our record.** Coates' docket (and Baseplan where it has a line) agree with each other, and ours is out by a digit or a label:
- WC07: 1317743 should be 1317643 (docket 26081411; Baseplan line 38).
- P66 fridge: 131190 should be 1311990 (docket 26126001).
- P33 fridge: 1238952 should be 1328952 (docket 26064103). Both fridges were flagged on 15 Oct and are still on the record.
- P05's 1127574 is labelled Aircon; the docket says it's the boiling-water unit.

**One number on two references:**
- 1189908 is an air conditioner on both P41 and P62.
- 1197839 is a forklift on both FL02 and T0004.
- 1211404 is the VMS board on T0001 (as vms5) and on VMS09.
- P46 still lists three fridges recorded elsewhere: 1328957 (moved to P54, 14 Oct), 1311992 (P26) and 1283996 (P28).

**Arrival days to confirm, where the docket is earlier and the day changes a charge:**

| Item | Docket | Ours | Note |
|---|---|---|---|
| GN20 1276701 (365 kVA) | 26102821, out 30 Sep | taken off 20 Oct | Andrew, 22 Oct: "never came to site". Baseplan has the line Delivered on that docket, and our record holds a photo filed under GN20/1276701 at 14:14 on 30 Sep. Line 6 ($6,260.40) and its labour (line 52) are now Ask Andrew, not Remove. |
| FL02 (1197839) and FL01 | out 11 Sep | 25 Sep | Only matters if the Coates forklifts are charged (decision 1). |
| EQ0005 fork extension | 13 Oct | 23 Oct | Baseplan 5 Oct. |
| EQ0001 scissor lift | 19 Oct | 22 Oct | Baseplan 19 Oct. EQ0001–3 were stamped within 4 seconds at 04:26 on 22 Oct. |
| EQ0002, EQ0003 | 21 Oct | 22 Oct | |
| WB03 barriers | 18 Sep, names WB03 | 23 Sep | Baseplan 18 Sep. |
| VMS13 | 16 Oct (with VMS14/15) | 19 Oct | |
| VMS09 (1211404) | out 7 Sep with the first boards; in and out again 12 Oct as VMS09 | 8 Oct | Our record has it as vms5 on T0001 first. Check it's charged once, from 7 Sep. |
| T0085, T0109 | 6 Oct, 13 Oct (their current machines) | 28 Sep | Same days as Baseplan. Our stamps went in 20 seconds apart at 03:45 on 28 Sep. If earlier machines were on those references, they need their own lines (decision 5). |

**Record-only days (charged over the event):** T0243, the WC-TV block, has no arrival on our record; the docket says 23 Sep. WC06's docket is 15 Sep against our 23 Sep.

**On Coates' dockets, not on our record:**
- P05 microwave 1320150, CP1 fridge 1116687 and urn 119810, P09 boiling-water unit 1254390.
- The laserplane 1065384 on 9987005 (16 Oct).
- WC21's 1083399. Baseplan has taken it off too, so that one agrees with us.
- Two pairs of fridges are on opposite buildings to the docket: P38/P39 (and 1272737 is called an aircon on P39) and P46/P51. Numbers only; the count is the same.

## Decisions for Andrew

1. **Coates forklifts** (9961976 lines 21, 25, 26, 27, 31, 34, 35) are at $0 on Baseplan. The P&L charges $28,671.82 for them from the card. Are they Coates' own (no charge, so the P&L comes down) or charged to the V8s?
2. **Accommodation and meals:** Baseplan has 2 × $13,850 = $27,700. The C004 scope (row 68) has $19,101.60. Which stands?
3. **Premiair VMS and the refrigerated container:** recode to the branch the P&L uses (STPS, KINP), or keep the sub-hire branch codes and move the P&L?
4. **Generator transport, line 53:** 10 legs at $300. The four sets up to 30 kVA need 8. Was there a swap?
5. **Plant start days:** the Supply forklifts and 2.4 m fork extension (9987005) and the broadcast scissor lift (9992300 line 4).

Once these are settled, Baseplan (7) can come onto the page so the P&L reads the same lines, with the site record kept, and the branch split matches line for line. The page still charges from Baseplan (4), 15 Oct.
