# Servicing tracker: the main page's panel (MOCK-UP for Andrew's yes, not built, not live)

Author: Andrew Fisher · 18 Oct 2026

Andrew, 18 Oct 2026: "purely just a track" · "But still links results to main" · "Remember must show a percentage complete
off that area" · "Must shows percentage complete for the area. And again for everything" · "must state. Reference number
and how many in each one" · "Just times". AGENTS.md: a new layout is shown as a mock-up and waits for his yes.

The read-only "Servicing tracker" panel for the top of the Event nights tab, above Kyle's run sheet (which is unchanged).
**The progress shown is an example**, made up from a fixed seed and marked on the panel itself: Friday all done, Saturday
part way at 23:20, Thursday ("if needed") unused, Sunday not started.

## What it shows

- A day chooser: Thu 22 (if needed) · Fri 23 · Sat 24 · Sun 25 (last night). Each day runs 08:00 to 08:00 Gold Coast
  time, with "on now" and the service clock, "ended", or "starts Sun 25 Oct 08:00".
- Everything: the %, "x of 75 references", "d of 760 jobs" (777 jobs on Sunday), and "All finished <day hh:mm>" or "not finished".
- One row per area (13 + "No location yet"): number, name, %, "x of y references", completed jobs, per-job totals, "finished Sat 22:53" or "not finished".
- A fold per area: a table with one column per job that day in Andrew's words (Pumped out · Fresh water refilled ·
  Cleaned & restocked; Sunday: Pumped out · Cleaned & restocked · Locked & confirmed empty), one row per line, each
  job's time in its cell, "not yet", or a dash where it is not a job (a waste tank is only pumped out). A reference with
  more than one line (WC20: blocks + waste tanks) gets its own row naming it, its units and "done hh:mm".
- The line under it: nothing ticks the job record, changes a delivery or a charge; the Event Portables count stays our
  on-site count. No names anywhere.

## Files

| file | what it is |
|---|---|
| `state.js` | **the state rule**, one copy for the crew card and this panel (ES5, no DOM, no clock of its own; `require` in node). Jobs, unticks by id, voids, earliest uncancelled time (never after its `at`, never in the future), units-weighted % rounded down, locations, units serviced, area finish time, 08:00 days |
| `test_state.cjs` | `node test_state.cjs`: 50 checks on the real data, including 250 random tick logs compared against the card's own copy of the rule in `../card/card_src.js` (same jobs, times, %, finish times and locations) |
| `panel_render.js` | `svcPanelHtml(M)`: draws the panel from `state.js`; every shown text escaped |
| `panel.css` | the panel's CSS, scoped to `#svc1063`, built from the page's own `.card`, `.btn` and colour tokens |
| `build_panel.js` | `node build_panel.js` writes `panel.html` (example ticks, `state.js`, `panel_render.js` inlined) |
| `panel.html` | the mock-up; `#day=2026-10-25&open=2` picks a day and opens areas |
| `shoot.cjs` | `node shoot.cjs`: browser checks and screenshots, panel.html and the real page (below). `--no-live` skips the real page |
| `evidence/` | 390 px phone shots: `panel_light/dark_390.png`, `panel_sunday_light_390.png`, and the same panel drawn on the live v10.60.1 Event nights tab: `realpage_light/dark_390.png` (first screen), `realpage_panel_light/dark_390.png` (the whole panel) |

## Checks (18 Oct 2026)

- `test_state.cjs`: 50 passed, 0 failed (`test_state_results.txt`).
- `shoot.cjs`: 46 passed, 0 failed (`shoot_results.txt`): every figure matches `state.js`; day chooser; touch targets
  44 px or more; WCAG AA contrast on every text node; no sideways scroll at 390 and 360 px; nothing spills out of the card;
  no "6 m" split over two lines; hostile names escaped; no requests except Google Fonts (panel.html). The real-page part
  runs through `toolchain/harness/open_page.js` (GET only, writes aborted; 0 writes were tried) and nothing is sent anywhere.

## For the build (v10.63)

- The run sheet's own redraw replaces `#pane-nights`, so a panel put inside it is wiped (shown by `shoot.cjs`). The panel
  needs its own container (review problem 2).
- The live page styles every `table` (`min-width:640px`) and `th` (sticky, nowrap, uppercase). `panel.css` overrides each.
- In OS dark mode the page keeps light paper cards (`contrast1007css`), so the panel does too. The two "dark" shots look
  like the light ones on purpose. The panel must not set its own ink or paper.
- Chromium under en-AU breaks lines at a no-break space, so number and unit sit in a no-wrap span.
- The card's generator should paste `state.js` in unchanged, in place of its own copy (same answers today, by test).

## Open for Andrew

- His yes on this layout (placement at the top of Event nights; the fold as a table).
- The view link: the v5.89 draft answers `/api/ticks` with 403 there, so the panel shows on the edit link only unless he
  wants it on the view link too.

## Revision for v10.67 (18 Oct 2026)

The headline now reads completed **references** and completed **jobs**, matching the crew card and the percentage’s
unit weighting. Per-job totals appear for each area and everything, using the additive shared `SvcState.taskStats`
function. Fully serviced units are no longer placed beside a jobs percentage. `admin_reader.js` consumes bounded
v5.90 pages and resets on changed epoch/definition; it never exposes a partial read as verified progress.

Actual page integration and the explicit edit-only creation/update workflow are in
`../../v10.67_servicing_tracker_DRAFT/`. The mock remains clearly marked as example data. Current shared state checks:
51 passed. The old browser screenshots/results are historical until re-run against this revision.
