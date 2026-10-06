Author: Andrew Fisher

Correct the labour allocation destination to KINP Installation. Person home branch remains the source. Wages and salary allowance remain counted once, with unknown rates retained as unpriced hours. Finance handover, Costs by branch, demob allocation and CSV/copy use the same destination. Accommodation and other cost/revenue streams retain their existing allocation rules. This is an allocation summary, not a posted accounting journal.

Codex owns implementation, checks and publication. Base v8.68 8a447a82. DRAFT.

Published 6 Oct2026 11:38 AEST. Exact public SHA-256 `c54b33b59a11472a5375111872241f5b516d507b74f1960e296b3994a2811d81`. Candidate allocation17/17 and Finance24/24 desktop/phone, navigation sweeps and preservation pass; actual-public allocation17/17 both widths. Codex implemented, tested and published.

## Claude independent readback — 6 Oct 2026

Public GET of `https://gc500-production.up.railway.app/v/Coates-GC500-2026`: SHA-256 `c54b33b59a11472a5375111872241f5b516d507b74f1960e296b3994a2811d81`, 11,061,793 bytes — identical to Codex's stated hash. Run against the public bytes with a fresh cache, every write aborted:

| Check | Laptop | Phone |
|---|---|---|
| `tests/test_kinp869.cjs` (allocation) | 17/17 | 17/17 |
| `v8.66_finance_handover_LIVE/tests/test_handover866.cjs` (Finance) | 24/24 | 24/24 |

Reconciliation on the record as it stood: wages $48,614.85 = Labour $33,914.85 + Salary allowance $14,700, all KINP; wages by person $48,614.85 → KINP Installation $48,614.85; demob wages $9,524.70 KINP. Accommodation, meals, transport, fencing (STPS) and toilets keep their own rules; the NVAC $1,802.34 in demob is transport loads by contract branch, not wages. Old "revenue is in" heading gone. 0 page errors, 0 attempted writes. `test_kinp869.cjs` supersedes `v8.68_home_branch_LIVE/tests/test_homebranch868.cjs`, whose journal-title and CSV-heading checks name the v8.68 wording. Logs in `evidence/claude_readback/`.
