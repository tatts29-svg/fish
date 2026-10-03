# v8.19 — Meet points, site rules and the Event Portables delivery plan (DRAFT)

Author: Andrew Fisher · 3 Oct 2026 · **DRAFT, tested, not uploaded. Not READY TO UPLOAD.** It waits for Andrew's yes on
the screenshots, because the Timeline card is a new panel.

**Numbered v8.19.** It was claimed as v8.18. Meanwhile the weather release "v8.18 — selected-day weather artwork" went
live (`f3bb490b`), and then Codex's **v8.20 Today** went live (`88a7b6b1…`, 3 Oct 2026). This release is rebuilt on
v8.20. All eight hunks apply unchanged, and none touches Today, the weather or their controllers (see *Build*).

## What Andrew asked (Claude chat, 3 Oct 2026)

> "This goes for all gear and equipment ... If we unsure they refer back to entry pitlane" — "this now should be info
> for everything now"

> (island west parkland) "no one enter park. Ensure spotters. Wild life. Extemly low branches. There is not much room
> hense sptters and excort is a must"

> "We go by whats on the quote at the moment" — "deliries for next week we move to the 9th oct" — "The loads that come
> in. Will have a run sheet where they go" — "I want qr codes done with direction to get to where they need to go"

> "We allocate everything to a WC number. Then at the end quote is this many. And we mention no WC allocation for these"
> — "Nothing is to be picked up unless emptied" — "They can take early we can store in pit regardless"

The wording on the card and the run sheets is the plan data's (`event_portables_plan.json`). It matches the PDFs Andrew
already has: `GC500_EventPortables_load_run_sheets_v3.pdf` and `GC500_EventPortables_Friday_delivery_v10.pdf` (plan
`v10`, 3 Oct 2026).

## What changed

1. **Meet points, for every reference.** `meetPoint819(a)` applies the rule in this order:
   - Any real map position (master plan, pinned, confirmed, or a drawing position) inside a drawn area outline (the
     island west parkland) goes to that area's point.
   - The pit lane precinct (PG.., WC12, WC16) goes to pit lane entry: "Pit lane entry – pit garages" for the garages.
   - A master-plan, pinned or confirmed position goes to the nearest point on the **same side** within 150 m. Side
     comes from the page's own `zone816`, and the page's own way-in words decide the side where they name it. A side
     the page cannot tell goes to pit lane entry: "side not known – pit lane entry".
   - Anything else goes to pit lane entry: a description spot, the pit-lane report point, or no position.

   For every master-plan reference (all the WC toilets) this is the private reference `assign.py`, line for line. The
   reviewer's correction extends it to pinned and confirmed gear, because Andrew's rule covers all gear: T0022 and T0023
   now get the island parkland point and its safety box, and P47 gets Commodore Park.
2. **Reference drawer.** Under *Where it is* the drawer shows:
   - "Meet point: <name>";
   - a QR (tap or scan) for Google Maps driving directions to the meet point at
     `https://www.google.com/maps/dir/?api=1&destination=<lat6>,<lng6>&travelmode=driving`, using the page's own
     `qrSvg` and `navUrl`;
   - why that point was chosen;
   - the parkland rules box, where the meet point is the island west parkland.

   The meet point's way in is shown only where it says more than the reference's own *Way in* line.
3. **Driver sheet (GC500-DRV-01).** The photographs keep every pixel they had on live, measured on all 26 driver sheets
   for 5–9 Oct.
   - **One reference:** the meet point goes in room the sheet already leaves empty, inside the *Master-plan position*
     box: its QR, "Meet point · scan for directions" and its name.
   - **Several references:** each row of the table gets a *Meet point* QR column and a "Meet point: <name>" line in
     its Position cell.
   - **Site rules:** they go on the end of the sheet's own rules line (PPE · Site hours · "Go to the meet point –
     Coates meets you" · "If unsure, go to the pit lane entry"). The island west parkland rules are added only where
     the load goes to the parkland.
   - The earlier separate *Meet point · site rules* band is gone.
4. **Timeline: the "Event Portables delivery plan (to quote Q6845)" card.** It sits under the day, where deliveries
   live, and reuses the Timeline's own load rows and folds. It holds:
   - **Site rules · all gear and equipment** (the one place on the page that carries them in full), with the parkland
     rules;
   - **Demob – pick-up**, word for word;
   - the fill-order wording, with the early-delivery rule beside it;
   - the **5 loads**. Each row has the date, the count (Load 1 shows +6 pee panels) and the zone, and opens to its
     stops: meet point (linked to directions), way in, WC numbers, FWF and *left on truck*. Each load has **Print run
     sheet**;
   - **a record line on any load whose references the record shows on another day**, read live from the page's own
     day lists (see *Source boundary*). For Andrew's "deliveries for next week we move to the 9th oct" it reads "Record
     still shows Thu 8 Oct for WC09, WC34 – moving to Fri 9 Oct per Coates". Any other difference is stated plainly,
     never as a move: "Record shows Mon 12 Oct for WC57 – this plan has Fri 9 Oct". On record 3675 Load 1 also named
     WC38, WC39, WC40 and WC61 on Wed 7 Oct. Codex moved them to Fri 9 Oct on the record (3736), so once the record
     has loaded the line no longer names them. The line is worked out fresh at every drawing of the card and every
     printed sheet, with no cache: Codex's preflight found that a 4 s cache, filled before the shared record loaded,
     kept the stale wording;
   - **Quote Q6845 against WC allocation.** The *No WC allocation* column is in Coates orange (56 / 0 / 0 / 4 / 3),
     with its note. There is no total row: the rows are unlike items;
   - **Cancelled – do not deliver**: WC32, WC66, and 6 of the 10 at WC09, with a *Source* column.
5. **Run sheet.** One A4 portrait page per load, in the layout of `GC500_EventPortables_load_run_sheets_v3.pdf`. It has:
   - the orange header, labelled "Event Portables delivery plan (to quote Q6845)", with the author;
   - the load bar;
   - the site and parkland rules;
   - the fill-order and early-delivery wording, and the load's record line;
   - the stops, counting down to 0, with a directions QR per meet point and a Done box;
   - the demob notice and the sign-off block. Above the signatures is a tick box for the Load Restraint Guide's
     pre-departure check: "Before leaving: load restrained and straps checked · deck clean of sand, mud and oil ·
     nothing loose" (Coates Load Restraint Guide 2023, p40 and p42). It is read from the plan JSON
     (`pre_departure_check`) and added on Andrew's yes of 3 Oct 2026;
   - the footer.

   All five sheets fit one A4 page; the QR codes give way first, never the words (Load 1 scale 0.85).

   On screen it is a modal preview with *Print / Save as PDF* and *Close*. On paper it prints alone.
6. The footer and the `gc500-release` marker read **v8.19**.

## Source boundary (for Codex's daily-message and installer work)

- **Where the plan lives:** the Event Portables plan is **build-time page data**, the top-level constant **`EP819`**,
  written in by `patch_v819.py` from `meet_points_03Oct2026/event_portables_plan.json`. The meet points are
  **`MP819`**, from `meet_points.json`. Neither is under `DATA`, and neither is in `SYNC` or any record collection.
- **What it is:** a **supplier plan, not the operational schedule or the record.** On the page it is always labelled
  "Event Portables delivery plan (to quote Q6845)" (`epLabel819()`): the card heading, the run sheet header and the
  print preview bar. The card's sub-line adds "the supplier's plan as it stands, not the GC500 delivery record".
- **What it does not do:** no v8.19 code adds plan loads to `programmeDays()`, `dpLoads()`, the Timeline's day lists
  (`dayBlock`) or `DATA`. The card's rows carry no `data-ld` / `data-ldsec`, so the Timeline's own handlers leave them
  alone. A test checks all of this on desktop and phone.
- **The one read of native data:** `epRecLine819()` *reads* `programmeDays()` / `dpLoads()` to compare the record's
  delivery days with the plan's. It never writes, and keeps its reading for 4 s.
- **Rule for Codex's daily message:** read the native day. Plan loads exist only in `EP819`; any use of them must carry
  `epLabel819()`.

**Shared touch points with Codex's v8.21 (Timeline daily runs, frozen `774bd0e4`), inspected 3 Oct 2026.** Codex's
files were not edited, because Codex integrates second.
- **Patches:** both apply cleanly to the live v8.20 page in either order: v8.19 then v8.21, and v8.21 then v8.19.
  The combined page passes `check_page`. They share no anchor line. v8.21 changes the inside of `dayBlock` (the
  `dayCards` load list and `dayPanels`). v8.19 adds its card after the `dayBlock(days[idx], true)` call in
  `renderTimeline_held`. v8.21 inserts its code before `renderTimeline`, v8.19 before `renderPass`.
- **v8.21 reads v8.19's data and functions:** `meetPoint819`, `mpUrl819`, `mpWhy819`, `MP819.park`,
  `EP819.site_rules`, `EP819.park` and `EP819.loads` (for its "Date needs confirmation" notice). It calls
  `mpWhy819(meet)` without the reference key. v8.19 now carries the key in `meetPoint819`'s result (`r.key`), so pit
  garages still read "Pit lane entry – pit garages".
- **The `dpLoads` change:** v8.21 alters the booking filter inside `dpLoads` (rescheduled bookings kept). The v8.19
  record line reads `dpLoads`, so after v8.21 it follows that projection. On the combined page Load 1's line was
  unchanged.
- **CSS:** v8.21 restyles the Timeline load rows under `#pane-timeline` (`.ld.go`, `.ldl`, `.ld-go`,
  `.ldlist.timed .ldl` and others). Those selectors outrank v8.19's `.ep819 …` row overrides. On the combined page the
  v8.19 card still fits and works (`phone819.js` 12/12 at 390 and 400 px), but its rows take v8.21's look: the date
  wraps over two lines and the stop summary wraps instead of being cut short. If Codex wants the supplier card's rows
  unchanged, scoping v8.21's row rules to `:not(.ep819 *)` would leave them as built. Screenshots of the combined page
  are in `scratchpad/v821/combo/`.
- **Driver and installer print:** v8.21 does not change `dpPage`, `dpWhere` or `dpRulesLine`, which are v8.19's two
  `dpPage` anchors. The installer daily page uses the helpers below.

## Helper contract (Codex integrates the installer daily sheet; these are the final signatures)

Everything is in `mp819_src.js` and styled under `.dp-page` in `v819.css`. Each helper takes the sheet's `--k` scale,
and the scale is 1 outside a sheet.

| function | returns |
|---|---|
| `meetPoint819(a)` | `{p, m, how}`: the meet point (`p.id`, `p.name`, `p.ll`, `p.way`), metres from the position, and `how` = `area` / `precinct` / `rule` / `noside` / `default` / `nopin` |
| `mpGroups819(as)` | `[{p, refs, url}]`: the meet points a list of references goes to, in order of first use. Its `.length` is the count |
| `mpMeetBlock819(as)` | **an HTML string**: one card per meet point (directions QR, "Meet point · scan for directions", name, coordinates, the references it serves). *Changed since `a8c26c0`, where it returned `{n, html}`: it now returns the HTML only, and the count is `mpGroups819(as).length`.* |
| `mpRulesBlock819()` | an HTML string: the site rules word for word from the plan, **deliberately without "Site hours 07:00–17:00"**, because every native sheet already prints the hours on its rules line. The island west parkland rules follow |
| `mpWhere819(html, g)` | the *Where it goes* HTML (`dpWhere` output) with each reference's meet point and QR put in, as on the driver sheet |
| `mpRulesLine819(html, g)` | the sheet's rules line (`dpRulesLine` output) with the short site rules added, and the parkland rules where load `g` goes there |
| `mpSameWay819(refWays, pway)` | true when every word of the meet point's way in is already in the sheet's own way in for each reference. The meet point's *Way in* is then **suppressed** (drawer, driver sheet). Words such as "the", "in", "via" and "race direction" are ignored |

## Review findings and how each was resolved

**Codex — source review of `5db4864`**

| # | finding | resolution | test |
|---|---|---|---|
| 1 | The 80 ms print timer survived Close / Escape and could print the app underneath | `ep819Close()` clears the pending timer and the `afterprint` listener. The timer and *Print / Save as PDF* print only while the run-sheet view is open (`epOpen819()`) | v819: "Close / Escape before the print starts cancels it" (desktop and phone) |
| 2 | Modal focus | Focus moves to *Print / Save as PDF* on open. Tab and Shift-Tab wrap inside the view. Escape and Close shut it and return focus to the load's *Print run sheet* button, which is found again if the Timeline was redrawn | v819: three keyboard checks per device |
| 3 | Brittle footer and marker anchors | Both are matched by pattern. A footer tag from another release (e.g. " · v8.20") is replaced, not stacked. A missing or doubled anchor stops the build with a plain message | `anchor_check819.py` (6 checks); the rebuild on live v8.20 applied cleanly |
| 4 | Installer sheet integration | Documented helpers (above); Codex integrates them | — |
| — | Stale logs (113 / 2) | Every log is regenerated from the final source. Each starts with a header naming the source commit, the candidate sha256 and the base sha256 | headers |
| — | `run_all.sh` could hide failures | Rewritten as an aggregator: every suite runs, each is judged on its own exit code and PASS/FAIL lines, there is a table at the end, and the exit is non-zero if any suite failed. The proof is in `regress/force_fail_proof.log` (exit 0 normally, exit 1 with one suite forced to fail) | `regress/summary.log` |
| — | Minimum photo height on every 5–9 Oct sheet, including multi-meet-point sheets, and 7 Oct sheet 4 explicitly | `photo819.js`: base vs build on every driver sheet, 5–9 Oct, plus an explicit WC86 + T0258 check | photo819 |
| — | Source boundary | the section above | v819: label and boundary checks |
| — | **Preflight on `5b952723`:** a stale record line, cached before the record loaded | No cache: the record projection is worked out fresh once per drawing of the card and once per printed sheet, so every redraw the page makes after the record loads or changes shows the record as it is. The native programme stays the authority and the plan stays separate | `fresh819.js`: first drawing before the record loaded; after it loaded; 8 s later; a simulated record change (WC38 moved back to 7 Oct, in the page only) through the page's own `syncRedraw()`, then undone; the run sheet |
| — | `results796` hard-coded 116 references with nothing recorded | A bounded correction in a v8.19 copy (`evidence/results796_tests_819.cjs`; v7.99's file is not changed). Before pressing the no-record control, the page's own rule (`lightMatches` with light `none`: not cancelled and nothing recorded) gives the exact references. The test then asserts the exact keys, their count, the visible rows and the landing position (top ≈ 12 px). The original failed logs are kept as `regress/results_*_on_865c1f2_original.log`, and the same failure on the live v8.20 page itself is in `regress/basecmp/` | results-desktop, results-phone |

**Independent reviewer** (`scratchpad/review819/r2/`)

| finding | resolution |
|---|---|
| **B1** Driver-sheet photos crushed | No band. The meet point goes in the sheet's existing empty room and the rules go on its own rules line. The way-in rule is shared with the drawer. `photo819.js` fails the run if any 5–9 Oct sheet's photos are lower than live: 26 of 26 are equal (table below) |
| **B2** Phone overflow at 400 px | On phones each stop is a card (meet point, FWF, left on truck, then the WC numbers). The quote and cancelled tables wrap and fit. The page-wide `table{min-width:640px}` is lifted for this card only. `phone819.js` checks 390 and 400 px with all 5 loads and the fold open |
| **B3** Pinned and confirmed gear got no area rules | The area test runs on any real map position, and the nearest rule for master, pinned and confirmed (description and report stay no-pin). The toilets equal `assign.py` unchanged, asserted in `assign_check819.py` |
| S1 Dates disagree | The load card and its run sheet carry the record line, worked out from the record (above), not hard-coded |
| S2 Agent name on the page | The patch strips any "via Codex / Claude" tail and refuses plan data naming an agent or model. The column is now *Source* |
| S3 Unknown side | `how: 'noside'`, "side not known – pit lane entry" |
| S4 Repeated facts | The card sub-line no longer repeats "120 FWF and 6 pee panels". The meet point's way in is dropped where the sheet already says it |
| S5 Wording | The plan JSON wording, citing `run_sheets_v3` and `Friday_delivery_v10` (above) |
| Nits | The Timeline insertion is wrapped in try/catch (the Timeline draws without the card if it ever throws). Pit garages read "Pit lane entry – pit garages". The total row is dropped. Shared hunk: see *Build* |

## Build

`bash toolchain/build.sh v8.19 v8.19_meet_points_ep_plan_DRAFT/patch_v819.py`

| | |
|---|---|
| source commit | `1cd16dcdc67a62299c7ca244cea5fa87dadeadcc` |
| base (live at build, Codex v8.20 Today) | `88a7b6b110194133ab59f5efa17b169f937f8fa21cb551dfd38f96eab6597919`, 9,293,149 bytes |
| candidate | `0630371d2c662cbff820d429aec87f0142da24a947d7b3ef4441dd5671d7bf6c`, 9,356,879 bytes |
| check_page | PASS (`regress/build.log`): inline scripts parse, no new keys, author line present |
| first 5,000 characters | byte-identical to the base (the service's identity check reads them; the v8.19 CSS lands after the page's first stylesheet, at about character 14,000) |
| changed regions | 8: the CSS, the release marker, the drawer call, two lines in `dpPage` (Where it goes, the rules line), the `renderTimeline_held` day line, the v8.19 code before `renderPass`, the footer. None in Today, the weather or their controllers |

**Shared hunk:** the Timeline insertion is the `renderTimeline_held` line ending
`dayBlock(days[idx], true) : '<div class="empty">No scheduled dates in the register.</div>')}`. Codex's v8.21 also works
there: whoever publishes second rebuilds on the other's page.

`toolchain/harness/sweep.js` now also prints the harness's write counts (`counts.blocked`), so a sweep can show that no
write was attempted. The field is additive; nothing else changed.

## Checks

`SCRATCH=<scratchpad> bash v8.19_meet_points_ep_plan_DRAFT/evidence/run_all.sh`. Every run is read-only: the harness
aborts every write, and `window.print` is stubbed. One browser runs at a time, under the shared lock. Each log starts
with the header below.

| suite | PASS lines | FAIL lines | exit | result |
|---|---|---|---|---|
| anchors | 6 | 0 | 0 | PASS |
| probe | 0 | 0 | 0 | PASS |
| assign | 3 | 0 | 0 | PASS |
| v819 | 155 | 0 | 0 | PASS |
| qr | 5 | 0 | 0 | PASS |
| fresh819 | 8 | 0 | 0 | PASS |
| photo | 93 | 0 | 0 | PASS |
| phone-widths | 12 | 0 | 0 | PASS |
| v799-desktop | 23 | 0 | 0 | PASS |
| v799-phone | 18 | 0 | 0 | PASS |
| packed-desktop | 20 | 0 | 0 | PASS |
| packed-phone | 14 | 0 | 0 | PASS |
| equip-desktop | 22 | 0 | 0 | PASS |
| equip-phone | 22 | 0 | 0 | PASS |
| results-desktop | 9 | 0 | 0 | PASS (rerun on `90cdfa1`, test-only change, same candidate) |
| results-phone | 9 | 0 | 0 | PASS (rerun on `90cdfa1`, test-only change, same candidate) |
| onetab-desktop | 20 | 4 | 1 | FAIL |
| onetab-phone | 20 | 4 | 1 | FAIL |
| rules | 45 | 0 | 0 | PASS |
| fresh | 11 | 0 | 0 | PASS |
| same-figures | 0 | 0 | 0 | PASS |
| sweep-desktop | 7 | 0 | 0 | PASS |
| sweep-phone | 7 | 0 | 0 | PASS |

23 suites; 2 fail, both the inherited one-tab suite (below). Full run: `regress/summary.log` (source `1cd16dc`). The two results suites were rerun on the same candidate after a test-only fix: `regress/summary_results_rerun.log` (source `90cdfa1`). Earlier failed runs are kept: `results_*_on_865c1f2_original.log` (the hard-coded 116) and `results_*_on_1cd16dc_testbug.log` (my copy read the wrong field, then hit the v8.16 More-menu click).

Header on every log of the full run: `# v8.19 checks · source commit 1cd16dcdc67a62299c7ca244cea5fa87dadeadcc · candidate sha256 0630371d2c662cbff820d429aec87f0142da24a947d7b3ef4441dd5671d7bf6c (9356879 bytes) · base (live at build) sha256 88a7b6b110194133ab59f5efa17b169f937f8fa21cb551dfd38f96eab6597919 (9293149 bytes) · run 2026-10-03T14:14:13Z`

- **QR codes:** 40 of 40 QR images (drawer, run sheets, driver sheets) decode to exactly `https://www.google.com/maps/dir/?api=1&destination=<lat6>,<lng6>&travelmode=driving` for one of the ten meet points; 5 of 5 printed run-sheet PDFs are one A4 page whose QR codes all decode the same way.
- **Meet-point assignment:** 131 of 131 master-plan references and WC toilets (all 65 WC among them): page = assign.py unchanged (0 differ) · 70 of 70 other references (pinned, confirmed, description, report, none): page = the same rule with pinned/confirmed included (0 differ) · 201 of 201 references in all · PASS T0022 -> ISLAND_WEST_PARK (want ISLAND_WEST_PARK) · PASS T0023 -> ISLAND_WEST_PARK (want ISLAND_WEST_PARK) · PASS P47 -> COMMODORE (want COMMODORE) · 71 of 71 plan meet points (loads and on-site lists) = the page
- **Loads:** 5 × 24 = 120 FWF; 6 pee panels on Load 1; early-delivery, site-rule, parkland and demob wording word for word from the plan (v819 suite).
- **Sweeps** (`regress/sweep-*.log`): desktop and phone. All 22 tabs are swept, plus seven deep links and Back, with 0 page errors, 0 console errors and 0 writes attempted. 16 tabs show; the 6 that do not (register, journal, breakdowns, variances, edit, add) are the view-only redirects, exactly as on the live v8.20 page itself (`regress/basecmp/`). The judge was first written as "every tab shown", stricter than the board's standard; the first run's logs show that failure, and it is corrected to the board's standard.
- **One-tab (v7.93) suite: 20 pass, 4 fail on desktop and phone, the same four on the live v8.20 page and on the previous live page (`f3bb490b`, weather v8.18) without v8.19** (`regress/basecmp/`). The four are Today assertions written before the v8.14 Today trim (the Fencing and roads cards, the folds, the four-tab round trip). They are inherited and v8.19 does not touch Today. They are reported, not waived and not rewritten here: Today is Codex's scope.
- **Fresh record lines** (`fresh819.log`): the card equals the native projection before the record loads, after it loads, 8 s later and after a simulated record change through `syncRedraw()`, with no reload.

**Driver-sheet photographs: live base vs v8.19** (`photo819.log`, every driver sheet; 5–9 Oct judged, 28 Sep shown for
comparison):

| day | load | live base px | v8.19 px | change | meet points |
|---|---|---|---|---|---|
| 2026-09-28 | 1 | 177.0 | 177.0 | +0.0 | MEDIAN_PITSTOP |
| 2026-09-28 | 2 | 166.3 | 166.3 | +0.0 | MEDIAN_PITSTOP |
| 2026-09-28 | 3 | 177.0 | 177.0 | +0.0 | MEDIAN_PITSTOP |
| 2026-09-28 | 4 | 14.6 | 0.0 | -14.6 | MEDIAN_PITSTOP, PITLANE, COMMODORE |
| 2026-09-28 | 5 | 165.9 | 165.9 | +0.0 | MEDIAN_PITSTOP |
| 2026-09-28 | 6 | 165.9 | 161.5 | -4.4 | MEDIAN_PITSTOP |
| 2026-09-28 | 7 | 153.0 | 153.0 | +0.0 | ISLAND_NORTH |
| 2026-10-06 | 1 | 131.6 | 131.6 | +0.0 | COMMODORE |
| 2026-10-06 | 2 | 131.6 | 131.6 | +0.0 | COMMODORE |
| 2026-10-06 | 3 | 131.6 | 131.6 | +0.0 | COMMODORE |
| 2026-10-06 | 4 | 131.9 | 131.9 | +0.0 | COMMODORE |
| 2026-10-06 | 5 | 176.7 | 176.7 | +0.0 | PITLANE |
| 2026-10-06 | 6 | 176.7 | 176.7 | +0.0 | PITLANE |
| 2026-10-07 | 1 | 87.5 | 87.5 | +0.0 | HELEN_PARK |
| 2026-10-07 | 2 | 87.5 | 87.5 | +0.0 | HELEN_PARK |
| 2026-10-07 | 3 | 87.5 | 87.5 | +0.0 | HELEN_PARK |
| 2026-10-07 | 4 | 96.8 | 96.8 | +0.0 | ISLAND_NORTH, PITLANE |
| 2026-10-07 | 5 | 87.5 | 87.5 | +0.0 | HELEN_PARK |
| 2026-10-07 | 6 | 87.5 | 87.5 | +0.0 | HELEN_PARK |
| 2026-10-07 | 7 | 108.2 | 108.2 | +0.0 | ISLAND_NORTH |
| 2026-10-07 | 8 | 108.2 | 108.2 | +0.0 | ISLAND_NORTH |
| 2026-10-07 | 9 | 89.3 | 89.3 | +0.0 | ISLAND_NORTH |
| 2026-10-07 | 10 | 89.3 | 89.3 | +0.0 | ISLAND_NORTH |
| 2026-10-07 | 11 | 132.6 | 132.6 | +0.0 | COMMODORE |
| 2026-10-08 | 1 | 179.4 | 179.4 | +0.0 | PITLANE |
| 2026-10-08 | 2 | 115.0 | 115.0 | +0.0 | MEDIAN_PITSTOP |
| 2026-10-08 | 3 | 126.3 | 126.3 | +0.0 | HILL_A47 |
| 2026-10-08 | 4 | 141.9 | 141.9 | +0.0 | MBP_LANDSIDE |
| 2026-10-08 | 5 | 163.5 | 163.5 | +0.0 | HILL_A47 |
| 2026-10-09 | 1 | 164.1 | 164.1 | +0.0 | COMMODORE |
| 2026-10-09 | 2 | 163.8 | 163.8 | +0.0 | COMMODORE |
| 2026-10-09 | 3 | 163.8 | 163.8 | +0.0 | COMMODORE |
| 2026-10-09 | 4 | 163.5 | 163.5 | +0.0 | SEASIDE_NORTH |

## Screenshots (looked at, desktop and phone; in the session scratchpad, not in git)

`scratchpad/v819_shots/`:
- `desktop_drawer_WC02.png`, `phone_drawer_WC02.png`: a parkland location, with the meet point, its QR and the parkland
  box;
- `desktop_drawer_WC61.png`, `phone_drawer_WC61.png`: a normal location (Seaside north; its way in is not repeated);
- `desktop_load_panel.png`, `desktop_load_panel_card.png` (the whole card), `phone_load_panel.png`;
- `desktop_runsheet_load1_page.png`, `desktop_runsheet_load1_printed.pdf` / `.png` (the printed A4, one page),
  `desktop_runsheet_load1_preview.png`, `phone_runsheet_load1_preview.png`;
- `desktop_driver_sheet_06Oct_load1.png`, `phone_driver_sheet_06Oct_load1.png`, `phone_driver_sheet_06Oct_load1_page.png`.

These are made by `evidence/shots819.js`. The test runs also leave every decoded QR image and the five run-sheet PDFs in
`scratchpad/v819/final/`.

## Limitations

- **Driver-sheet photographs:** on every judged sheet (5–9 Oct, 26 sheets) the photo strip is exactly the live base's (26 of 26 unchanged). On 28 Sep (past, shown for comparison, not judged) load 4 14.6 → 0.0 px; load 6 165.9 → 161.5 px. There the sheet has no Way in of its own ("Not set") so the meet point's way in is shown, and the three-reference load already had almost no room on live.
- **QR size on paper:** the driver-sheet meet point QR is 13 mm × the sheet scale (about 10 mm at the usual 0.8), the same as the sheet's own Navigate QRs in the table (12.5 mm × scale); the run sheet QRs are 24 mm. Decoding is proven from the rendered page and the printed PDF; scanning a physical print with a phone has not been done here.
- **The record line follows the live record.** It is worked out when the page draws; the test works it out independently from the same record. Its wording "moving … per Coates" is used only for Andrew's next-week move onto Fri 9 Oct; other differences are stated, not explained.
- **Phone driver sheet:** the A4 driver sheet on a phone is the native page wider than the screen, as on live; v8.19 adds nothing to that.
- **Not touched:** Codex's Demob register and logic, the crane rules, the equipment register, Today, the Timeline messaging and installer preview. The installer daily sheet gets the meet point only when Codex wires the helpers in.
- Seen in passing, outside this release: the v8.16 drawer's map chip reads "MACINTOSH ISLAND" for WC61 on Main Beach Pde (existing behaviour, unchanged).
- **Inherited one-tab failures** (above): 4 Today assertions fail on the live pages without v8.19 as well. The suite's exit is therefore non-zero, and `run_all.sh` reports it as a failed suite.
- The v8.21 row styling changes how the supplier card's load rows look once both are live (see *Source boundary*). That is for Codex to settle when integrating second.
- No record writes. No upload (no key in this session; Codex publishes after Andrew's yes).

## Open questions for Andrew / Codex

- Andrew: yes or no on the Timeline card, the run sheet and the driver-sheet placement (screenshots above). Nothing is
  uploaded until then.
- The record still has WC09 and WC34 on Thu 8 Oct, and WC57 on Mon 12 Oct, while the plan puts them on Load 1, Fri 9 Oct.
  The page says so and does not change the record. Moving them is a record change for Andrew to approve.
- Codex: the installer daily sheet uses the helpers above. The Timeline hunk is shared with v8.21.
