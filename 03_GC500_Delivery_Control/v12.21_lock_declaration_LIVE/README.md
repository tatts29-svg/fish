# Servicing door-lock declaration — LIVE

Author: Andrew Fisher

“Locked (doors locked)” identifies the physical toilet doors. Tapping an unfinished lock job opens a confirmation showing its reference, completion line, unit count and existing asset numbers. One person enters their name and explicitly confirms: “I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.” The selected crew label is recorded alongside that name. Cancel records nothing.

The declaration stays with the durable tick and outbox, with exact server acknowledgement before it is shown as saved. The night report includes the wording, confirmer, group names, covered reference/line/count, phone tap time and service receipt time in dated AEST. Withdrawn/voided evidence remains identifiable; old lock completions have no invented declaration. Pump-out and cleaning completion ticks remain separate. This records the person's declaration, not independent proof of the work.

## Publication and read-back

- Server v5.93: Codex READY source `159c9674233502da0f765f00ea57a2630d96a424`, exact blob `8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46`. Claude activated it at 17:45 AEST; boot-hash evidence is in [the switch handover](../server_v5.93_switch/README.md). Independent GET checks confirmed capability, retained history, tracker configuration, printed signatures, cards and inventory. Source is now archived in `../server_v5.93_lock_declaration_LIVE/`.
- Crew card: LIVE 25 Oct 2026 17:52:56 AEST, READY source `4f7ce94e497b5f589253b949d47ae343b5ec08cc`. Exact HTML `54957ef5bb042313fe74b277fa0344395ecf6d543ede5e19b3abd1940ce74798`. One native update via `--card-first --execute`, attributed to Andrew Fisher via Codex; 76 preservation checks passed. Existing tracker configuration, signatures, history, contacts, job record and version preserved. Live phone and desktop GET-only checks 10/10 each; no job tapped. Existing open cards refresh once after pending ticks show saved.
- Main page/report: LIVE 25 Oct 2026 18:11:14 AEST, READY source `6eeb5744fc6a8df6d47230b1d4bad4a66d74d9b8`. Base v12.19 `6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16`. Live `f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7`, 15,378,131 bytes. Shared guarded upload passed; independent public GET at 18:12:11 AEST matched every byte, with crew HTML, earlier ticks, configuration and signatures retained and job record unchanged. Public phone smoke check 7/7; view-only servicing access remains protected. Phone screenshot inspected.

The card was published before the report page so the confirmation could be available while the main-page phone sweep finished. Codex implemented, tested and published the page/card independently; Claude activated the tested server. No claim of a second agent's page review. Claude's Costs follow-up is v12.22, based on the exact live v12.21 bytes; its tests and publication remain his scope.

## Validation

- 199 inline scripts parse; all scripts and markup outside servicing, its report and the footer preserved exactly. Model 19/19 and preservation 5/5, including guarded wrong-base and duplicate application rejection.
- Real card to disposable localhost v5.93: 26/26 on phone and desktop, including required name/checkbox, cancellation, grouped coverage, offline reload/retry, missing acknowledgement, undo and unavailable capability. No external writes.
- Synthetic A4/phone report: 5/5; all 120 entries across 26 numbered pages, no clipping. The pagination budget covers every report block rather than stopping after 20 pages.
- Both final complete sweeps: 27 routes, 19 direct panes, seven deep links and Back; zero page errors, console errors or writes. Initial desktop attempts timed out; neither counted as passing and no checks were relaxed.
- Server validation: 50 focused and 205 retained HTTP checks; preserved through staging/activation. See the server source and switch handover.

The first live-card test looked for a closure-local variable on window. It was corrected to inspect the served declaration code and actual GET capability response; both viewport reruns passed without a product change. The public-page smoke check waits for shared-record hydration before inspecting its phone screen.

Operational snapshots, crew links, names, page captures and native payloads stay in private storage outside Git. Browser tests use the shared browser lock. Synthetic screenshot names are test data. `tests/update_tracker1221.cjs` is a guarded one-time updater: it deliberately refuses an already-updated card. `tests/verify_server1221.py` describes the server-activation phase before page/card publication; it is not a repeatable post-release updater.
