# Refresh persistence

Author: Andrew Fisher

The v10.09 native background redraw reproduced the reported reset: all eleven expanded WC09 charge disclosures returned closed. The four-second shared-record poll does not automatically reload the page; when records change it rebuilds the current view and drawer. Existing state capture covered only named legacy disclosures and unit/transport forms.

This module keeps current drawer and page disclosures, reading position, keyboard focus, unsubmitted editable fields and selected attachments through that redraw. Stable reference/item keys keep the same disclosure open when the live quantity or amount changes. The rebuilt values remain current. Existing unit/transport stale-write checks continue to own their original expected-record tokens.

Captured view state lives only during a synchronous redraw. No new timer, persistent view cache or auto-open action is added. Explicit Close, collapsed sections, another reference, navigation and successful submitted changes retain their normal behaviour. The ordinary same-reference drawer refresh used by document/report updates also keeps disclosures.

No native records or financial calculations are changed by this module. The financial agent owns the separate rate correction; the persistence-only preview still showed the old pee-panel amount.

Validation: baseline failure reproduced, then 28 focused browser checks passed on 390×844 phone and 1440×1000 desktop, with zero browser errors or attempted operational writes. Checks cover scheduled sync redraw, all WC09 charge disclosures, Build disclosures, phone/desktop scroll, explicit collapse and Close, navigation, fresh values, unsaved draft/caret, pending file attachment and native unit stale-write tokens. Phone screenshot inspected. Private evidence: `/workspace/private-gc5001010-persistence-check/`.

Combined release browser checks remain the parent release owner's responsibility. `check_persistence1010.cjs` accepts `PAGE` and `OUT`. No browser tests run without `/tmp/gc500-browser.lock`.

P33 follow-up: the shared local `bump()` Save path now preserves main-page disclosures and reading position without restoring old submitted field values. Generic disclosure identities exclude mutable form-storage keys so an existing unit's first metadata save does not lose its nested More details fold. Body/document scrolling and already-open independent dialog surfaces are included; detached or explicitly closed dialogs are never recreated. `check_p33_persistence1010.cjs` adds captured native P33 metadata/note Saves, six main-page/section cases, body-scroll mode, nested dialog scrolling and explicit Close. It accepts `LIVE=1` for post-publication testing with all writes still intercepted. The release owner records these final follow-up checks separately from the initial 28-check result.

Expanded checks reproduced a second P33 defect: native focus anchoring measured a collapsed replacement drawer and its queued frame later forced scroll from 6472 to 2006. Open disclosures now restore before that measurement. The existing queued frame yields to new user input, a closed drawer, a new reference or replaced drawer contents. No timer was added. A separate Costs regression came from table wrappers receiving `tabindex` and an accessibility label after rendering; those transient attributes no longer change the identity of nested disclosures.

The main-page test respects existing UI rules: day-document menus allow only one open menu, and Today's lazy-fold anchoring yields to real scroll intent before the test records a reading position. These behaviours are not overridden. The user-intent assertion also checks the visible Save button position, so normal browser scroll anchoring after a small layout change is distinguished from a real jump.

Final focused validation: **90 browser checks passed** on phone and desktop (58 expanded P33/page checks, 32 original-plus-regression checks), zero browser errors and zero operational writes. The P33 test captured both native metadata and note saves locally; it did not submit either to the service. Private evidence is `/workspace/private-gc5001010-expanded/p33/review.json` and `/workspace/private-gc5001010-expanded/persistence/review.json`. The tested private candidate SHA is `6dcad8370ec201b42ca2473f8f184cd8798096d0e5f4c2bc4cba9f8a27a2798d`, carrying frozen persistence JS SHA `7c7faf4671f339cbe460fa39d7549bc61fe6ba6c1536dcc76e75ee525dc23c74`. The P33 phone screenshot was visually checked.

A final exact-anchor text correction removes the unconditional “Saved in the shared record” note hint. The note toast now reports a failed local Save separately from a successful on-device Save; the existing header owns shared acknowledgement. This wording correction passed exact base-anchor application after the browser checks. Final integrated/public verification belongs to the release owner.

Sanitised results are stored in `evidence/browser-summary1010.json`. It records all 90 check outcomes without native values or screenshots and verifies that the tested persistence script and native scroll-frame guard are byte-identical in final candidate `8cdd8e1ac7421e020a69333c4d82c1cb7f90ee6ee220209901aa0ec8325e6461`. This component equivalence does not claim byte equality of the entire HTML or validate unrelated release changes.
