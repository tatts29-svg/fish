# v8.92 — the A+ pass: smooth, fast, easy to get around, the right words

Author: Andrew Fisher. Built 8 Oct 2026. **DRAFT — ready to upload once the lead has the edit key** (see the results table at the end).

Andrew, 8 Oct 2026 about 03:40 AEST: *"This need to be all A+ class perfection. Every look. Every movement. Smooth. Fast. No lag.
Navigation needs to be easy. Terminology needs to be correct with words in every part."* And at 04:00 on what good looks like:
*"No bugs. No errors. No scrolling issues. No presentation issues. No navigation around page issues. Nothing is blocking things.
We have back buttons we have close buttons. Easy simple. And all cost align and correct."*

This release changes how the page **behaves and reads**. It changes no record, no money figure, no pin and no direction:
DATA and every navigation pin are byte-for-byte the base's (`tests/test_identity892.py`), and every figure on Costs & P&L —
the P&L summary, Costs to job end, the Finance handover, the business's lines, the Transport view, Rehire by branch and all
17 tie-outs — is the same string of figures on the base and on this build (`tests/test_money892.cjs`).

## What felt slow, and why (measured first)

Measured like for like on the same machine, headless Chromium, three screens (phone 390×844 with touch, laptop 1440×900,
wide 2560×1370), on the full chain the lead named (`fe52302c…`) and then on this build. The table is in
`evidence/measurements.md`; the raw JSON is in `evidence/measure/`. In plain words:

| What Andrew would feel | Why | What v8.92 does |
|---|---|---|
| Fencing takes about a second to open, and every record refresh on it repeats that | the service's file index was rebuilt for every photograph on the tab — 300 times a draw, 612 ms of the second | built once per draw |
| Documents takes over half a second | every file name was checked against every docket number, and the docket numbers and every asset's numbers were worked out again for every file (650 ms) | the book numbers and the asset numbers are read once per draw, each file name once |
| Costs & P&L is the slowest tab, around a second | the Finance month-end events were filtered again for every labour line (490 ms), and the labour plan was worked out for each card that asked | once per draw |
| A small stutter after every tab opens | every table that scrolls sideways was measured and then written one at a time — the browser laid the page out again between each | all measured first, all written after |
| The Timeline stutters while you scroll | on every scroll frame each lamp housing was measured and then switched, one at a time — a forced layout per lamp | all measured, then all switched |
| Today stutters while you scroll | every scroll event re-ran the instrument check and rewrote every card's play/pause controls | one check per frame, and nothing rewritten while the same instrument keeps running |
| On the Timeline a record refresh moved the page under you | the browser guessed a new scroll anchor while the pane was rebuilt (+47 px) | a redraw keeps the reading position; the browser's guess is turned off on the work area |

Nothing is worked out differently; the same functions give the same answers. What changed is how many times they run inside one
draw (inside a draw the record cannot change, so the first answer is kept until the draw ends — the page's own `holdAssets` memo,
emptied at the end of every hold and whenever a save lands mid-draw) and when the page measures the screen against writing to it.

## The look

The three-size audit (`evidence/audit/`) checked every tab for text that spills or is clipped, anything past the right edge,
page-wide sideways scrolling, text contrast, focus rings and tap targets. Fixed:

- **Contrast (WCAG AA).** The Demob day tiles used the dark island tile's grey words on a light tile (1.9:1 and 1.6:1); the
  "Oversized: check permit" fold heading was the drawer's orange on a light card (1.9:1); Today's first jump pill was white on
  Coates orange (2.9:1) and its small print under the circuit map 4.3:1. All clear 4.5:1 now, with the page's own darker orange
  ink and its slate grey — the components are not redrawn.
- **Tap targets on a touch screen.** Small buttons, links, chips and the drawer's × keep their size and look, and each gains a
  44 px tall hit area centred on it (an invisible pseudo-element); fold headings get 44 px of height. Phones and tablets only
  (`pointer: coarse`); a laptop is unchanged.
- **No sideways overflow** on any tab at any of the three sizes (checked in the test).
- **Costs & P&L → Transport (lead, 8 Oct):** the long explanation that pushed the four figures down is folded under them as
  "How these figures are worked out", closed, and remembered open like the other Costs folds; the tie-out line stays in view;
  the Everything reconciles panel is as v8.88 made it.

Found and left as they are, with the reason, in `evidence/audit_findings.md` (for example the day strip's weather scene bleeding
past its card on purpose, tables that scroll inside their own box, the Equipment register card still called Register).

## Navigation

Checked at all three sizes: every dialog and menu — Tools, the clock pod, the search finder, the reference drawer, the Timeline
stage dialog, Today's work dialog and the Coates Way machine — opens, closes with **Escape** and closes with its **× or Close**;
**Back** returns to the tab before; `#day/…`, `#costs` and the other deep links land where they say; a redraw keeps the
reading position on Timeline, Equipment, Costs, Fencing and Today; the search box finds references, names and asset numbers
as it did (the finder answers every keystroke and the heavy redraw waits for the pause). Nothing here needed changing beyond the
scroll position and the tap targets — the page's navigation was already sound; the test now proves it on every build.

## Terminology — one word for one thing

`evidence/terminology_report.md` lists every user-visible string that differed from the AGENTS.md table or used two words for
one thing, where it is, and what was done. Fixed in v8.92: **Equipment page** (was Plant page), **Costs & P&L** everywhere the
page still said "Costs & charges", **Customer rates & charges** everywhere a hint still sent people to "the Pricing tab",
**the Equipment tab** (was the Register tab), **sub-hired** as the one spelling (was subhired / sub-hire in 30 places; the money
stays **Rehire**, and the Finance handover streams now read Fencing — Rehire and Toilets — Rehire), **oversized** (was oversize),
**Rate 1 / Rate 2 / Rate 3** as the contract calls them, and **licences** on the Pre-start declaration. Kept, with the reason:
Finance's own timing words (billing month), staff expense claims, management's category wording, quoted documents in the record,
and the master plan's location words ("Pit Lane (~40 m)"), which are directions and are not changed in v8.92.

In v8.91's area (daily runs, run sheets, Drivers/Install prints, crew planning, loading) and so **listed, not patched**: "driver
sheet" for the Drivers print, "Subhired · no Coates number" on the drop sheet, "Sub-hire pick-up" and "sub-hire supplier" on the
Demob run sheets, "oversize" in the run-sheet sign-off and the crew planning category, and two orange-on-white links in the
loading lines (2.9:1).

## For Andrew

1. The Map explorer tab's sheet button (and the machine's page) say **Plan on satellite**; the tab says **Map explorer**. One
   thing, two names — which word do you want on the button? (The explorer's own name lives in the machine bundle.)
2. Fold headings on a phone are a little taller than before (44 px for the thumb). Say if you would rather they were not.

## Build

```
toolchain/build.sh v8.92 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
  v8.89_master_map_DRAFT/patch_v889.py v8.92_a_plus_pass_DRAFT/patch_v892.py
```

The patch asserts the chain is in, takes the footer from whichever release ran last (v8.89, v8.91, v8.93 or v8.94), applies the
in-place edits exactly once each, puts its style before `</head>` and its script before the last `</body>` (after every other
release's, so its overrides land last), and proves DATA and MASTER_LOC are the original bytes before it writes.

- **Base:** live v8.83 `88a3584e…`, chain v8.84–v8.89 `fe52302c…` (11,257,271 bytes).
- **Candidate:** see the results table. `check_page` PASS (16 inline scripts parse, no new keys, author line present).

## Results

[filled in below once every run is in]
