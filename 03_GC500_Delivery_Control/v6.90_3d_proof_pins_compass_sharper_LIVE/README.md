# v6.90: 3D proof with the job on the model, a compass, and sharper, smoother streaming (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "look at 3D proof … high tech attention … more detail, more quality … functions smoother and clearer".

**Live since 27 Sep 2026, 12:43 AEST** (see RELEASE.md).
`poc3d/index.html` and `poc3d/units3d.json` over the live `poc3d/` files.

## What changes

| | Now (live) | New |
|---|---|---|
| Sharpness | Desktop drew at up to 1.5 pixels per point, phones at 1. Detail setting 20 (desktop) / 12. | Each screen draws at its own pixel density, up to 2x (1.75x on phones). Detail setting 4 at rest (8 on phones), so finer tiles come in. MSAA and FXAA smoothing on edges. "Ultra (4K)" goes to 3x and the finest detail. |
| Smoothness | Camera stopped dead | The camera coasts after a drag. Tiles are preloaded along a flight. Requests a move makes stale are dropped, and the screen edges fetch coarser detail while moving. |
| The job | Not shown | 260 pins from the master plan (v6.89 positions) stand on the model in their trade's colours. Labels show within about 900 m. Tap a pin to see what it is. |
| Trades | — | Chips along the bottom switch each trade on or off. Buildings, toilets, generators, light towers, our barriers and big screens are on at the start. |
| Find | — | Type a reference (WC23, P12, GN04, BS05 …) and press Enter to fly there. `?find=WC23` in the address does the same. |
| Compass | — | Dial with N, E, S and W where they really are, plus a "Facing …" label. Press a letter to turn to face that way (0.7 s), keeping the same spot in the middle. |
| Orbit | — | Slowly circles the spot in the middle of the view. Any touch stops it. |
| Full screen | The Full screen button also changed the quality setting (bug) | Fixed |

Positions are the master plan laid on the ground by image registration: about ±8 m, not a survey. Each pin's card says so.

## Imagery date
Google credits "Vexcel Imaging US, Inc." for the model and gives no capture year. Google doesn't publish the date for
Photorealistic 3D Tiles, so the year can't be stated from the data. If Andrew names a building that has gone or changed,
its demolition or completion date would bracket the capture.

## Cost
Same service and key as now: Map Tiles API, Photorealistic 3D Tiles. Billing is per root request (a page load or a return
to the page), not per tile. The upgrade doesn't add root requests. Sharper settings pull more tile data per view, but
data within a session isn't billed separately.

## Checks (test browser with software graphics, desktop 1440x900 and phone 390x844; GET only, plus Google tiles)
Result: boots with no page errors, and all 260 pins load.
- The quality settings take effect: detail 4, MSAA 4, FXAA on.
- Search "WC23" finds WC23; Enter flies there, and the card reads "WC23 · Toilets".
- N gives heading 360 and "Facing north". W gives 270 and "Facing west".
- Orbit turns, and a touch stops it.
- The toilets chip hides all 68 toilet pins and shows them again.
- Google's credits stay on screen.

Screenshots (JPEG) are in `screens/`. The software renderer is far slower and softer than a real GPU, so judge sharpness on a
real screen.
