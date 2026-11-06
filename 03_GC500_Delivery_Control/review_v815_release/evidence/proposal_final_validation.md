# Documents candidate — final focused validation

Author: Andrew Fisher · 3 Oct 2026 AEST.

**Focused browser checks pass 60/60; independent source/CPU checks pass 43/43.** This records the checked Documents candidate, not publication or completion of the separately running standing suites.

| Binding | Value |
| --- | --- |
| Candidate SHA-256 | `665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb` |
| Candidate size | 9,116,658 bytes |
| Live v8.14 base SHA-256 | `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce` |
| Adopted implementation source | `c1f69890736fae4c004e4643ff4139bb19cebeeb` |

The owner source's `docs815_src.js`, `patch_v815.py` and `v815.css` all match the hashes in the independent [43-check CPU evidence](followup_e540cbc_proposal_results.json). The tested page also contains the exact checked JavaScript and CSS. That evidence comprises the original 28 positive checks plus 15 correction checks, including incoming-record classification, fresh collection reads within the retained asset hold, public search and category-focus restoration. It makes no browser or elapsed-time performance claim.

The actual-page supplement passes **30/30 desktop and 30/30 phone**, with **zero page errors, zero console errors and zero attempted service writes**. It covers keyboard category opening/closing and focus, search and caret retention during redraw, retained-note search/detail behaviour, full native document/photo printing and post-print state, missing-document header selection, view-only controls, and the practice upload form's category/field/focus behaviour. PDFs were generated privately. No actual upload or operational record change is claimed.

The release owner reported inspecting **phone-keyboard**, **desktop-after-print**, **phone-after-print** and **phone-upload-form** screenshots from this candidate. Their hashes are retained in the [sanitised aggregate](proposal_final_browser.json); the screenshots and PDFs remain private. This evidence consolidation did not independently reopen the images.

The browser runner's original `auditDesignedForSourceCommit` names an earlier test-design source. It is retained as provenance, not presented as the tested implementation: the recorded runtime page/base hashes and the adopted-source comparison above establish this final binding. The sanitised aggregate retains only generic assertions, counts, pass states and artifact/source hashes; raw results and operational payloads are not copied.

Final standing suites, the fresh pre-upload check and guarded publication remain with the release owner.
