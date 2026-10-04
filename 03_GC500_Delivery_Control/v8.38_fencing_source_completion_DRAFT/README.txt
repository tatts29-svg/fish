Author: Andrew Fisher
v8.38 — reviewed fencing source completion — DRAFT

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

Current state: implementation is frozen after the standard build and passing synthetic checks. Affected browser, financial and native-state verification remains required before readiness. This folder is not a publication instruction.
