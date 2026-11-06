# Generator standdown audit — 13 Oct 2026

Author: Andrew Fisher

The existing generator hire calculation follows Andrew's rule. Charge the delivery day and every day through Thursday 22 October at the published Standby Rate 2026; charge Friday 23, Saturday 24 and Sunday 25 October at Daily Rate 2026; charge nothing from Monday 26 October. Physical pickup dates remain separate.

The original rate workbook was reopened, SHA256 `60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`, Street Rate Card 2026 cells A66:D79. All 14 published generator sizes match the model. For 200 kVA the visible daily rates are $182.28 standdown and $364.56 race weekend. Source precision is retained until each contract line is rounded, as already agreed; the calculation uses the published standby column rather than inventing a replacement rate.

Fresh public read at 18:01 AEST and the combined candidate read at 18:02 AEST, native record 5698, give the same totals (AUD ex GST):

| Generator Hire Revenue | Confirmed arrivals | Remaining forecast | Combined |
|---|---:|---:|---:|
| Standdown portion | $21,132.58 | $3,884.69 | $25,017.27 |
| Complete hire charge | $28,196.40 | $9,333.73 | $37,530.13 |
| Generator quantity | 9 | 9 | 18 |

Actual represents the complete hire period for confirmed arrivals, including the coming race weekend. Pending arrivals remain forecast. Each source contract line enters the shared totals once. Costs, P&L, reference charges, branch totals and October allocation reconcile. These are generator hire figures only; installation, transport and other charge categories are audited separately.

Validation: 103 fresh-public checks and 103 combined-candidate checks; 184 independent Decimal comparisons against the original workbook; existing 87 finance and 36 source boundary/identity tests. No failed checks, browser errors or live writes. Candidate audited: SHA256 `22cee753bc0974bd4c1e28c56b047b6e9388b6fe5dfc3e2445993e104f0cbecf`. The generator finance source is unchanged from v10.05. Run `check_standdown1006.cjs` against the final candidate again if integration changes it; `audit_standdown1006.py` consumes its private detailed outputs and checks the original rate card independently.

Two contract-only spares still have no recorded destination: contract 9961976 lines 32 and 39. Their quantities, planned dates and forecast hire are priced, but their exact locations cannot be described as verified. Unconfirmed plant numbers remain omitted. No generator application code or operational record was changed by this audit.
