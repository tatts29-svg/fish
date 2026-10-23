Author: Andrew Fisher.

Draft: Map explorer equipment symbols and separate area highlights

The map references keep their identity and show the kind of equipment beside the code, replacing bracketed quantity labels. Mixed references keep each distinct equipment kind. Quantities and completion details remain in the existing detail view. A small embedded vector font makes the symbols sharp at every display density without a network request; the equipment key uses the same drawings.

Each servicing area keeps its existing number, name, colour and geometry. The selector isolates and fits one area, or shows all areas as separate outlines. These are envelopes around recorded servicing locations, not surveyed boundaries. Locations beyond the drawing and references without a position remain explicit; no position is inferred.

Scope comes from PR #1 handover 6353466493 and the v11.47 shared-board claim. Exact base: v11.46, SHA256 `9763bea1f82b5a0a355d4ae2deeaa608a0db20bf9cf6b037303838a547b163e9`. The satellite-map scripts, finder, Showcase, crew-card code, operational records and printed QR tokens stay unchanged. `#expcard` stays in place.

Build with the shared toolchain. `tests/check_scope.py BASE CANDIDATE` proves the bounded byte changes; `tests/test_v1147.cjs` uses the shared read-only harness and requires `PAGE` plus an `OUT` directory outside the checkout. Run it on desktop and with `MOB=1`, then both shared sweeps. `make_symbols.py` recreates `symbols.json` using fontTools; normal builds use the committed vector bytes.

Validation is in progress. This draft is not ready to upload. Screenshots, full logs and source-record observations stay in private evidence storage; the final handover will record aggregate results and exact release bytes.
