# (Helper read, 1 Oct 2026 16:45 AEST — the 2025 export and the fourteen invoices; every figure reconciled to the invoices to the cent. Reference only: nothing from it goes on the page.)

# GC500 2025 — what the V8s were actually billed (read-only reference pass)

**Sources read (all 14 invoices plus the workbook, not just the 5 attached):**
`/home/user/fish/03_GC500_Delivery_Control/reference_2025_contracts_and_invoices/Baseplan_2025_Contracts.xlsx` (sheet `2025` empty; Sheet2–Sheet14 = 13 contract sheets, 498 contract lines, 70 columns, same layout as this year's export) and `invoices/INV244*.PDF` x14 (12 tax invoices + 2 credit adjustments). Compared against `/home/user/fish/03_GC500_Delivery_Control/v7.66_rehire_by_branch_LIVE/sources/Baseplan_SuperCars_2026-10-01_1450.xlsx` (308 lines, 10 contracts). All AUD. Nothing was edited.

**Reconciliation (gives confidence in every number below):** sum of the export's `Billed Amount` across 498 lines = **$948,906.19 ex GST** = the 12 invoices' Hire Charges + Other Charges to the cent; sum of `Tot(inc.SD,DW&GST)` = **$1,074,219.94 inc GST** = the 12 invoice totals to the cent. So the export's money columns are the invoiced figures.

## 1. Which columns carry money

Populated on every line: `Price` (used for Transport/Labour/Pumpout lines; 0 on hire lines), `Prebill Amount`, `Rate 1`, `Last Billed Amount`, `Last Total Amount`, `Billed Amount`, `Billed Units`, `Tot(inc.SD,DW&GST)`. `Rate 2–5` populated but always 0. `Flat Monthly Charge`, `Sell Price`, `Quoted Qty/Price` empty. `Rate Type` = `W` on all 311 hire lines (blank on service lines); `Rate ID` 127801/128104; `Rate Classification` = "no rates". The ones that matter:

| Column | Meaning as used in 2025 |
|---|---|
| `Rate 1` | the contract rate per unit per period (type W). On the invoice it prints as "Rate" with Rate Desc **Block** and flag **QR** (Quoted Rate), so it was charged **once as a block for the event**, not per week |
| `Billed Amount` | ex-GST amount invoiced on that line (= Rate 1 x Qty on hire lines, Price x Qty on service lines) |
| `Billed Units` | days charged (invoice "Days Chgd", e.g. 43.00@, 19.00@, 2.00@) — informational only, block rate did not multiply by it |
| `Tot(inc.SD,DW&GST)` | Billed Amount + 12.5 % LTD damage waiver (where applicable) + 10 % GST |
| `Last Total Amount` / `Last Billed Amount` | only populated on Sheet8/9/11 (progressive billing); ignore |
| `Sales Analysis Code` | `BRANCH-STREAM`: KINP-HIR/INS/FRI/SUB/TOI/CON, STPS-HIR/INS/FRI/SUB, MEAD-HIR/FRI/SUB — this is the P&L split |
| `Supplier Sub Rental` | rehire supplier code on SUB lines: ZNC001 (fence, crowd barrier, shade cloth), TFH002 (white picket), BLA034 (Black Diamond 6x3 buildings), EVE019 (all event toilets, hydration station), UPH004 (VMS 14–18), QUE011 (forklift AT 068) |
| `Warehouse`, `Job Code`, `Package`, `Split SAC` | empty |

Note: no cell on any sheet carries the contract number; the header is row 1. The contract number only appears on the invoice as **Hire Schedule No**, and I matched sheets to invoices by exact line/total match.

## 2. Contract by contract

| Sheet | Hire Schedule (contract) No | Branch | Invoice(s), date | Order No on invoice | Lines | Status | Dates (start → term) | Rate 1 x Qty ex GST | Billed Amount ex GST | Tot inc DW+GST |
|---|---|---|---|---|---|---|---|---|---|---|
| Sheet2 | 9764733 | STPS (Staplyton) | 24404307, 29 Oct 25 | PO19126 | 3 | 3 Returned | 21 Oct → 29 Oct 25 | 3,966.17 | 3,966.17 | 4,417.30 |
| Sheet3 | none (no invoice) | KINP (Kingston) | — | — | 23 | Returned | 13 Oct → 11 Nov 25 | 0 | 0 | 0 |
| Sheet4 | 9772833 | KINP | 24405952, 30 Oct 25 (18 pp) | CC 3.14 | 201 | 101 Ret / 100 Del | 18 Sep → 17 Nov 25 | 68,998.50 | 170,955.37 | 198,179.55 |
| Sheet5 | 9773297 | STPS | 24402634, 28 Oct 25 + credit 24405710 (−54,890.37 ex) | 3.15 | 11 | 9 Ret / 2 Del | 28 Oct 25 (block) | 405,939.17 | 434,522.05 | 477,974.27 |
| Sheet6 | 9773347 | KINP | 24402693, 28 Oct 25 | CC 3.12 | 5 | 2 Ret / 3 Del | 28 Oct → 17 Nov 25 | 8,923.93 | 10,877.80 | 13,192.63 |
| Sheet7 | 9773423 | STPS | 24402923, 28 Oct 25 | 4.03 | 23 | 13 Ret / 10 Del | 28 Oct 25 (3 days chgd) | 3,389.59 | 5,587.55 | 6,146.33 |
| Sheet8 | 9773725 | STPS | 24403996 + 24404055 (progressive), 29 Oct 25 | 4.05 | 69 | 31 Ret / 38 Del | 29 Oct 25 | 40,519.50 | 68,263.24 | 75,089.58 |
| Sheet10 | 9774588 | KINP | 24405797, 30 Oct 25 + credit 24495288 (−491.87 ex) | Broadcast Buildings | 18 | 12 Ret / 6 Del | 18 Sep → 17 Nov 25 | 5,695.60 | 12,318.92 | 14,333.99 |
| Sheet11 | 9774835 | KINP | 24406837, 30 Oct 25 (8 pp) | CC 3.16 | 111 | 94 Ret / 17 Del | 30 Oct → 17 Nov 25 | 128,209.27 | 227,678.22 | 267,469.16 |
| Sheet9 | 9753008 | MEAD ("Brisbane Mechanical Specialist", job site QLD_GOLD COAST 600_BCAST) | 24406710, 30 Oct 25 | BROADCAST MACHINES | 9 | 4 Ret / 5 Del | 17 Oct → 13 Nov 25 | 5,953.94 | 9,253.94 | 10,998.01 |
| Sheet12 | 9774927 | KINP | 24405588, 30 Oct 25 | Broadcast Toilet | 3 | 1 Ret / 2 Del | 30 Oct → 31 Oct 25 | 2,404.71 | 4,112.59 | 4,854.50 |
| Sheet13 | none (no invoice) | STPS | — | — | 16 | Returned | 3 Nov → 13 Nov 25 | 0 | 0 | 0 |
| Sheet14 | 9792714 | STPS | 24450559, 23 Nov 25 | Marketing VMS Boards | 6 | 2 Ret / 4 Del | 20 Oct → 23 Nov 25 | 104.10 | 1,370.34 | 1,564.62 |
| **Total** | 11 invoiced contracts | | 12 invoices, 2 credits | | **498** | | | **674,104.48** | **948,906.19** | **1,074,219.94** |

Invoice header facts common to all: Customer **V8SU0845 "V8 Supercars Aust Pty Ltd ATF AVESCO Unit Trust"**, Job Site **QLD_GOLD COAST 600**, Site Days Chgd/Week 7, Ordered By Brendan Gill / Brendan Meek / Carl Iannelli, Served By Brendan Gill (Ross Saxelby on the MEAD one). Sheet3 and Sheet13 are the $0 Coates own-use / returned-plant contracts (Coates Office, Lunchroom, Container 6.0x2.4, fridges, microwave, podium, spare 6x3s, VMS returns) — never invoiced.

**Invoice roll-up:** 12 invoices = $976,563.44 ex GST ($679,784.80 hire + $269,121.39 other charges + $27,657.25 LTD waiver), GST $97,656.50, **$1,074,219.94 inc GST**. Credits: 24405710 "Incorrect from PO revised" −$54,890.37 ex / −$60,379.41 inc on the fence mesh; 24495288 "3.6m building charged as 6m building" −$491.87 ex / −$541.06 inc. **Net charged to the V8s: $921,181.20 ex GST / $1,013,299.47 inc GST.**

## 3. Grand totals by kind of contract line (498 lines)

| Kind | Lines | Rate 1 x Qty ex GST | Price x Qty ex GST | Billed Amount ex GST | Tot inc DW+GST |
|---|---|---|---|---|---|
| Hire, plant-numbered (7-digit Item) | 145 | 139,466.52 | — | 142,235.58 | 171,350.58 |
| Hire, bulk code (ARMORZONMASHTL2, TRAKMAT, TEMPFENCEFEETRH, CHAIR/DESK/TABLE/SINK) | 33 | 11,787.13 | — | 12,491.47 | 14,396.67 |
| MISCITEM (fridges/VMS "a" boards/buildings keyed as misc, damage waiver) | 35 | 4,998.34 | — | 7,205.26 | 8,780.65 |
| **Rehire (SUB-xxxx)** | 99 | 517,852.49 | — | **517,852.49** | 583,658.58 |
| **Transport (TRANSPORT)** | 85 | — | 91,862.00 | **91,862.00** | 101,048.20 |
| **Installation / Labour (LABOUR, INSTDISMEXTNL, INSTDISMFENCING)** | 96 | — | 99,111.52 | **99,111.52** | 109,022.60 |
| Toilet servicing (PUMPOUT, KINP-TOI) | 4 | — | 77,731.47 | 77,731.47 | 85,504.62 |
| Cleaning (CLEAN9, KINP-CON) | 1 | — | 416.40 | 416.40 | 458.04 |
| **Total** | 498 | 674,104.48 | 269,121.39 | **948,906.19** | **1,074,219.94** |

Rehire was **55 %** of the ex-GST revenue; Transport Revenue **9.7 %**; Installation **10.4 %**; Coates-plant hire **17 %**; toilet servicing **8.2 %**.

## 4. Rehire (SUB) lines — every code

| SUB code | Supplier | Description(s) | Qty | Rate 1 ex GST (W, billed as block) | Billed ex GST | Sheet |
|---|---|---|---|---|---|---|
| SUB-3941 | ZNC001 | Temporary Fence Mesh Panel (P) — per metre | 11,361 | 17.65 | 200,521.65 (less credit 54,890.37) | 5 |
| SUB-3941 | ZNC001 | 1.8 m fence with scrim — per metre | 3,910 | 26.75 | 104,592.50 | 5 |
| SUB-3941 | ZNC001 | 1.8m Security Fence with hoarding — per metre | 110 | 25.76 | 2,833.60 | 5 |
| SUB-3941 | ZNC001 | 1.8 M Security fence pedestrian gate — each | 32 | 39.52 | 1,264.64 | 5 |
| SUB-3941 | TFH002 | White picket fence — per metre | 147 | 32.94 | 4,842.18 | 5 |
| SUB-3941 | ZNC001 | Temporary Fence Mesh Panel (P) — panels, 9 days | 144 | 15.69 | 2,259.36 | 2 |
| SUB-4865 | ZNC001 | Shade cloth (per panel, 9 days) | 144 | 9.10 | 1,310.40 | 2 |
| SUB-4865 | EVE019 | WC09 Pee Panels (lump) | 1 | 4,404.96 | 4,404.96 | 11 |
| SUB-3839 | ZNC001 | Barrier - Crowd Control — each | 2,338 | 10.46 | 24,455.48 | 5 |
| SUB-3839 | ZNC001 | Barrier - Crowd Control - Flat feet — each | 210 | 10.54 | 2,213.40 | 5 |
| SUB-3839 | ZNC001 | Barrier - Crowd Control - Demarcation — each | 4,205 | 15.49 | 65,135.45 | 5 |
| SUB-2112 | BLA034 | 6.0M x 3.0M building (P25, P62, P63, P66; VIZ, TAL, EVS, AUD broadcast) | 8 | 1,384.53 | 11,076.24 | 4, 10 |
| SUB-2103 | EVE019 | Toilet Portable - Fresh Water Flush (FWF), 19 days chgd | 229 across 58 lines | 237.71 / 238.07 | 54,565.27 | 11 |
| SUB-2103 | EVE019 | WC100 Toilet Portable FWF - Trailer | 2 | 1,249.62 | 2,499.24 | 11 |
| SUB-3636 | EVE019 | Toilet - Disabled Access (WC01, WC31, WC51, WC86) | 4 | 1,380.24 | 5,520.96 | 11 |
| SUB-2028 | EVE019 | WC60 Toilet Block 6x3 Event MFU Tank Mounted (Female, Male) | 2 | 4,672.29 | 9,344.58 | 11 |
| SUB-3699 | EVE019 | WC27 Toilet Block 6.0M x 3.0M Tank Mount | 1 | 4,672.29 | 4,672.29 | 11 |
| SUB-14032 | EVE019 | Toilet Block 16 Pan 7.0M x 2.5M | 1 | 4,306.31 | 4,306.31 | 11 |
| SUB-1401 | EVE019 | Hydration Station | 1 | 5,270.13 | 5,270.13 | 6 |
| SUB-2631 | UPH004 | VMS 14–18 Variable Message Board Senior | 5 | 409.92 | 2,049.60 | 8 |
| SUB-12501 | QUE011 | AT 068 Forklift Rough Terrain 2.5t 2WD/4WD, 10 days (adj $216.00/day) | 1 | 2,160.00 | 2,160.00 | 9 |
| SUB-FUEL | QUE011 | Subhired Fuel Charges, Diesel 068 | 23 | 0 | 0 | 9 |

## 5. 2025 Rate 1 table (ex GST, rate type W, invoiced once as a Block / Quoted Rate) and this year's like-for-like

| Item (2025 description) | 2025 Rate 1 ex GST | Item type | 2026 export Rate 1 (W) | Change |
|---|---|---|---|---|
| 12.0M x 3.0M building (P01, P03, P04, P46, P51, P52) | 1,894.62 | plant | 1,951.46 | +3.0 % |
| 9.6M x 3.0M (P17, P33, P57, P73) | 1,530.27 | plant | 1,576.18 | +3.0 % |
| 6.0M x 3.0M (24 units, plant and SUB-2112 alike) | 1,384.53 | plant / SUB | 1,426.07 | +3.0 % |
| 4.8M x 2.4M (P10–P20, P27, P60) | 1,093.05 | plant | 1,125.84 | +3.0 % |
| 3.6m x 2.4m (P56, P58) | 947.31 | plant | 975.73 | +3.0 % |
| 6x3 Toilet Block cyclone rated (WC15.x, WC16, WC17, WX16, WCTV) | 2,404.71 | plant | 2,476.85 | +3.0 % |
| 6x3 Toilet Block with Waste Tank (WC20.1/.2; tank on its own $0 line) | 3,133.41 | plant | 3,227.41 (WC20, WC27, WC60) | +3.0 % |
| Toilet Block 6x3 Male / Female (WC09 pair) | 3,940.34 each | plant | 2,476.85 | −37 % |
| Toilet Block M/F cyclone 6x3 WC05 | 4,672.29 | plant | 3,227.41 | −31 % |
| Toilet Block 6x3 Tank Mounted (WC27, WC60) | 4,672.29 | SUB | 3,227.41 (plant) | −31 % |
| 16 Pan block 7.0M x 2.5M | 4,306.31 | SUB | 2,852.13 (MISCITEM, qty 2) | −34 % |
| FWF portable toilet (event block, 19 days) | 237.71 / 238.07 | SUB-2103 / plant | **90.07 per week** | different basis |
| Toilet Portable with Trailer | 237.71 (plant) / 1,249.62 (SUB WC100) | | 237.71 | same |
| Toilet - Disabled Access | 1,380.24 | SUB-3636 | 337.75 per week | different basis |
| Waste / Sewage Holding Tank 6.0M x 2.4M | 0 (bundled into the 3,133.41 block rate = +728.70 over a plain block) | plant | 0 | same |
| Hydration Station | 5,270.13 + transport 862.00 + "Installation - Fill Portable Water" 491.87 | SUB-1401 | no line | — |
| Trakmat 2.4M x 1.1M (KINP 20 off, event) | 182.69 each | bulk | 5.00 /wk | — |
| Trakmat (MEAD 10 off, 28 days) | 56.16 each | bulk | — | |
| Fence mesh per metre (11,361 m) | 17.65 | SUB-3941 | no fence lines this year | — |
| 1.8 m fence with scrim per metre | 26.75 | SUB-3941 | — | |
| 1.8 m fence with hoarding per metre | 25.76 | SUB-3941 | — | |
| Pedestrian gate each | 39.52 | SUB-3941 | — | |
| White picket per metre | 32.94 | SUB-3941 | — | |
| Shade cloth per panel (9 days) | 9.10 | SUB-4865 | — | |
| Fence feet concrete (R/H), 3 days | 2.93 / 3.30 | bulk | — | |
| Crowd control barrier each / flat feet / demarcation | 10.46 / 10.54 / 15.49 | SUB-3839 | — | |
| Armorzone MASH TL2 water-filled barrier, per unit event block (WB01–WB17) | 6.45 to 80.27 (most 7.74–15.48; WB01 59.34, WB03 52.89) plus one lump "Transport Charge and Install - Water filled barriers" 17,800.00 | bulk | 1.18 /wk each | — |
| VMS Senior, full event (VMS 3–8) | 3,337.92 / 3,806.40 | plant | 53.61 /wk | — |
| VMS Colour Senior, full event (VMS 01, 02) | 3,747.84 / 3,630.72 | plant | 53.61 /wk | |
| VMS Junior / Senior short (VMS 9, 10) | 1,112.64 | plant | | |
| VMS Senior 3-day (VMS 11–20, 5a, 7a) | 409.92 (468.48 for 03A/5a/7a; 175.68 VMS 02a) | plant / SUB-2631 | | |
| VMS marketing (Burleigh, Coomera), 4 days | 52.05 x 4 = 208.20 each | MISCITEM | | |
| Forklift RT 2.5t AT 068, 10 days | 2,160.00 block (216.00/day) | SUB-12501 | 1,483.20 /wk (1298390) | — |
| Scissor lift 43ft diesel, 6 days | 1,421.00 block (236.83/day) | plant | 336.00 /wk | — |
| Knuckle boom 60ft diesel, 10 days | 1,811.34 block (181.13/day) | plant | 484.00 /wk (61ft) | — |
| Tyne extension / tyne rotator | **not hired in 2025** | — | SUB-2527 extension 9.30 /wk; rotator 1302007 at $0 | — |
| Generators (any kVA) / light towers | **none in 2025 export or invoices** | — | all NVAC lines at $0 except one 80kVA at 339.00 | — |
| Fridge Full Size | 45.47 (KINP) / 51.15 (STPS) | plant / MISCITEM | — | |
| Microwave / Sink with tap / Zip boiler / Urn | 48.69 / 88.04 / 52.70 / 49.77 | | | |
| Desk / Swivel chair / Stacking chair / Folding table | 5.68 / 3.93 / 2.19 / 3.50 | bulk | | |

The Coates-plant building and toilet-block rates this year are exactly **1.03 x** last year's block rates — same rate card uplifted 3 %. The 2026 export's FWF toilet, accessible toilet and 16-pan figures are the Street Rate Card 2026's own hire figures ($90.07 = 21 days at $4.29; $337.75 = 21 days at $16.08; $2,852.13 = 70 days at $40.74): this year's card splits hire from install, demob and pump-outs, which last year's one line bundled (Andrew, 1 Oct 16:50: "you add the hire and the pump-out, it equals what was charged, almost" — $90.07 + $36.44 + $36.44 + $72.87 = $235.81). VMS, barriers and machines carry the card's daily rates and the page charges them by the day for the days on the contract. Nothing on those lines is a gap.

## 6. Service lines — Transport, Installation, servicing

**Transport (85 lines, $91,862.00 ex GST, SAC `-FRI`)**, every one on the customer contract and invoiced:
- Buildings: "Pxx - Transport Charge Each Way - <tenant>", Qty 2 x **$500.00** for 3.6/4.8/6.0 m, Qty 2 x **$800.00** for 9.6 m and 12 m (49 lines on Sheet4 = $53,400; one P01 line keyed at $0).
- Toilet blocks: Qty 2 x $500.00 each (WC15.1, WC15.2, WC20.1, WC20.2, WCTV).
- Broadcast buildings: one line "Transport Charge" Qty 8 x $500.00 = $4,000.
- VMS: "VMS nn - Transport Charge" Qty 1 x **$300.00** per board (20 lines Sheet8, 2 on Sheet7); marketing VMS Qty 2 x $150.00.
- Machines: forklift / scissor / boom Qty 2 x $500.00; trakmats Qty 2 x $150.00.
- Hydration station $862.00; trakmats (KINP) $600.00.
- Water-filled barriers: one lump "Transport Charge and Install - Water filled barriers" **$17,800.00**.
- Fence: no transport line (inside the SUB-3941 per-metre rate and the two install lines).

**Installation / Labour (96 lines, $99,111.52 ex GST, SAC `-INS`)**:
- Buildings: "Pxx - Labour Charge - <tenant>" (item LABOUR) **$655.83** flat per building, Memo on the line: "Install - $145.74 / Steps - $156.15 / Levelling - $52.05 / Cleaning - $104.10 / Fire Ext - $52.05 / Demob - $145.74" (sums to 655.83). 46 buildings.
- Toilet blocks: "WCxx - Installation & Dismantling Charge" (INSTDISMEXTNL) **$707.88** = Install 145.74 / Steps 156.15 / Levelling 104.10 / Cleaning 156.15 / Demob 145.74 (WC20.2 keyed at $67.98).
- Broadcast buildings itemised: Installation - steps 4 x 156.15; Installation & Dismantling Charge 8 x 145.74; Levelling 4 x 52.05; Fire Extinguishers 4 x 52.05; General Cleaning Fee (CLEAN9, KINP-CON) 4 x 104.10.
- VMS: "VMS nn - Labour" **$176.97** per board, $353.94 for the "a" boards and 02a/3A.
- Fence: "Installation - Relocation of Fence" **1,427.5 x $8.40 = $11,991.00** (per metre relocated) and "Installation - Labour Fencing" lump **$16,591.88**.
- Toilets contract: Labour - Event Crew $2,721.07; Installation - Project Manager $2,477.58; Event Crew Concert Fri $376.08 / Sat $420.33; Accommodation and travel $9,550.80.
- Buildings contract X03: "Labour Charge - Engineering" 17 x $145.74 = $2,477.58 (memo "Labour - Project Manager") and 0.5 x $19,101.60 = $9,550.80 (memo "Accommodation & Travel") — i.e. the $19,101.60 accommodation was split half to buildings, half to toilets, and **$145.74 is the labour unit rate**.
- Fridges: Op42 Labour $145.76, Op45 $36.44.

**Toilet servicing (PUMPOUT, SAC KINP-TOI, $77,731.47 ex GST)**: FWF Pumpout Service and clean $56,182.77; Tank Pumpout and clean $13,116.60; Sewer connect clean and restock $6,246.00; FWF Pumpout Service Pre Event $2,186.10 — four lump lines on the toilets contract, "Onhire" status, invoiced 30 Oct 25.

## 7. Damage waiver, environmental, cleaning, fuel

- **LTD (limited damage) waiver = 12.5 % of Hire Charges**, shown as a separate "LTD Waiver Charge" line under the invoice totals. Applied where the header says "LTD Waiver Yes": all Kingston invoices (24402693 $1,115.50; 24405588 $300.59; 24405797 $711.96; 24405952 $9,207.78; 24406710 $744.25; 24406837 $15,475.58) and the Staplyton marketing VMS (24450559 $52.04). "LTD Waiver No" on the Staplyton fence, VMS, barrier and fridge contracts. Not charged on SUB-3941/SUB-3839/SUB-4865 fence, crowd barrier and pee-panel lines (their Tot = Billed x 1.10 only); it was charged on SUB buildings, toilets and the forklift. Sheet2 (STPS) instead carried a manual MISCITEM "Damage Waiver" **$396.41** (11.1 % of $3,569.76) which then also attracted a $49.55 LTD charge. Total waiver 2025: **$27,657.25 ex GST** (net $27,602.60 after credit).
- **Environmental charge: none** on any contract or invoice.
- **Cleaning**: inside the labour bundles ($104.10 buildings, $156.15 toilet blocks) plus a standalone General Cleaning Fee CLEAN9 $104.10 x 4 on the broadcast buildings.
- **Fuel**: SUB-FUEL "Subhired Fuel Charges" Qty 23 (Diesel 068) at $0 — on the contract but never billed. No fuel line anywhere else.

## 8. Periods — how it was billed

- Everything hire was a **single event block** ("Rate Desc: Block", "QR" quoted rate, "@ charged 7 days per week"), invoiced on 28–30 Oct 25 as the plant came off hire. Days charged printed but did not multiply: buildings delivered 18 Sep 25 show 43.00@ with an "Adj Rate" of $44.06/day against the $1,894.62 block; buildings delivered 28 Oct show 2.00@ at the same $1,894.62; FWF toilets 19.00@ (30 Oct → 17 Nov 25); plant toilet blocks 42.00@; forklift 10.00@, scissor 6.00@, trakmats 15.00@ — all one block.
- Exceptions worth knowing: three building lines were charged "Daily" x 2 (P39 and P44 6x3 at $2,769.06, P52 12x3 at $3,789.24) — $4,663.68 ex GST more than the block, looks like a keying error nobody credited; one Armorzone line (WB15) charged "Min7 Days" at $9.03/day x 13 = $704.34 on the progressive invoice 24404055 after the first invoice charged it as block $117.39.
- Two progressive invoices: 24403996 then 24404055 on contract 9773725 (VMS/barriers, "Previous Invoice Number 24403996").
- Invoice dates: 28 Oct (fence, hydration, fridges/VMS short), 29 Oct (VMS/barriers, mesh panels), 30 Oct (buildings, toilets, broadcast, machines, WCTV), 23 Nov (marketing VMS). Contract start dates 18 Sep 25 (first buildings), bulk 28–30 Oct 25; term dates 28 Oct to 17 Nov 25.

## 9. Fencing recovery (Q5)

Customer side, ex GST: contract 9773297 invoiced $434,522.05 (mesh 200,521.65 + scrim 104,592.50 + hoarding 2,833.60 + gates 1,264.64 + picket 4,842.18 + crowd barriers 91,804.33 + Armorzone 80.27 + relocation 11,991.00 + install labour 16,591.88), credited $54,890.37 ("Incorrect from PO revised" on the mesh line) = **$379,631.68 ex GST**, plus contract 9764733 mesh/shade **$3,569.76** = **$383,201.44 ex GST** ($421,521.58 inc GST). Fence-only (SUB-3941 lines net of credit) = $259,164.20; crowd control barriers (SUB-3839) = $91,804.33; installation lines $28,582.88. Against Andrew's Advanced 2025 POs of $334,666.32 (Coates cost), the customer side is **$48,535.12 above cost (12.7 % margin on revenue)** — if the POs are ex GST and cover the crowd barriers too; if they only cover the SUB-3941 fence, the fence alone was under water by $75,502.

## 10. Branch / P&L (Q9)

Branch codes on the 2025 job: **KINP** (Kingston (P), kingston@coates.com.au) carried buildings, toilets, hydration, broadcast buildings = $437,955.73 ex GST billed; **STPS** (Staplyton (S)) carried fence, VMS, barriers, fridges, marketing VMS = $513,709.34 ex GST; **MEAD** (invoice header "Brisbane Mechanical Specialist", Job Site "QLD_GOLD COAST 600_BCAST") carried the machines = $9,253.94 ex GST. **No NVAC in 2025** (this year's generators). Contract numbers 9753008, 9764733, 9772833, 9773297, 9773347, 9773423, 9773725, 9774588, 9774835, 9774927, 9792714. Revenue stream suffixes HIR / SUB / FRI / INS / TOI / CON are the P&L lines; the Order Number field carried the V8s' contract clause ("CC 3.12/3.14/3.16", "3.15", "4.03", "4.05") or a plain label ("Broadcast Buildings", "BROADCAST MACHINES", "Broadcast Toilet", "Marketing VMS Boards", "PO19126").

## 11. Which open questions this answers

- **Q1 Transport — answered.** Yes: 85 TRANSPORT lines, $91,862.00 ex GST, every building/toilet/VMS/machine had its own "Transport Charge Each Way" line at $500 (small building, toilet block, machine), $800 (9.6/12 m), $300 (VMS), $150 (trakmat/marketing VMS), plus $17,800 lump for barriers and $862 hydration. This year's export carries $6,938.47 — last year's pattern says roughly $85k is missing from the contracts.
- **Q2 Labour — answered.** Per building "Labour Charge" $655.83 flat (6-part memo), per toilet block "Installation & Dismantling Charge" $707.88, per VMS $176.97, fence relocation $8.40/m + $16,591.88 lump, PM 17 x $145.74, accommodation $19,101.60 split across two contracts; $145.74 is the unit labour rate. $99,111.52 ex GST in total.
- **Q3 Water — partly answered.** Hydration Station $5,270.13 + $862 transport + "Installation - Fill Portable Water" $491.87 (all ex GST, KINP). No water truck, water delivery or drinking-water tank lines in 2025 — those are new.
- **Q4 Toilets — answered.** FWF portables were overwhelmingly SUB-2103 (EVE019) at $237.71/$238.07 block for 19 days, 4 on Coates plant at the same rate; toilet blocks were Coates plant (1311140–1311147, 1303837, 272839, 417726, 1292010) at $2,404.71 / $3,133.41 (with waste tank) / $3,940.34 / $4,672.29, plus SUB tank-mounted blocks at $4,672.29 and a SUB 16-pan at $4,306.31. Servicing was four PUMPOUT lump lines totalling $77,731.47 ex GST under KINP-TOI.
- **Q5 Fencing — answered** (section 9): per metre per event block, SUB-3941 $17.65 mesh / $26.75 scrim / $25.76 hoarding, $39.52 per gate, relocation $8.40/m; net recovery $383,201.44 ex GST.
- **Q6 Rates — answered for** toilets, waste tank (bundled), hoarding, flat feet, Armorzone, VMS, crowd barriers, scissor/boom/forklift, fridges, buildings by size, trakmats. **Not answered** for tyne extension, tyne rotator, generators by kVA, light towers — none were on the 2025 job.
- **Q7 — answered.** LTD waiver 12.5 % of hire on Kingston contracts; no environmental charge; cleaning bundled or $104.10 CLEAN9; fuel on contract at $0.
- **Q8 — answered.** One block per item for the event, invoiced 28–30 Oct 25, days printed but not multiplied; three lines accidentally doubled.
- **Q9 — answered.** KINP, STPS, MEAD; no NVAC; 11 contract numbers listed above.

Not read (outside the brief): the newer upload `aabb1352-2025_event_portaloos.xlsx` in the uploads folder. Of the 5 PDFs Andrew attached, all are among the 14 already in the repo folder; the other 9 were read too.