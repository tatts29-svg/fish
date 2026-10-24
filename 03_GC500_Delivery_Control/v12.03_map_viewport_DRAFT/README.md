# Map viewport sizing

Author: Andrew Fisher

DRAFT — final checks in progress; not READY and not published. Codex owns this
bounded map layout correction. Starting shared source:
`db79a2bdcb843f8303054de2e07c15c9392d9e25` on `ccr-061f77e8-ivjhrv`.

Base live v12.00:
`2261fdc8c1043bad0ed582fac9240366ef112e1275e4962ced62068089c2de51`.
Current candidate v12.03:
`682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69`
(15,180,045 bytes; 192 inline scripts).

The map was sized from the space left below the desktop event banner and several
full-width control rows. A 2560 × 1080 window left only 282 pixels for the plan.
Map now uses a compact header, puts Find and Show map alongside one another on
wide screens, and folds area tools on short desktop windows. Other tabs restore
their normal header. Map contents and native pan/zoom controls stay unchanged.

Map height offers Fit screen, Large and Extra tall, remembered on this device
only. Resizing and scrolling do not silently undo that choice or grow the map.
The existing Full screen button is prominent and fills the window; Escape also
works when keyboard focus is inside the embedded plan and returns focus to Exit.
The phone retains its existing tools and full-screen layout.

Measured candidate stage heights so far: 595 pixels at 2560 × 1080, 312 at
1280 × 720, 955 at 3440 × 1440; 1225 pixels in the latter full-screen view.
Static preservation checks pass 14/14. Native behaviour, phone regressions and
both navigation sweeps remain to be completed before READY. Raw page captures,
screenshots and operational data remain outside Git.

Claude retains v12.01 Build and v12.02 servicing-report drafts and mock-up holds,
plus Samsung. The on-time script, Servicing IIFE and fonts loader are unchanged.
No record, media, price, branch attribution, map position or calculation change.
Rebase/retest if the live page changes before the guarded upload.
