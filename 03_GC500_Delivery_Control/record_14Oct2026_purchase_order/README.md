# Approved P/O and source-docket reconciliation

Author: Andrew Fisher

The user supplied a supplier programme and the matching signed docket scan, authorised the existing P/O amount, then clarified that the underlying docket pricing must match that order. Private specifications and original PDFs are retained outside this public repository.

Three separate native operations keep the evidence clear:

1. `record_purchase_order.cjs` saves the authorised amount on the existing P/O. Completed and freshly verified before the pricing change.
2. `record_pricing.cjs` stores the approved supplier breakdown on that same P/O via native `setPo`. It requires the supplier-pricing release, preserves the existing amount and commercial receipt fields, and permits only the order and its audit changes.
3. `record_docket.cjs` corrects the two source-backed physical transcription fields after pricing is saved. A narrowly guarded catalogue adapter preserves the existing reviewed programme assignment and capped allowance. Customer charges retain their existing rate and normal line rounding; approved supplier charges stay fixed.

Each writer requires a private specification and supports a read-only `--practice` first. Live `--apply` additionally requires the private edit binding and exact published page SHA. It backs up the entire shared record, checks for concurrent changes, pauses native transmission, verifies the exact queued document changes, then permits only those native requests. Every acknowledgement and fresh full-record readback is retained privately. There is no automatic retry after partial failure.

`verify_pricing.cjs` and `verify_docket.cjs` provide fresh read-only browser checks. The pricing-stage verification runs before the separate physical correction, so its unchanged-customer assertion remains meaningful. Tests never write to the live record. The P/O is not marked invoiced, receipted or paid by these operations.

Mapping evidence: all source records have an existing identity and named location; only a subset has reviewed schedule links. No exact map-reference/geometry binding was established for these records. Existing verified programme and plan links are shown dynamically; no pin or schedule task was guessed.

Final operation status and release evidence are recorded on STATUS.md. Detailed amounts, scans, specifications, backups and raw browser results remain in authorised private storage under `/workspace/private-po4647519/`.
