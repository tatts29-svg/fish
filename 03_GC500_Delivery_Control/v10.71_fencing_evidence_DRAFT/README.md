# Reviewed fencing activity evidence

Author: Andrew Fisher.

**DRAFT.** Four source-reviewed physical activities were still absent from the existing evidence catalogue. This patch appends those activities and their source identities to the native separate-activity presentation. It preserves the original shared records, labour, pricing, installation headline and the category correction already applied by later releases.

The original papers, source snapshots and exact reviewed bundle remain in authorised private storage. `GC500_FENCING_EVIDENCE_BUNDLE` supplies that bundle at build time. The patch requires its exact checksum, an exact match to the existing catalogue, unchanged existing sources/activities/plan allowances, and the final v10.70 boundary. It never reapplies the older category correction. Changed source files, records or overlaps remain subject to the native runtime review guards.

Validation prepared:

- `python3 -m unittest discover -s tests -p test_patch.py -v`: synthetic wrong-base/input/double-application and exact-byte preservation tests.
- `node tests/test_native_evidence.cjs <page> <private bundle> <private fixture>`: executes the actual native evidence guards on private read-only source snapshots, including changed record/source/overlap and future-date refusal.
- `GC500_FIXTURE=<private frozen GET directory> node tests/browser_parity.cjs <final v10.70> <candidate> <private bundle> <private result>`: full-page native record, finance, labour, headline/percentage and separate-activity comparison. Repeat with `MOB=1`.

The synthetic and extracted-native tests pass. Native browser parity and visual inspection pass on desktop and phone for the exact private chain hashes below. Both standard release sweeps, current-source verification, guarded publication and exact live read-back remain parent release gates. No live change has been made by this draft. Final build must start with the then-current live page using the shared toolchain.

Private sequential build prepared on 18 Oct 2026:

- Predecessor v10.70 SHA-256: `2c3d560843a1efbc6c24f332e46492ddafebd81bf1203356eba0cfa82b95aea6`.
- Candidate v10.71 SHA-256: `1d43cde32a478389d3ad1dedd280606fe4ed57ceab1e045de122b22c5de627bc`, 18,506,324 bytes.
- Canonical attribution scrub and static checks pass: 143 inline scripts; no new credentials.
- Four synthetic guard tests and seven actual native evidence checks pass on this candidate.
- Replacing only the catalogue, footer and review marker back to their predecessor bytes restores the entire predecessor exactly. Canonical rebuild reproduces the candidate byte for byte; wrong-version, missing-catalogue and repeated application are refused.

Native browser validation completed on 18 Oct 2026:

- Desktop 1440 × 900: 16/16 checks pass. Phone 390 × 844 at device scale factor 2: 16/16 pass.
- Both pages completely hydrated the same frozen shared record. All shared records, embedded source data, Costs, Revenue, supplier estimates, labour, ledger, forecast and monthly models are unchanged.
- Assets, programme, loads, daily models, demob and equipment readings are unchanged. The installed-fence headline, remaining amount and percentages are unchanged under the existing v10.47 rules.
- Exactly the reviewed activities enter their native separate rows. The relocation row's own recorded and remaining work changes by the reviewed movement; scrim activity receives no programme denominator or percentage. Existing source decisions and pending issues remain intact.
- All four added native source cards load their original thumbnails. Dialogs fit both viewports; private activity, source-card and relocation screenshots were inspected. There were zero runtime errors, console errors, missing frozen endpoints or operational writes.
- Tests use frozen API data with genuine original media GETs and the standard successful-response cache. No media overrides, placeholders or failed-response substitutions were used. Sanitized results are in `tests/evidence_browser.json`; exact models, source details and screenshots remain private.

The initial comparison assertions were corrected to preserve the current installed-headline rules and to allow the reviewed movement to reduce its own detail-row remainder. Those were test assumptions, not production changes. The final complete runs above passed after those corrections.

This is a private draft chain build, not a build from a newly published predecessor and not a READY or LIVE claim. A later release-envelope-only change must keep its own exact byte-equivalence evidence rather than silently relabelling these tested hashes.
