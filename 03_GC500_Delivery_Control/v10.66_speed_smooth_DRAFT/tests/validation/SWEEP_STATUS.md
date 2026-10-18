# Final standard sweeps — passed after network recovery

Author: Andrew Fisher

The final unchanged canonical `toolchain/harness/sweep.js` passes at desktop and phone sizes on
candidate `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.
Both use fresh API replies and original assets. The existing `assert_sweeps1068.cjs` validates
all 24 tab routes and intentional aliases, seven exact deep-link destinations and browser Back.

| Final check | Desktop | Phone |
| --- | --- | --- |
| Tab routes / exact deep links | 24 / 7 | 24 / 7 |
| Back returns to Equipment | Pass | Pass |
| Page / console errors | 0 / 0 | 0 / 0 |
| Early page errors / failed network responses | 0 / 0 | 0 / 0 |
| Operational write attempts | 0 | 0 |

An observation-only preload captures early errors, full stacks and failed responses privately;
it does not alter routes, responses or page behavior. The strict checker passes both final reports.
The candidate bytes are unchanged from the earlier parity, boot, print and performance evidence.
This completes the validation-owned gates; publication and exact live read-back remain with the
release coordinator. This document itself does not claim LIVE.

## Earlier outage evidence, retained separately

Earlier attempts were correctly blocked. A cache-only run lacked 16 original requests and was
not called a pass; no placeholders or synthetic map responses were used. A later live-connected
attempt saw 36 HTTP503 console errors plus two page errors on desktop and 59 HTTP503 console
errors on phone, from Google tiles, Mapbox and jsDelivr.

A bounded check of exact v10.65 baseline
`c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8` then completed all 24 routes,
seven destinations and Back without errors or failed responses. Network recovery therefore
prevented reproducing the earlier failure; identical baseline failures are **not** claimed.
Relevant map frame/loader source sections were independently found byte-identical. The final
candidate sweeps were rerun immediately after that clean baseline and passed independently.

Raw URLs, map-provider parameters and logs remain private. `results.json` retains sanitised
historical failure counts separately from the final passing results. Timing and idle limitations
in `RESULTS.md` still apply; passing these sweeps is not a zero-lag performance claim.
