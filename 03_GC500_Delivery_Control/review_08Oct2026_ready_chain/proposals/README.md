# Correction proposals for the implementation owner

Author: Andrew Fisher.

`v892-correction.patch` is prepared for the v8.92 implementation owner to review and adopt. It has **not** been applied to
the claimed draft or the combined release. It changes source code only; no record or financial content is included.

The proposal removes the card-ID shortcut that skips controls after a Today DOM replacement. It retains scroll-event
batching. It also cancels delayed scroll restoration on new renders and navigation events, and verifies the captured tab
and pane before any later scroll write.

The portable fixture `../tests/repro_aplus892.cjs` reproduces the two defects on the current combined candidate. With the
proposal applied to a private candidate and `--expect-fixed`, both corrected cases pass and cache invalidation still passes.
These are isolated native-function checks, not browser or publication acceptance. The owner must rebuild from source and
run the affected browser/motion/navigation checks before adding this correction to a READY handover.

The separate `../tests/repro_flow891.cjs` proves that a flow-only change can overwrite another truck's window when they
share a reference, and that an order-only save incorrectly converts unknown people requirements into zero. Those v8.91
findings require their own correction; this v8.92 proposal does not address them.

Both reproductions default to successful exit when the documented defects reproduce. They must not be treated as passing
release gates. `repro_aplus892.cjs --expect-fixed` selects the corrected-behaviour assertions.

`v893-alignment-portability.patch` changes only the alignment test's absolute checkout import to the same harness via a
relative path. That target is present in the shared repository. It is not applied to the claimed source, and does not remove
the requirement for exact v8.93 assets or establish an alignment-test pass.
