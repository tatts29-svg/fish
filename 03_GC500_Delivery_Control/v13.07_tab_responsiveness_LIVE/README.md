# v13.07 tab responsiveness — LIVE 15 Nov 2026 16:23 AEST

Author: Andrew Fisher.

Opening Build replayed all 46 historical day readings before showing the tab. It now opens in about 1.7 seconds in the controlled desktop and phone checks, down from 7.3 seconds. The selected day and final Build day keep their immediate native reading; other cards use the existing visible-card loader. Whole-Build printing resolves pending readings. Supplier/day-sheet and drawing-sheet prints skip hidden Build history.

Deferred Demob observers stop when their pane is inactive. VMS redraws use one fresh native asset snapshot instead of rebuilding it for each board. Phone tab captions fit the existing row and retain their full accessible and desktop names.

Andrew's instruction in the dashboard review chat, 15 Nov 2026: “please check other tabs for smoothness no glitching. no render delays. no bugs”.

## Exact candidate

- Base live v13.06: `1017be1594f6c9660838d6440dfb125c9399de99519fae3866a7af8fdd2caa52`.
- v13.07 candidate: `e632b5bbe5aaab781bb7242b892d102e1e8e8894dd973223d6a57e1839443428`, 17,071,065 bytes.
- The combined patch reproduces those bytes exactly and rejects repeat application or any other base.
- Six intended scripts change; 219 scripts and all 161 existing styles remain byte-identical. Only the phone caption style is added. Native progress calculations, document invalidation, asset-cache freshness and permissions are preserved.
- No financial model, operational record, source quantity, map position, media or machine file changes. The complete v13.05 machine manifest remains `b4cf3f0b2b768031f26d7463bdb8c7168506a1faee048f046407d8d1103b75b2`.

## Acceptance

`CHECKS.json` contains non-sensitive results and exact source hashes.

- Shared sweeps: all 27 routes, seven deep links and Back on desktop and phone; zero runtime errors, console errors or attempted record writes.
- Build: 23 focused assertions and 17 existing loader lifecycle checks.
- Native comparisons: 15 assertions each on desktop and phone. All 46 historical models, print readings, VMS facts, financial outputs and operational documents agree with the baseline. Rapid clicks settle on the last requested tab.
- Phone captions: 40 cases at 360, 390, 430, 640 and 1440 px; no clipping; accessible names, pane associations and keyboard focus retained.
- Data loading/reconnection: 17 existing checks; unavailable records stay unavailable until ready and revised records refresh the readings.
- Weather continuity, changed forecasts, pause, reduced motion and offscreen resume pass. The legacy test assumed a card for today, after the programme ended. Its assertions are unchanged; `tests/weather1307.cjs` supplies an explicit 13 Nov browser clock and browser-only forecast fixture. Other suites use the real date.
- Phone height-only and width resize checks pass for Build and Demob.
- Desktop Build and phone Build/Documents/Fencing screenshots inspected: no new clipping or overlap.
- Shared static checks pass: all 225 inline scripts parse and no new keys or edit key occur.

Measured initial Build reads fall from 46 to one for the current selected final day. Hidden Demob mutation calls fall from 12 to zero. Direct VMS redraws build assets once instead of 116 times, taking about 0.38 seconds instead of 1.04–1.10 seconds. These are controlled headless-browser measurements, not a physical-phone or network-speed guarantee.

Raw screenshots, CPU profiles, service snapshots and detailed financial comparisons stay in private evidence outside the repository. No native setter or service-record write is used.

## Build and checks

Build through `toolchain/build.sh v13.07 v13.07_tab_responsiveness_LIVE/patch_v1307.py` from the exact v13.06 page. Publication uses `toolchain/upload_page.py` with its unchanged-live-base guard.

`tests/native1307.cjs` requires BASE, PAGE, STATE and a private absolute OUT directory. It uses the existing GET-only frozen-record harness. `test_phone_tabs1307.cjs` uses PAGE and private OUT. `tests/check_sweep1307.cjs` validates output from the unchanged shared sweep, including public aliases. Use the existing v9.86 hydration test and v13.00 resize test; the active-day weather adapter is `tests/weather1307.cjs`.

All browser checks use `/tmp/gc500-browser.lock`. Implementation and review ownership, exact source commit and publication state are recorded on STATUS.md and PR #1. Source commit `f046229f548b17713543f5f987df022d53c7bdca` was published through the guarded uploader at 16:23 AEST on 15 Nov 2026. The uploader and an independent cache-busted public read both matched the tested bytes. Actual-public phone checks, with no HTML substitution: 19 hydration assertions plus all 27 routes, seven deep links and Back; zero runtime/console errors or attempted record writes. Record version remains 13404 after verification. Sanitized publication evidence is in CHECKS.json.
