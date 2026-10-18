# Reviewed fencing activity evidence

Author: Andrew Fisher.

**DRAFT.** Four source-reviewed physical activities were still absent from the existing evidence catalogue. This patch appends those activities and their source identities to the native separate-activity presentation. It preserves the original shared records, labour, pricing, installation headline and the category correction already applied by later releases.

The original papers, source snapshots and exact reviewed bundle remain in authorised private storage. `GC500_FENCING_EVIDENCE_BUNDLE` supplies that bundle at build time. The patch requires its exact checksum, an exact match to the existing catalogue, unchanged existing sources/activities/plan allowances, and the final v10.70 boundary. It never reapplies the older category correction. Changed source files, records or overlaps remain subject to the native runtime review guards.

Validation prepared:

- `python3 -m unittest discover -s tests -p test_patch.py -v`: synthetic wrong-base/input/double-application and exact-byte preservation tests.
- `node tests/test_native_evidence.cjs <page> <private bundle> <private fixture>`: executes the actual native evidence guards on private read-only source snapshots, including changed record/source/overlap and future-date refusal.
- `GC500_FIXTURE=<private frozen GET directory> node tests/browser_parity.cjs <final v10.70> <candidate> <private bundle> <private result>`: full-page native record, finance, labour, headline/percentage and separate-activity comparison. Repeat with `MOB=1`.

The synthetic and extracted-native tests pass. Full native browser parity, both standard sweeps, phone visual inspection, current-source verification, guarded publication and exact live read-back remain pending. No live change has been made by this draft. Final build must start with the then-current live page using the shared toolchain.
