# v11.12 — the race call speaks as complete; the servicing cards glow for the big screen

Author: Andrew Fisher. Built on live v11.11 `9aee0e49…`. **LIVE 22 Oct 2026 08:11 AEST**, sha256 `39492d284905cbaefc16055e73811e6fff88c6151210b38ce14b8f5f5f56494b` (21,069,050 bytes); media manifest `e7b812bd7b915972…` (1,983 files) registered first. Status in STATUS.md.

Andrew, 22 Oct 2026, after v11.11 went live: "Can we talk like everything is complete and talk in numbers that
everything is complete. Fencing complete as per schedule and we don't include the demob. Barriers all done. We mention
VMS boards there is 24 in total every one is towed around the track and set to location. So we talk as in everything is
done so we don't need to revisit this again." And: "I also want more glow on all cards in servicing. More glow pulsating
in this area. This will be on a big screen at night time so this will look amazing."

## 1. Eleven turns re-voiced (`SCRIPT_CHANGES.md` has each old and new line and the figure basis)

Same voice, flow and mix as v11.11; one take each. Turns 11, 13, 14, 15, 17, 18, 19, 20, 21, 23 and 28 now say:
24 boards every one towed around the track and set; 311 barriers every one placed, 100 % done; every delivery landed;
12,617 m of fence complete to the schedule; more than 4,500 panels, 6,500 clamps, 1,000 braces, 135 vehicle and 34
pedestrian gates; 7.4 km of crowd-control barrier; 4.4 km of scrim and nearly a kilometre relocated (no stack-down
line, that is demob); 20 km of fence and crowd control complete to the schedule; everything 100 %. The other 22 takes
are v11.11's. Body now 10 min 59 s + 13 s loop opener. `turns.json` is the whole script as it stands.

The record was brought into line the same morning (`../record_22Oct2026_barriers_vms/`): WB17 and WB18 on site and
complete, VMS21 in place and complete, so Today reads 311 of 311 barriers and 24 of 24 boards, the same as the call.
The fence figures on the page stay the dockets' (11,577.5 of 12,617 m), by the "dockets are truth" rule; the call speaks
the schedule, as instructed.

## 2. Servicing glow (`<style id="svc1112-glow">`, placed after every servicing style block)

- Every area card glows in its own area colour: a 2 px coloured frame with a 26 px halo and inner light, pulsing
  (opacity 0.32 → 0.85, 2.6 s), three phase offsets so the grid breathes rather than blinks; the card's own shadow
  and number badge carry the colour too.
- A done card goes brighter and faster (3 px frame, 40 px halo, 0.5 → 1.0 every 1.9 s). A pressed (chosen) card holds
  its glow at 0.9.
- The map outlines breathe in their area colour (stroke 0.22 → 0.7), the done ones wider and faster; the area
  accordions below the map carry a coloured halo that brightens and dims; the whole-night card has an orange halo.
- The servicing block's own rules still apply: the pulse pauses when the tab is off or paused, and stops under
  `prefers-reduced-motion`. Styles only: no tracker data, QR, code or signature change (every printed sheet stands).

## 3. Footer v11.11 → v11.12.

## Media

The eleven v11.11 takes they replace leave the page and the manifest (1,983 files, digest `e7b812bd…`);
`media_v1112/<sha>.mp3` and `media_manifest_v1112.json` are written beside the build for `upload_media1112.py`, which
goes before the page as in v11.11.

## Checks

`tests/test_broadcast1112.cjs` on the build: 36/36 (the eleven new takes in, the eleven old out, the other 22 as
v11.11; media table and manifest agree; chain, loop and restart rules; glow style after the servicing styles; 0 page
errors). Toolchain PASS all checks (scrubber a no-op). Servicing screenshot on a local read-only copy of the edit link
at 1920×1080: 15 cards, each with its coloured frame, halo and `svc1112-pulse` animation; 0 errors; evidence in
`evidence/`. Sweeps, live media check and live broadcast start: see STATUS.
