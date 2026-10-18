> **LIVE within v7.73 — 1 Oct 2026 18:19 AEST.** Final proof: `../v7.73_crystal_LIVE/evidence/release_verification.json`.

# v7.70 — the Forecast P&L in the business's lines

Author: Andrew Fisher · 1 Oct 2026

**Corrected draft for the combined v7.73 release. Final combined-build verification and upload are pending.**
Earlier builds and recorded browser results are historical and do not validate the corrections described here.

Andrew asked for the GC500 forecast in the business's terminology, with each charge in the correct category and
clear information for management. The original July 2026 P&L supplies the ledger names; the issued Street Rate Card
2026 and current project records supply the charging basis. No prior-year operational amounts are introduced.

## What the card shows

The card sits below the Forecast P&L, before Costs to job end. Its two columns are **on the record** and **to job end**.
It reads the existing financial models and reconciles its Revenue and known costs back to those models. Reconciliation
checks arithmetic; the separate classification tests check that the components reach the appropriate rows.

| Revenue row | Basis |
|---|---|
| 1005 Hire Revenue | Contract charges less delivery and hired-in lines, plus fire extinguishers ticked per piece. |
| 1010 Rehire Revenue | Hired-in contract lines and fencing. The fencing rate still bundles hire and installation; its allocation remains provisional until the branch provides the split. |
| 1030 · 1031 Transport Revenue | Delivery and pickup charge lines on the contracts. |
| 1032 Toilet Pumpouts | Servicing at the card's rates, with the water truck and pre-fill charged on at cost. |
| 1020 Consumables | Water deliveries and the drinking-water tank charged on at cost. |
| 1047 Installation | Install, steps, levelling and demob ticked per piece, plus the event scope's stated **people** charge. |
| 1025 Cleaning | Cleaning ticked per piece, kept separate from Installation. |
| Event accommodation and travel — allocation pending | The support part of the event scope remains Revenue on a separate row with **no ledger code** until Finance confirms its allocation. |
| 1015 Damage Waiver | No assumed rate; the branch supplies the applicable charge. |

If the event scope has no usable people/support split, its whole amount remains on an unallocated Revenue row.
Nothing is guessed into Installation. An explicitly hourly-only scope remains labour. These classifications preserve
the existing Revenue total. Unticked future per-piece labour remains in the separate Labour forecast; it is not
silently added to this card's job-end Revenue.

The cost rows separate Rehire, Toilet Pumpout Costs, Consumables, Transport, Installation — external contractors and
R&M. R&M (2357) remains within direct costs. Travel, accommodation, meals and printing sit separately below those
lines; they remain included when reconciling to the existing project's **Direct costs known** total. Wages retain
their separate treatment and the unresolved Finance allocation between Temporary Staff, Direct Staff and Installation.

Event Portables quote lines are grouped by their descriptions, with each quote's delivery and pickup allocated to
its largest category. If the approved quote split does not reconcile, the whole approved amount remains on Rehire
and the card explains that fallback. Supplier figures are described as recorded or forecast costs, not proof of payment.

## Difference and recovery

The card uses **Difference before overheads** and **Difference so far — not a margin yet**. Missing supplier costs,
unpriced wages and incomplete transport figures remain limitations; a positive difference is not a completed margin.

**Rehire Recovery is unavailable while fencing Revenue bundles installation, supplier costs are missing, or the quote
cost categories do not match Revenue.** The card explains what is needed. It calculates a formal ratio only for
matching, complete scope. The existing Rehire by branch card's combined cover against known costs remains a separate
view and is not substituted for formal Rehire Recovery.

Transport Recovery groups cartage and pump-outs as the P&L does, with cartage shown separately in its explanation.
Consumables Recovery names charges still awaiting recovery. Installation Recovery remains unavailable while the
fencing split and relevant labour costs are unresolved.

## Verification

- `evidence/classification_regressions.js`: **10/10 offline synthetic checks pass** on the corrected model. Covers
  cleaning/fire classification, people/support allocation, unknown and zero-person splits, hourly-only labour,
  unchanged totals, R&M and unavailable versus valid recovery ratios. Accepts the patch or a built page as input.
- `evidence/practice_tests.js`: browser checks wait for **all shared-record collections to finish their initial sync**
  before rendering and asserting. Expectations now check people-only Installation, separately unallocated support,
  fire extinguishers in Hire, and unavailable Rehire Recovery while scope/costs are incomplete.
- Final desktop/phone checks, sweeps and visual review must be run on the combined v7.73 build before release. Earlier
  standalone v7.70 and combined v7.72 evidence is historical; no earlier byte count or pass total applies to the
  corrected release.

Build the corrected chain on the current live page:

```bash
bash toolchain/build.sh v7.73 v7.70_pl_in_the_business_lines_LIVE/patch_v770.py v7.72_tidy_for_management_LIVE/patch_v772.py v7.73_crystal_LIVE/patch_v773.py
```

This patch adds the financial presentation and its navigation entry. It does not edit shared records, create a
customer invoice or post a ledger journal. Source gaps such as missing supplier costs, recoverable transport charges,
damage waiver and unallocated event support remain visible for completion.
