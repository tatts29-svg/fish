# v11.30 — The plan loads on the crew card (fetched as a blob, kept for offline); shared pins spread

Author: Andrew Fisher. Built on live v11.29 `2e42b438…`. LIVE line and hashes in STATUS.md.

## Why

After v11.29 went live, the GET-only probe of the TEST card at PG01's clean code showed the pins on the dark and this in the
console: `Refused to load the image '…/explorer/assets/sheet-overview.webp' because it violates the following Content
Security Policy directive: "img-src data: blob:"`. The service serves the crew card with that policy: images only from
`data:` or `blob:` sources. The same policy lets the card fetch from its origin (the probe's `fetch()` of the plan returned
200, image/webp).

## What changes

- The card fetches the sheet overview itself and hands the map a **blob URL**. It also keeps a **data URL copy in local
  storage** (about 240 KB), used first on the next open, so the map draws without signal too.
- Until the plan is there the map says "Plan loading…", or "Plan loads with signal" when the fetch failed; the pins and
  the navigation taps work regardless.
- References that share one pin on the record (PG01, PG03 and PG05 sit on one) are spread a touch around the spot so each
  label can be read.

Footer v11.29 → v11.30. The crews see it once the trackers are published again.

## Files

- `patch_v1130.py` — requires the live v11.29 page by SHA-256; rewrites the v11.29 map block (loader, spread, the image
  from the loaded source, the note, the handle `window.SvcMap1129` gaining `src`, `state`, `setSrc`, `reload`); footer.
- `tests/test_v1130.cjs` — desktop and phone: the template never points the image at the URL; in the card tab (no origin)
  the map carries no image and says so, with the 14 pins; a set source draws as the full-sheet image; a kept copy in local
  storage is used first on reload; PG01/PG03/PG05 spread; record unchanged, no errors, no writes. `test_v1129.cjs` is
  superseded on its image-href check (it expected the URL); `test_v1127.cjs` and `test_v1126.cjs` run as regressions.
- `tracker_card_check.cjs` — waits for the plan on the published card and requires a blob: or data: source on the map's
  image, the kept copy in local storage, 12+ pins, PG01 highlighted and Where am I.

## Checks

- Dry build on a scratch copy of live v11.29, then the real build from live: byte for byte the same (`f004603f…`).
- `tests/test_v1130.cjs`: 10/10 desktop and phone on the build; 10/10 desktop and phone on live (evidence/).
- Regressions: v11.27 9/9 and v11.26 10/10 on the build (evidence/regression_dry/) and on live; v11.29 10/11 on the
  build, the one miss being its image-href check, which expected the plan URL this release removes on purpose.
- Sweeps, desktop and phone: 25 tabs, 7 hashes, Back, 0 console, 0 writes blocked.
- LIVE 23 Oct 2026 01:59 AEST. TEST tracker republished 02:00, EVENT 02:01; `tracker_card_check.cjs` CARD OK on both:
  14 pins, PG01 highlighted, the map's image on a `blob:` source, the kept copy in local storage (238,415 characters),
  Where am I, Save & close status page, 0 writes blocked, 0 page errors.
- Screenshots: `evidence/area_map_PG01_phone_v1130.png`, `evidence/area_map_PG01_desktop_v1130.png`,
  `evidence/card_live_phone_v1130.png`, `evidence/card_live_desktop_v1130.png`.
- Known: in Area 1 the pins around PG01 (WC17, WC73, T0176, PG03, PG05) sit close enough that their labels still touch
  on a phone. A later release can place labels clear of each other.
