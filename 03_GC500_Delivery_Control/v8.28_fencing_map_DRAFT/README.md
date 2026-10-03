# Fencing map component for the v8.29 integration

Author: Andrew Fisher

This folder preserves the reviewed v8.28 Fencing map component. It is being integrated with the Fencing source and estimate presentation into the upcoming v8.29 release. It is not a separate live release. Final combined-page review, navigation checks, publication and public readback remain with the release owner; consult the shared board for their current result.

Fencing opens directly in the existing Map explorer. Source-aligned annotations retain their source and revision, while independently recorded area sign-offs use distinct markers. An area tick never certifies every fence line or later task at that location. Type, source, day, status and search filters preserve unknown and unmapped states. Leaving Map stops its refresh loop. PNG exports retain the overlay and wrapped provenance, and use the existing satellite mosaic compositor to avoid rotated tile seams. No operational or financial record is changed by this component.

## Source and privacy boundaries

The generic files here contain no source attachment, private geometry catalogue, shared record, contact details, financial evidence, credentials or generated HTML. The deployment supplies the separately approved catalogue. `source-bindings.json` binds its hash without publishing its content and records the exact component source and asset identities.

`cesium_loader/` contains the separately reviewed 3D library startup correction included in the frozen asset union. It waits asynchronously for the same pinned library before scene startup; network error, stall or a missing library global exposes native Retry. It preserves the existing quality, camera, provider access and activation APIs. Its README describes the unchanged stylesheet limitation.

## Reproduce without a service write

Run commands from this directory. No command below uses network access, credentials, the live record, registration or deployment.

```sh
node tests/fencing_model.cjs
```

The host patch requires the exact v8.27 page named in `source-bindings.json`. Keep all inputs and outputs outside the source folder. Set `GC500_FENCING_INPUT` to the reviewed private catalogue and `GC500_FENCING_INPUT_SHA256` to its full bound SHA-256, then run:

```sh
python3 patch_v828.py "$GC500_PRIVATE_BASE_HOST" "$GC500_PRIVATE_COMPONENT_HOST"
python3 patch_explorer828.py --base-dir "$GC500_PRIVATE_MAP_BASE" --output "$GC500_PRIVATE_MAP_OUTPUT"
```

The map base directory contains the exact retained `explorer.js` and `explorer-index.html`. The asset patch emits exactly five map files. Both patches use the shared `toolchain/rep.py` and refuse the wrong base. `GC500_TOOLCHAIN` may point to that same helper when testing an isolated copy. The host also supports the standard toolchain's one-path working-copy convention. The resulting v8.28 component host is an intermediate input for the v8.29 wrapper, not a separately publishable final page.

The Cesium commands are in `cesium_loader/README.md`. They require the bound private base and candidate HTML, rather than bundling them in this repository.

## Validation and release boundary

The frozen component completed 112 scoped CPU/source checks, 26 map browser checks, six affected export checks, and 43 actual-browser Cesium checks across normal desktop/phone, failure/retry and stalled/late results. These suites have overlapping coverage; do not add their counts as a unique assertion total. The public-safe model subset has 34 synthetic checks. Browser evidence had zero page/console errors and no operational writes. Independent source and regression review is recorded separately. These results establish the component's tested scope, not the final combined v8.29 page or a live deployment.

The asset manifest is a complete union preserving unchanged descriptors. Only the reviewed map/library assets change. Publication must retain the old manifest and changed original bytes; rollback restores old bytes before registering the old manifest. Private historical server blobs must stay private and retain their authenticated backup/restore protection. This source package does not register or prune anything.

Satellite imagery and source alignment support site orientation, not set-out. Historical and current annotations are not additive installed totals. Missing or ambiguous geometry remains explicitly unmapped.
