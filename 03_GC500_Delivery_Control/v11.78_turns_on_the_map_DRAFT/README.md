# v11.78 — the turns on the map: find, picture and send a track turn

Author: Andrew Fisher. Built on live v11.76 `862c9a63880169e2cfdb0f293b9fd662e2643c6c792a824f2ffc4bc454618b01`.

## Andrew's words, 24 Oct 2026

> "Can we have the same function for turns the track has turns.. so when i get a mwssage to send someone to a turn on on the
> track. I nead to send them to that area on track.. example where is turn 2"

Then, on the tested build: "Go live".

## Where the turns come from

The page held no turn positions. The master plan D001-26003-03 labels fifteen turns T1 to T15 on the carriageway at each corner.
Each label's centre was read on the drawing as the page holds it (MAP_TILES level 0, 5200 × 3673 px, the D001 frame) on 2× crops
with a 20 px grid, about ±3 px (about 1 m): `turns_read.json`. Each place goes through the master registration exactly as the
v11.76 stands do (`patch_v1176.stands`, worst MASTER_LAYERS point 0.08 m): `turns1178.json`. Independent check against the page's
own VMS removal spots: Turn 10 is 0.4 m from "T10 runoff" and Turn 2 is 4.1 m from "T2 runoff".

## What changes

The v11.76 find/send block (`find1176-style`/`find1176-script`, Claude's own) is replaced by `find1178`, the same module plus:
- "turn 2", "t2", "T02", "turns" (and "corners") answer in the Maps box and the finder with Turn n first; "turn 16" says the plan
  labels T1 to T15. Other searches answer as before (T0085, stand 5, gate 6, VMS 10, WC41, asset numbers).
- A turn's card: close and wider pictures (aerial with the master plan), Send…, Navigate, Save, Copy, Open a text message, Show on
  the satellite map, and Text it to a mobile on the edit link — the v11.76 card.
- The satellite map under the explorer carries the turns as red pins with a **Turns (15)** filter and a list.
Footer v11.76 → v11.78 (v11.77 is Codex's Showcase claim; the patch also accepts its footer). No record writes.

## Checks

- `tests/test_v1178.cjs` 44/44 desktop and phone on the build (the 35 v11.76 checks plus nine for the turns).
- Sweeps desktop and phone: 27 tabs / 19 shown / 7 hashes / Back, zero errors, zero console errors, zero blocked writes.
