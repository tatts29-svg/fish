# Servicing door-lock declaration — crew card LIVE, report page DRAFT

Author: Andrew Fisher

“Locked (doors locked)” means the physical toilet doors. Tapping an unfinished lock job opens a confirmation with the exact reference, grouped completion line, unit count and any existing asset numbers. One person enters their name and explicitly confirms: “I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.” The selected crew label is saved with that person's name. Cancelling does nothing.

The declaration is part of the same durable tick/outbox entry. A new server capability and an exact declaration echo are required before it is treated as saved. Offline reload and retry preserve the original confirmer. Pump-out and cleaning ticks are not created by the declaration. Existing completion counts, plans, signatures, identities, quantities, crew groups and history remain unchanged.

The night report includes declaration wording, named confirmer, selected group names, exact covered reference/line/count, phone tap time and service receipt time in dated AEST. Withdrawn/voided declarations stay identifiable as history; pending declarations and legacy lock completions without a named declaration are distinguished. This records what a person declared; it does not claim independent proof of work. No historical declaration is inferred.

## Dependency and publication order

Requires activated server v5.93 `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46` and verified `lock_declarations_version:1`. Its source/staging/runbook is shared separately. This environment cannot switch Railway. Do not publish the new crew card before activation and preservation read-back. Preserve all machine server blobs.

Built on verified v12.19 `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16`. Current draft `f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7`, 15,378,131 bytes. If v12.20 publishes first, rebuild the patch on its exact live bytes and repeat affected gates before publication. Footer must never move backwards.

Use the shared build/check/upload toolchain, then `tests/update_tracker1221.cjs` for the existing event tracker through the native publisher. The updater defaults to dry capture. `--card-first --execute` can publish the independently tested crew card while the main page remains on the exact v12.19 base; it does not upload the main page. This requires the same activated v5.93 capability and every native preservation guard. The report page remains DRAFT until its full sweeps pass. `--execute` without `--card-first` additionally requires `GC500_NATIVE_TRACKER_EXECUTE=1`, exact reviewed live page and server capability. Its private snapshot proves unchanged tracker configuration, signatures, history, contact details and job record. No live test tick or crew message is permitted.

Server v5.93 was activated by Claude at 17:45 AEST. Independent GET read-back at 17:47:48 verified declaration capability, all 426 earlier events, tracker configuration, signatures, cards and inventory. The exact boot hash is supported by Claude’s deployment evidence.

## Checks so far

- Shared page checker: 199 inline scripts parsed, no new keys.
- Real card-to-local-server integration: 26/26 phone and desktop, including required name/checkbox, cancellation, grouped coverage, offline reload/retry, missing acknowledgement and unavailable capability. Zero external writes.
- Declaration/report model: 19/19, including all existing report fields/totals preserved, old ticks, undo/void, pending, different nights, duplicate reads and escaped names.
- Exact preservation: 5/5; only the servicing script, night-report script and release footer change. All other scripts and page markup unchanged; wrong-base/double application refused.
- Synthetic A4 pagination/phone layout: 5/5, 120 entries over 26 numbered pages, no clipping; final page visually inspected. The pager now budgets for all report blocks rather than stopping after 20 pages.
- Final native card-first dry capture: 76/76 (including receipt safety), zero live writes; exact crew HTML SHA-256 `54957ef5bb042313fe74b277fa0344395ecf6d543ede5e19b3abd1940ce74798`. Actor: Andrew Fisher via Codex.
- Final desktop full sweep: 27 routes, 19 direct panes, seven deep links and Back; zero page errors, console errors or writes. Phone full sweep remains pending. Initial desktop attempts timed out; neither counted as passing and no checks were relaxed.
- Phone prompt and report final page visually inspected. The crew card is LIVE from 25 Oct 2026 17:52:56 AEST; the main report page remains DRAFT until its phone sweep passes.

Operational snapshots, crew links/names, page captures and native publish payloads stay outside the public repository. Browser tests use the shared browser lock. Synthetic screenshots contain test names only.

## Native crew-card publication

READY source `4f7ce94e497b5f589253b949d47ae343b5ec08cc`. One native update, 76 preservation checks passed; crew HTML `54957ef5bb042313fe74b277fa0344395ecf6d543ede5e19b3abd1940ce74798` reads back exactly. Tracker configuration, signatures, history, contacts, job record and version unchanged. Actual live phone and desktop GET-only checks 10/10 each; no job tapped. Existing open cards need a refresh after current ticks are saved. Main page remains v12.19 until the separate report-page gate passes.

The first live-read test incorrectly looked for a closure-local capability variable on window. The test was corrected to inspect the served declaration code and the actual GET capability response; both viewport reruns passed. No product change was needed.
