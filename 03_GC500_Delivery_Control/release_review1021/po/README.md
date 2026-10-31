# Keep purchase-order checks current

Author: Andrew Fisher

Review correction for the exact combined v10.21 candidate. It leaves the original three patches intact.

A named check now carries the values reviewed inside its existing `checked` object. A material order change through `setPo` clears the current check. Same-value saves and receipt-only changes retain it. The display also rejects a mismatched review snapshot after a shared edit. Older `{by, at}` records remain compatible until an order edit.

Mark checked asks the user to Save first when the row contains edits, and leaves those edits in place. It cannot check old values while discarding the form.

Apply `patch_po_review1021.py` after the original v10.19, v10.20 and v10.21 patches. The patch requires source SHA256 `9db6edd2492e6f25d4144cc8762f8a223f1cca1a6ad01d25d9c648e17280456b` and refuses repeats. No live operational record changes are part of this patch.

Local checks: `node test_po_review1021.cjs`; `python3 -I test_patch_po_review1021.py <exact v10.18 page>`. The browser regression requires the owner's strict GET-only harness through `GC500_READONLY_HARNESS`, final `PAGE` and private `OUT`. It calls the native setter against a temporary in-memory record with persistence replaced by no-op functions, restores the full state, then proves native version and record parity.
