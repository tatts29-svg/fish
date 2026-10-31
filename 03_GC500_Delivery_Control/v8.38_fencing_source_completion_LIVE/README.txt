Author: Andrew Fisher
v8.38 — reviewed fencing source completion — VERIFIED LIVE

This guarded host patch extends existing reviewed-source associations and adds independently reviewed area anchors. Existing geometry, native records, financial calculations, purchase-order associations and source-review safeguards are preserved. The existing content-only map-to-register scroll handling remains intact.

Current original and plan checksums, exact record identity and reviewed field signatures gate each association. Source context without a safe map registration is shown only in the existing record Details, with a verified plan-page link and an explicit unmapped state. Source context creates no completion, measured length or financial allocation. Recognising an additional plan can expose its already-recorded programme rows; prior rows and the default source remain unchanged. PDF creation dates are qualified separately from issued revisions and work dates.

Private reviewed inputs and their SHA-256 bindings are required:
FENCE_REVIEW838_INPUT / FENCE_REVIEW838_INPUT_SHA256
FENCE_MAP838_INPUT / FENCE_MAP838_INPUT_SHA256

The build strips filesystem paths from new reviewed inputs. Existing catalogue metadata is preserved. The patch accepts only its exact predecessor and refuses repeat application. Dependency resolution supports the preserved LIVE source folders. No machine assets or server changes are currently required; the existing explorer consumes the parent-host catalogue and trace snapshot.

Checks:
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/source_context838.cjs
node tests/explorer_sources838.cjs

Current state: VERIFIED LIVE, 4 Oct 2026 14:20 AEST. Implementation 64f19550; public READY checkpoint 6441569d. Exact public host 400bb272d392322ad5a615fa23b83d724d38bc15811b0cde242377b0c5777929, 10,429,572 bytes. Final public desktop/phone coverage 154/154 passes with no HTML substitutions or operational write attempts; an initial desktop keyboard timeout and its non-reproducing repeat are documented in RELEASE_REVIEW.txt. All shared collections and complete machine inventory are unchanged; server remains healthy v5.87.
