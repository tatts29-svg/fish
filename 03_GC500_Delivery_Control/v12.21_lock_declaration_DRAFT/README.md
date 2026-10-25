# Servicing door-lock declaration — draft, not live

Author: Andrew Fisher

“Locked (doors locked)” means the physical toilet doors. Tapping an unfinished lock job opens a confirmation with the exact reference, grouped completion line, unit count and any existing asset numbers. One person enters their name and explicitly confirms: “I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.” The selected crew label is saved with that person's name. Cancelling does nothing.

The declaration is part of the same durable tick/outbox entry. A new server capability and an exact declaration echo are required before it is treated as saved. Offline reload and retry preserve the original confirmer. Pump-out and cleaning ticks are not created by the declaration. Existing completion counts, plans, signatures, identities, quantities, crew groups and history remain unchanged.

The night report includes declaration wording, named confirmer, selected group names, exact covered reference/line/count, phone tap time and service receipt time in dated AEST. Withdrawn/voided declarations stay identifiable as history; pending declarations and legacy lock completions without a named declaration are distinguished. This records what a person declared; it does not claim independent proof of work. No historical declaration is inferred.

## Dependency and publication order

Requires activated server v5.93 `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` and verified `lock_declarations_version:1`. Its source/staging/runbook is shared separately. This environment cannot switch Railway. Do not publish the new crew card before activation and preservation read-back. Preserve all machine server blobs.

Built on verified v12.19 `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16`. Current draft `f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7`, 15,378,131 bytes. If v12.20 publishes first, rebuild the patch on its exact live bytes and repeat affected gates before publication. Footer must never move backwards.

Use the shared build/check/upload toolchain, then `tests/update_tracker1221.cjs` for the existing event tracker through the native publisher. The updater defaults to dry capture. `--card-first --execute` can publish the independently tested crew card while the main page remains on the exact v12.19 base; it does not upload the main page. This requires the same activated v5.93 capability and every native preservation guard. The report page remains DRAFT until its full sweeps pass. `--execute` without `--card-first` additionally requires `GC500_NATIVE_TRACKER_EXECUTE=1`, exact reviewed live page and server capability. Its private snapshot proves unchanged tracker configuration, signatures, history, contact details and job record. No live test tick or crew message is permitted.

## Checks so far

- Shared page checker: 199 inline scripts parsed, no new keys.
- Real card-to-local-server integration: 26/26 phone and desktop, including required name/checkbox, cancellation, grouped coverage, offline reload/retry, missing acknowledgement and unavailable capability. Zero external writes.
- Declaration/report model: 19/19, including all existing report fields/totals preserved, old ticks, undo/void, pending, different nights, duplicate reads and escaped names.
- Exact preservation: 5/5; only the servicing script, night-report script and release footer change. All other scripts and page markup unchanged; wrong-base/double application refused.
- Synthetic A4 pagination/phone layout: 5/5, 120 entries over 26 numbered pages, no clipping; final page visually inspected. The pager now budgets for all report blocks rather than stopping after 20 pages.
- Native publication dry capture: 76/76 on the initial candidate; final-candidate rerun and full-page desktop/phone sweeps in progress. The first desktop sweep was stopped after stalling; the instrumented retry reached Costs but exceeded its five-minute test timeout. Neither is counted as a pass. This is not READY for page publication.

Operational snapshots, crew links/names, page captures and native publish payloads stay outside the public repository. Browser tests use the shared browser lock. Synthetic screenshots contain test names only.
