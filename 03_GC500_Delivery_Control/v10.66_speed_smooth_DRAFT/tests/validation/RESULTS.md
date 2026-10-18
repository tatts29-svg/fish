# v10.66 validation evidence

Author: Andrew Fisher

Validated on 18 Oct 2026. This records this validation scope; standing regressions, standard sweeps, publication and
exact live read-back are owned by the release coordinator and are not inferred from these results.

- Baseline v10.65 SHA256: `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
- Candidate v10.66 SHA256: `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`; 18,322,548 bytes.
- Desktop: 1440 × 900, normal CPU. Phone: 390 × 844, DPR 2; performance runs use CPU ×4 throttling.
- Functional comparisons use the same frozen record and 18 Oct 2026 09:30 AEST clock. Performance uses real timers
  and the same frozen API/weather replies. Every browser runs serially with operational writes blocked.

| Functional check | Desktop | Phone |
| --- | --- | --- |
| Complete pane/day/drawer/header/footer comparisons | 171/171 | 171/171 |
| Panes / sampled Build days / sampled reference drawers | 24 / 23 / 31 | 24 / 23 / 31 |
| Initial boot, deep links, delayed record, cached offline and recovery | 21/21 | 21/21 |
| Actual native Print and browser PDF semantic parity | Both pass | Both pass |
| Page errors / unexpected console errors / write attempts | 0 / 0 / 0 | 0 / 0 / 0 |

Complete canonical records agree and remain stable. The separate boot gate verifies complete initial collection/scope
hydration without manual repair. Print checks exercise the mandatory confirmation UI and retain the native finance
lifecycle. Extracted PDF/report text and models agree; PDF binary/pixel identity is not claimed. The final settled
phone Today screenshot was inspected and remains private. Eleven comparator contract checks pass.

The original desktop comparison matched 167/171. The four remaining capture differences were traced to a percentage
animation still running, hidden-report materialisation after screen finance filtering, and the exact footer version
boundary. Bounded Today/progress recaptures validate source, clock and full-record identity; the other 167 original
checks remain unchanged. No figures or semantic differences are dropped. The README documents the transparent
baseline hydration setup and why initial baseline hydration is not claimed equivalent.

## Minimum controlled performance

One A/B sample per viewport, not medians. Both arms start the same timed tab sequence from Today. Browser contexts
are fresh, static assets cached, and API/weather replies frozen. These numbers are not a production mobile-network
SLA. The requested three-pair benchmark remains extended follow-up.

| Transition | Desktop seconds: base → candidate | Reduction | CPU ×4 phone seconds: base → candidate | Reduction |
| --- | --- | --- | --- | --- |
| First Build | 2.085 → 1.101 | 47.2% | 10.231 → 5.421 | 47.0% |
| Today | 1.603 → 0.890 | 44.5% | 7.596 → 3.874 | 49.0% |
| Equipment | 0.568 → 0.484 | 14.8% | 2.709 → 2.320 | 14.4% |
| Map | 0.342 → 0.246 | 28.0% | 1.811 → 1.187 | 34.5% |
| Build revisit | 0.846 → 0.707 | 16.5% | 4.088 → 3.029 | 25.9% |

Selecting another Build day measured 0.615 → 0.522 s desktop and
2.745 → 2.325 s on the throttled phone.

Candidate Today became usable in 2.624 s desktop and 11.171 s phone, missing the <2 s / <8 s goals.
The baseline cold route was Map and the candidate route Today, so cold-load timing is **not** claimed as an A/B gain.
Desktop Equipment and Map meet 500 ms completion; the remaining desktop transitions and every phone transition
still miss that goal. Every measured feedback frame opportunity meets 100 ms and load/tab CLS stays below 0.02.
A frame opportunity is not a screenshot-proven visual response.

Post-usable load-window maximum long tasks were 95 ms desktop and 390 ms phone; the phone misses the 250 ms goal.
Tab transitions also contain longer tasks: the largest measured candidate transition task was
930 ms desktop and 4860 ms phone. Per-transition details are retained in `results.json`.

Each candidate phone idle window ran for at least 60 seconds after warm-up. Top-level main-thread TaskDuration was
Today 5.11%, Build 8.48%, Map 4.98%; all miss the <2% goal. Maximum idle long task was 156 ms. No baseline-idle or desktop-idle improvement is claimed.
TaskDuration is not total-device/GPU utilisation. These results establish measured gains and remaining limits,
not “no lag” or a pass of every aspirational target.

Raw records, financial text, exact semantic deltas, PDFs, screenshots, browser logs and profiles remain outside the
repository. `results.json` contains only source identities, validation outcomes and performance measurements.
