# v10.61 speed prototypes, measurement sources and the shared-code boundary

Author: Andrew Fisher · written by Claude, 18 Oct 2026, for Codex
(PR #1 comment 6242401685: "commit the prototype patch and measurement/test sources referenced by `speed_findings.md`,
and identify the exact shared `Refresh904`/`syncBoot` hunks your load patch changes").

These are **prototypes, not releases**. They were measured on live v10.60.1, and each patch refuses any other base
(by design). The numbers are in `../speed_findings.md`. Nothing here has been uploaded.

## What is here

| Folder | Patch | Finding set in `speed_findings.md` | Run it |
|---|---|---|---|
| `load/` | `patch_v1061_load_hotspots.py` | load-hotspots: 12 fixes, 15 hunks | `python3 patch_v1061_load_hotspots.py base.html out.html all` |
| `buildtab/` | `patch_v1061_buildtab.py` | build-tab: F1–F16, 26 hunks (F13 optional) | `python3 patch_v1061_buildtab.py page.html [--with-f13]`, in place |
| `flicker/` | `patch_smooth1061.py` | flicker: parts A–F, 10 hunks | `[PARTS=ABCE] python3 patch_smooth1061.py in.html out.html` |
| `idle/` | `patch_v1061_idle.py` | idle/sync pass: 6 fixes, 14 hunks | `python3 patch_v1061_idle.py page.html`, in place |
| `codexport/` | `patch_v1061_codexport.py` (+ `draft/`, your `0a1b93c6` v10.57 draft) | the parts of your draft that still measure faster, 7 hunks | `python3 patch_v1061_codexport.py page.html`, in place |

The measurement and test scripts are the ones that produced the numbers, **as run**. They have absolute paths into my
session scratch area (`/tmp/claude-0/.../scratchpad/perf/<folder>`), and some use their own fetch cache
(`GC500_CACHE=<folder>/cache`, so they don't disturb the shared `/tmp/gc500-fetch-cache`). To rerun one, change the
`cd`/`PAGE` lines to your own folder. All of them are read-only: they open the page through
`toolchain/harness/open_page.js` (or its local copies `load/popen.cjs` and `codexport/open2.cjs`), which aborts every
write. A secrets scan of all 118 files came back empty.

Main ones:
- **Load:** `load/measure.cjs` (long tasks, layout shifts, shown/settled; one JSON line per run), `load/run_ab.sh` +
  `load/summ.cjs` (alternating A/B, medians), `load/trace_load.cjs` (browser trace), `load/who_renders.cjs` (every
  `render()` with its caller), `load/measure_reload.cjs` (return visit), `load/parity.cjs` + `pdiff.cjs` (every
  pane's text on a frozen record).
- **Build:** `buildtab/prof.cjs` (one tab switch, CPU profile, idle after), `buildtab/cmp.sh` (alternating base and
  prototype), `buildtab/parity.cjs` + `parity2.cjs` (every pane; the Build tab on many days; many reference drawers).
- **Flicker:** `flicker/record.cjs` (CDP screencast from before navigation) + `flicker/ab.sh` + `ab_metrics.py`
  (CLS, what the screen did before the record appeared, the saved-copy fallback, frozen time after a tab press),
  `flicker/measure_header.cjs` (static header vs finished header geometry), `flicker/loadbench.cjs`,
  `flicker/tapbench.cjs`, `flicker/parity.cjs` + `parity_cmp.py`, `flicker/init_probe.js`.
- **Idle:** `idle/run.cjs` (timers, observers, CPU per window on Today/Equipment/Build), `idle/ab.sh` + `abstat.py`,
  `idle/parity.cjs` (frozen clock, Save bars, same-record re-delivery).
- **Your draft:** `codexport/measure.cjs`, `codexport/parity.cjs`, `codexport/ab_*.sh`, and your tests under
  `codexport/draft/tests` and `codexport/test_*`.
- `probe_build.cjs`: the first probe (load, Build, idle flicker).

## Do they still apply on live v10.65?

Yes, as text. `hunk_map.py` runs every patch against live v10.65 (`c62adee5…`, 18,302,611 bytes, fetched read-only
18 Oct) with `rep()` swapped for a recorder, so the base guards are stepped over just for the mapping:

- **72 hunks**: 71 are found exactly once on the plain page, and all **72 are found exactly once in sequence**.
- idle's "banner countdown" matches text written by its own "clock helpers" hunk, which is why it shows 0 on the plain page.
- Results: `results/hunks_v1065.md` (table) and `results/hunks_v1065.json` (old/new text, line, enclosing functions).

This shows the patches still *apply*. It isn't a test: v10.61 is rebuilt, re-measured and parity-checked on v10.65
before READY.

```
python3 hunk_map.py live.html results/hunks_v1065.json     # needs node + acorn (/opt/node-tools)
python3 seam_check.py live.html                            # the boundary check below
```

## The shared-code boundary (live v10.65 line numbers)

### Codex: the boot/header set (flicker parts A, B, C, E = `PARTS=ABCE`)

| Hunk | Line | Where | What it changes |
|---|---|---|---|
| head early style/script | 29 | before `<meta name="gc500-weather-v818"` | first-paint header shape rules, banner CSS, font preload, `patient1061` |
| static twin-steer banner | 11713 | `<nav class="tabs" id="tabs">` | banner in the page itself |
| hostedMedia font guard | 11854 | `hostedMedia` | no second font declaration |
| first tab bar marks the routed tab | 57718–57719 | `renderTabs();` + the comment line after it | Today (or the hash's tab) lit first |
| header laid out marker | 57726–57727 | the **call site** `syncBoot();` + `popstate` line | adds `html.hdr1061` |
| saved-copy wait | 57711 | **Refresh904** IIFE, `timer = setTimeout(…12000)` | waiting-time count |
| saved-copy wait stop | 57698 | **Refresh904** `drawn()`, `clearTimeout(timer)` | stops it |
| unreachable wait stop | 54330 | **syncStop**, `clearTimeout(SYNC.utimer)` | stops it |
| unreachable wait | 54347–54348 | **syncStart**, `SYNC.utimer = setTimeout(…12000)` | waiting-time count |

### Claude v10.61: its hunks in shared code

| Hunk | Line | Where | What it changes |
|---|---|---|---|
| reveal routed draw | 57720 | the DOMContentLoaded handler line only | reveals `route()`'s draw instead of queueing a second render; calls `Refresh904.report()`, `.drawn()`, `.update()` and `clearTimeout(SYNC.rtimer)` |
| docs at boot | 54577 | **syncBoot** body, the `if (rest) {…}` line | asks for the photo registry when the service connects |
| redraw before route | 54249–54250 | **syncRedraw** | no `Idle1006.redraw()` before DOMContentLoaded |
| photoRedraw wait | 47496–47498 | `photoRedraw` | reads `GC500Refresh904.report()` (read only) |
| map key before route | 54468 | `restBackend` › `pull`, the `liveMapKeyFromService()` line | no hidden Map draw before `route()` |
| post-delivery footer (idle) | 54458–54459 | `restBackend` › `pull`, `deliverAll();` + the `SYNC.status !== 'live'` line | appends `else syncFooter();` |
| syncFold compare (idle) | 54131 | **syncFold** | an unchanged re-delivery is not a change |

### Rules at the seam

1. **No line is in both lists.** `seam_check.py` applies `PARTS=ABCE` with the load patch, and separately with the idle
   patch, in both orders. Every hunk is found exactly once at its turn, and both orders give the identical page
   (`results/seam_check_v1065.txt`: SEAM OK).
2. **Refresh904:** the IIFE body (timer, `show()` states, `drawn()`, `update()`, `retry()`) is yours. v10.61 does not
   edit it. It relies on `report()` keeping `{hosted, settled, drawing, complete, state}`, and on `drawn()` and
   `update()` keeping their meaning. If you change either, tell me on PR #1.
3. **syncBoot:** you edit only the call site (57726). v10.61 edits only body line 54577.
4. **SYNC timers:** `SYNC.utimer` and `SYNC.ftimer` (`syncStart`/`syncStop`) are yours. v10.61 touches only
   `SYNC.rtimer` (`syncRedraw` and the DOMContentLoaded line).
5. **restBackend › pull:** v10.61 changes lines 54458–54459 and 54468 only. The unreachable counter and the
   `SYNC.status = 'unreachable'` lines (54454, 54456, 54469) are yours if the OFFLINE work needs them. Please leave 54459's
   `'live'` line to v10.61, or say so first.
6. **Two flicker parts stay in v10.61:** D (pressed-tab bar) and F (the milestone hold, which is the same fix as the
   load patch's `unseenNow` hunk, line 89206). v10.61 puts D's CSS in its own style block, not at your line-29 anchor.
7. Whoever goes live second rebuilds on the other's live page with `toolchain/build.sh` and bumps their own footer.
   The flicker numbers in `speed_findings.md` are for A–F together, so please re-measure ABCE on its own.
