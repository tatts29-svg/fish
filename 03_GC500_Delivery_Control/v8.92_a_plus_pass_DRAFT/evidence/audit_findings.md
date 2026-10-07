# v8.92 look-and-navigation audit — what was found at three sizes, what was done

Author: Andrew Fisher. 8 Oct 2026. Phone 390×844 (touch), laptop 1440×900, wide 2560×1370; headless Chromium against the live
record (read-only). Per tab the audit lists every control under 44 px, every text box that spills or is clipped, every element past
the right edge, page-wide sideways overflow, text under WCAG AA contrast and buttons without a visible focus ring; then it opens and
closes every dialog and menu. Raw results: `audit/before_*.json` and `audit/after_*.json`; screenshots without money in `shots/`.

## Fixed in v8.92

| Finding | Where | Before | After |
|---|---|---|---|
| Grey words on light tiles, 1.9:1 and 1.6:1 | Demob, "Choose a pick-up day" tiles ("Mon Oct", "21 to pick up", "references") | `#a9b4b3`/`#b9c2c1` on `#eff4f7` | slate `#4b5560`, 6.8:1 |
| Orange fold heading on a light card, 1.9:1 | Demob, "Oversized: check permit / travel window" | `#ff9a4d` | the page's orange ink `#b34a0d`, 6.2:1 |
| White on Coates orange, 2.9:1 | Today, the first jump pill | `#fff` on `#ff6a13` | on the orange ink, 6.8:1 (as `.btn.primary` since v5.49) |
| Small print 4.3:1 | Today, the line under the circuit map | `#68787c` on `#f8f6f4` | slate `#5f6a75`, 4.9:1 |
| Controls under 44 px on the phone | `.btn.sm` 25 px, `.btn.tiny` 22 px, `.linkish` 24 px, `.invn` 28 px, `a.chip` 21 px, filter buttons, Today's banner buttons 30 px, the header's search/Tools/Back 32–34 px | tap area = the box | a 44 px tall hit area centred on each (invisible pseudo-element; the box and the look are unchanged); touch screens only |
| Fold headings 15–25 px tall on the phone | `summary` everywhere | — | 44 px tall on touch screens (padding; the marker and the words are unchanged) |
| The drawer's × 26 px wide | reference drawer header | 26×60 | 44×44 minimum on touch screens |
| A record refresh moved the Timeline 47 px | Timeline, any redraw while scrolled | reading position lost | kept (`render` keeps `main.scrollTop`; `overflow-anchor:none` on the work area; a pane that fills in behind is put back as its height returns) |
| The Transport explanation pushed the figures down | Costs & P&L → Transport, phone first | two long paragraphs above the four figures | the figures lead; "How these figures are worked out" is a closed fold under them; the tie-out line stays |

## Found and left, with the reason

| Finding | Where | Why it stays |
|---|---|---|
| `button.day` "past the right edge", `span.dface` wider than its card | Timeline day strip | the strip scrolls sideways by design (`overflow-x:auto`), and the weather scene bleeds past the card on purpose |
| Tables wider than the screen | Equipment, Costs & P&L, Customer rates & charges, About (laptop and phone) | every one sits in a `.tblwrap` that scrolls sideways and is a keyboard region ("Table — scrolls sideways"); the page never scrolls sideways (`main overflow-x:hidden` on the phone) |
| `#panehead-*` and `.sr`/`.vh` text "clipped" to 1 px | every tab | visually hidden headings and screen-reader text, by design |
| Orange link on white 2.9:1 ("Pre-Transit Checklist…"), tick "short" 3.2:1 | Timeline loading lines (v8.72) | v8.91's area — listed for that build |
| Red "cancelled" on pale green 4.47:1 | Equipment register row | 0.03 under AA, on a single word beside its light; left as built, noted |
| The Breakdowns card on Today (`data-go="breakdowns"`) | Today | hidden by the page's own `.tabsoff` rule (the tab is set aside); not reachable, not a dead end |
| Checkboxes 17–20 px | Timeline loading lines, Fencing papers | inside labels (the label text toggles them); sizing them would restyle a component; in v8.91's area |
| "Register" card title | Equipment | the equipment register lives on Equipment (Andrew, 2 Oct); the set-aside tab was the Register |
| "Plan on satellite" | Map explorer sheet button and the machine's page | the explorer's own name is set in the machine bundle — a question for Andrew in the README |

## Dialogs and menus (every size)

Tools menu, clock pod panel, search finder, reference drawer, Timeline stage dialog, Today's work dialog, Coates Way machine:
each opens, closes with Escape and closes with its × or Close. The Map explorer frame is the machine's own (out of scope). Back
returns to the tab before; a step back past an open drawer closes it (the page's own rule since v5.71).
