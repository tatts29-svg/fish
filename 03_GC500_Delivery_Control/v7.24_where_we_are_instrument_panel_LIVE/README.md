# v7.24: Where we are as one race-car instrument panel (LIVE)

Author: Andrew Fisher

Andrew, 28 Sep 2026: "make it look like a race car dash that animates 4k ultra crystal clear. Animate it really good". Built from the instrument-panel handover (`handover_brief.md`, `concept.png`).

## What changed on Where we are
- **One charcoal housing:** a raised brow with an orange perimeter and a fine inner lip.
  - Left: the delivery gauge with a Due by this day / Whole job switch.
  - Right, stacked: Fencing records and Calculated revenue.
  - Bottom edge: the shared-record state and when it was last confirmed.
- **Removed:**
  - the old delivery block (the red "Behind by 29", the separate 197 and 226 tiles, the LED ladders and the whole-job bar);
  - the four white cards (On site, Plant on the job, Temporary fence, Revenue).
  - Nothing is lost. The detail moves into three drawers: **View delivery details**, **View fencing breakdown** and **View charges**.
- **Today is unchanged.** It keeps its own delivery block.

## Figures (all read live from the existing functions)
| Where | Now reads | Source |
|---|---|---|
| Gauge, due mode | 87.2% · 197 of 226 due units recorded · Due by 28 Sep | completionAsOf |
| Gauge, whole job | 25.6% · 202 of 790 units recorded | completionAsOf |
| Fencing | 4,342.5 m · recorded fence work | fenceMetres (clean 4,127.5 + scrim 215) |
| Revenue | $402,945 ex GST · 43 hire lines with no rate | moneySummary |

**Wording safeguards from the handover:**
- **The 29:** shown only in the delivery drawer, as a gap in the record rather than proof of lateness. It comes with its real reasons: 0 references recorded not on site, and 9 with no delivery record (listed as tappable references).
- **The 5 extra:** split into "not due yet or no date" (5) and "more than asked for on due rows" (0).
- **Fencing:** called work recorded, not unique length.
- **Revenue:**
  - called "calculated", ex GST — not profit, invoiced or cash;
  - its breakdown adds back to the total exactly: hire contracts $240,445, fencing $92,551, event labour $55,817 (provisional), ticked labour $14,132.

## Motion
- **Entry:**
  - the housing rises in over about 0.3 s, and the zones follow left to right with a 40–50 ms stagger;
  - the toggle's lit half glows once;
  - the needle and arc sweep up together, eased (0.78 s after a 0.17 s pause).
- **Switch:**
  - the lit half slides, with a light sheen passing across it;
  - the button presses by 1 px;
  - the words cross-fade as one group;
  - the needle moves from wherever it is at that moment.
  - Rapid clicks turn it around mid-sweep, with no queuing or jump.
- **View date / sync:**
  - a redraw never replays the entry;
  - the needle travels from its current position to the new value;
  - a figure that genuinely changed glows once;
  - the status lamp brightens once when the service confirms.
- **Drawers:** they ease open, and the arrow leans in on hover or focus.
- **Reduced motion:** the final state shows at once.
- **Idle cost:** nothing loops, and animation frames only run while something is moving.

## 4K
Everything is vector SVG plus live text; there are no images. Checked at 3840×2160, desktop at 1× and 2×, tablet 820 px, and phones at 390 and 360 px. There's no sideways scroll at any size.

Print gives a light version with the final values.

## Tested
- 0 errors on all sizes, and on the full sweep of all tabs (desktop and phone).
- The money probe is identical.
- Pre-starts still print one page each.
- Rapid switching lands on the right value, and a redraw doesn't replay the entry.
- Changing the date moves the needle (21 Sep: 77.5%, 131 of 169).
- Reduced motion shows the final state on the first frame.

**Kept out on Andrew's word:** Delivery signals stays off (v7.19). The handover suggested keeping it as a drill-down.

**LIVE: 28 Sep 2026 05:41 AEST**, byte for byte on the view link.
