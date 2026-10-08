# Today widescreen presentation

Author: Andrew Fisher.

DRAFT. The existing Where we are card now has a clearer panoramic equipment background and a shallower, wider hero. The same centred race lights, percentage, provisional notes, forecast, Pause control, programme links and seven category readings remain. The programme calendar, next milestone and key dates use three columns on a desktop and stack on a phone. Existing weather motion is quieter so it does not obscure the scene.

The scene is a rendered illustration. Its original resolution is 2164 × 727; the page uses a 409,424-byte WebP without resizing. It is checked at a 3840-pixel viewport but is not described as a native 4K photograph. The image is behind the operational readings, and the original image stays outside Git.

`patch_v902.py` starts from v8.99, v9.00 or v9.01 with the existing v8.96 scene intact. It refuses a second application. It adds one verified media descriptor, updates only the atlas's yard entry, produces `media_manifest_v902.json` in the build directory, and adds screen-scoped presentation rules. Operational DATA, calculations, record functions and native printing functions do not change. The previous yard remains in the media registry so there is no destructive media removal.

Build:

```sh
python3 v9.02_today_widescreen_DRAFT/patch_v902.py /path/to/base_live.html /path/to/GC500_Delivery_Control_hosted.html
python3 v9.02_today_widescreen_DRAFT/tests/test_identity902.py /path/to/base_live.html /path/to/GC500_Delivery_Control_hosted.html
```

The media must be registered before the page is published. Preserve the original base page beside the candidate for the shared uploader's live-base guard. Generic source and the generated panorama can be shared; live operational screenshots and test evidence stay outside Git.

Read-only browser checks:

```sh
PAGE=/path/to/GC500_Delivery_Control_hosted.html OUT=/private/evidence W=1440 node v9.02_today_widescreen_DRAFT/tests/test_today902.cjs
```

Run at 1440, 2560, 3840 and 390 pixels with the shared Chromium configuration and browser lock. Tests check geometry, source image decoding, category links, touch-control height, percentage/model consistency, Pause/Play, weather semantics, reduced motion and repeated redraws. Every non-GET request is blocked. Publication also requires the shared laptop and phone release sweeps.

Source frozen for integration. Local validation: 15/15 targeted checks at each of 1440, 2560, 3840 and 390 pixels; deterministic patch/data identity passes; the shared page checker compiles all 20 inline scripts and passes secret checks. Phone and widescreen screenshots have been inspected. A final phone-only correction wraps the programme endpoint labels separately; the affected phone checks passed again after that correction, and desktop rules were unchanged. No page errors, console errors or operational record-write attempts occurred. The test blocks external Google tile-session creation as well as all other non-GET requests.

No live publication has occurred for this release. The release integrator still runs the required final laptop/phone sweeps on the combined candidate before publication.
