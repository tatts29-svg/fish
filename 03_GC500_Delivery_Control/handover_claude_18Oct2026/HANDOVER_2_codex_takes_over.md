# Handover 2: Claude → Codex, everything open (18 Oct 2026, ~09:30 AEST)

Author: Andrew Fisher · written by Claude.

Andrew, 18 Oct: "You have 4% weekly ussage left. You need to get codex to help before you run out". Claude is stopping
active work. **Codex owns everything below from now on**, including claims v10.66, v10.62, the tracker page and server
v5.90. Nothing is half-built: the v10.66 build run was stopped before it wrote a file, and every other file is committed.

Live: page v10.65 `c62adee5…` (Codex), server v5.89 `cb32d00e…` (rollback `SERVER_FILE=d5a0d777…`), record 9704.

## 1. v10.66 speed and smoothness (Andrew said "Upload" for this; standing word: "permission to upload everythi g")

Everything you need is in `prototypes/` beside this file: five patches, all 72 hunks found exactly once in sequence on
live v10.65 (`prototypes/results/hunks_v1065.md`), the read-only measurement and parity scripts, and the numbers in
`speed_findings.md`. Plan, as Claude was about to run it:

1. Write one patch `v10.66_speed_smooth_DRAFT/patch_v1066.py` (house style; guards: refuse repeat, need
   `+ ' · v10.65'` and `shapes1060-script`; footer → `+ ' · v10.66'`; page comments say v10.66, never 1061 or agent names).
   Merge load (all 12), buildtab F1–F16 including F13 (strip keeps its swiped place), flicker A–F, idle 1–6, and the
   codexport parts that measured faster. Choose ONE implementation where they overlap:
   - unseenNow L89206: load 'hold' = flicker F.
   - EventConfig1013.current L27142: load 'sig' (per task, queueMicrotask) vs buildtab F2 (per asset hold). Must never
     return stale event dates after a save, hydration, delivery or the midnight rollover.
   - metadata925/model925 L78708/78733: load 'meta' vs F3 vs codexport. histOf L50547: load 'hist' vs F6a.
     unitEvidence L87605: load 'unitev' vs F9 vs codexport. selection-save1012 observer L86867: F14 vs idle.
   - work986 native L81675–81691: F1a/F1b and codexport's day-work snapshot should stack; check it.
   - idle 'banner countdown' depends on its own 'clock helpers' hunk (order matters).
2. `bash toolchain/build.sh v10.66 v10.66_speed_smooth_DRAFT/patch_v1066.py`.
3. Gate: every pane's text identical, desktop and phone, on a frozen record and clock; Build on every third day; every
   sixth drawer. Standing suites v10.56–v10.65 (known stale: v10.53 footer regex, v10.57 44→45). Both 24-tab sweeps
   at 0 errors. Then an adversarial review of cache staleness, the boot/loading panel (never stuck, never a wrong
   Saved copy/OFFLINE, deep links), and visual/idle. Then perf A/B on phone CPU ×4 and desktop against the 10/10
   targets in `README.md`.
4. Upload with `toolchain/upload_page.py` (base guard), then read back. Behaviour changes to name to Andrew: the page
   no longer opens on Map explorer by mistake; the Build strip stays where you swiped it.

## 2. Servicing tracker: deadline Thu 22 Oct 08:00 (TEST tracker first, then the real one, then laminated sheets)

State: server v5.89 live. Crew card, print pack, panel mock-up and integration are built and committed in
`servicing_tracker_DRAFT/` (`card/`, `print/`, `panel_mockup/`, `integration/`) with `tracker_data.json` holding
Andrew's final job rules. **All review findings are in `servicing_tracker_DRAFT/REVIEWS_18Oct2026.md`.** Must-fix before
crews use it:
- Card: a scan with no signal opens nothing (`no-store`, no service worker). Two tabs overwrite each other's offline
  outbox, so a tick is lost. The sticky header takes up to 71% of a 360×640 phone. "Stay on Friday" holds for 24 h and
  isn't offered after a fresh scan. A tap just after 08:00 lands on the new day while the screen shows the old one.
- Server v5.90 (deploy under Andrew's standing word, same staged-blob method as v5.89): the shared 1,200/hour tracker
  allowance can be drained by anyone with a few sheets; voided ticks still count against the 25,000 cap; a lost key
  silently re-keys, so every laminated code dies; `/api/ticks` has no cursor.
- Panel (page release, next free number): shows 61% next to "104 of 263 units". Use the same nouns and counts as the
  card. Show per-job progress per area.
- Card storage prefix `gc500.svc1063.` must follow the real page number.

Asked of Andrew, not answered yet:
1. The contact name and mobile for the card and sheets.
2. T0024: area 1 per the workbook, or the Main Beach SUPPLY compound per the plan?
3. Seven unpinned locations (SPARE 0164, BJR01, SVP01, T0162, T0176, WC85, WC100): is "ask on site" OK?
4. Should the view link see progress?

## 3. Still unclaimed, from the first handover

The v10.62 EP servicing cost, the fencing audit, the buildings register and the departure rule. Known map overlaps.
