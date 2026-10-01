# Review of v7.64–v7.67

Author: Andrew Fisher · 1 Oct 2026

Read-only review of the drafts. The evidence uses invented rows and round numbers, reads the JavaScript literals
from the actual patches, and makes no network requests or record changes. It does not modify the claimed patches.

Run from `03_GC500_Delivery_Control`:

```sh
node review_v764_v767/evidence/synthetic_regressions.js
```

The reviewed drafts fail six checks. A non-zero exit is expected until the defects are corrected.

| Source | Reproduction and correction needed |
|---|---|
| `v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py:59` | Unchanged outstanding fencing vanishes when its programme week ends. Keep the forecast or explicitly list the unresolved quantities and exposure; an elapsed date is not completion. The fixture currently asserts retention in the forecast. If the fix reports a separate unresolved amount, adapt the assertion to check that output instead. |
| `v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py:90` | The existing P&L honours a recorded transport replacement by reference, but the new forecast still adds the reference's card estimate. Reuse the replacement rule. |
| `v7.66_rehire_by_branch_DRAFT/patch_v766.py:69` | Fencing Rehire cost includes installation. Use `fencePaidSplit().gear` and show installation separately. The attempted note on line 71 reads nonexistent `dockets`, `rehire` and `labour` properties; the source supplies `gear`, `installation`, `docket_labour` and `green`. |
| `v7.66_rehire_by_branch_DRAFT/patch_v766.py:66` | Excluding the entire NVAC branch drops marked hired-in non-forklifts. Conversely, a marked toilet can enter two groups. Track the rows actually grouped and count each once. |
| `v7.67_priced_by_us_DRAFT/patch_v767.py:60` | The word “extension” matches different dimensions and produces a “same thing” instruction. Require compatible specifications and rate units before recommending an amount; a weekly rate is not automatically a whole-event rate. |

No independent v7.65 layout or binding defect was identified. After correction, rerun the synthetic checks,
the releases' focused checks, both sweeps and phone inspection before marking the combined draft ready.
