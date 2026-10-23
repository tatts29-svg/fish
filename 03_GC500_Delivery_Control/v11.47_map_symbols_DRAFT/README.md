Author: Andrew Fisher.

READY TO UPLOAD: Map explorer equipment symbols and separate area highlights

The map references keep their identity and show the kind of equipment beside the code, replacing bracketed quantity labels. Mixed references keep each distinct equipment kind. Quantities and completion details remain in the existing detail view. A small embedded vector font makes the symbols sharp at every display density without a network request; the equipment key uses the same drawings.

Each servicing area keeps its existing number, name, colour and geometry. The selector isolates and fits one area, or shows all areas as separate outlines. These are envelopes around recorded servicing locations, not surveyed boundaries. Locations beyond the drawing and references without a position remain explicit; no position is inferred.

Scope comes from PR #1 handover 6353466493 and the v11.47 shared-board claim. Exact base: v11.46, SHA256 `9763bea1f82b5a0a355d4ae2deeaa608a0db20bf9cf6b037303838a547b163e9`. The satellite-map scripts, finder, Showcase, crew-card code, operational records and printed QR tokens stay unchanged. `#expcard` stays in place.

Build with the shared toolchain. `tests/check_scope.py BASE CANDIDATE` proves the bounded byte changes; `tests/test_v1147.cjs` uses the shared read-only harness and requires `PAGE` plus an `OUT` directory outside the checkout. Run it on desktop and with `MOB=1`, then both shared sweeps. `make_symbols.py` recreates `symbols.json` using fontTools; normal builds use the committed vector bytes.

Validation is complete on v11.46. Candidate SHA256 `beb194ddf20a232a595f9b547d1b2ae2c1f10ef0c06e517df7de9a54965226d9` (21,396,852 bytes). Source code: `0420da0b8ee8b2a9b6afed4260b5dacac5b18cdb`; publication source/commit will be recorded on the shared board. Build and byte-scope checks pass, including exact preservation of the crew-card template and printed QR data. Desktop and phone: 19/19 map checks each; both shared sweeps: 27 tabs, seven deep links and Back, no page/console errors or attempted writes. Satellite regression: 11/11; crew-card wording regression: 11/11 desktop and phone. Final phone screenshots inspected. Public evidence contains aggregate results only; screenshots, raw logs and source-record observations remain private.

Rebuild command: `bash toolchain/build.sh v11.47 v11.47_map_symbols_DRAFT/patch_v1147.py` from the delivery-control folder. Scope check: `python3 v11.47_map_symbols_DRAFT/tests/check_scope.py build/GC500_v11.47/base_live.html build/GC500_v11.47/GC500_Delivery_Control_hosted.html`. Set `PAGE` to that candidate and `OUT` outside the checkout when running `tests/test_v1147.cjs`; repeat with `MOB=1`. Regressions use `EXPECT_PAGE=v11.47`. The guarded uploader must still confirm the unchanged base before publication.

This supersedes the unpublished v11.45 draft after the crew-card release became live. No record, coordinate, tracker publication or printed-code change is part of this release. No independent review by the other implementation owner is claimed.
