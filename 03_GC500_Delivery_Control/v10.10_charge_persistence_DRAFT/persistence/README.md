# Refresh persistence

Author: Andrew Fisher

The v10.09 native background redraw reproduced the reported reset: all eleven expanded WC09 charge disclosures returned closed. The four-second shared-record poll does not automatically reload the page; when records change it rebuilds the current view and drawer. Existing state capture covered only named legacy disclosures and unit/transport forms.

This module keeps current drawer and page disclosures, reading position, keyboard focus, unsubmitted editable fields and selected attachments through that redraw. Stable reference/item keys keep the same disclosure open when the live quantity or amount changes. The rebuilt values remain current. Existing unit/transport stale-write checks continue to own their original expected-record tokens.

Captured view state lives only during a synchronous redraw. No new timer, persistent view cache or auto-open action is added. Explicit Close, collapsed sections, another reference, navigation and successful submitted changes retain their normal behaviour. The ordinary same-reference drawer refresh used by document/report updates also keeps disclosures.

No native records or financial calculations are changed by this module. The financial agent owns the separate rate correction; the persistence-only preview still showed the old pee-panel amount.

Validation: baseline failure reproduced, then 28 focused browser checks passed on 390×844 phone and 1440×1000 desktop, with zero browser errors or attempted operational writes. Checks cover scheduled sync redraw, all WC09 charge disclosures, Build disclosures, phone/desktop scroll, explicit collapse and Close, navigation, fresh values, unsaved draft/caret, pending file attachment and native unit stale-write tokens. Phone screenshot inspected. Private evidence: `/workspace/private-gc5001010-persistence-check/`.

Combined release browser checks remain the parent release owner's responsibility. `check_persistence1010.cjs` accepts `PAGE` and `OUT`. No browser tests run without `/tmp/gc500-browser.lock`.
