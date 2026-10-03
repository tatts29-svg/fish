# Documents selection lost during a later redraw

Author: Andrew Fisher · 3 Oct 2026 AEST.

**Reproduced on desktop and phone against candidate665f53fe. This is a product defect and blocks publication of that candidate.** The earlier60-check focused run passed on a warm, reset Documents view; it did not establish persistence of selected-row focus through subsequent refreshes. Owner abbb01b release-specific reruns exposed the missing highlight/focus in a longer session.

The actual-browser trace uses real header typing and result clicking. The first render marks the chosen missing document and the row receives focus. A second native full render follows roughly30ms later; `selRow815` has already cleared `state.docSel815`, so the replacement row has no `aria-current` and focus returns to BODY. At350ms and1050ms the selected query and target row still exist, but the marker/focus are gone. An explicit `docsRedraw()` retains that loss. Both devices reproduce with zero page/console errors and no attempted service writes. Trace/aggregate evidence is `selected_row_refresh815_results.json`; images remain private.

A separate CPU fixture uses the actual render, selection and file-refresh functions to demonstrate both refresh-after-focus and refresh-before-the-zero-delay-focus-callback orderings. This proves the lifecycle problem without relying on one timing coincidence. The browser trace's second render is observed; its upstream trigger is not asserted from this evidence.

The initial, uninstrumented browser run also showed the lost selection before350ms, but its overly narrow reproduction predicate required an earlier successful observation and therefore exited1. That private result is retained. The instrumented reproduction records the selection being marked before the later render and has an accurate loss predicate.

A correction must preserve selected identity through redraw, reacquire the current row for pending focus, restore focus only if the row owned it, and leave a different active control alone. Deliberate new query/category selection must clear stale selection. No implementation change is included in this reproduction.
