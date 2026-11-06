# v10.81 — the Teams Area toilets get their pins (servicing tracker)

**LIVE 20 Oct 2026 10:17 AEST.**

- **Page:** `e4cb536810736c1e138cdfd80acb01b26178fa172a246df865ea81ea1405e592` (18,515,841 bytes), on v10.80 `6a509831…`.
- **Upload:** guarded upload; the view link serves the build byte for byte.
- **Checks:** `test_v1081` passes on desktop, phone and the live page. Both sweeps: 0 page errors, 7/7 links, Back works. The phone sweep's one message was the weather service.

Author: Andrew Fisher.

## What Andrew sent (20 Oct 2026)

- "Brad jones racing gets pinned here https://maps.app.goo.gl/Qc33GTum79TD6Y6g8" → -27.985863, 153.427503
- "Blanchard race gets pinned here https://maps.google.com/?q=-27.985742,153.427447 ... To162"
- "Shell v power gets pinned here https://maps.app.goo.gl/zjcEbX5erApUU8z67" → -27.986211, 153.427753
- "T0176 redbull gets pinner here https://maps.app.goo.gl/CPXbwTDvT79rUKmE7" → -27.986724, 153.428010
- WC85's link resolves to the spot already placed (-27.938636, 153.426477), so WC85 doesn't change.

## What changed

- **Record** (`record_18Oct2026_vms_regos/teams_pins_spec.json`): BJR01, T0162, SVP01 and T0176 placed through `placeHere`. Record 10024 → 10036, VERIFIED.
- **Page:** the crew card (`SVC1067_CARD`) carries the four pins; the tracker data is unchanged. Footer v10.80 → v10.81.
- **Repo copies:** `servicing_tracker_DRAFT/tracker_data.json` matches. The print pack (DRAFT, 69 pages) gives the four their directions QRs. They aren't drawn on the iEDM plan, so their map box still reads "Off the plan".

## Still without a pinned drop

- **T0024:** drawn on the plan near Narrowneck.
- **WC100:** two trailers, 1288823 "at The Spit" and 1248439 "at S18".
