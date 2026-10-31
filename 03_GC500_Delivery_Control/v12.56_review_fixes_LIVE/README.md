# v12.56 — the evening's four fixes, on top of v12.55

Author: Andrew Fisher · built 29 Oct 2026 as a chained candidate: live v12.59
(`1e35528f32ff0b9cd3e0fb646b52cd92bc0c58733d3d9efaf9d02485e7c3a89b`) + `patch_v1255.py` + `patch_v1256.py`.

**LIVE 29 Oct 2026 21:37 AEST** on Andrew's word ("Go live", 21:35 AEST). Public bytes
`cb27d7c56a41c0d5b2fcd19294800b5095fe690da0fe3c91937e8ed9babbdc5c`, 16,127,515 bytes, rebuilt at 21:36 from the
live v12.59 to the same hash as the 19:48 candidate; the upload guard held (live unchanged since the build started,
record 11984); a cache-busted public read-back straight after was identical to the candidate byte for byte. One
upload carried the money release (v12.55) and these four. The stand-alone v12.55 candidate (`a1ef216a…`) stays
built as history.

No money moves here: charge 998,997.00 before and after, every P&L line as v12.55 leaves it.

## What Andrew asked for (29 Oct 2026, 19:00 to 19:10 AEST) and what this does

| Andrew | What it was | What v12.56 does |
|---|---|---|
| "Whats happening here this is still not fixed" (Today, By group: Forklifts 11 of 12, Furniture 0 of 6, Track mat — of 30) | The card counts a thing completed only when a crew tick says so. Fridges, pad chairs, the fork extensions and the track mats have nothing to install, so nobody ticked them. | Where no completion was recorded for a type, what is on site counts as completed; a partly recorded type keeps its recorded count. Every group now reads 100%: Forklifts 12 of 12, Furniture 6 of 6, Track mat 30 of 30, the rest unchanged. |
| "i asked i only want friday. saturday. sunday" (Servicing tracker, Previous nights) | Tue 20, Wed 21 and Thu 22 were the crews' practice runs before the event, tagged practice in the tracker's days, and the strip still listed them. | The strip shows Fri 23, Sat 24, Sun 25 only. The practice nights and their records stay; they are just not listed. |
| "Whats happening in maps.. this looks like a mess. What do these mean" (satellite map covered in green rings) | Each green ring is a collection mark, one per reference that has been picked up (v12.29). With most of the job gone there are about seventy of them. | The rings are off until "Show what has left" is ticked in the Map tools bar; while it is on, a key on the map reads "Green ring = has left site · dashed = part left · red = needs review". Nothing recorded changes. |
| "Can we remove vms removals and fencing closures tabs" · "Can we remove the edit tab" | VMS removals and Fence closures were on the Tools views; Edit was set aside for everyone but the editing link. | All three set aside the way the other set-aside pages are (v5.86): off the tab row, the Tools views and the menu; a link that still asks for one lands on Today and says the page has been set aside. The finder's "VMS removal spot" entries and the print links for those two sheets land the same way. |

Also answered in chat: the Demob cards show each reference's location as the nearest stand and distance (GN04 reads
"Near Stand S15 · 25 m") with Navigate to the pin; the Build cards' map picture is not on them. Build cards with three
maps, one on the master plan drawing, is queued as the next release (preview first).

## Proof

- Tab bar on the candidate: Today, Build, Equipment, Sub-hired, Demob, Map explorer, Documents, Coates Way, Tools;
  Tools views without Edit, VMS removals or Fence closures; `go('vmsoff')` and `go('edit')` land on Today.
- Today, By group: Fencing, Toilets 271/271, Buildings 52/52, Generators 15/15, Lighting 7/7, VMS 24/24, Barriers
  311/311, Access & plant 12/12 (Fork Extensions 1/1), Furniture 6/6, Ground protection 30/30, Other 5/5
  (`evidence/desktop-plates.png`, `evidence/phone-plates.png`).
- Tracker strip: the harness cannot draw the tracker panel (it needs the service's tracker list), so the rule was
  run over the tracker's own days list from the page: before, six nights; after, Fri 23, Sat 24, Sun 25; the same
  three even if the service copy carried no practice flag (the label test). (`tests/tracker_days.json`.)
- Map explorer, desktop and phone: opens with no rings and the key hidden; ticking "Show what has left" draws the
  rings and shows the key (`evidence/*-map_before.png`, `evidence/*-map_after.png`; the module's state read inside
  the explorer frame: showLeft false → true, key hidden → shown).
- Page checks: 218 inline scripts parse, no secrets, Author kept — PASS. Styles: every existing block byte-identical;
  one small block added for the map switch.
- Sweeps on the candidate, desktop and phone: 27 routes (17 shown: the two set-aside pages join the eight hidden
  routes), 7 deep links, Back; 0 page errors, 0 console errors, 0 blocked writes (`tests/sweep56_*.json`).

## Build and upload

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.56 v12.55_to_the_cent_LIVE/patch_v1255.py v12.56_review_fixes_LIVE/patch_v1256.py
python3 toolchain/upload_page.py build/GC500_v12.56/GC500_Delivery_Control_hosted.html   # done 21:37 AEST 29 Oct on Andrew's word
```

`patch_v1255.py` is guarded to the exact live v12.59; `patch_v1256.py` requires the v12.55 footer and module and
refuses to apply twice. Files: `patch_v1256.py` (eight exact replacements plus the map module and its stylesheet),
`map_left1256.js`, `map_left1256.css`, `tests/`, `evidence/`.
