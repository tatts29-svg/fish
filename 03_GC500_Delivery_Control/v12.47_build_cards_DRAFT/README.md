# v12.47 — dark Build cards with compact map strips

Author: Andrew Fisher

Andrew approved go-live for the selected **existing dark card plus compact map strip**. The production candidate has passed its final native, financial and desktop/phone navigation checks. Publication still requires the exact verified live predecessor and shared live-base rebuild. This approval does not expand the change into a dashboard redesign.

The original reference, destination, equipment, qualified measurements, progress lights, delivery window, warnings, Navigate action, Details action and expanded workspace remain in their original order. Date/weather cards and other tabs are unchanged. No operational stage, record, rate, quantity, role, save handler or completion state is changed.

## Production boundary and ownership

- Required predecessor: **v12.46**, SHA-256 `4c07b14d578e390b7d39d073b8946ce9d84a21250cb55147d980eadce635cfe1`.
- Production candidate: **v12.47**, SHA-256 `1437f56498007f24a7e54acfd23542c2ab2daa0e3fd9aca64941c45753bd47ff` — 16,086,631 bytes.
- `patch_v1247.py` uses shared `rep`, requires the explicit reviewed predecessor SHA/version, checks its single footer, refuses repeat application, and guards the selected CSS plus both native-tested JavaScript source fingerprints.
- The only page changes are the added strip/lifecycle modules and the release footer. Exact reversal recovers the predecessor bytes; all 149 original stylesheet blocks remain exact.
- Production derives an in-memory copy of the reviewed adapter without its preview-only notice. Its module label and footer say v12.47. The original preview source files remain intact, and the selected dark-strip CSS is unchanged from commit `6f138f4`.
- Claude retains publication ownership. Publish only after the preceding 45.1 and 46 releases and exact 46 read-back are verified, then complete the guarded 47 release/read-back process. A successful local gate alone does not prove live publication.

## Location and resource handling

The strip uses existing Find1176 locations and pictures, then opens the existing map at the same recorded coordinate. Unknown coordinates do not get invented previews. External satellite imagery is not fetched automatically. A missing image has an explicit map action.

Continuous observation and fresh viewport checks prune offscreen queue entries and remove attached image sources. The compressed cache and attached thumbnail count are each capped at 16. Reentry restores a retained thumbnail or requests one draw. Generation, decoding and compaction share a single draw slot. Changed coordinates, removed/replaced cards and hidden panes reject stale results. Eligibility is checked before decoder creation and before canvas work. Hidden-document cleanup runs synchronously, independent of animation frames; temporary decoder and canvas resources are cleared.

## Validation

- **PASS:** seven production boundary tests, including missing/wrong predecessor, repeat application, mismatched footer, changed selected/tested sources, exact reversal and failed-CLI non-mutation.
- **PASS:** 129 synthetic lifecycle checks and 28 DOM/observer/decoder adapter checks. No operational fixtures, browser or network are used by those tests.
- **PASS:** all 215 inline scripts parse; the shared page check finds no new credentials; author attribution remains present.
- **PASS on the local preview:** exact closed/expanded same-render DOM identity, native text/controls against the untouched base, source/styles, date-card order, map-coordinate dispatch and desktop/phone scroll/tab eviction/reentry. Candidate and baseline documents remained exact, with no queued/inflight writes, blocked writes or runtime page errors.
- **PASS — production native gate:** the exact candidate above and exact 46 predecessor passed closed/expanded DOM identity, original text/controls, source/styles, date-card order, exact map dispatch and desktop/phone scroll/tab eviction/reentry. No preview notice is present; the runtime module and footer say v12.47. Candidate and baseline records remained unchanged, checked before baseline reload and after baseline verification, with zero runtime page errors or blocked/queued/inflight writes.
- **PASS — independent review:** exact candidate reproduction/reversal, selected/tested source guards, original styles, privacy and absence of financial/operational mutation.
- **PASS — final financial preservation:** 34 native comparisons against exact46 preserve all checked customer/supplier totals, categories, branch calculations, ledger/reconciliation and source records, with zero errors or operational writes.
- **PASS — both shared navigation sweeps:** desktop and phone each cover27 tabs, seven deep links and Back, with zero runtime errors, console errors or operational-write attempts.
- **Remaining release gates:** verify exact46 live, reproduce the tested47 bytes with the shared build, then hand over READY for Claude’s guarded upload/full read-back. This is a checked draft, not a live claim; Andrew’s design/publication approval is already recorded.

Actual-data page files, snapshots, screenshots and native reports remain outside Git. These resource checks do not measure production heap usage or imply a live speed result.

## Reproduce

```sh
BASE=/private/path/reviewed46.html python tests/test_patch_v1247.py
node tests/lifecycle.cjs
node tests/adapter.cjs
```

To patch a private copy of the exact reviewed predecessor:

```sh
GC500_V1247_BASE_SHA256=4c07b14d578e390b7d39d073b8946ce9d84a21250cb55147d980eadce635cfe1 \
GC500_V1247_BASE_VERSION=12.46 \
python patch_v1247.py /private/path/copied46.html
```

`tests/preview_browser.cjs` uses the shared read-only harness. Set private `PAGE`, `BASE`, `STATE`, `OUT`, expected page/base SHA and state/base version variables, `PRODUCTION=1` and `INITIAL_HASH=#timeline`; coordinate the browser lease. It captures complete desktop/phone cards and checks exact native preservation plus real scroll/tab eviction and reentry.

The historical visual builder `build_preview.py` remains pinned to the original reviewed 43 source for reproducibility. Its preview label and source files are retained; production uses only the guarded 47 patch above.
