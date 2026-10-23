# Operational Servicing nights

Author: Andrew Fisher

DRAFT — final checks running; not published.

Andrew, 23 Oct 2026, directly in the working chat: “Servicing is going to be operational now can we remove all previous day please”.

The Servicing tab shows current and upcoming nights in its main selector. Ended nights remain in collapsed “Previous nights · saved history”; opening a saved night reads that night's existing results, and closing history returns to the current night. At 08:00 AEST the current night advances and the ended night moves into history. After the event the page explains that it is showing saved results. The phone keeps history directly below the operational selector.

This changes the manager page only. The tracker configuration, crew-card template, printed QR links, tokens, saved ticks, completion calculations and crew tick flow are unchanged. No tracker is republished and no operational record is deleted. The historical nights are not removed from the tracker configuration because doing so would invalidate its configuration match and affect the printed crew pages.

Base: verified live v11.59, SHA-256 `b6a8fc0e613b508e051f91f4b565cca7351efe33855520936d05077a1111f54c` (21,585,915 bytes), shared source `c0c0dfcd54e11af66578c1cad8e23888b4750e95`.

Candidate: SHA-256 `e17bd3d868b00f421f23a249c39f39c94801c05b57533ae8d4bfcd7674cf683f` (21,588,037 bytes).

Checks use native edit-mode rendering with the sender held before hydration and an allowlist of GET endpoints. The credential stays in the environment and request memory. Direct crew-card `/d/` routes are blocked because opening them records a view; this review makes no independent crew-card HTML read-back claim. Screenshots and raw tracker snapshots stay in private storage. The final release evidence will contain only sanitised results.

Run with the shared toolchain:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v11.60 03_GC500_Delivery_Control/v11.60_operational_nights_DRAFT/patch_v1160.py
PAGE=03_GC500_Delivery_Control/build/GC500_v11.60/GC500_Delivery_Control_hosted.html node 03_GC500_Delivery_Control/v11.60_operational_nights_DRAFT/tests/test_math.cjs
# OUT must be an absolute private evidence directory outside the checkout.
CHROMIUM_PATH=/usr/bin/chromium PAGE=/absolute/candidate.html OUT=/private/evidence flock /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v11.60_operational_nights_DRAFT/tests/test_v1160.cjs
# Repeat with MOB=1, then run both shared harness sweeps.
```
