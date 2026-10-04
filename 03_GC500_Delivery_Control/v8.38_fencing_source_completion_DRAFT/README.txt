Author: Andrew Fisher
v8.38 — reviewed fencing source completion — READY TO UPLOAD

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

Current state: READY TO UPLOAD from implementation 64f19550. Final candidate 400bb272d392322ad5a615fa23b83d724d38bc15811b0cde242377b0c5777929. Standard checks, 34 CPU tests, final integration checks and both navigation sweeps pass. Root reviewed the phone presentation. See RELEASE_REVIEW.txt; publication and public verification remain pending.
