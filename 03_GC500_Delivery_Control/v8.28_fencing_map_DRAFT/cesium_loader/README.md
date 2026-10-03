# Cesium library startup component

Author: Andrew Fisher

This is the bounded library correction included with the Fencing map assets for the upcoming v8.29 integration. It is not a separate live release. `patch_loader.py` changes exactly four regions of the bound existing v8.13 3D asset and refuses a different base or repeated application.

The controller and native recovery handlers are installed before one asynchronous attempt to load the same pinned Cesium JavaScript. A 30-second library deadline, download failure or missing library global exposes the existing Retry. Failed or abandoned attempts cannot start map access or a scene if the library arrives late. Only native Retry opens a new document. Distance-display-condition construction moves after library success, retaining desktop and phone values. Camera presets, quality policy, labels, parent API, access logic and downstream runtime recovery remain unchanged.

External stylesheet links are unchanged. A stylesheet that blocks inline execution can still delay recovery; this patch addresses the library JavaScript download gap. Software-rendered browser checks do not establish physical-device frame rates.

## Offline reproduction

Run from the parent `v8.28_fencing_map_DRAFT` directory. Supply private absolute input/output paths through the shown variables. The first command creates only a local candidate; the tests use synthetic DOM, timers, CDN and graphics with no real network or credentials. Their optional final report argument writes only to the chosen private path. Without it they report counts on stdout.

```sh
python3 cesium_loader/patch_loader.py "$GC500_PRIVATE_CESIUM_BASE" "$GC500_PRIVATE_CESIUM_CANDIDATE"
node cesium_loader/tests/synthetic.cjs "$GC500_PRIVATE_CESIUM_CANDIDATE"
PYTHONDONTWRITEBYTECODE=1 python3 cesium_loader/tests/preservation.py "$GC500_PRIVATE_CESIUM_BASE" "$GC500_PRIVATE_CESIUM_CANDIDATE"
```

Expected base SHA-256: `7edf7b5ac55c1cf5f60f35b72d577d8e257854e2e482b1b93796e498edcf5ac4`.

Expected candidate SHA-256: `c463bf4afaa37c28a2b78e83e1c7461e569dea88a2f890948060b8af7e0a35ba`.

The complete-controller synthetic suite contains 36 checks; source preservation contains 14. An independent offline review added 39 checks, and focused desktop/phone/failure/stall browser verification completed 43. Original failed harness evidence and its corrected cache-aware Retry assertion remain in the private review record. None of these numbers is a deployment claim.

The fixture named `AIzaSyntheticOfflineFixtureOnly` is deliberately fake and used only because the unchanged native key validator recognises that prefix. No real key is embedded or needed.
