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

How the comparison works:
- The site record and the P&L are read from the live page's own models, read only: `financeScopes1013`, `deliveryOf` (first on-site stamp), the VMS model, `ONHIRE_ROWS` with `contractCharge`, `servicing748`, `scopeFigures` and the fencing dockets.
- Scripts:
  - `dump_site.cjs`, `dump_lines.cjs`, `dump_service.cjs`, `dump_vms.cjs`, `dump_fence.cjs` read the page;
  - `to_json.py` and `diff67.py` read the export;
  - `build_review7.py` builds the workbook;
  - `dump_fence_detail.cjs` and `fencing_source.py` trace where the 9990776 quantities come from;
  - `arrivals_check.py` checks our record against Coates' delivery dockets. It's parked on Andrew's word and not used by the workbook.
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
| NVAC | $92,804.84 | +$5,198.83 | +$28,671.82 (Coates forklifts) |
| STPS | $439,301.67 | +$51,589.58 | — |
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
| Fence, no scrim | 9,292.5 m (the papers' 13,270 m less the 3,977.5 m under the scrim) | 8,888 m |
| Fence with scrim | 3,977.5 m | 2,775 m |
| Demarcation CCB | 5,062.5 m | 4,603 m |
| Crowd control barrier | 2,195 m | 2,350 m |
| Flat feet | 270 | 220 (and the rate is $7.51, not the card's $9.65) |
| Pedestrian gates | 22 | 32 |
| Relocation | 137.5 m so far | 1,520 m |

- **The fence under the scrim is charged once** (Andrew, 25 Oct: "we charge once"; live in v12.16). The categories come to the P&L's $340,871.73, which was $405,150.96 before that.
- Baseplan, at its own rates, is $309,106.83, so it is short $31,764.90 against our dockets. Corrected 25 Oct: the first workbook priced the 110 m with hoarding at $16.16 instead of its own $23.59 and showed $308,289.53. The fix list and the branch tie-out were already right.
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
- **To fix:** the branch (STPS) re-keys 9990776 from the signed docket totals on the Fencing sheet.
  - Line 3 takes 9,182.5 m of fence with no scrim, keeping line 5's 110 m with hoarding if it is there; our dockets have no hoarding of their own.
  - Lines 6 and 10 take 3,977.5 m each.
  - Demob relocation follows.

**Hours keyed as hours:minutes:** 27.15 h is 27 h 15 min (27.25 h) and 15.22 is 15 h 22 min (scope 15.375 h). VMS event labour is 65 h against the scope's 65.33 h.

**Rates:**
- **Light towers:** three event days at the card ($192.99); Baseplan has $643.30 and $385.98.
- **Generators:** the standby rate from the day they turned up, then the daily rate for 23–25 Oct. Net +$6,040.92 over 14 sets; per set on the Generators sheet.

**GN20, the 365 kVA (1276701), is on site.** Andrew, 25 Oct: "i made a error the gn20 is here sorry". That corrects his "never came to site" of 22 Oct.
- Baseplan is right to have it: 9961976 line 6, Delivered from 30 Sep, $6,260.40. Its labour line 52 (two large sets, GN20 and GN23) is right too.
- Large-set transport, line 55, needs 4 legs at $600, not 2 (+$1,200).
- **Back on our record and the P&L.**
  - It's GN20-A on our record, on site 30 Sep, number 1276701 (`../record_25Oct2026_gn20_back/`, record 10848 → 10870).
  - v12.16 (live 25 Oct 14:18) put line 6 back on hire on GN20-A.
  - NVAC's P&L is up $6,840.83: the card's 315 kVA standby rate (the next size down from 350 kVA) for 14.5 days.
  - So line 6's rate now shows on the fix list like every other set: Baseplan $6,260.40 against the P&L's $6,840.83.

**Remove:**
- PG29 (9968955 line 154). It's on Tickford's own hire schedule.

**Numbers:** WC07 line 38 carries 1317643; our record has 1317743. Our record stands, so the line changes.

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

## Coates' delivery dockets: parked (Andrew, 25 Oct)

Andrew: "im not to worried about doeckets remember our is truth im only really woried about baseplan baseplan is what
is being charged". Our record is the truth, and this review only asks what Baseplan must change to match it.
- The cross-check of our record against the dockets is kept in the folder but not in the workbook: `arrivals_check.py` and `evidence/arrivals_check.json`.
- One thing came out of it on his word ("yes onsite please add"): the P05 microwave, the CP1 fridge and urn, the P09 boiling-water unit and the laserplane (EQ0006) are now on our record. See `../record_25Oct2026_accessories_laserplane/`.

## Fencing: what we charge the V8s, what we pay Advanced, and their invoices (25 Oct)

Andrew asked:
- "what we pay and then what we charge so i can show gow we got this figure $405,150.96";
- then "just want to make sure what ever we have receievd for from their invoices have matched correctly i just want us to work out what we charge the v8s but also know via break down of what we pay advance based off everything we have".

Then Andrew ruled "we charge once" (see below), asked for the table as "item the total then rate we pay advnanced then the rate we charge v8s then the total", and asked to "update all costs and P&L with our data". v12.16 (live 25 Oct 14:18) did that.

Workbook: `GC500_Fencing_Charge_and_Cost_25Oct2026.xlsx` (Summary, By week, Dockets, Labour notes and extras), section 1 in his order. Built by `fence_pay_charge.py` from three read-only dumps of the live page (v12.16): `dump_fence_pay_charge.cjs`, `dump_fence_split.cjs` and `dump_fence_invoices.cjs`. Summary figures: `evidence/fence_pay_charge.json`. Every figure is the page's own pricing and ties to it to the cent.

- **We charge the V8s $340,871.73:** 167 signed red-book dockets, 9 Sep to 23 Oct, at the 2026 street card or Andrew's named rates, with the fence under the scrim charged once. It was $405,150.96 before.
- **We pay Advanced $255,218.20:**
  - the dockets at Advanced's approved sheets (weeks 1–5) or their rate sheet (week 6, event week): $234,136.70;
  - plus team leader days and materials on the orders: $12,564.00;
  - less two receipted invoices that came in under the sheet rates: −$2,527.50 (the order stands, the project manager, 23 Oct);
  - so $244,173.20, the fencing cost on the page;
  - plus the labour notes: $10,850.00;
  - plus invoice 93920, a partial collection on order 4658850: $195.00. It is in no docket and not in the page's fencing cost.
- **Margin:** $85,653.53 (25.1%).
- **Advanced's invoices and sheets against our record:**
  - Weeks 1–4: their approved sheets equal the orders to the cent. Week 4 is receipted (4926209).
  - Week 5: the sheet is 50 cents over the receipted order; the order stands. Docket 36524 (17 Sep, $1,375 at their rates) is on our record, charged to the V8s, and on none of their sheets.
  - Week 6: invoiced at $8,992 with no sheet, so it can't be checked line by line. Our 6 dockets come to $10,144 at their rates; the order stands.
  - Week 1: labour note 24479 ($50) is not on the sheet.
  - Week 3: their sheet prints the order as "464517". The page pairs it with week 3's 4647515, not week 4's 4647517.
  - Event week and demob: nothing billed yet. The event week is about $40,943.70 at their rates, with the scrim netted out the way they bill it.
- **The scrim fence is charged once** (Andrew, 25 Oct: "we charge once"; v12.16, live 14:18).
  - The crews' papers write the whole fence run as clean, scrimmed sections included. On 109 of the 115 dockets Advanced have invoiced, their clean metres are exactly the paper's clean less the scrim and 2.5 m a vehicle gate.
  - The scrim rate ($25.53) is the fence plus the shade cloth, and our record had charged the paper's clean at $16.16 as well.
  - Each docket with scrim now carries one line taking its scrim metres off the clean: $64,279.23 off the charge, docket by docket.
  - Baseplan keys clean and scrim fence as separate metres, as the programme does; 2025 billed fence with scrim as its own all-in metre.
- **Also:**
  - Pedestrian gates are paid at $61 and charged at the card's $36.18 (22 gates, $546.04 under).
  - Advanced bill 219 vehicle gates at $50 ($10,950); the V8s pay none on their own, as settled.

## Decisions for Andrew

1. **Coates forklifts** (9961976 lines 21, 25, 26, 27, 31, 34, 35) are at $0 on Baseplan. The P&L charges $28,671.82 for them from the card. Are they Coates' own (no charge, so the P&L comes down) or charged to the V8s?
2. **Accommodation and meals:** Baseplan has 2 × $13,850 = $27,700. The C004 scope (row 68) has $19,101.60. Which stands?
3. **Premiair VMS and the refrigerated container:** recode to the branch the P&L uses (STPS, KINP), or keep the sub-hire branch codes and move the P&L?
4. **Generator transport, line 53 (settled from our record):** 10 legs at $300 is right. Four sets up to 30 kVA need 8 legs, and GN10's set was swapped on our record (1197355 off, 1283681 on), which adds 2. Only worth a word if that swap was on us.
5. **Plant start days:** the Supply forklifts and fork extension (9987005), and the broadcast scissor lift (9992300 line 4). Our days for EQ0001 (22 Oct) and EQ0005 (23 Oct) are the days they were ticked on the page, in the catch-ups of 22 and 23 Oct. Baseplan has 19 Oct and 5 Oct. T0085 and T0109 had machines changed on the same reference.

Once these are settled, Baseplan (7) can come onto the page so the P&L reads the same lines, with the site record kept, and the branch split matches line for line. The page still charges from Baseplan (4), 15 Oct.
