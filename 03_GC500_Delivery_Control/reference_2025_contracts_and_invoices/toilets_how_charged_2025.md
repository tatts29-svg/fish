# How the portable toilets were charged last year — INV24406837 decoded (reference only)

Author: Andrew Fisher · 1 Oct 2026, 19:00 AEST · nothing from this goes on the page (Andrew, 18:20)

Andrew, 1 Oct 18:50: "take note of how portable toilets were charged last year with sub-hired and ours — does this make
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

## 6. Where this year's contracts do NOT line up with last year's quoted rates

The 2026 Rate 1 figures on the toilet lines, against 2025's invoiced rates (2025 + 3 % shown for the lines that moved
by that):

| Line | 2025 invoiced, each | 2026 Rate 1, each (export of 1 Oct) | Reading |
|---|---|---|---|
| 6 × 3 toilet block | $2,404.71 · $3,133.41 | **$2,476.85 · $3,227.41** | **+3.0 %, lines up** |
| FWF toilet with trailer | $237.71 | **$237.71** | the same |
| **Fresh Water Flush toilet** (222 units on 104 lines, sub-hired and Coates alike) | **$237.71** | **$90.07** | **38 % of last year's** |
| **Accessible / disabled-access toilet** (4) | **$1,380.24** | **$337.75** | **24 %** |
| **16-pan block** (2) | **$4,306.31** | **$2,852.13** | **66 %** |
| Pee panels (WC09, 6) | $4,404.96 the set | on the FWF line at $90.07 each | not the same thing |

Rate Type is W on every 2026 line, blocks included, and the blocks are plainly whole-event figures — so the three
lines above are not "weekly rates"; they are quoted figures well under last year's. If the branch confirms last year's
basis plus 3 %, the difference on this year's quantities is about **$42,000 of Rehire Revenue**: FWF 222 × ($244.84 −
$90.07) ≈ $34,360; accessible 4 × ($1,421.65 − $337.75) ≈ $4,340; 16-pan 2 × ($4,435.50 − $2,852.13) ≈ $3,170. The page
charges what the contract says (Rate 1); it cannot decide this. **A question for the branch, with this invoice beside
it.**

Two revenue lines the page does not carry at all yet, which last year's invoice does: **transport per movement**
($500 each way per block — this year's contracts carry $6,938 of delivery and pickup in all) and **LTD waiver** (12 %
of hire).

## 7. Does it make sense with our rate cards?

Yes. The page already does what the 2025 invoice shows: one Coates rate per unit whether the unit is ours or
Event Portables'; servicing at the card's pump-out rates; labour per piece at the card's five figures; the event
labour scope and accommodation charged on. The 2025 figures are last year's quoted rates; this year's blocks are those
plus 3 %, and the 2026 street card the page falls back to carries the current figures. What the invoice exposes is not
the page's method but **three contract lines quoted low** (FWF, accessible, 16-pan), and **two lines missing from this
year's picture** (transport per movement, LTD waiver). None of it goes on the page as "last year's"; it goes to the
branch as this year's questions.
