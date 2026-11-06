# How the portable toilets were charged last year — INV24406837 decoded (reference only)

Author: Andrew Fisher · 1 Oct 2026, 16:38 AEST · nothing from this goes on the page (Andrew, about 16:25)

Andrew, 1 Oct 16:34: "take note of how portable toilets were charged last year with sub-hired and ours — does this make
sense to you now with our rate cards, keeping in mind these would be 2025 rates." The invoice is
`invoices/INV24406837.PDF` (SHA-256 `cc47c2bc…`): Coates Hire Operations, Kingston (P), tax invoice 24406837 of
30 Oct 2025 to V8 Supercars Aust Pty Ltd ATF AVESCO Unit Trust, hire schedule 9774835, 105 lines over 8 pages, a
progressive invoice (most lines still "Onhire"). **$243,153.80 ex GST** = Hire Charges $128,209.27 + Other Charges
$99,468.95 + LTD Waiver Charge $15,475.58; GST $24,315.36; $267,469.16 inc.

## 1. Sub-hired and Coates toilets were charged the same way, at Coates's rates

| What | Item code on the invoice | 2025 customer rate, ex GST | How charged |
|---|---|---|---|
| Fresh Water Flush toilet, **sub-hired** (Event Portables gear) | SUB-2103 | **$237.71 / $238.07 each** | once for the event ("1.00 @ … QR" — Quoted Rate, "charged 7 days per week"), one line per location, qty = units (WC07 20, WC09 10, WC31 20, WC33 17, WC56 12, WC71 8 …) |
| Fresh Water Flush toilet, **Coates's own** (1114551, 1114525) | plant number | **$237.71 each** | the same line, the same rate |
| FWF toilet with trailer (Coates 1201763, 1190564; sub-hired WC100) | plant number / SUB-2103 | $237.71 (Coates) · $1,249.62 (WC100 trailer unit) | once |
| Disabled-access toilet | SUB-3636 | $1,380.24 each | once (WC01, WC31, WC51, WC86) |
| Pee panels (WC09) | SUB-4865 | $4,404.96 the set | once |
| 16-pan toilet block | SUB-14032 | $4,306.31 | once |
| 6 × 3 toilet block, Coates's own (1311147, 1311140, 1311145, 1311146, 272839, 417726, 1311141–1311144) | plant number | $2,404.71 · $3,133.41 · $3,940.34 | once |
| Toilet block male/female cyclone rated 6 × 3, Coates (1303837, WC05) | plant number | $4,672.29 | once |
| Tank-mounted toilet block, **sub-hired** (WC27 SUB-3699; WC60 ×2 SUB-2028 male and female) | SUB | $4,672.29 each | once |

So last year the V8s paid **one Coates rate per unit for the event**, whether the unit was Coates's or Event Portables'.
That is exactly the page's rule for Rehire: charged to the V8s at **our** rates as if the gear were ours, with the
supplier paid separately. The sub-hired lines sat on SUB item codes; Coates's units on plant numbers.

## 2. Per Coates toilet block: transport and install/dismantle, as separate lines

| Line | Item code | 2025 figure |
|---|---|---|
| "WC15.1 – Transport Charge" | TRANSPORT | **$500.00 × 2 = $1,000.00** (delivery and pickup), per block |
| "WC15.1 – Installation & Dismantling Charge" | INSTDISMEXTNL | **$707.88** = Install $145.74 + Steps $156.15 + Levelling $104.10 + Cleaning $156.15 + Demob $145.74 |

Those five labour figures are **the card's per-piece labour figures the page uses today** (headed 2025 on the card).
The page ticks them per piece: WC60's two blocks are ticked install, steps and levelling ($405.99 each) with cleaning
and demob to come, which lands exactly on last year's $707.88 a block.

## 3. Servicing as PUMPOUT lines, at the card's pump-out rates

| 2025 line | Amount | At the card's rate that is |
|---|---|---|
| FWF Pumpout Service and clean | $56,182.77 | 771 × $72.87 |
| Sewer connect clean and restock | $6,246.00 | 24 × $260.25 |
| Tank Pumpout and clean | $13,116.60 | 21 × $624.60 |
| FWF Pumpout Service Pre Event | $2,186.10 | 30 × $72.87 |
| | **$77,731.47** | |

This year's page prices Event Portables' quantities on Q6844 at the same three card rates (780 × $72.87, 51 × $260.25,
24 × $624.60 = $85,101.75). **The page's servicing line is how the servicing was billed last year, line for line.**

## 4. Event crew, project manager, accommodation — charged to the V8s

| 2025 line | Item code | Amount |
|---|---|---|
| Labour – Event Crew | INSTDISMEXTNL | $2,721.07 |
| Installation – Project Manager | INSTDISMEXTNL | $2,477.58 |
| Labour – Event Crew Concert Sat Night / Friday Night | INSTDISMEXTNL | $420.33 · $376.08 |
| **Accomodation and travel** | INSTDISMEXTNL | **$9,550.80** |

So the event labour scope and the accommodation **were revenue lines last year**, as Installation. This year's page
carries "Event labour — the scope" ($55,817, 368.9 h of people over the event plus accommodation and travel) on the
same footing. Accommodation is a cost to Coates *and* a charge to the V8s — the P&L guide's "overhead" note is about
where Finance posts the cost; the charge side is Installation revenue.

## 5. LTD Waiver — a line of its own

**$15,475.58 on Hire Charges of $128,209.27 — 12.07 % of the hire** (header "LTD Waiver: Yes"). Damage waiver on
the hire only, never on labour, steps, cleaning, install/demob or pump-outs — the rule already in `AGENTS.md`. This
year's page carries **no damage-waiver line**; the 2026 export's waiver fields are empty. One for the branch: does LTD
waiver apply to the 2026 contracts, and at what rate.

## 6. What this year's card does with last year's one figure (corrected 1 Oct 16:58)

An earlier draft of this section read the FWF, accessible and 16-pan Rate 1 figures as "quoted low" against last
year's. That was wrong, and Andrew put the Street Rate Card 2026 beside it (16:50: "you add the hire and the pump-out,
it equals what was charged, almost"; "this info is literally trying to help us come up with correct logic on how things
are getting priced … and split things into the correct kitty"). The card is in `../reference_street_rate_card_2026/`.

| Card line (2026) | Daily | Hire for the event | Labour per piece | Pump-out |
|---|---|---|---|---|
| Portable FWF Single | $4.29 | **$90.07** = 21 days | install $36.44 · demob $36.44 | $72.87 a visit |
| Accessible Toilet 3.6 × 2.4 | $16.08 | **$337.75** = 21 days | install $88.49 · demob $88.49 | $72.87 a visit |
| 16 Pan Unit | $40.74 | **$2,852.13** = 70 days | the block's five figures | $260.25 (sewer) · $624.60 (tank) |
| Sewer Combo / Tank Mount 6 × 3 | $35.38 / $46.11 | $2,476.85 / $3,227.41 = 70 days | the five figures | as above |
| Waste Tank 6m (Additional) | $10.72 | $750.56 = 70 days | install $145.74 · levelling $104.10 · cleaning $156.15 · demob $145.74 | — |

$90.07 hire + $36.44 install + $36.44 demob + one $72.87 pump-out = **$235.81**, which is last year's one-line figure
near enough. So this year's card **splits** what last year's line bundled: the hire is the hire, the labour is the
labour, the pump-outs are the pump-outs — each into its own kitty. The contracts' Rate 1 on those lines is the card's
hire figure and is right; the page charges the labour per piece and the servicing per visit as their own lines, which
is the card's logic. **Nothing on those lines is a question for the branch.**

Two kitties the card names that the page does not carry yet: **damage waiver** (the card: "Prices exclude GST and
damage waiver … no damage waiver to be charged on labour / steps / fire extinguishers / cleaning / installation &
demobilisation / pump outs" — so waiver on the hire only, at a rate the branch sets) and **transport** (the card has
no transport line; the contracts carry $6,938 of delivery and pickup lines). Both are this year's questions, from this
year's card.

## 7. Does it make sense with our rate cards?

Yes. The page already does what the card says: one Coates rate per unit whether the unit is ours or Event Portables';
servicing at the card's pump-out rates per visit; labour per piece at the card's figures; the event labour scope and
accommodation charged on as Installation. What the 2025 paper is for is the logic and the kitties — which line each
charge goes to — not a comparison of figures. None of it goes on the page as "last year's".
