# Picked-up artwork acceptance

Author: Andrew Fisher

`native_art1266.cjs` compares the reviewed v12.65 page and an exact v12.66
candidate against one pinned private record. It reuses the shared read-only
native harness; operational HTTP writes are blocked. Captures and complete
record/model outputs must remain outside the repository.

Required environment: `BASE`, `CANDIDATE`, `EXPECTED_PAGE_SHA`, `STATE`, `OUT`,
plus the normal harness `NODE_PATH` and `CHROMIUM_PATH`. Run once for desktop
and once with `MOB=1` for the real phone viewport. Hold the shared browser lock
for each run:

```sh
flock /tmp/gc500-browser.lock node \
  03_GC500_Delivery_Control/v12.66_pickedup_art_DRAFT/tests/native_art1266.cjs
```

The test compares all native cards, stamp text, controls, card models, financial
readers and persisted documents. It checks the exact light-tower type allowlist,
inline decorative image semantics, repeated native filtering/rendering,
unsupported-type fallback and a current card. Representative cards also have
their geometry, typography and actual viewport screenshots compared.

The existing native `content-visibility` grid settles through its own
`Singles1238.goCard` path and repeated real scrolling. The test confirms that the
target stamp is on screen and the card contains its footer before measuring it.
It does not override page styles or accept placeholder card dimensions.

Private outputs include `<viewport>-acceptance.json`, exact base/candidate
captures, actual viewport screenshots and focused stamp screenshots. A failed
run produces `<viewport>-failure.json`; its screenshots are diagnostic only.
The shared desktop and phone tab sweeps remain separate required checks.
