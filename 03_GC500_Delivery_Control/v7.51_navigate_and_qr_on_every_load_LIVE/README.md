# v7.51 — Navigate and a QR code on every load line (LIVE — uploaded by Codex, 1 Oct 2026)

Author: Andrew Fisher · 1 Oct 2026

Andrew, with the Timeline on a big screen: "Can I get a navigate to, as well as a QR code taking you to the exact
pinned location. Make it look good and suited to that line. Animate it. Pulsate it."

## What it does

Every load line on the Timeline's day list ends in a **NAVIGATE** pill and a **QR code**, on a dark panel that
continues the line. Both open the phone's maps app with driving directions to the exact position of the first
reference on the load that has one — the master plan's position where the plan tags the unit (master plan wins),
else a pin taken on site, else a position placed on the map — and the pill says which ("MASTER PLAN", "PINNED ON
SITE", "PLACED ON THE MAP"; on a load of several references, the reference too). The QR is for the big screen: a
driver holds a phone up to it and drives. The pill pulses in the Coates orange; the QR's frame glows in time.
`prefers-reduced-motion` stops both. A load with no position recorded carries nothing rather than a wrong spot.

The pill and the code sit **outside** the line's own button, so pressing them never opens or closes the load; the
open load's delivery cards drop under both. On a phone the panel becomes a second row under the line, the QR a
little smaller, and nothing scrolls sideways.

Build: `toolchain/build.sh v7.51 v7.50_generators_over_the_event_forklifts_by_the_day_DRAFT/patch_v750.py
v7.51_navigate_and_qr_on_every_load_DRAFT/patch_v751.py` (v7.51 is independent of v7.50 and applies before or after
it; v7.50 must go live regardless).

## Checks (evidence/)

- `practice_tests.js` → `practice_results.json`: on 1 Oct's list, 5 of 6 loads carry the panel (WC66 has no position
  yet); on every one the pill's link and the QR's link equal the drawer's Navigate link for the first positioned
  reference; pressing the pill leaves the load closed; opening the load keeps the panel and drops the cards under it;
  0 page errors on the big screen (1920 px) and the phone; no sideways scroll on the phone; QR 58 px on the big
  screen, 44 px on the phone.
- `shot751_timeline_bigscreen.png`, `shot751_timeline_open.png`, `shot751_timeline_phone.png`.
- Sweeps: `sweep_desktop.txt`, `sweep_phone.txt`.
