# Pickup artwork checks

Author: Andrew Fisher

Run from the repository root. `BASE` and `CANDIDATE` are immutable HTML copies; `STATE` is one complete private `/api/state` snapshot used for both copies. `OUT` must be outside the repository. Do not commit the snapshot, raw captures, screenshots, identifiers or financial values. All operational HTTP writes are denied by the existing native harness; its narrow map-session exception remains unchanged.

The declared synthetic cases cover all 30 equipment illustrations, aliases, specialised attachments, paired and mixed equipment, unresolved descriptions, attempted markup, input immutability and rejection of reference prose. The whole-reference cases verify that only explicit completed departure types are used. The caller contracts compare native supplier/Build text, status and stamp metadata before/after while checking the separately passed equipment context.

```bash
node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/art_mapping.cjs
node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/reference_context.cjs
BASE="$GC500_ART_TEST_DIR/base.html" \
CANDIDATE="$GC500_ART_TEST_DIR/candidate.html" \
node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/consumer_contracts.cjs
```

The browser comparison uses the actual page and its native data models. It requires every current equipment type to resolve, and every picked-up card to receive exactly its own illustration. It compares all card wording/controls, complete financial reader outputs and every persisted document. Actual daily navigation, filtering, repeated rendering, native legacy/Build/supplier callers and a real reference drawer are exercised. Every represented picked-up family is captured at its original card dimensions. A separate, clearly labelled synthetic gallery checks all 30 atlas cells, image decoding, measured crop bounds, static/reduced-motion behaviour, print omission and preservation of the stamp if its decorative image is absent. Atlas E has two deliberately measured non-square crop windows; `atlas_manifest.cjs` records them independently of the implementation.

Run phone and desktop serially under the shared browser lock, setting the two expected hashes to the reviewed predecessor and final candidate. These commands assume Playwright and Chromium are configured in the environment; otherwise set `NODE_PATH` and `CHROMIUM_PATH` to their installed locations.

```bash
BASE="$GC500_ART_TEST_DIR/base.html" \
CANDIDATE="$GC500_ART_TEST_DIR/candidate.html" \
STATE="$GC500_ART_TEST_DIR/state.json" \
OUT="$GC500_ART_TEST_DIR/native" \
EXPECTED_BASE_SHA="$GC500_ART_BASE_SHA" \
EXPECTED_PAGE_SHA="$GC500_ART_CANDIDATE_SHA" \
flock -x /tmp/gc500-browser.lock bash -c '
  MOB=1 node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/native_art1268.cjs &&
  MOB=0 node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/native_art1268.cjs
'
```

`consumer_census.cjs` separately traverses every `allAssets()` reference, including references absent from the current Singles card model. It checks every existing completed legacy, Build, drawer, supplier-unit and supplier-quantity stamp against explicit equipment types. Any unresolved completed stamp fails the census and is recorded in its private `gaps` list. Run it under the same lock with the same `CANDIDATE`, `STATE`, `OUT` and `EXPECTED_PAGE_SHA` values:

```bash
flock -x /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/consumer_census.cjs
```

`atlas_gallery.cjs` creates a separate clearly labelled synthetic visual contact sheet using the exact candidate stamp/artwork CSS and all 30 mappings. All network access is denied. This avoids clipping by the native scrolling pane; it supplements the actual native-card screenshots and does not replace their layout checks. Run it under the same lock with `CANDIDATE`, `OUT` and `EXPECTED_PAGE_SHA` set:

```bash
flock -x /tmp/gc500-browser.lock node 03_GC500_Delivery_Control/v12.68_all_pickup_art_LIVE/tests/atlas_gallery.cjs
```

For recovery after a browser screenshot timeout, `BASE_CAPTURE` and `BASE_CAPTURE_META` may point to an already completed private baseline capture and its recorded provenance. The script verifies capture/page/state hashes, fixed clock, viewport, complete capture schema and its zero-error/write result before reuse. Acceptance records that recovery explicitly. The unchanged current-card viewport screenshot allows at most two 60-second attempts; retries remain recorded and the screenshot gate is retained.

An acceptance JSON is written only after all checks pass. Raw JSON captures include operational evidence and remain private. The reference helper/native-left timing probe is recorded privately for performance review; it is not a claim about every device. The page checker, both shared navigation sweeps, guarded upload and full public-byte read-back are separate release gates. Candidate acceptance does not prove a live release.
