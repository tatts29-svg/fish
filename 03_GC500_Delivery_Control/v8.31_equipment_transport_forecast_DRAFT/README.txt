Author: Andrew Fisher
v8.31 transport forecast — source ready for final build; not ready to upload

Branch transport entries are incomplete. The equipment adapters estimate current
asked delivery and pickup at current card charges and add only the
uncovered amount to job-end Revenue. A matched current contract leg replaces its
estimate, even when below the card. Missing rates, unclear quantity/leg basis,
unallocated charges and unresolved identities stay held for review.

The pure model consumes each source coverage identity once. Current kept asset
ownership and native removal/restoration records resolve settled reassignments;
old contract labels remain unallocated coverage until their commercial scope is
clear. Missing asset numbers alone do not block an otherwise readable order.
Own-use, cancelled, relocation and follow-up rows are excluded. No quantities
come from counting asset numbers. Historical amounts are not forecast inputs.

The existing Costs-to-job-end section gains per-family disclosures, with a
per-reference delivery/pickup breakdown. Included transport is explicit. Held
rows have reasons; overlapping held scope is not totalled as missing Revenue.
cj764Model.revenue.transportToCome and pl770Model Transport job-end Revenue use
the same addition. Current Revenue, current branch tables, earned Finance,
Direct costs, native records and completion states are unchanged. No new editor
or native store is introduced. Thirty-four stale rate-card unit descriptions
are corrected to the original card's explicit each-way/ex-GST basis; numerical
rates and included/POA states are preserved.

Files
- building_transport831.js: pure model, current building adapter, shared coverage
  normaliser, existing-style family disclosures. All families enter one global
  coverage evaluation and one pure calculation; coverage is not spent twice.
- other_transport831.js: current equipment projection, exact reviewed source
  bindings, included transport and held scope. Supplier transport costs are not
  converted to customer Revenue. Existing recorded coverage keeps precedence.
- patch_v831.py: refuses anything except the exact reviewed v8.30 bytes and cannot
  run twice. The standard toolchain owns build, scrub, checks and publication.
- tests/test_building_transport831.cjs: synthetic pure coverage/arithmetic cases.
- tests/test_adapter831.cjs: synthetic projection, alias, exclusions and settled
  reassignment coverage, unknown HA/family and truckload cases.
- tests/test_other_adapter831.cjs: synthetic source, direction and target guards.
- tests/test_patch_v831.py: supplied-base financial/code/data boundary checks.

Checks so far: 37 pure cases, 26 shared adapter cases, 14 other-adapter cases and
18 static boundary checks pass. Private current-source projection and 15 source
guards reconcile. Independent review passed 15 compound/adversarial cases,
including new-contract branch holds, truckloads, source retarget and direction.
Browser, phone, print and required sweeps remain part of the final combined
candidate verification. Private originals, source cells, actual row amounts and
record snapshots are retained privately and are not in this release folder.

Run the Node tests directly. Run the Python test with the reviewed v8.30 hosted
HTML path as its argument. The patch requires GC500_V831_PRIVATE_SPEC and
GC500_V831_SPEC_SHA256; missing or changed private inputs fail before the output
is written. The bounded schema is source mapping and provenance only, inserted
as DATA.transport_forecast831. Every other DATA field is unchanged except the
34 exact metadata corrections. Private input paths/contents are not committed.
The root release owner controls the final scope,
standard build, checks, publication and shared board. No live changes made here.

Integrated into verified live v8.32 on4 Oct2026 at06:17AEST. This component was not uploaded separately. See ../v8.32_transport_banners_and_labels_LIVE/README.md for final candidate and checks.
