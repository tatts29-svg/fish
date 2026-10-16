# v10.39 — the drawer opens quickly again; pee panels carry no steps — READY, not uploaded

Author: Andrew Fisher. Andrew, 16 Oct 2026: "everything is very laggy and slow at the moment please fix … pee panels
will have a delivery, install charge, level charge, clean charge, demob charge, pick up."

1. **The lag.** The seven-symbol tick row (v10.33) worked out its ticks outside the page's one-pass asset hold, so the
   transport model rebuilt the whole asset list over and over: 8.5–8.8 s for one reference, and a drawer runs it three
   times. It now runs inside `holdAssets`, like every other render path.
2. **Pee panels:** install, level, clean, demob (with the delivery and pick-up legs) — no steps. Pricing already charged
   it that way; only the tick row offered a steps tick.

Footer v10.38 → v10.39. No record changes in the page.

| Check (`tests/test_quick1039.cjs`, base live v10.38 vs build) | Result |
|---|---|
| Tick row, worst of WC09, WC45, P03, GN06, T0128, PG03, FL03 | 8,519 ms → 300 ms |
| Opening the WC09 drawer | 9,037 ms → 1,472 ms |
| Same tick answers for every other reference | yes |
| Pee panel lines | install, levelling, cleaning, demob |
| Pricing money on every reference checked | unchanged (WC09: FWF $728.70, Pee Panel $3,310.38, Toilet Block 6m $1,415.76) |
| Sweeps desktop and phone | 24 tabs, 18 shown, 0 errors, 0 console |

Build sha256 `fa44b754a6ab55bed9723a54998edd3d14ea8efaa5945a435de898733066e7a5`, 18051117 bytes, on live v10.38 `d181b29e…`.
