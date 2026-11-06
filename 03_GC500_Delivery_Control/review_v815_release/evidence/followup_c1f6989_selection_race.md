# Missing document selection — refresh race

Author: Andrew Fisher · 3 Oct 2026 AEST.

**A product race is reproduced in the exact tested source. Do not dismiss the owner's failed selection check as fixture-only.** The specific asynchronous trigger in the owner's browser run still needs a trace; this CPU reproduction establishes a real path to the same lost-selection state.

Bindings: commit `c1f69890736fae4c004e4643ff4139bb19cebeeb`; Documents source SHA-256 `038e6fd2966c374a27b70a0d3195c50f27346e9c7f32f59a607bba6618093168`; built page SHA-256 `665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb`. The later `abbb01b` changes tests/evidence, not this implementation. There are no `goDoc815` or `focus815` functions in this exact page; the relevant helper is `selRow815`.

`finderPick()` sets `state.docSel815` and calls `go('docs')`. In `docs815_src.js:320`, rendering may start `docsRefresh(false)`. At `:355`, `selRow815()` immediately clears that selection ID, marks the current DOM row and queues a **0 ms** callback holding that row. At `:359`, the callback returns if the captured row has been detached. A later full render replaces `pane.innerHTML` at `:334`; it preserves category/search focus, but not the selected document row.

The base's file registry expires after **30 seconds** (`docsRefresh`, built page line 33586). Its asynchronous completion unconditionally calls `docsRedraw()` (line 33601), even if the file list did not change. Two real function sequences were reproduced with an invented missing document and a controlled file-list promise:

| Ordering | Result |
| --- | --- |
| Selection timer runs, then file refresh completes | Initially marked and focused; refresh replaces the row and both are lost. |
| File refresh completes before selection timer | Replacement removes the marker; the timer sees its detached row and never scrolls or focuses. |

In both cases the query and matching document remain present. All existing **43 positive checks still pass**, demonstrating the additional timing coverage this finding needs. [Script](followup_c1f6989_selection_race.cjs) and [synthetic results](followup_c1f6989_selection_race_results.json) contain the evidence. The script takes explicit `--source-dir`, `--baseline`, `--current-base`, `--page` and optional `--out` paths, reuses the checked-in synthetic positive fixture, and rejects a different page/source hash. Exit 0 means the defect was reproduced, not release approval.

Other valid replacement triggers are `syncRedraw()` **250 ms** after a changed remote record (built page line 40025), and capability/status transitions calling `docsRedraw()` (lines 40215/40240). A focused document row does not invoke the typing deferral. By contrast, the **640 ms** count-up updates number text only; the normal `go()` pane focus is synchronous and precedes the row timer; header blur's **120 ms** callback only closes the finder. Scroll restoration alone cannot remove `aria-current`.

The `abbb01b` logs show `current: null` on **both desktop and phone**. Consequently `focused: false` and `inView: false` are downstream of the missing marker; the test does not measure an off-screen selected row in this case. The owner's check samples **900 ms** after selection. The supplemental check samples **350 ms** after a reset/warm Documents view, so its pass does not cover a replacement later in that interval. The precise event in the owner's run is unproven; instrument file-list completion and full redraws around selection, or hold a read-only file-list response until after selection to reproduce in the browser.

A correction should retain the selected-document identity through refreshes, reapply its marker, restore focus when the selected row previously owned it, and resolve pending focus against the current DOM. Clearing selection before a row exists loses the pending request. Persisting an unconditional refocus request would instead steal focus after the person moves to another control; clear/cancel it on a new search/category choice. No implementation changes or browser runs were made here.
