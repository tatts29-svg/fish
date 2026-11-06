# v10.40 — event-night servicing charged per unit, per night — LIVE 16 Oct 2026 13:16 AEST

Author: Andrew Fisher. Andrew, 16 Oct 2026: "here is a new charge for these areas to add in. This gets charged Friday,
Saturday and Sunday night for each unit: FWF Pump out & Clean & Restock $72.87; waste tanks — Tank Pump Out & Clean &
Restock $624.60; toilet blocks with no bottom waste tanks — Sewer Connect Units Clean & Restock $260.25 … mention the
charge for each night then a total for all 3 nights." Then: "the charges I mentioned is what we charge the V8s. We pay
Event Portables for their service."

The servicing charged to the V8s took its quantities from Event Portables' quote Q6844 (780 FWF services, 24 tank
pump-outs, 51 block cleans). It now counts what is on each reference, per night, for the three event nights the page
holds (Fri 23, Sat 24, Sun 25 Oct): every FWF unit, every waste tank, and every toilet block on a reference with no
waste tank (a block with a tank is serviced through its tank, not charged twice). A rate typed on Pricing still stands.
The water lines (charged at what Event Portables charge us) and the cost side (what we pay Event Portables, on Costs)
are unchanged. Each reference's drawer shows the charge each night and the three-night total; Pricing and the P&L add
up from the same figures.

| Service | Units on the page | A night | Three nights |
|---|---|---|---|
| FWF Pump out & Clean & Restock $72.87 | 233 | $16,978.71 | $50,936.13 |
| Tank Pump Out & Clean & Restock $624.60 | 6 | $3,747.60 | $11,242.80 |
| Sewer Connect Units Clean & Restock $260.25 | 11 (WC09, WC15, WC16, WC17, WC31, T0243) | $2,862.75 | $8,588.25 |
| **Servicing charged to the V8s** | | $23,589.06 | **$70,767.18** (was $85,101.75 on the quote's quantities) |

Not counted, for Andrew to say: Accessible Toilet ×4, FWF Trailer ×2, Pee Panel ×6 (none named in his three charges).

Tests: `tests/test_nights1040.cjs` 11/11 (per-line quantities, WC09 $728.70 + $520.50 a night = $3,747.60, WC05's tank
not doubled with its block, buildings carry none, drawer table, water lines unchanged, no page errors). Sweeps desktop
and phone 24/18, 0 errors. Build sha256 `2d8b11f513590dd3031fb6582e660b5d9183a3ea706d739476f879dddc47dd95`, 18057303 bytes, on live v10.39 `fa44b754…`.
