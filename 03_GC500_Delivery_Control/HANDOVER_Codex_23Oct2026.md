# Handover for Codex — GC500 Delivery Control, Friday 23 Oct 2026, 05:20 AEST

Author: Andrew Fisher. Read AGENTS.md first, then STATUS.md (newest entry on top). This note says where the page is up to
tonight so nothing already done is done again. Everything below is recorded in STATUS.md with hashes; this is the short form.

## Where we are

- Live page: v11.37 (sha db0d582a…, 21,318,762 bytes), uploaded 05:06 AEST from `build/GC500_v11.37/`. Every release since
  v11.29 went live tonight in order (v11.29 … v11.37); the folders are `v11.NN_<name>_LIVE/` with a patch, tests and evidence
  each. A patch applies only to the exact live page it names by SHA-256 (`BASE_SHA256` in the folder), so a new release is
  built on the current live build, never on an older one.
- The race weekend is on. The crew card (servicing tracker) is in use on phones through the printed QR codes: do not change
  any QR code or the EVENT tracker's codes. The TEST and EVENT trackers were last republished 05:07 (v11.37 card).
- Working branch `ccr-061f77e8-ivjhrv`, draft PR #32. Last commit 72e28efb. The repository holds the patches, tests and
  evidence; it never holds the edit key, private link files (`private_links_*.json`, gitignored), signed link bundles, print
  packs, card backups, the raw SMS export or the Baseplan / schedule files.

## What went live tonight (newest first)

| Release | What | Live |
|---|---|---|
| v11.54 | The 2026 Event Labour Scope C004-26003-01 on the page (2026 access plan, $150.11 / $91.14, the shifts as written); race-weekend charge $55,816.56 → $56,744.47 | 12:46 |
| v11.53 | Questions tab closed off: the identity check no longer fails on the VMS boards (51 → 2 locations without numbers), nine settled questions to history, NVAC lines treated; 3 / 2 / 51 | 12:32 |
| v11.52 | Not charged here: the six references on their own hire schedules (T0024, T0162, T0176, BJR01, SVP01, PG29) out of every charge and cost; waste-tank labour one charge with the block | 12:13 |
| v11.51 | The Map explorer's servicing areas only with the toilets: outlines while the Toilets & amenities filter is on or one area is chosen (inside Codex's v11.47 block) | 11:24 |
| v11.50 | Fence closures redrawn from Andrew's marked plan: one bright colour, straight runs on the footpaths, no glow | 11:11 |
| v11.48 | Event nights and Change deliveries set aside (TABS_OFF); the Servicing tab carries the trackers | 10:47 |
| v11.47 | Codex: unit-kind symbols beside the Map explorer codes; each servicing area outlined and named | 10:16 |
| v11.46 | The crew card names each line in the crew's words with its symbol ("8 flush toilets", not "8 × FWF"); TEST tracker republished, EVENT on Andrew's word | 09:55 |
| v11.44 | The satellite maps turned to the plan's way up (beach along the top) | 09:24 |
| v11.43 | Showcase opens on the flat circuit on a device that was slow building the 3D, "3D circuit" one press away | 09:09 |
| v11.42 | The finder finds anything: tabs, the Showcase, VMS boards by number, removal spots and mornings, register asset numbers | 08:09 |
| v11.41 | "Where it is": every VMS board and every generator on satellite under the Map explorer (filter) and the boards under the VMS boards tab; GN25 listed as having no position | 07:43 |
| v11.40 | Satellite maps capped at Esri's sharpest real imagery (zoom 20) | 07:27 |
| v11.39 | VMS removals map (colour-coded, dotted line to each board's spot), Friday morning added, closures satellite layer fixed | 07:15 |
| v11.38 | Closure lines re-placed on the footpath side, thin neon, Plan / Satellite | 07:03 |
| v11.37 | Crew card plan zooms to 16000% on the Map explorer's tiles (pinch, drag, double tap, wheel, + / − / Fit); both trackers republished | 05:06 |
| v11.36 | Fence closures tab: the closure lines on the 2026 plan as neon lines (nine lines, three colours), zoom to 16000% | 05:00 |
| v11.35 | Twin-steer tick before printing off; Build tab stops at 22 Oct; Coates on time rebuilt from the 22 Oct texts | 03:56 |
| v11.34 | Crew card: a symbol per reference (toilet, block, accessible, trailer, sewer, tank); tap zooms to it; key | 03:10 |
| v11.33 | Fence closures tab (#fenceclose): ten points, three race days, closed / opened ticks, printable sheet | 03:01 |
| v11.32 | VMS removals tab (#vmsoff): five end-of-session boards, earliest off-track times, where each goes, ticks, sheet | 02:51 |
| v11.31 | Crew card labels laid out clear; Closer / Wider | 02:22 |
| v11.30 | Crew card plan loads as a blob (the card's CSP refuses img URLs) | 01:59 |
| v11.29 | Crew card: the scanned reference's area on the plan with a pin per reference | 01:44 |

## Andrew's standing rules (verbatim where it matters)

- "The edit key never goes in a file, a commit, a log, a screenshot or a message." Tests are GET-only. A record change goes
  through the page's own functions, with a backup first, as "Andrew Fisher via Claude" (or via Codex), in a
  `record_<date>_<what>/` folder.
- No AI or agent names anywhere on the page. The scrub step (`toolchain/scrub_attributions.py`) runs in the build.
- The site record is truth; "Our dockets and whats been invoiced is truth". A door side is never guessed. "If I have unticked
  it don't go ticking it again." "we charge for the works we do we cant charge for things that have not been done."
- Never read Railway variables. "Dont change any qr codes from servicing. I have already printed all sheets."
- Commits as Andrew Fisher; a release is not done until the live page's bytes match the build and the live tests pass.

## How a release is made (the toolchain)

1. Dry: copy `build/GC500_vPREV/GC500_Delivery_Control_hosted.html` to scratch, run the patch, run `scrub_attributions.py`,
   then `check_page.py --base <prev build>`; run the release's tests (`PAGE=… node tests/test_vNNNN.cjs`, `MOB=1` for phone)
   and the regressions; sweeps `toolchain/harness/sweep.js` desktop and phone (27 tabs, 7 hashes, Back, 0 console, 0 blocked).
2. Real: `bash toolchain/build.sh vX.YY patch.py` (fetches live, applies, scrubs, checks) — must be byte-identical to the dry
   page (compare sha256).
3. `python3 toolchain/upload_page.py build/GC500_vX.YY/GC500_Delivery_Control_hosted.html`; then `LIVE=1` tests.
4. For a card change: `node tracker_update.cjs test` then `event` (from the release folder, private links beside it), then
   `tracker_card_check.cjs test|event PG01`.
5. STATUS.md entry on top, README in the folder, rename `_DRAFT` to `_LIVE`, commit, push.
Gotchas: `rep()` in `toolchain/rep.py` consumes the old text's leading whitespace, so a replacement that starts where a space
was must begin with that space. Dated "Andrew Fisher, 23 Oct 2026" strings in page text are scrubbed to "the project
manager, …", so compare hashes after the scrub.

## Assignments, 23 Oct 2026 08:05 AEST (posted on PR #1; reply "taking" there)

1. **Codex — Map explorer pin labels and areas.** Andrew: "Can we have symbols of what they are. Confusing a number on
   how many there in brackets. We want to know is it a toilet flush or sewer tank and toilet block. Or sewer tank toilet.
   Pee panels. Or disabled toilets"; "Area must be in highlight so we want to show the areas not just in bulk as one".
   The explorer's pin labels read "GN23 (1)" / "GN? (2)"; show the unit kind as a symbol instead of a count, and
   highlight each area on its own. The crew card's six symbols (v11.34, `kindOf1134` / `symHtml1134`) can be mirrored.
2. **Codex — positions the record lacks.** GN25 (1244536) has no position; the Altus compound (Cypress Ave) spot for
   VMS 13 / 14 is at the street until pinned. Record a pin from Andrew through the page's own pin function.
3. **Claude — finder (v11.42, LIVE 08:09).** Tabs, the Showcase, VMS boards by number, removal spots and mornings, register
   asset numbers are findable; the finder functions are free again.
4. **Claude — Showcase (v11.43, LIVE 09:09).** Andrew: "What ever makes it quicker please" — a device that was slow opens on
   the flat circuit with the 3D one press away.
5. **Claude — crew card list wording (v11.46, LIVE 09:55; TEST tracker on it, EVENT on Andrew's word)** and the open questions to Andrew.
6. **Claude — v11.52 (LIVE 12:13), v11.53 (LIVE 12:32) and v11.54 (LIVE 12:46) are done.** Next: the fencing reconciliation to
   the cent — waiting on Andrew for the weekly Commercial Approval sheets for construction weeks 3, 4, 5 and 6 (POs 4647515,
   4647517, 4647509, 4647508); weeks 1 and 2 already match their POs to the cent on the record. None of it touches Codex's
   `mapunits1147-script` block.

## Open asks from Andrew, in his order of priority

1. **Fence closures map (v11.36) — refine.** His rules, 23 Oct: "a clean bright neon line along the footpaths", "no breaks in
   the lines", "follow the foot path on one side of the road, then cross at stages and do the other side", "you don't walk
   on buildings", "show it so it's the one side of foot path when shown and when the other side we show that"; "use a new map
   or a satellite map" is on the table. The lines live in `v11.36_closures_map_LIVE/closures_lines.json`; to move one, edit
   the waypoint in `lift/routes.json` and re-snap with `lift/snap_lines.py` (needs the scratch tile fetcher, see the README).
   In hand now: thinner strokes, each line offset onto its footpath side, the two corners that cut across cleaned, a
   satellite base if the page's CSP allows it.
2. **VMS removals map.** "Vms removals boards lets colour code lets have a map with the colour have a dotted line on where
   they go. They get taken off track first thing this morning." Also: "Today is friday they get taken off the track this
   morning" — the v11.32 tab's mornings start Saturday 24; Friday 23 must be added. Board positions are the VMS1024 boards on
   the page; where each goes is in the tab's RULES (VMS 16 behind 2 Breaker St −27.9817267 153.42943; VMS 15 the T2 runoff;
   VMS 13 and 14 the Altus compound, Cypress Ave; VMS 17 the T10 runoff).
3. **Crew card lists: kind words and symbols, not a count in brackets.** "We want to know is it a toilet flush or sewer tank
   and toilet block. Or sewer tank toilet. Pee panels. Or disabled toilets." The map symbols exist since v11.34 (kindOf1134,
   symHtml1134); the list lines still say the record's type words ("1 × FWF"). "Area must be in highlight so we want to show
   the areas not just in bulk as one."
4. Unanswered questions to Andrew: what "Rest can be placed on yellow side of the barrier" refers to; where the bracketed
   count he saw is.

## Where things are

- Plan geometry: the explorer's sheet is 2384 × 1684 pt (1 pt ≈ 0.71 m); tiles at
  `/w/Coates-GC500-2026/explorer/assets/vt/` (manifest.json; levels −3 … 3.25; 512 px WEBP tiles packed in `.bin` files,
  served by byte range). Georeferencing (sheet → Web Mercator z18 px, 512-px tiles) is in the explorer's
  `georeferencing.json`. The slim manifest used by the card and the closures map is `tiles1137_manifest.json` /
  `tiles1136_manifest.json`.
- The card template is `var SVC1067_CARD` on the page; card patches chain (V29 → V30 → V31 → V34 → V37) by importing the
  previous patch's strings; the card's handle is `window.SvcMap1129`.
- The closures record is `DATA.closures` (marks, windows, plate); the Fence closures tab is `fenceclose1133`, its map card
  `closuremap1136`; the VMS tab is `vmsoff1132`.
