# Documents selection fix — focused validation

Author: Andrew Fisher · 3 Oct 2026 AEST.

**The final selection candidate passes 80/80 actual-browser checks and 70/70 independent CPU checks.** The selected row now remains marked and focused across refreshes and redraws, while later interaction can move focus and clear the selection.

| Binding | Value |
| --- | --- |
| Candidate SHA-256 | `35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770` |
| Candidate size | 9,118,422 bytes |
| Live v8.14 base SHA-256 | `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce` |
| Base implementation commit | `c1f69890736fae4c004e4643ff4139bb19cebeeb` |
| Corrected `docs815_src.js` SHA-256 | `da33522f35097ce2987e26ede691cd9d99b6e606e6522af8a0e02bb9e07cf134` |

The candidate contains the exact corrected source. The isolated [selection correction](../proposal_c1f6989_selection.py) applies to the base implementation above. The preceding `665f53fe…15fb` candidate and its evidence remain unchanged and are not the page validated here.

The [CPU results](../followup_c1f6989_selection_positive_results.json) retain all **43** previous positive assertions and add **27** selection checks. They cover refresh completion before and after the initial focus timer, full and partial redraws, guarded focus restoration without another scroll jump, user movement to search/category/other controls, clearing selection on new queries or category routes, and unchanged source records. These checks execute the corrected source with synthetic records and DOM/timer doubles. The fixture's original-page hash identifies the page used to extract native refresh/redraw functions; those functions were compared byte-for-byte with this final candidate and are unchanged. CPU results make no browser geometry or elapsed-time performance claim.

The focused selection regression passes **10/10 desktop and 10/10 phone** after actual header selection, a delayed refresh, native redraw and partial repaint. It also confirms that search keeps focus, new queries and category choices clear the old selection, later selection reacquires the chosen row, and later refreshes do not resurrect a cleared row. The full supplement passes **30/30 desktop and 30/30 phone**, covering keyboard category controls, search/caret preservation, retained-note search and details, complete native printing and restored screen state, missing-document header selection, view-only controls, and practice upload-form fields/focus. Both sets report **zero page errors, zero console errors and zero attempted service writes**. No upload or operational record change is claimed.

The release owner reported inspecting the new **desktop-after-print** and **phone-after-print** screenshots. Their hashes are recorded in the [sanitised aggregate](focused_browser.json); images and PDFs remain private. This consolidation did not independently reopen the images. The supplement's older runner-design source is retained as provenance; its actual runtime page/base hashes establish the current candidate binding.

Only generic assertions, aggregate counts, pass states and hashes are copied. Standing suites, the fresh pre-upload verification and publication are recorded separately by the release owner.
