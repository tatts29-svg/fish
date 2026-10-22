# v11.17 — Map explorer: press and hold anywhere for that spot's coordinates; share them with a picture of the map

Author: Andrew Fisher. Built on live v11.16 `8a19fcce…`. **BUILT and tested, not uploaded** — on Andrew's word (race night is
23 Oct). Build: `build/GC500_v11.17/` (made by `bash toolchain/build.sh v11.17 v11.17_tap_for_coordinates_DRAFT/patch_v1117.py`).

Andrew, 22 Oct 2026: "i want to be able to tap any where in here to get the exact map coordinates if its to hard lets not
do it but if its possible be a good extra to have. then i want to be able to then attach and send a message with those
coordinates and a map of that area".

## What it does

On the Map explorer (Satellite + plan, Satellite only or Original plan), on a phone or a laptop:

- **Press and hold** anywhere on the map (finger still for half a second), or **right-click** on a laptop: an orange pin
  drops and a card opens with the spot's **latitude and longitude to six decimals**, the **two nearest placed references**
  with distance and direction ("at P01 · 9 m south-west of P05"), and the line "Off the plan on satellite, give or take a
  metre or two. Not a survey."
- **Share with map**: the phone's share sheet gets the words (coordinates, nearest references, a Google Maps link, the
  time) and a **PNG of the map around the pin** (the map as it is on screen with the drawing over it, the pin, a north
  arrow, a scale bar, and a caption band). From there it goes to SMS, WhatsApp, Teams or email. Where the share sheet
  takes text only, the picture is saved to the device; on a laptop with no share sheet, the words are copied and the
  picture is saved.
- **Copy** (the words), **Open in Maps** (navigation to the spot), **✕** (clear).
- A pin dropped low on a phone screen, where the card sits, slides the map up so the pin stays in view.
- A one-time hint when the plan comes on: "Press and hold anywhere on the map for that spot's coordinates."
- A short tap still picks a reference; a drag still pans; a pinch still zooms. The click after a hold picks nothing.

**Read-only.** No record writes, no server change, no explorer re-upload: the layer is injected into the explorer frame by
the page (the v10.60 shapes pattern), pinned to the reviewed explorer build (all six scripts); any other build and it
stands down.

## Where the coordinates come from

The explorer's own georeferencing (`assets/georeferencing.json`): a sheet point goes through the main plan's affine
(`sheet_to_z18px`, Web Mercator pixels at z18, 512 px tiles) to lat/lon; in the Original plan view a point inside the
inset uses the inset's own affine. The registration file states the fit: 20 check points, RMS 0.67 m, 95th percentile
1.04 m, "not a survey, not for set-out" — hence the card's line. Checked in the test against the recorded pins: P01's
drawn tag lands on its recorded pin to 0.0 m; across the 44 pinned references the median is 0.04 m and 38 are within 2 m
(the outliers are tags the drawing has a few metres from the pin, PG29's 99 m away being a shared-outline tag — the
drawing's, not the layer's).

## Files

- `spot1117_src.js` — the page-side layer (`gc500SpotLayer1117.mount(frame)`) and the frame-side module
  (`GC500Spot1117`: `drop(x, y)`, `clear()`, `words()`, `picture()`, `share()`, `sheetToLL(x, y)`, `nearest(ll)`, `state`).
- `patch_v1117.py` — appends the script before `</body>`, adds the mount to the explorer frame's load hook, footer
  v11.16 → v11.17. Requires the live v11.16 page by SHA-256.
- `tests/test_v1117.cjs` — desktop 22/22, phone 21/21 on the build (the maths against the recorded pins, drop/card/words,
  the picture 1080 × 1270, share through a files share sheet / a text-only one / none, press-and-hold drops, tap does
  not, drag does not, right-click does, pin follows the map, Clear, record unchanged, no page errors, no writes).
- `evidence/` — phone and desktop screenshots and the share picture as made by the page (JPEG copies), results.json.

## Checks

Toolchain PASS all checks. test_v1117 desktop 22/22, phone 21/21. Sweeps desktop + phone: see STATUS.
