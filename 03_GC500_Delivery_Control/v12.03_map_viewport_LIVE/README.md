# Map viewport sizing

Author: Andrew Fisher

LIVE — 25 Oct 2026 06:27:49 AEST through the normal guarded upload.
READY source `3e2305a6220c4109b3833e0c1e522cb09d1f7483` on
`ccr-061f77e8-ivjhrv`, starting from
`db79a2bdcb843f8303054de2e07c15c9392d9e25`.
Separate public GET at 06:28:08 AEST matched the exact bytes and footer. Actual
public UI checks passed 9/9, including the saved explorer link, Original plan,
height choice, zoom, full screen, embedded Escape, phone sizing and header restore.
Live wide and phone screenshots inspected. This release is complete.

Base live v12.00:
`2261fdc8c1043bad0ed582fac9240366ef112e1275e4962ced62068089c2de51`.
Verified live v12.03:
`682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69`
(15,180,045 bytes; 192 inline scripts).

The map used the space left below the desktop event banner and several full-width
control rows. A 2560 × 1080 window left only 282 pixels for the plan. Map now uses
a compact header, puts Find and Show map alongside one another on wide screens,
and folds area tools on short desktop windows. The same window now has a 595-pixel
map stage. Other tabs restore their normal header.

Map height offers Fit screen, Large and Extra tall, remembered on this device
only. At 2560 × 1080, Large provides 830 pixels and Extra tall 1186 pixels, with
normal page scrolling. Repeated sizing and scrolling do not grow the map or undo
the preference. The existing Full screen button is prominent and fills the
window; Escape works inside the embedded plan and returns focus to that control.
Phones retain their existing map tools and full-screen layout.

## Checks

- Shared build: 192 scripts parse, zero secrets found.
- Preservation: 14/14. Embedded DATA, all unrelated scripts, map content/styles,
  Showcase, loading improvements, on-time script, Servicing IIFE and fonts loader
  retained exactly. Only the native map height call and footer change in existing scripts.
- Focused browser checks: 23/23, including device preference after navigation and
  reload, native zoom, embedded Escape, 1280/1920/2560/3440-pixel desktop widths,
  phone sizing and no shared-record change.
- Existing phone regression: 17/17; map regression: 21/21 desktop and 21/21 phone.
- Original plan and saved `#sheet/__explorer` entry: 9/9 each. An initial test used
  the older `__satellite3d` route and found a parked iframe; the final test waits
  for the explorer inside the active map pane, without bypassing pointer checks.
- Desktop and phone sweeps: 27 routes, 19 direct panes, seven deep links and Back;
  zero page errors, console errors or attempted writes.
- Wide, full-screen Original plan and phone screenshots inspected privately.
  Normal map stages: 312 pixels at 1280 × 720, 595 at 1920/2560 × 1080,
  955 at 3440 × 1440; full-screen 1225 pixels at 3440 × 1440.
- Guarded-upload dry run: unchanged live base and edit access verified.

Raw captures, screenshots and operational data stay outside Git. Sanitised
receipts are in `evidence/`. These are Chromium viewport checks, not physical
monitor or Samsung Internet tests. This changes map sizing, not image resolution.

## Reproduce

Run from `03_GC500_Delivery_Control`, with the existing browser environment and
private OUT directory configured. Browser checks use `/tmp/gc500-browser.lock`.

```sh
bash toolchain/build.sh v12.03 v12.03_map_viewport_LIVE/patch_v1203.py
export PAGE=build/GC500_v12.03/GC500_Delivery_Control_hosted.html
python v12.03_map_viewport_LIVE/tests/test_preservation1203.py build/GC500_v12.03/base_live.html "$PAGE"
flock /tmp/gc500-browser.lock node v12.03_map_viewport_LIVE/tests/test_native1203.cjs
flock /tmp/gc500-browser.lock node v12.03_map_viewport_LIVE/tests/test_live1203.cjs
flock /tmp/gc500-browser.lock node toolchain/harness/sweep.js
MOB=1 flock /tmp/gc500-browser.lock node toolchain/harness/sweep.js
```

The strict sweep checker takes the private directory containing
`sweep-desktop.log` and `sweep-phone.log`. For actual public UI verification,
unset PAGE and run `tests/test_live1203.cjs` again after the guarded upload.

Independently implemented and tested; no second-agent review claimed. Claude
retains v12.01 Build and v12.02 servicing-report drafts/mock-up holds, plus Samsung.
He must rebuild/retest those drafts on the new verified live page before their
publication, keeping the release numbering current. No record, media, price,
branch attribution, map position or calculation change.
