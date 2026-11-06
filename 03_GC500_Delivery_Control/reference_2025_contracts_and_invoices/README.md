# GC500 2025 — the contracts and invoices, read as a guide for this year (reference only)

Author: Andrew Fisher · 1 Oct 2026 · read only: nothing on the page or the live record changes from this folder.

Andrew, 1 Oct 2026: "this could give us an advantage on how it looked last year and maybe steal some info or maybe it
answers some questions too … no one in the business can help me." And with the last five PDFs: "that's all I can find
from 2025, I'm hoping all this data can help us as no one in the business can help me."

Every figure below is AUD and says ex GST or inc GST. Every figure is traced to an invoice number or a contract line.
Dates are written 28 Oct 2025 style. The event was 24–26 Oct 2025; the invoices were raised 28–30 Oct 2025 (one on
23 Nov 2025).

**The short version.** Last year Coates charged the V8s **$921,181.20 ex GST net** ($1,013,299.47 inc GST) on the
twelve tax invoices and two credit notes in this folder (gross $976,563.44 ex GST before the two credits). Every
item was billed as one quoted **Block** charge for the event, not by the day or the week. Nearly every piece of
plant carried its own **Transport Charge** line ($300–$800 ex GST a leg) and its own **Labour / Installation**
line ($145.74–$707.88 ex GST), on 85 transport lines ($91,862.00 ex GST) and 96 labour lines ($99,111.52 ex GST).
Toilet servicing went on four **PUMPOUT** lines ($77,731.47 ex GST). Water was a **Hydration Station** Rehire line
($5,270.13 ex GST) plus its transport and a fill line. The fence was five Rehire lines on SUB-3941 at a block rate per
panel, $314,054.57 ex GST before a $54,890.37 ex GST credit. Of this year's nine questions, seven are answered
outright, two in part (section 5).

---

## 1. What was received

Folder: `03_GC500_Delivery_Control/reference_2025_contracts_and_invoices/`. The SHA-256 list is in `SHA256SUMS.txt`
(cited, not recomputed here).

| File | What it is |
|---|---|
| `Baseplan_2025_Contracts.xlsx` | Baseplan rental export: one sheet per 2025 contract, thirteen contract sheets (`Sheet2`–`Sheet14`; the `2025` sheet is empty), 498 contract lines, 70 columns (Item, Description, Quantity, Rate 1, Sales Analysis Code, Supplier Sub Rental, Start/Term Date, Billed Amount, Billed Units, Tot(inc.SD,DW&GST), Delivery/Return Number, Memo …). No contract (Hire Schedule) number column — each sheet is tied to its invoice below by its total, which matches to the cent. |
| `invoices/INV24402634.PDF` … `INV24495288.PDF` | Fourteen Coates Hire Operations documents to V8 Supercars Aust Pty Ltd ATF AVESCO Unit Trust (customer code V8SU0845), job site QLD_GOLD COAST 600 / QLD_GOLD COAST 600_BCAST: twelve tax invoices and two tax adjustments (credit notes 24405710 and 24495288). 48 pages in all; every page legible. |
| `Event_Portables_2025_portaloos.xlsx`, `Event_Portables_2025_po_lines.csv`, `event_portables_2025.md` | Coates's own 2025 purchase-order lines to Event Portables (the Rehire cost side of the toilets, servicing and water; $96,340 ex GST), read separately in `event_portables_2025.md`. Used here only for the recovery ratios in section 5. |

The sibling folder `reference_2025_fencing/` holds Advanced's eleven 2025 purchase orders ($334,666.32, Coates's
fencing cost); section 7 puts last year's customer side against them.

**Purpose.** Reference only. Andrew, 1 Oct 2026, about 16:25: "I don't wanna see last year's" — so no 2025 figure goes on
the page, no last-year column, no reference line. This file is our own check on how Coates billed this event last
year, what it charged for, and at what rates, so this year's gaps can be named and put to the branch. Any page change
that follows is a proposal (v7.70 or later), never done from here.

---

## 2. How a 2025 invoice looked

Every invoice has the same shape: a header (Hire Branch, Hire Schedule No, Order Number, LTD Waiver Yes/No, Site Days
Chgd / Week 7), then numbered lines in three groups that roll into three totals, then GST.

| On the paper | What it is | How it reads |
|---|---|---|
| **Hire line, Coates plant** | Item Code is a plant number (e.g. `1311147`), description `WC15.1 - 6x3 Toilet Block - Rear Pits Spine Path`, P G Code (product group), `QR` = Quoted Rate, Rate Desc `Block`, Days/Mths Chgd `1.00@`, Hire Period From/To, Status Onhire/Offhire/Returned | One block charge for the event whatever the days on site. Rolls into **Hire Charges**. `@` = "charged 7 days per week". |
| **Hire line, Rehire (SUB)** | Item Code `SUB-nnnn` (e.g. `SUB-2103` Toilet Portable – Fresh Water Flush, `SUB-3941` fence, `SUB-2112` 6.0 m × 3.0 m building, `SUB-12501` forklift), same columns | Gear hired in and charged to the V8s at our rate. Same block treatment. In the workbook these lines carry a Supplier Sub Rental code (EVE019, ZNC001, BLA034, UPH004, QUE011, TFH002) and a `-SUB` sales analysis code. Rolls into Hire Charges. |
| **Block +** | Rate Desc `Block +` with Days Chgd 3.00 or 6.00 or 9.00 | A per-unit **per-day** rate (fence feet $0.98/day, barriers on the closing invoice, broadcast fence panels $1.74/day, boom $181.13/day, trakmats $3.74/day). |
| **Daily / Min7 Days** | Rate Desc `Daily` or `Min7 Days`, `^` minimum hire applied | Rate × days. Used on a handful of lines (one Armorzone at 7 days × $11.47 on INV24402634; three buildings on INV24405952 — see section 8). |
| **Transport Charge** | Item Code `TRANSPORT`, description `<ref> - Transport Charge` or `Transport Charge Each Way`, Qty 2 (delivery + return), no hire period | Transport Revenue per reference. Rolls into **Other Charges**. Sales analysis code `-FRI`. |
| **Installation / Labour** | Item Code `INSTDISMEXTNL` (or `LABOUR`, once `INSTDISMFENCING`), description `<ref> - Labour`, `Installation & Dismantling Charge`, `Labour Charge` with the build-up written in: `Install - $145.74 / Steps - $156.15 / Levelling - $52.05 / Cleaning - $104.10 / Fire Ext - $52.05 / Demob - $145.74` | Installation per reference. Other Charges. Code `-INS`. |
| **PUMPOUT** | Item Code `PUMPOUT`, `FWF Pumpout Service and clean` etc., Qty 1, lump sum | Toilet servicing. Other Charges. Code `-TOI`. |
| **CLEAN9** | `General Cleaning Fee` $104.10 per building | Cleaning as its own line (INV24405797 only); elsewhere inside the Labour Charge. Code `-CON`. |
| **LTD Waiver Charge** | In the totals box, not a numbered line; 12.5 % of Hire Charges where the header says LTD Waiver Yes | Damage waiver on hire only, never on transport, labour or pump-outs. |
| **Credit note** | "Tax Adjustment for Inv No …", one line, Credit Reason printed | Reverses part of an earlier invoice (two in the set). |

**Worked example — INV24405588, 30 Oct 2025, Kingston (P), Hire Schedule 9774927, order "Broadcast Toilet"** (one
page, the TV compound toilet):

| Line | Item Code | Description | Qty | Rate | Line total ex GST |
|---|---|---|---|---|---|
| 1 | 1292010 (Coates plant, P G 31261) | WCTV - 6x3 Toilet Block - TV Compound Toilet · 1.00@ Block · QR · 30 Oct 2025 08:43 to 09:30 · Offhire | 1 | $2,404.71 | $2,404.71 |
| 2 | TRANSPORT | WCTV - Transport Charge | 2 | $500.00 | $1,000.00 |
| 3 | INSTDISMEXTNL | WCTV - Installation & Dismantling Charge. Install - $145.74 / Steps - $156.15 / Levelling - $104.10 / Cleaning - $156.15 / Demob - $145.74 | 1 | $707.88 | $707.88 |
| | | **Hire Charges** | | | **$2,404.71** |
| | | **Other Charges** (transport + installation) | | | **$1,707.88** |
| | | **LTD Waiver Charge** (12.5 % × $2,404.71) | | | **$300.59** |
| | | **Price Excluding GST** | | | **$4,413.18** |
| | | GST | | | $441.32 |
| | | **Invoice Total inc GST** | | | **$4,854.50** |

Read it as: one toilet block earned $2,404.71 hire + $1,000.00 Transport Revenue + $707.88 Installation = $4,112.59
ex GST before waiver. That three-line pattern (hire · transport · labour) per reference is the 2025 model; this
year's contracts carry the hire and very little of the other two.

---

## 3. The fourteen invoices

Twelve tax invoices and two credit notes. These may not be all of 2025's invoices (Andrew: "that's all I can find");
two contracts in the workbook (section 4) have no invoice here, and some lines on the progressive invoices were still
Onhire on 30 Oct 2025, so a later invoice may have followed.

| Invoice | Date | Hire Schedule · branch · order | Period (as printed) | Ex GST | GST | Inc GST | What it covered |
|---|---|---|---|---|---|---|---|
| 24402634 | 28 Oct 2025 | 9773297 · Staplyton (S) · 3.15 | 28 Oct 2025 same-day stamps; Block, 1.00 day; Returned | $434,522.05 | $43,452.22 | $477,974.27 | The fence: SUB-3941 mesh 11,361 @ $17.65, scrim 3,910 @ $26.75, hoarding 110 @ $25.76, pedestrian gates 32 @ $39.52, white picket 147 @ $32.94; crowd control SUB-3839 2,338 @ $10.46, flat feet 210 @ $10.54, demarcation 4,205 @ $15.49; Installation – Labour Fencing $16,591.88, Installation – Relocation of Fence 1,427.5 @ $8.40 = $11,991.00; one Armorzone $80.27. No transport line, no waiver. "Credit note 24405710 was created." |
| 24402693 | 28 Oct 2025 | 9773347 · Kingston (P) · CC 3.12 | 28 Oct 2025 same-day; Block | $11,993.30 | $1,199.33 | $13,192.63 | Hydration Station SUB-1401 $5,270.13; Transport Charge – Hydration Station $862.00; Installation – Fill Portable Water $491.87; 20 Trakmats @ $182.69 = $3,653.80; Transport – Trak Matts $600.00; LTD waiver $1,115.50. |
| 24402923 | 28 Oct 2025 | 9773423 · Staplyton (S) · 4.03 | 28 Oct 2025; 3.00 days at Adj Rates | $5,587.55 | $558.78 | $6,146.33 | 3-day top-up: five fridges @ $17.05/day; VMS 02a, 03A, 11, 12, 19, 20 at $58.56–$156.16/day; fence feet 200 @ $0.98/day and 80 @ $1.10/day; Labour lines $36.44–$353.94; VMS 12 and 19 Transport $300.00 each. |
| 24403996 | 29 Oct 2025 | 9773725 · Staplyton (S) · 4.05 | 29 Oct 2025 same-day; Block | $67,558.90 | $6,755.91 | $74,314.81 | VMS 01–18 and 20 (13 Coates boards, 2 MISCITEM, 5 SUB-2631) at block rates $409.92–$3,806.40; a $300.00 Transport line and a $176.97 (or $353.94) Labour line per board (19 transport, 18 labour); 13 water-filled barrier groups WB01–WB17 $6,086.22; "Transport Charge and Install - Water filled barriers" $17,800.00. |
| 24404055 | 29 Oct 2025 | 9773725 · Staplyton (S) · 4.05 | 29 Oct 2025 09:40–09:48; Returned; "Previous Invoice 24403996" | $704.34 | $70.43 | $774.77 | Closing invoice for 9773725: 30 lines at $0.00 (already billed), WB15 13 @ $9.03 × 6 days Min7 = $704.34. Shows the barriers' per-day rates ($0.92–$9.03). |
| 24404307 | 29 Oct 2025 | 9764733 · Staplyton (S) · PO19126 · job site _BCAST | 21 Oct 2025 09:00 to 29 Oct 2025 11:20; 9.00 days Block + | $4,015.72 | $401.58 | $4,417.30 | Broadcast compound fence: SUB-3941 144 panels × 9 days @ $1.74 = $2,259.36; SUB-4865 shade cloth 144 × 9 @ $1.01 = $1,310.40; a keyed MISCITEM "Damage WAiver" $396.41 and then LTD waiver $49.55 on it. |
| 24405588 | 30 Oct 2025 | 9774927 · Kingston (P) · "Broadcast Toilet" | 30 Oct 2025 08:43–09:30; Block | $4,413.18 | $441.32 | $4,854.50 | Worked example above: one 6x3 toilet block, transport $1,000.00, Installation & Dismantling $707.88, waiver $300.59. |
| **24405710** (credit) | 28 Oct 2025 | 9773297 · Staplyton (S) · 3.15 | — | **−$54,890.37** | −$5,489.04 | **−$60,379.41** | Credits SUB-3941 Temporary Fence Mesh Panel (P) on 24402634. "Credit Reason: Incorrect from PO revised" — the mesh drops from 11,361 panels to about 8,251 at $17.65. |
| 24405797 | 30 Oct 2025 | 9774588 · Kingston (P) · "Broadcast Buildings" | 18 Sep 2025 07:00 to 30 Oct 2025; 43.00 days, one Block each | $13,030.88 | $1,303.11 | $14,333.99 | Four 6.0 m × 3.0 m broadcast buildings VIZ/TAL/EVS/AUD on SUB-2112 @ $1,384.53 block; tables, chairs, fridges; Transport Charge 8 × $500.00 = $4,000.00; Installation – steps 4 × $156.15, Installation & Dismantling 8 × $145.74, Levelling 4 × $52.05, Fire Extinguishers 4 × $52.05, General Cleaning Fee 4 × $104.10; waiver $711.96. "Credit note 24495288 was created." |
| 24405952 | 30 Oct 2025 | 9772833 · Kingston (P) · CC 3.14 | 18 Sep 2025 (P01, P03, P04) and 28 Oct 2025 12:44–19:32 to 30 Oct 2025 11:17; 2.00 days, Block; 170 of 187 lines Onhire | $180,163.15 | $18,016.40 | $198,179.55 | The site buildings: 51 locations P01–P73 plus X03 Engineering. Per location a building (3.6 m × 2.4 m $947.31; 4.8 m × 2.4 m $1,093.05; 6.0 m × 3.0 m $1,384.53; 9.6 m × 3.0 m $1,530.27; 12.0 m × 3.0 m $1,894.62 block), "Transport Charge Each Way" 2 × $500.00 (or 2 × $800.00 for 9.6 m and 12 m) and "Labour Charge" $655.83. 48 transport lines $53,400.00; 51 labour lines $43,893.19 (incl. Project Manager 17 × $145.74 = $2,477.58 and Accommodation & Travel $9,550.80, half of $19,101.60); waiver $9,207.78. |
| 24406710 | 30 Oct 2025 | 9753008 · Brisbane Mechanical Specialist · "BROADCAST MACHINES" · _BCAST | 17 Oct 2025 08:00 to 31 Oct 2025 17:00 | $9,998.19 | $999.82 | $10,998.01 | AT 068 Forklift RT 2.5 t SUB-12501 $2,160.00 block (10 days, $216.00/day); Scissor 43 ft $1,421.00 block (6 days); Knuckle Boom 60 ft $181.13/day × 10 = $1,811.34; 10 Trakmats @ $3.74/day × 15 = $561.60; Transport 2 × $500.00 each machine, 2 × $150.00 trakmats = $3,300.00; waiver $744.25. |
| 24406837 | 30 Oct 2025 | 9774835 · Kingston (P) · CC 3.16 | 30 Oct 2025 07:47 to 20:04 same-day; Block, 1.00 day; most lines Onhire | $243,153.80 | $24,315.36 | $267,469.16 | The toilets (8 pages, 105 lines): 11 Coates 6x3 toilet blocks $2,404.71–$4,672.29 block; 240 Toilet Portable – Fresh Water Flush on SUB-2103 @ $237.71 / $238.07; 4 disabled SUB-3636 @ $1,380.24; 2 trailer units @ $1,249.62; 3 tank-mounted blocks (SUB-2028, SUB-3699) @ $4,672.29; 16-pan block SUB-14032 $4,306.31; Pee Panels SUB-4865 $4,404.96. Transport $1,000.00 on each of four Coates blocks only ($4,000.00). Installation & Dismantling $707.88 × 3 (one printed $67.98); Labour – Event Crew $2,721.07, Concert Friday $376.08, Saturday $420.33; Installation – Project Manager $2,477.58; Accommodation and travel $9,550.80. **PUMPOUT: FWF Pumpout Service and clean $56,182.77; Sewer connect clean and restock $6,246.00; Tank Pumpout and clean $13,116.60; FWF Pumpout Service Pre Event $2,186.10 = $77,731.47.** Waiver $15,475.58. |
| 24450559 | 23 Nov 2025 | 9792714 · Staplyton (S) · "Marketing VMS Boards" | 20 Oct 2025 09:00 to 24 Oct 2025 09:00; 4.00 days | $1,422.38 | $142.24 | $1,564.62 | Two MISCITEM VMS (Burleigh Bunnings, Coomera Overpass) @ $52.05/day × 4 = $208.20 each; Labour Charge (code LABOUR) $176.97 each; Transport 2 × $150.00 each; waiver $52.04. |
| **24495288** (credit) | 30 Oct 2025 | 9774588 · Kingston (P) · "Broadcast Buildings" | — | **−$491.87** | −$49.19 | **−$541.06** | Credits SUB-2112 AUD building on 24405797: "3.6m building charged as 6m building" — $1,384.53 − $947.31 = $437.22 hire plus $54.65 waiver. |

**Totals**

| | Ex GST | GST | Inc GST |
|---|---|---|---|
| Twelve tax invoices (gross) | $976,563.44 | $97,656.50 | $1,074,219.94 |
| Two credit notes | −$55,382.24 | −$5,538.23 | −$60,920.47 |
| **Net, as far as these fourteen show it** | **$921,181.20** | **$92,118.27** | **$1,013,299.47** |

Arithmetic: every invoice's Hire Charges + Other Charges + LTD Waiver Charge equals its Price Excluding GST, and GST is
within 1–8 cents of 10 % (per-line rounding). Gross by kind (the invoices and the workbook agree to the cent):

| Kind (2025 wording on the paper) | Lines | Ex GST, gross |
|---|---|---|
| Hire Charges — Coates plant and stock codes (incl. 34 MISCITEM lines $7,205.26) | 213 | $161,932.31 |
| Hire Charges — Rehire, SUB lines | 99 | $517,852.49 |
| Transport Revenue (TRANSPORT lines; includes the $17,800.00 bundled barrier transport-and-install line) | 85 | $91,862.00 |
| Installation (INSTDISMEXTNL / LABOUR / INSTDISMFENCING) | 96 | $99,111.52 |
| Cleaning (CLEAN9) | 1 | $416.40 |
| Toilet pump-outs (PUMPOUT) | 4 | $77,731.47 |
| LTD Waiver Charge | — | $27,657.25 |
| **Total** | **498** | **$976,563.44** |

Net of the two credits, Rehire is $462,524.90 ex GST and waiver $27,602.60 ex GST.

---

## 4. The 2025 contracts export (`Baseplan_2025_Contracts.xlsx`)

Thirteen contract sheets, 498 lines. Item Type 1 lines (hire, Status Returned, Rate Type W) carry Rate 1 and Billed
Units; Item Type 2 lines (transport, labour, pump-out, cleaning; Status Delivered) carry a Price and no rate. **Billed
Amount** is the ex-GST charge before waiver; **Tot(inc.SD,DW&GST)** is the line inc waiver and GST, and each sheet's
Tot sum equals its invoice total inc GST to the cent (that is how each sheet is tied to its Hire Schedule number; the
export has no contract-number column). The sheets show the pre-credit figures — neither credit note is in them.

| Sheet | Hire Schedule (from the invoice) | Branch codes on the lines | Lines | Rate 1 × Qty (hire) | Billed Amount ex GST | Tot inc GST | What it is |
|---|---|---|---|---|---|---|---|
| Sheet2 | 9764733 (INV24404307) | STPS-SUB, STPS-HIR | 3 | $3,966.17 | $3,966.17 | $4,417.30 | Broadcast fence: SUB-3941 144 @ Rate 1 $15.69 (9 days → $2,259.36), SUB-4865 shade cloth 144 @ $9.10, supplier ZNC001; MISCITEM Damage WAiver $396.41. |
| Sheet3 | not invoiced here (no Hire Schedule number known) | KINP-HIR | 23 | $0.00 | $0.00 | $0.00 | Zero-rated lines, 13 Oct to 11 Nov 2025: Coates Office 4.8 m, Coates Lunchroom, Coates Container, two fridge-freezers, microwave (Coates's own site set-up); air conditioners for P60, P65, P67, P73, TAL and T86; the T86 Toyota 86 building; three "BLACK DIAMOND" buildings P62, P63, P66 on MISCITEM (memo "REHIRE BLACK DIAMOND"), which were billed on 9772833 as SUB-2112. |
| Sheet4 | 9772833 (INV24405952) | KINP-HIR 97, KINP-INS 51, KINP-FRI 49, KINP-SUB 4 | 201 | $68,998.50 | $170,955.37 | $198,179.55 | The site buildings. 84 Coates plant lines $62,810.66; 4 SUB-2112 (BLA034) $5,538.12; 13 MISCITEM $5,313.40; 49 transport $53,400.00; 51 labour $43,893.19. 14 extra $0 lines dated 4–11 Nov 2025 (returns). |
| Sheet5 | 9773297 (INV24402634) | STPS-SUB 8, STPS-INS 2, STPS-HIR 1 | 11 | $405,939.17 | $434,522.05 | $477,974.27 | The fence. Seven SUB lines supplier **ZNC001** $401,016.72 (mesh, gates, hoarding, scrim, crowd control, flat feet, demarcation); white picket fence supplier **TFH002** $4,842.18; two installation lines $28,582.88 (Qty 1,427.5 @ $8.40 confirms the invoice's $11,991.00); one Armorzone $80.27. Before the $54,890.37 credit. |
| Sheet6 | 9773347 (INV24402693) | KINP-SUB, KINP-FRI 2, KINP-INS, KINP-HIR | 5 | $8,923.93 | $10,877.80 | $13,192.63 | Hydration Station SUB-1401 supplier **EVE019** (Event Portables) $5,270.13, term 17 Nov 2025; transport $862.00 + $600.00; fill $491.87; 20 trakmats $3,653.80. |
| Sheet7 | 9773423 (INV24402923) | STPS-HIR 13, STPS-INS 8, STPS-FRI 2 | 23 | $3,389.59 | $5,587.55 | $6,146.33 | Fridges, fence feet, VMS top-up (3 billed units). |
| Sheet8 | 9773725 (INV24403996 + 24404055) | STPS-HIR 26, STPS-FRI 20, STPS-INS 18, STPS-SUB 5 | 69 | $40,519.50 | $68,263.24 | $75,089.58 | VMS 01–18/20 and WB01–WB17. SUB-2631 boards supplier **UPH004**. Transport 20 lines $23,500.00 (19 × $300.00 + $17,800.00); labour 18 lines $3,539.40. Billed units 7 on the barriers. |
| Sheet10 | 9774588 (INV24405797) | KINP-SUB 4, KINP-HIR 8, KINP-FRI, KINP-INS 4, KINP-CON | 18 | $5,695.60 | $12,318.92 | $14,333.99 | Broadcast buildings SUB-2112 supplier **BLA034** (Black Diamond), 43 billed units; furniture; transport $4,000.00; labour $2,206.92; CLEAN9 $416.40 on KINP-CON. Before the $491.87 credit. |
| Sheet11 | 9774835 (INV24406837) | KINP-SUB 73, KINP-HIR 21, KINP-INS 9, KINP-FRI 4, KINP-TOI 4 | 111 | $128,209.27 | $227,678.22 | $267,469.16 | The toilets. 73 SUB lines supplier **EVE019** $87,867.86 (SUB-2103 qty 242 incl. 2 trailer units; SUB-3636 × 4; SUB-2028 × 2; SUB-3699; SUB-14032; SUB-4865); 17 Coates lines $40,341.41 (11 blocks, 4 portables, **two Waste Tank lines 1311337/1311336 at Rate 1 $0**); 4 PUMPOUT lines $77,731.47 on KINP-TOI; 9 labour $17,737.48; 4 transport $4,000.00; 4 MISCITEM $0 return lines 3–11 Nov 2025. SUB lines term 17 Nov 2025, 19 billed units, one block charged. |
| Sheet9 | 9753008 (INV24406710) | **MEAD**-SUB 2, MEAD-HIR 3, MEAD-FRI 4 | 9 | $5,953.94 | $9,253.94 | $10,998.01 | Broadcast machines. AT 068 forklift SUB-12501 supplier **QUE011** $2,160.00 (10 units); scissor, boom, trakmats; four transport lines $3,300.00 with memos "del & ret forklift" etc.; **SUB-FUEL "Subhired Fuel Charges" Qty 23, memo "Diesel 068", billed $0**. |
| Sheet12 | 9774927 (INV24405588) | KINP-HIR, KINP-FRI, KINP-INS | 3 | $2,404.71 | $4,112.59 | $4,854.50 | The broadcast toilet (worked example). |
| Sheet13 | not invoiced here (no number known) | STPS-HIR | 16 | $0.00 | $0.00 | $0.00 | Zero-rated, 3–13 Nov 2025: VMS 25, VMS 26, VMS 9, "Rehired Uplift VMS Board", 50 trakmats, VMS trailer, nine Coates VMS boards returned 11–12 Nov 2025 (memo on 1191957 "Inbound Assessment … missing batteries"), "Trak matts – VMs – Besser blocks". The post-event return of the VMS fleet. |
| Sheet14 | 9792714 (INV24450559) | STPS-HIR 2, STPS-INS 2, STPS-FRI 2 | 6 | $104.10 | $1,370.34 | $1,564.62 | Marketing VMS, two sites; labour on code LABOUR. |
| **All** | | | **498** | **$674,104.48** | **$948,906.19** | **$1,074,219.94** | Billed Amount + waiver $27,657.25 = the gross $976,563.44 ex GST. |

**What was hired, by kind (Billed Amount ex GST, gross):** Coates plant and stock $154,727.05 (179 lines) + MISCITEM
$7,205.26 (34) · Rehire SUB $517,852.49 (99) · Transport $91,862.00 (85) · Installation $99,111.52 (96) · Cleaning
$416.40 (1) · Pump-outs $77,731.47 (4).

**Suppliers on the SUB lines:** ZNC001 (fence, crowd control, shade cloth — $404,586.48 gross), EVE019 (Event
Portables: toilets, hydration station — $93,137.99), BLA034 (Black Diamond: eight 6.0 m × 3.0 m buildings —
$11,076.24), UPH004 (five VMS boards — $2,049.60), QUE011 (the forklift — $2,160.00, plus the $0 fuel line), TFH002
(white picket fence — $4,842.18). Whether ZNC001 is Advanced's supplier code is not stated anywhere in the folder
(section 7).

**Sales analysis code suffixes** (how Finance split the lines): `-HIR` hire, `-SUB` Rehire, `-FRI` transport, `-INS`
installation, `-TOI` toilet pump-outs, `-CON` consumables (the cleaning fee). These line up with this year's P&L
reading: Rehire Revenue 1010, Transport 1030/1031, Toilet Pumpouts 1032, Installation 1047, Consumables 1020.

---

## 5. Answers — Q1 to Q9

**Q1 Transport — ANSWERED.** Yes. Last year every piece of plant that moved carried its own `TRANSPORT` contract line
per reference, Qty 2 for delivery and return, under Other Charges, sales analysis `-FRI`. 85 lines, **$91,862.00 ex
GST** gross ($74,062.00 without the $17,800.00 "Transport Charge and Install - Water filled barriers" line, which
bundles transport and installation under a transport code). Rates ex GST a leg: **$500.00** for a 3.6 m, 4.8 m or
6.0 m building, a 6x3 toilet block, a forklift, scissor or boom (INV24405952, 24406837, 24405588, 24406710);
**$800.00** for a 9.6 m or 12.0 m building (INV24405952, nine locations); **$300.00** per VMS board one line each
(INV24403996 ×19, 24402923 ×2); **$150.00** a leg for trakmats or a marketing VMS (INV24406710, 24450559); **$862.00**
hydration station and **$600.00** 20 trakmats (INV24402693). The fence (INV24402634) and the 240 portable toilets
(INV24406837) carried **no** transport line — their transport sat inside the Rehire block rates. The site-buildings
contract alone carried $53,400.00 ex GST of Transport Revenue (48 lines).
*For this year:* the $6,938 on this year's contracts against $22,011.39 paid to carriers (Transport Recovery 0.32) is
a billing gap, not last year's practice. Last year's model is one Transport Charge line per reference at $500 / $800
a leg; put to the branch (section 9).

**Q2 Labour — ANSWERED.** Charged per reference on `INSTDISMEXTNL` (or `LABOUR`), described "<ref> - Labour",
"<ref> - Install", "Installation & Dismantling Charge" or "Labour Charge", with the build-up printed in the description
or memo. 96 lines, **$99,111.52 ex GST**. The 2025 rate card as printed:

| Component (ex GST) | Site building (INV24405952 "Labour Charge", INV24405797 itemised) | Toilet block (INV24406837 / 24405588 "Installation & Dismantling Charge") |
|---|---|---|
| Install | $145.74 | $145.74 |
| Steps | $156.15 | $156.15 |
| Levelling | $52.05 | $104.10 |
| Cleaning | $104.10 | $156.15 |
| Fire extinguisher | $52.05 | — |
| Demob | $145.74 | $145.74 |
| **Per unit** | **$655.83** (48 of them) | **$707.88** (4 of them; one printed $67.98) |

Also: VMS board $176.97 each (Senior/Junior; "a" units $353.94); fridges $145.76 and $36.44; fence "Installation –
Labour Fencing" lump sum $16,591.88 and "Installation – Relocation of Fence" 1,427.5 @ $8.40; "Installation – Fill
Portable Water" $491.87; Event crew $2,721.07 + $376.08 + $420.33; "Labour – Project Manager" 17 × $145.74 = $2,477.58
on each of INV24405952 and INV24406837; "Accommodation & travel" $9,550.80 on each of the same two (rate $19,101.60
on 24405952, so the two invoices carry the whole $19,101.60 between them). Installation excluding the PM and
accommodation lines: $75,054.76 ex GST.
*For this year:* install and demob are chargeable per reference and the components have 2025 figures; the crew's
hours on the page (Running sheet) have a precedent for being charged on as Installation, and the Project Manager and
accommodation were charged to the V8s in 2025 (Alfie's nights this year).

**Q3 Water — PARTLY ANSWERED.** One package on INV24402693 (contract 9773347, KINP): **Hydration Station SUB-1401
(Event Portables, EVE019) $5,270.13 ex GST block** + **Transport Charge – Hydration Station $862.00** + **Installation –
Fill Portable Water $491.87** = **$6,624.00 ex GST** (plus 12.5 % waiver on the hire). Against Coates's 2025 Event
Portables cost for water (quote Q6128: deliveries $1,800 + 3,000 L drinking-water tank $2,450 + freight $360 =
$6,610 ex GST) that is a recovery of 1.00 — a pass-through, in the P&L's words a Consumables line charged at cost.
There is no water-truck or pre-fill line on any invoice; last year's water truck ($6,800 on Q6289) was recovered, if
at all, inside the four PUMPOUT lump sums ($77,731.47), where "FWF Pumpout Service Pre Event $2,186.10" is the
nearest thing to a pre-fill.
*For this year:* the drinking-water tank and water deliveries have a 2025 customer precedent — one Hydration Station
Rehire line plus a transport line and a fill line, at roughly the supplier's figure; the water truck and pre-fill have
none as separate lines and belong with the servicing, as this year's v7.69 rule already treats them.

**Q4 Toilets — ANSWERED.** Both. **Coates plant-numbered lines** for the 6x3 blocks: 1311147/1311140 $2,404.71 block;
1311145/1311146 (Rear S04, with waste tanks) $3,133.41; 272839/417726/1311141–1311144 $3,940.34; 1303837 (cyclone
rated) $4,672.29; WCTV 1292010 $2,404.71; and four Coates portables (1201763, 1190564, 1114551, 1114525) at the same
$237.71 as the SUB units. **SUB (Rehire) lines** for everything from Event Portables: 240 "Toilet Portable – Fresh
Water Flush" SUB-2103 at $237.71 (lines 13–36) and $238.07 (lines 40 on) block each, by location WC01–WC85 and PG01–
PG29; "Toilet – Disabled Access" SUB-3636 $1,380.24 ×4; trailer units SUB-2103 $1,249.62 ×2; tank-mounted Event MFU
blocks SUB-2028 $4,672.29 ×2 and SUB-3699 ×1; 16-pan block SUB-14032 $4,306.31; Pee Panels SUB-4865 $4,404.96.
**Servicing** went on its own item code `PUMPOUT`, sales analysis KINP-TOI, four lump sums on INV24406837: FWF
Pumpout Service and clean $56,182.77; Tank Pumpout and clean $13,116.60; Sewer connect clean and restock $6,246.00;
FWF Pumpout Service Pre Event $2,186.10 — **$77,731.47 ex GST**, no waiver. Coates paid Event Portables $47,435 ex GST
for the servicing (Q6289, 260 services × 3 weeks, 17 cleans × 3, 8 tank pump-outs × 3, plus the $6,800 water truck),
so the servicing recovery was 1.64; the toilets' hire recovery was $87,867.86 ÷ $42,295 = 2.08 (SUB lines against
Q6127). Per unit, last year's servicing revenue reads $56,182.77 ÷ 780 = $72.03 a FWF service, $13,116.60 ÷ 24 =
$546.53 a tank pump-out, $6,246.00 ÷ 51 = $122.47 a sewer-connect clean. Transport: $1,000.00 on each of four Coates
blocks only; none on the SUB portables. Installation & Dismantling $707.88 on three blocks (and $67.98 on WC20.2).
*For this year:* the page's "priced by us at our pump-out rates" ($72.87 / $624.60 / $260.25 for the same 780 / 24 /
51) sits above last year's charged figures on all three; last year's total for the same quantities was $75,545.37
(plus the $2,186.10 pre-event service) against the page's $85,102. Both cover this year's $46,545 cost. Last
year's toilet-block rates ($2,404.71 to $4,672.29 block) and portable rate ($237.71–$238.07) are the customer rates
this year's lines can be checked against.

**Q5 Fencing — ANSWERED for the customer side; the recovery depends on one question (section 7).** The fence was
charged on contract 9773297 (Staplyton (S), order 3.15) as a block rate **per panel** for the event, all on Rehire
code SUB-3941 (supplier ZNC001), not per metre and not per week, plus two installation lines; no gate-install,
relocation-per-move or transport lines. INV24402634 then credit 24405710:

| Line (INV24402634) | Qty | Rate ex GST | Ex GST |
|---|---|---|---|
| Temporary Fence Mesh Panel (P), SUB-3941 | 11,361 | $17.65 | $200,521.65 |
| 1.8 m fence with scrim, SUB-3941 | 3,910 | $26.75 | $104,592.50 |
| 1.8 m Security Fence With hoarding, SUB-3941 | 110 | $25.76 | $2,833.60 |
| 1.8 M Security fence pedestrian gate, SUB-3941 | 32 | $39.52 | $1,264.64 |
| White picket fence, SUB-3941 (TFH002) | 147 | $32.94 | $4,842.18 |
| **Fence Rehire, gross** | | | **$314,054.57** |
| Credit 24405710, mesh panel "Incorrect from PO revised" | ≈ −3,110 | $17.65 | **−$54,890.37** |
| **Fence Rehire, net** | | | **$259,164.20** |
| Barrier – Crowd Control, SUB-3839 | 2,338 | $10.46 | $24,455.48 |
| Barrier – Crowd Control – Flat feet, SUB-3839 | 210 | $10.54 | $2,213.40 |
| Barrier – Crowd Control – Demarcation, SUB-3839 | 4,205 | $15.49 | $65,135.45 |
| **Crowd control Rehire** | | | **$91,804.33** |
| Installation – Labour Fencing (INSTDISMEXTNL) | 1 | $16,591.88 | $16,591.88 |
| Installation – Relocation of Fence (INSTDISMEXTNL) | 1,427.5 | $8.40 | $11,991.00 |
| **Installation** | | | **$28,582.88** |
| Broadcast fence, INV24404307: mesh 144 × 9 days @ $1.74; shade cloth 144 × 9 @ $1.01 | | | $3,569.76 |

Net customer side for fence, crowd control and installation: **$379,551.41 ex GST** ($383,121.17 with the broadcast
compound). No waiver on the fence (LTD Waiver No).
*For this year:* 2025 charged a flat block per panel ($17.65 mesh, $26.75 scrim, $25.76 hoarding, $39.52 gate,
$32.94 picket) — a different basis from this year's per-metre price with removal and V gates included. The relocation
rate $8.40 per unit (1,427.5 units) is the only 2025 relocation figure; this year's 809 m relocation is billed by the
hour with no customer rate.

**Q6 Rates this year lacks — PARTLY ANSWERED.** Found (ex GST): **forklift** AT 068 RT 2.5 t SUB-12501 $2,160.00
block for 17–26 Oct 2025, 10 days = $216.00/day (INV24406710); **scissor** 43 ft $1,421.00 block, 6 days = $236.83/day;
**knuckle boom** 60 ft $181.13/day; **trakmats** $182.69 block each (20, INV24402693) or $3.74/day (INV24406710);
**VMS** block per board $3,747.84 / $3,630.72 (Colour Senior), $3,806.40 / $3,337.92 / $1,112.64 / $409.92 (Senior),
$1,112.64 (Junior), $468.48 (MISCITEM "a" units), $409.92 (SUB-2631), day rates $136.64 / $156.16 / $58.56
(INV24402923) and $52.05/day marketing boards (INV24450559); **water-filled barriers** Armorzone MASH TL2 (Coates
stock code) $6.45–$59.34 block per unit by location group, closing per-day $0.92–$9.03 (INV24404055), Min7 $11.47/day
(INV24402634); **crowd control** $10.46, flat feet $10.54, demarcation $15.49 per unit block; **hoarding** $25.76 per
panel block; **fence feet** $0.98 / $1.10 per foot per day; **waste/holding tanks** on Coates plant 1311337/1311336
at Rate 1 $0 — the toilet block with tanks was $3,133.41 against $2,404.71 without, so the tank read as $728.70 a
block inside the hire; **buildings** $947.31 / $1,093.05 / $1,384.53 / $1,530.27 / $1,894.62 block; **fridge** $45.47
block or $17.05/day, sink $88.04, zip boiler $52.70, microwave $48.69, urn $49.77, desk $5.68, chairs $1.10–$2.19/day,
tables $3.50; **shade cloth** $1.01 per panel per day. Not found: tyne extension, tyne rotator, generators by kVA,
light towers, WPF barriers. **Fuel:** a SUB-FUEL line "Subhired Fuel Charges" Qty 23, memo "Diesel 068", on contract
9753008 at $0 — recorded, not charged.
*For this year:* the forklift settles the open MEAD question by analogy — 2025 charged the AT 068 one block
($2,160.00 for 10 days), not rate × days; this year's Rate 1 $1,483.20 (= card $185.40 × 8 days) reads the same way,
one whole hire, and the page's $11,865.60 (× 8 again) is likely overstated, as STATUS already says. VMS and barriers
this year at $53.61 and $1.18 a day sit in the range of last year's day rates.

**Q7 Damage waiver, environmental, cleaning, fuel — ANSWERED.** Waiver: header "LTD Waiver Yes/No"; where Yes, one
"LTD Waiver Charge" in the totals = **12.5 % of Hire Charges**, never on transport, labour or pump-outs. Yes on every
Kingston (P) and the MEAD invoice (24402693 $1,115.50; 24405588 $300.59; 24405797 $711.96; 24405952 $9,207.78;
24406710 $744.25; 24406837 $15,475.58; 24450559 $52.04); No on the Staplyton fence, VMS and barrier invoices. Two
oddities: INV24404307 keyed a MISCITEM "Damage WAiver" $396.41 as a hire line and the system then added 12.5 % of it
($49.55) — a waiver on a waiver; INV24406837's $15,475.58 is 12.5 % of $123,804.64, not of the $128,209.27 Hire
Charges, so about $4,404.63 of hire (close to the $4,404.96 Pee Panels line) carried no waiver. Total waiver
$27,657.25 ex GST gross. **Environmental charge: none** on any invoice. **Cleaning:** a `CLEAN9` "General Cleaning
Fee" $104.10 per building (INV24405797) or inside the Labour Charge ($104.10 building, $156.15 toilet block). **Fuel:**
no fuel charged; the one SUB-FUEL line is $0.
*For this year:* waiver at 12.5 % of hire is the 2025 basis if this year's contracts have LTD Waiver on; the page's
rule (waiver never on labour, steps, cleaning, pump-outs) matches the paper.

**Q8 Periods — ANSWERED.** Items were billed as **one quoted Block charge for the event**, not by the day or week.
The paper shows it three ways: Days/Mths Chgd `1.00@` with the invoice-date timestamp as the hire period (fence 28 Oct
2025 12:29–12:49; toilets 30 Oct 2025 07:47–20:04; VMS 29 Oct 2025 06:08–09:40) — the printed period is when the
schedule was keyed, not the days on site; or the real on-site days with an Adj Rate = block ÷ days (buildings 18 Sep
to 30 Oct 2025, 43.00 days, $1,384.53 = $32.20/day; event-week buildings 2.00 days, $692.27/day); and in the workbook
Term Dates to 17 Nov 2025 with 19 or 43 Billed Units against one block charge. Per-day billing was the exception
(`Block +`: fence feet, chairs, broadcast fence 9 days, boom and trakmats 10–15 days, barriers' closing 6 days; a
`Min7 Days` Armorzone). Three site buildings (P39 Club 500 Green Room 2, P44 Queensland Ambulance Service, P52
Volunteer Sign On) carry Rate Desc `Daily` and were charged the block rate per day — $4,663.68 ex GST above Block
treatment — and P51 `Daily` for one day. Invoices were raised at off-hire, 28–30 Oct 2025, straight after the 24–26
Oct event, most lines still "Onhire" (progressive); one 23 Nov 2025. Five buildings delivered and off-hired the same
afternoon (28 Oct 2025 17:00: P46, P69, P47, P51, P25) still carried the full block, both transport legs and full
labour.
*For this year:* the event-days rule on the page (three days, both ends billed) is a different basis; 2025's was one
block per item regardless of days, with the day rate × days only for extensions.

**Q9 Branch and P&L — ANSWERED as far as the paper goes.** Three branches, all at 37-45 Mudgee St, Kingston QLD 4114:
**Kingston (P)** = sales analysis code **KINP** (buildings 9772833, broadcast buildings 9774588, toilets 9774835,
broadcast toilet 9774927, hydration station 9773347 — $452,754.31 ex GST gross); **Staplyton (S)** = **STPS** (fence
9773297, broadcast fence 9764733, VMS and barriers 9773725, 9773423, 9792714 — $513,810.94 gross); **Brisbane
Mechanical Specialist** = **MEAD** (broadcast machines 9753008 — $9,998.19). Together $976,563.44. NVAC does not
appear in 2025. Served by Brendan Gill (Ross Saxelby on the MEAD contract); ordered by Brendan Meek or Carl Iannelli. Order
Numbers are the V8s' cost codes — CC 3.12 hydration, CC 3.14 buildings, 3.15 fence, CC 3.16 toilets, 4.03 and 4.05
VMS, PO19126 broadcast fence. Every contract line is coded to a branch (KINP-, STPS-, MEAD-), so in 2025 the job's
revenue sat on the Brisbane branches' P&Ls line by line; nothing on the paper names an Industrial Solutions P&L or
a job code. That is the only P&L signal, and it answers STATUS's P&L question (1) only to the extent that last year
was branch-coded.

---

## 6. Rates — this year's basis is the Street Rate Card 2026, not a comparison with 2025

An earlier draft of this section set 2025's invoiced rates beside this year's Rate 1 figures and flagged lines as "well under". Withdrawn on Andrew's word (1 Oct 16:48–16:55: "I don't need you flagging info from last year"; "this info is literally trying to help us come up with correct logic on how things are getting priced … and split things into the correct kitty"). This year's rates are the 2026 card's (`../reference_street_rate_card_2026/`): one hire figure for the event per line, with install, demob and the pump-outs charged as their own lines — which is why a 2025 one-line toilet figure and a 2026 hire figure are not the same thing and are not compared. What the 2025 paper is for is the **logic**: which line each charge went to (hire · transport · installation · pump-outs · waiver), which is section 2 above and the kitties in section 5.

## 7. Fencing: last year's customer side against Advanced's purchase orders

Advanced's 2025 purchase orders (reference_2025_fencing): **$334,666.32** — build weeks $215,239.59, Event Week
$95,811.62, bump-out $23,586.43 — Coates's cost, read as ex GST. The customer side from section 5:

| Customer side 2025, ex GST | Amount |
|---|---|
| Fence Rehire, SUB-3941, net of credit 24405710 (mesh, scrim, hoarding, gates; excl. white picket $4,842.18 from TFH002) | $254,322.02 |
| White picket fence (TFH002) | $4,842.18 |
| Crowd control Rehire, SUB-3839 (ZNC001) | $91,804.33 |
| Broadcast compound fence and shade cloth (ZNC001) | $3,569.76 |
| Installation – Labour Fencing + Relocation (Coates-coded STPS-INS, no supplier) | $28,582.88 |

What the recovery is depends on what Advanced's POs covered, which neither folder says:

| If Advanced's $334,666.32 covered … | Customer side | Rehire Recovery |
|---|---|---|
| the fence only (mesh, scrim, hoarding, gates, broadcast), hire only | $257,891.78 | **0.77** |
| the fence and the installation labour | $286,474.66 | **0.86** |
| all ZNC001 hire lines (fence + crowd control + broadcast) | $349,696.11 | **1.04** |
| all ZNC001 hire lines and the installation | $378,278.99 | **1.13** |

Two things decide it. (a) Is ZNC001 Advanced? The SUB-3941 fence, SUB-3839 crowd control and SUB-4865 shade cloth all
carry the same supplier code, and Advanced's POs were "as per quote 26181", one quote for the job — so most likely yes,
and the crowd-control barriers were part of the same supply. (b) Was the $28,582.88 of Installation Advanced's crew
(this year the green book) or Coates's own? If (a) yes and (b) Advanced, last year's fencing recovery was about
**1.13** (gross $378,278.99 charged against $334,666.32 paid), and about 1.04 on the hire alone. If the crowd
control was bought elsewhere, the fence recovery was under 1.0 — the $54,890.37 credit took the mesh from 11,361 to
about 8,251 panels, and that is where the margin went.

Shape, not just totals: 2025 charged the whole fence in one block on 28 Oct 2025 (one invoice, one credit); Coates paid
Advanced week by week (eleven POs). This year the page accrues fencing cost and revenue by programme week; last year's
paper does not support a weekly customer-side comparison.

---

## 8. What the paper does not tell us

- Whether these fourteen are all of 2025's invoices. Two contract sheets (Coates's own site set-up and the November
  VMS return) have no invoice and no charge; the progressive invoices (24405952 170 lines Onhire, 24406837 most lines
  Onhire, 24405797 EVS Onhire) may have had later invoices that are not here.
- The actual on/off-hire dates for the block-charged items (the printed hire periods are keying timestamps); the
  workbook's Term Dates (17 Nov 2025 on most SUB lines) are the nearest thing.
- The supplier behind ZNC001, TFH002, UPH004, QUE011, BLA034 by name; Advanced is not named anywhere in the export.
- What Advanced's purchase orders covered (fence only, or crowd control and installation too) — the recovery hinges
  on it (section 7).
- The metres: the fence was charged per panel, so no per-metre rate can be read for this year's per-metre basis.
- Any water-truck, pre-fill, generator, light tower, tyne extension, tyne rotator or WPF rate.
- Why four hire-schedule lines on INV24402923 and eight on INV24403996 were never billed, and why WC20.2's
  Installation & Dismantling printed $67.98 against a $707.88 build-up.
- Possible double billing between INV24402923 and INV24403996: plant 1270772 as "VMS 02a" (3 days $175.68) and
  "VMS 02" (block $3,630.72); 1211347 as "VMS 03A" ($468.48) and "VMS 3" ($3,337.92); 1211643 as "VMS 19" ($409.92) and
  "VMS 9" ($1,112.64); VMS 12 Transport $300.00 on both. And the three `Daily` buildings on INV24405952 ($4,663.68
  over Block). Noted, not asserted; last year's, not ours to fix.
- GST on Advanced's POs (read as ex GST).

---

## 9. Proposed next steps for Andrew

**Questions for the branch (Kingston (P), Staplyton (S)):**

1. Transport. Last year every reference carried a `TRANSPORT` line at $500 / $800 a leg ($91,862.00 ex GST across the
   job; $53,400.00 on the buildings contract alone). This year's contracts carry $6,938 against $22,011.39 paid to
   carriers. Are the delivery and pickup lines still to be raised per reference, as in 2025, or is transport inside
   this year's event rates? (STATUS "Waiting on Andrew" (2).)
2. Labour. 2025 charged Installation per reference at $655.83 a building and $707.88 a toilet block, $176.97 a VMS
   board, plus Project Manager (17 × $145.74 twice) and Accommodation & travel ($19,101.60). Which of these go on
   this year's contracts, and at what 2026 rates? (STATUS (3) and (4).)
3. Water. 2025 charged a Hydration Station Rehire line $5,270.13 + transport $862.00 + fill $491.87. Will the branch
   put a rate on this year's drinking-water tank and deliveries, and are the water truck and pre-fill inside the
   servicing lines as in 2025?
4. Fencing. Was ZNC001 Advanced, and did quote 26181 cover the crowd-control barriers and the installation crew? Then
   last year's recovery can be stated (section 7). Also: 2025 charged per panel at a block; this year per metre —
   confirm the basis and that removal is in the per-metre price.
5. Forklift. 2025 charged the AT 068 one block ($2,160.00 for 10 days). Confirm MEAD 9968726 line 1's $1,483.20 is the
   whole hire, not a daily rate (the page shows $11,865.60).
6. Waiver. LTD Waiver was on for the Kingston (P) contracts in 2025 (12.5 % of hire). Is it on for this year's KINP
   contracts?
7. P&L. 2025's lines were coded KINP / STPS / MEAD; does this year's job report into the same branch P&Ls or into
   Industrial Solutions? (STATUS (1).)

**Page changes — proposals only, v7.70 or later, none done:**

- A Transport Revenue line per reference at a branch-confirmed leg rate, so Transport Recovery is read against charged
  lines rather than $6,938 (after Q1 is answered).
- The expected-labour per unit already pre-loaded on the page: offer the branch the 2025 components ($145.74 install,
  $156.15 steps, $52.05 / $104.10 levelling, $104.10 / $156.15 cleaning, $52.05 fire extinguisher, $145.74 demob) as
  the starting point to confirm, not as rates to copy.
- The four water lines: keep v7.69's at-cost rule; if the branch rates a Hydration Station line, replace the at-cost
  figure with it.
- Fencing: no change until Q4 is answered; then, if useful, a note on the Costs tab that 2025's fence was charged per
  panel in one block (reference only, not a figure).
- Nothing from 2025 on the page itself (Andrew, about 16:25: "I don't wanna see last year's").
