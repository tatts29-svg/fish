# v12.55 — the P&L to the cent against Baseplan (10), Andrew's bits only

Author: Andrew Fisher · built 29 Oct 2026 on the exact live v12.59
(`1e35528f32ff0b9cd3e0fb646b52cd92bc0c58733d3d9efaf9d02485e7c3a89b`) · **READY TO UPLOAD on Andrew's word**, for the
review tomorrow arvo (30 Oct).

Candidate: `a1ef216a8f75add81a7d27126ade0a80e62d9bf259f864dbd53976354f06ab3d`, 16,124,069 bytes.

Andrew, 29 Oct 2026 18:40 AEST: "Fix your bits and get v12.55 ready to upload. I can look at all the contracts in the
morning and we can review tomorrow arvo again." His bits, from the bridge in
`review_29Oct2026_pl_cleanup/RECONCILIATION_BASEPLAN10.md`:

| | Before | After | Move |
|---|---|---|---|
| Charge to the V8s, on the record | 1,007,518.57 | 998,997.00 | −8,521.57 |
| 1047 Installation | 119,211.46 | 112,871.72 | −6,339.74 |
| 1005 Hire | 221,631.79 | 220,042.74 | −1,589.05 |
| 1030 · 1031 Transport | 159,913.48 | 159,213.48 | −700.00 |
| 1010 Rehire | 395,858.87 | 395,966.09 | +107.22 |
| Pump-outs, consumables, cleaning, accommodation, services, waiver | | | 0.00 |

## What moves, and why

1. **The double count comes out (−5,631.86).** The install and demob ticks on the generators, the light towers and
   the VMS boards are the record of the work; the money for that work is Baseplan's own labour lines (9961976 lines
   51, 52, 58 and 60; 9994954 line 13; 9961265 line 40), which the P&L already carries as contract installation. The
   page charged both. Now those ticks price at nought with the reason on each line ("in the contract labour line …"),
   the same way the held references do (v11.52): a wrapper on `labourLinesFor`, nothing else. Every table keeps its
   rows and tick counts (497 ticks before and after). Also inside the −6,339.74 on Installation: 9961265/40 re-struck
   from 4,247.28 to Baseplan (10)'s 3,539.40 (−707.88).
2. **Every contract line Baseplan (10) prices differently from the site rule is pinned to Baseplan (10)'s figure
   (−4,910.31 net), WB02 excepted.** The pin table struck against Baseplan (8) on 28 Oct (BP12429) is re-struck
   against (10): the four 7 Sep boards termed 28 Oct (−3,323.82), Baseplan's inclusive day count on 16 day-rate lines
   (+640.10), the post-event boards at Baseplan's flat 428.94, the VMS transport at 40 legs (−1,200.00), the two booms
   at five days (−932.85), the 2.5 t forklift to 30 Oct (+741.60), 9997710/1 at 207.36 (+17.28), and 9961265/43 at
   375.27 (+268.05). WB02 (9972648/3) stays at the site record's 34 days, 1,364.08: Baseplan's 280.84 is the branch's
   to fix. Baseplan (10)'s status and term facts on the four boards and 9997710/1 are written to the source rows.
3. **The two lines the page did not carry are added at Baseplan (10)'s figures (+2,020.60):** contract 9994248
   (STPS: fence 612.50, CCB 630.00, chairs 52.80, delivery 250.00, pickup 250.00) and 9997710 line 3 (225.30).

Nothing else moves. Cleaning stays charged (it is inside Baseplan's Install & Demob rates). The pee panels (3,310.38),
track mats (5,309.10), T0021/T0022 (1,311.66), the transport legs with no contract line (7,293.30), VMS11/VMS12 and the
site shift (1,625.81) stay charged on the page and flagged for the branch and Andrew. The fencing stays held out.
Codex's earlier `v12.55_ruled_labour_DRAFT/` (built on a wrong cleaning ruling) is superseded by this folder.

## Proof

- Every contract line on the candidate against Baseplan (10), by the page's own `contractCharge`: 384 common lines,
  **355 to the cent**, 28 no-rate lines whose scopes the P&L carries elsewhere (pump-outs, accommodation, event labour,
  the ten Install & Demob lump lines), **1 different: WB02 +1,083.24**. Page-only: VMS11 536.10, VMS12 589.71, site
  shift 500.00, forklift 0.00. (`tests/pl_lines_cand55.json`.)
- Per-piece ticks: 497 before and after; generators 15 install, light towers 7 install + 7 demob and VMS 24 install at
  nought; buildings, toilets, FWF, track mats unchanged. Labour charge 73,174.28 → 67,542.42. (`tests/perpiece_cand55.json`.)
- Money probe, 79 figures: 13 move, all in the table above and the branch totals (KINP +107.22, STPS −2,805.68,
  MEAD −191.25, NVAC 0). (`tests/money_base55.json`, `tests/money_cand55.json`.)
- Page checks: 218 inline scripts parse, no secrets, Author kept — PASS. Styles byte-identical to live.
- Sweeps on the candidate, desktop and phone: 27 routes (19 shown, 8 hidden routes as always), 7 deep links, Back;
  0 page errors, 0 console errors, 0 blocked writes. (`tests/sweep55_desktop.json`, `tests/sweep55_phone.json`.)
- The attribution scrubber changed one phrase in the six added rows' note (the author's name to "the project manager");
  nothing else.

## Build and upload

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.55 v12.55_to_the_cent_DRAFT/patch_v1255.py     # from the live page, guarded to 1e35528f…
python3 toolchain/upload_page.py build/GC500_v12.55/GC500_Delivery_Control_hosted.html   # on Andrew's word only
```

The patch refuses any base but the exact live v12.59 and refuses to apply twice. Files: `patch_v1255.py` (the
release), `source_rows_v1255.py` (the six rows and five status/term facts), `baseplan10_pins.py` (the pin table),
`covered1255.js` (the covered-labour wrapper), `tests/` (the probes above and their outputs).
