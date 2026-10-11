# Map identity and refresh repair — v9.96

Author: Andrew Fisher

The map retained old asset numbers and names when a reference stayed at the same point. It also omitted Event Portables numbers and the numbers of unplaced assets from the embedded search. This scoped change reuses the existing map and its native rendering, while refreshing its current identity, search results, selected marker and open card from the same shared record used by item cards.

## Integration

1. Import `identity996.py` and run `patch(html, path)` on the assembled parent HTML. The canonical identity readers must already be present. This adds no operational records, coordinates, arrival states or invented fleet numbers.
2. Run `python3 maps/patch_maps996.py SOURCE_EXPLORER_DIRECTORY OUTPUT_EXPLORER_DIRECTORY`. Its three source hashes must match `evidence/source-bound.json`; it rejects changed or already-patched inputs. Use retained registered source bytes, not a partial reconstructed map.
3. Validate the final parent candidate with the three generated external files. The browser test explicitly routes these candidate files and therefore is candidate evidence, not a public deployment check.
4. After the separate v9.95 release, obtain and retain the exact then-current full machine manifest. If v9.95 changes only the parent/media API, the existing manifest remains the correct one; verify its live SHA rather than assuming either a change or no change. Verify the three map input hashes still match the audited baseline.
5. Build a retained manifest union with **only** `explorer/explorer.js`, `explorer/explorer-merge.js` and `explorer/index.html` replaced. Keep every other entry and byte unchanged, including the v9.95 film. The existing machine union tool is `satellite_explorer/tools/machine_set.py`; the guarded publishing precedent is `v8.13_maps_satellite_LIVE/evidence/publish_machine813.py`.
6. `publish_maps996.py --keep RETAINED_MANIFEST --candidate-dir GENERATED_FILES --out PRIVATE_OUTPUT --expected-base REVIEWED_LIVE_SHA --machine-tool PATH_TO_MACHINE_SET` defaults to preparation only. Add `--publish` only for root-authorised publication. It checks the live machine SHA before staging and immediately before registration, limits the exact manifest diff to the three reviewed map paths, preserves all other entries, and reads back the public bytes. Validate the final public parent and map together against the actual current record. This work has not published anything.
7. Register the additive external map repair before the assembled parent page. The external code tolerates the older parent projection (ownership and destination fields default empty); it retains native asset/name searches. The parent projection also tolerates the older map, although the new fields only become visible after the external repair. Keep both previous exact artifacts for a paired rollback if public verification fails.

## Data and behaviour

- The parent projection uses `gcUnits925(a, {loading:false})`, `ItemOwnership969.read(a)` and `destinationOf(a)`, under the existing held-asset cache. It preserves leading zeros, current ownership and quantities without fleet numbers.
- Map identity includes placed and unplaced references. A named current destination can be searched even when no exact drawing position is established.
- A changed record rebuilds the native map items, rebinds existing markers once, reruns an active query and refreshes the open native card. Query, selected reference, scroll and result focus are retained where the reference remains present. Camera navigation is not invoked by record refresh.
- An already-open header finder refreshes its existing result list after a normal shared-record render. A closed finder stays closed.
- The first usable map reconciles the parent record once. A search also checks newly received data before the parent’s deferred redraw, so it cannot serve an obsolete number during that interval.
- An unchanged plan does not rebuild the item/search lists; an unchanged card model does not redraw the card.
- No arrival or completed status is inferred from an assigned asset number. WC61/WC69 number assignments remain separate from receipt evidence.

## Validation

`node maps/tests/identity996.cjs` exercises canonical identities, zero preservation, quantity-only ownership, current destination and header finder updates (10 checks).

`node maps/tests/refresh996.cjs /workspace/private-maps996` exercises the actual native item/search source and replacement refresh function, including a reproduction of the original stale-number defect, new/removed/unplaced identities, marker movement, stage-only card changes and unchanged-work suppression (14 checks).

`maps/tests/maps996_browser.cjs` uses the read-only repository harness and explicitly routed local map candidates. Hold `/tmp/gc500-browser.lock` and set `PAGE`, `MAP_CODE` and `OUT`; set `MOB=1` for the phone viewport. It changes a supplier number in memory, checks real embedded map results and card updates, restores the exact original record and blocks operational writes. Satellite session/tiles are local fixtures. Raw current-state data and screenshots stay outside Git under `/workspace/private-maps996/`.

Source guards confirm only three external files are emitted and reject changed/reapplied inputs. Evidence is saved in this folder without raw asset records.

## Location and sharpness audit limits

The current shared-record sample was version 5300. WC61, WC69 and WC09 have established master-plan positions. WC85 and spare T0268 are directed to Coates compound in the current record but have no exact master pin; WC100 names two different current destinations. The Concert generator has no proven exact drop-off. These facts remain named/unplaced; this change invents no coordinate.

A separate potential moved-location inconsistency needs a location-policy change, not an identity patch: `gc500PlanItems` and `ptOf782` prefer an existing master point even when a mapped reference is marked `_locationMoved`. None of the three currently moved references has a master point, so the current sampled records do not demonstrate that conflict. Do not change the shared `zone816` or destination adapters without checking native movement semantics and original plan evidence.

The served georeference and vector-tile drawing use the same D001-26003-03 issue dated 2 October 2026 (SHA-256 recorded in source evidence). The source already has 26 tile levels, beyond-pyramid vector rendering, device-pixel-ratio rendering at rest, bounded bitmap caches and offscreen cancellation. These remain unchanged. This verifies the drawing revision and rendering path, not the accuracy of every individual map location or a universal no-lag claim.
