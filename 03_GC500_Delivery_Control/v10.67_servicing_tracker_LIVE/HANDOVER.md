# Panel and print source handover — ready for guarded build

## Final upload-envelope candidate — 18 Oct 2026

The release candidate is `f32b39bcf42637fd246e03c6b64547b9dd203015659b768411e232e77ffcfc86` (18,465,246 bytes), built from verified live v10.66 `9724e2a644833e7b6e56139b7954add2f639e348f03c6b6c9d109e0229cc821a`. Its only difference from browser-tested `6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387` is the inherited 32-byte `<!-- GC500 Delivery Control -->` comment immediately after the doctype. Removing that exact single comment restores all original bytes, including every script, style and data value. The patch now pins the corrected predecessor; no runtime function changed.

`tests/envelope_equivalence.json` and `tests/test_envelope_identity.py` prove the exact relationship through v10.71. New-candidate build guards/boundaries pass 10/10 (`tests/envelope_build_results.json`), static checks pass, and the native server upload envelope accepts the page. Original integration/sweep evidence below retains its original hashes; these browser runs were not relabelled or repeated for a non-rendered comment. The publisher must reproduce the final candidate above and perform guarded upload/read-back.

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
`v10.67_servicing_tracker_LIVE/`. The card and server have their own owners and evidence.

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
| Final candidate static checks and phone inspection | 142 scripts parse; no new secrets; readable at 390 px; diff check clean |

The frozen page SHA-256 is `6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387`
(18,465,214 bytes), built on exact final v10.66 `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.
These identify original browser-tested bytes. The patch now pins the corrected predecessor named above; no live claim is made here.

## Release owner’s next action

The final actual-page/native-server integration passes 22/22 against v5.90
`55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`. All first collection merges complete.
The test explicitly checks native empty-map normalization and then whole-state stability; tracker actions preserve
every state value and the record file bytes. It confirms TEST/event creation, exact read-back, same-token signatures,
private bundle download, per-job/stale progress, redraw, permission revocation and fresh-view privacy. The inspected
390 px phone screenshot has readable controls and no horizontal overflow. `tests/actual_page_results.json` is sanitized;
the private fixture, raw logs and screenshot are not published.

Both final standard sweeps pass: 24 panes, seven correct deep-link destinations and Back, zero page/console/navigation
errors and zero attempted writes. Before/after machine identity and record endpoint version match. These used fresh
live GETs rather than an atomic frozen record; `tests/sweep_results.json` records the exact routing assertions.

After v10.66 is verified live, the release owner runs the standard guarded v10.67 build and verifies the result matches
the final upload-envelope candidate above, then uploader dry-run and guarded publication/read-back. No repeat browser run is needed
when the final built bytes are identical; any changed predecessor or output requires the affected checks again. The
server prerequisite is verified live and the publication hold is lifted. Missing contact nomination and physical
paper scans gate real tracker/sheet rollout, not the empty-state page software. Exact commands are in `RELEASE_CHECKLIST.md`.

No commit, push, publication or live operational write was performed by the panel/print agent. No servicing contact,
missing pin or access decision was invented. Physical iPhone/Android paper scans remain an operator check.

## Packaging and current release instructions

Standard publisher scrubbing initially changed the embedded crew author metadata. Its JSON space is now encoded,
leaving the decoded template/data/runtime identical to the browser-tested candidate. Current packaging output:
`6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387` (18,465,214 bytes), on the exact final v10.66 base above.
Ten exact-build checks pass, including native-script allowlist, unchanged DATA/styles/map scripts, exact card builder
identity, repeat/wrong-base refusal and a byte-stable standard publisher scrub. `tests/build_results.json` and the final
actual-page/sweep results all bind to the same frozen candidate. `RELEASE_CHECKLIST.md` gives publisher commands and setup evidence.
