# Panel and print source handover — release checks pending

Author: Andrew Fisher · 18 Oct 2026

## What changed

- The Event nights panel reads the separate tracker through the server's bounded cursor and epoch API. It uses
  the crew card's exact shared state reducer, with overall and per-job reference/job totals for every area.
- It stays separate from the run-sheet redraw, preserves open areas, labels stale reads, handles TEST dates honestly
  and clears private controls/tokens on the native capability-change callback. Tracker progress remains edit-only.
- Make/update is deliberate and edit-only. It requires an operator and confirmed servicing contact, supports TEST
  rehearsal followed by the event tracker, explicitly reuses existing tokens, and stops on missing completion keys.
  There is no rekey/withdraw action. Saved means metadata and served card bytes were read back successfully.
- The private QR download carries the exact published data and contact. Printing consumes that bundle, so TEST dates
  cannot silently become event dates. Real print mode requires a matching private readiness receipt and recorded
  physical scan checks; TEST bundles cannot be promoted to real sheets.
- Print pages have readable contact/footer wording and truthful offline preparation steps. The tracked PDF remains
  DRAFT with placeholder codes. Existing map positions, quantities, job plans and operational records were not edited.

## Owned paths

`servicing_tracker_DRAFT/panel_mockup/`, `servicing_tracker_DRAFT/print/`, and
`v10.67_servicing_tracker_DRAFT/`. The card and server have their own owners and evidence.

## Checks completed

| Check | Result |
|---|---|
| Shared reducer / exact card inclusion / random event order | 51 passed |
| Panel totals, nouns, per-job sums, cursor/epoch and partial-read refusal | 10 passed |
| Create payload, TEST window, event dates, contact and source immutability | 19 assertions passed |
| Isolated admin/panel browser fixture at 360 and 1280 px | 28 passed; no page errors or network writes |
| Print mode, matching receipt and exact downloaded TEST data/contact | 7 passed |
| Complete PDF/QR suite | 42 passed, including every completion/location QR decode at 300 dpi |
| Published-bundle print rehearsal | All 55 pages rendered; actual TEST day/contact present; event dates absent |
| Actual full page with final native server | 22/22; zero errors or attempted record writes; exact record bytes unchanged |
| Current provisional page static checks and phone inspection | 142 scripts parse; no new secrets; readable at 390 px; diff check clean |

The provisional page SHA-256 is `bb57d139e0aacf5e0f193e5238c260a7e28ef2f40f52d8eba2843fd91b9dabc9`
(18,465,137 bytes), built on boot-corrected v10.66 `08a8d9c13cf185de9f5c8db39cebb7d4d3f82acf44b15d8f5dc0b0fde3f078b3`.
These hashes identify development evidence only. They are not READY or live claims.

## Remaining release gate

The actual-page/native-server integration passes 22/22 against exact final v5.90
`55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`. All first collection merges complete on the
boot-corrected base. The test explicitly checks the native empty-map normalization and then whole-state stability;
tracker actions preserve every state value and the record file bytes. It confirms TEST/event creation, exact read-back,
same-token signatures, private bundle download, per-job/stale progress, redraw, permission revocation and fresh view privacy.
The phone screenshot was inspected with readable controls and no horizontal overflow. Sanitized evidence is
`tests/actual_page_results.json`; the private fixture, raw logs and screenshot are not published.

Still required: both standard page sweeps, a guarded build from the final deployed v10.66, and rerunning affected
checks if that base changes. Claude owns the Railway switch; the page remains DRAFT pending its confirmed server
switch and these release gates. Physical iPhone/Android paper scans remain an operator check.

No commit, push, publication or live operational write was performed by the panel/print agent. No servicing contact,
missing pin or access decision was invented. Physical iPhone/Android paper scans remain an operator check.
