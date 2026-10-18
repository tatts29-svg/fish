# v6.86 — LIVE 27 Sep 2026, on Andrew's request: "a couple for each of pics, zoomed in and zoomed out"

Author: Andrew Fisher

Built from v6.84 + `patch_v685.py` (with the `master_loc.json` that carries each unit's pictures) + `patch_v686.py`. The v6.81 draft fixes are still not in.

## What changed
- **Two pictures per unit.** Every one of the 139 references the master plan places now has two crops of D001-26003-03 in its drawer, each with a red ring on the unit. Tapping either opens it full size.
  - **Close up:** about 80 m across.
  - **The area:** about 370 m across.
- **Where they are stored.** The 278 pictures (WebP, 20.9 MB in all, about 75 KB each) are in the hosted media store. The media manifest is `078d86e9…`, 453 files. They load only when a drawer opens.
- **Drawer header.** It reads "D001 rev 03 · master" and "Location: Master plan D001", and the Navigate button is labelled "master plan", not "pinned".
- **Rings.** Each ring is drawn on the picture after rendering, so no crop shows another unit's ring.

## Checks
- **Local:**
  - pictures load in the drawer on desktop and phone;
  - deep data audit shows no issues;
  - 68 running-sheet days are clean;
  - navigation is clean on phone;
  - accessibility is clean.
- **Live:**
  - `/v/` equals the build byte for byte;
  - media uploaded 278 + 175 kept;
  - P38, GN01, WC42 and P53 drawers each load both pictures;
  - no page errors.

## Rollback
Re-upload v6.85. The media files stay on the server unused.
