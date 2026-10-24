# v11.56 — the gates on the maps — LIVE

Author: Andrew Fisher. Built on live v11.55 `7262dbfc63ef6f67744fa8f84bf5a734b60eb48d4655b98c3c9faebaccd63c4e`.
**LIVE 23 Oct 2026 14:55 AEST**, page `c59fbc57dd1c17d1b831a93ad936c205a0128703d842e7579af5896b2d812da6`, 21,429,685 bytes, the view
link byte for byte.

## Andrew's words, 23 Oct 2026

> "can we add a gate search on the maps so when someone says gate 1 or gate 6 we know where it is please"

## Where the gates come from

The master plan D001-26003-03 draws the spectator gates, and the page already held each one's position from it
(`MASTER_LAYERS`, layer `gate`: G1, G2, G3, G4, G5A, G5B, G6, G7, G8, G8a, G9, G10 — image registration, not survey). Where the
master draws a gate twice the page keeps one point: the fence-line point where it is drawn (G1, G8, G8a), otherwise the approach
on the main sheet, never the Cypress car park inset copy. No position is new and nothing is guessed.

## What changed (`gates1156.js`, one style rule, footer v11.55 → v11.56)

1. **The finder answers a gate.** "gate 6", "gate6", "g6", "g 6", "gate 10", "gate 5a" put that gate first; "gate 5" offers 5A and
   5B; "gates" lists all twelve. "gate 1" is Gate 1, not Gate 10. Any other search is untouched. The row says what it is
   ("Gate 6 · spectator gate · master plan D001-26003-03 · the approach, as the master draws it") and what opens.
2. **Picking a gate opens the Maps tab** in its explorer view, with the satellite map under the explorer zoomed to 1600% on the
   gate and a yellow ring on it for twelve seconds, and a line saying so.
3. **The satellite map under the Map explorer carries every gate**: a white pin with the gate's number (G6), its label, a
   **Gates (12)** filter beside VMS boards and Generators, and a row in the list under the map with how the position is known,
   **Navigate ↗** (Google Maps directions to the pin) and **On the plan**, which shows the gate's label on the master drawing
   (the plan zoomed on it, ringed — the page's own "callout" behaviour).

The block sits after `find1142-script`, the last wrapper of the finder, before `steady1143-script`. Nothing is written; the
record is untouched; no other tab changes.

## Checks

- `tests/test_v1156.cjs` — 14/14 on the dry page, desktop and phone; **14/14 live, desktop and phone** (`evidence/live/`):
  footer; twelve gates with the right faces; G1 and G8A on the fence line, G6 the main-sheet approach; the finder's answers for
  "gate 6", "g6", "gate 10", "gate 1", "gate 5a", "gate 5", "gates", and "P33" untouched; the row's words; the pick opens the
  Maps tab in explorer view, closes the finder, no page reload; satellite 1600% and ringed on G6; twelve items, pins, the
  filter and the list; the Gates filter alone; "On the plan" lands on the master sheet; record unchanged; no errors; no writes.
  Screenshots `gate6_*.png` (satellite, ringed) and `gate6_plan_*.png` (the plan).
- Sweeps desktop and phone on the final dry page: 27 tabs, 19 shown, 0 errors, 0 console, 0 blocked.
- Real build byte-identical to the tested dry page; `check_page.py --base` PASS.

```
bash toolchain/build.sh v11.56 v11.56_gate_search_LIVE/patch_v1156.py
python3 toolchain/upload_page.py build/GC500_v11.56/GC500_Delivery_Control_hosted.html
```

Numbering: Codex's Showcase repair claim of 13:57 also said v11.56; the uploader names the rebuilds (AGENTS.md rule 4), so that
work takes the next number when it is built on this live base.
