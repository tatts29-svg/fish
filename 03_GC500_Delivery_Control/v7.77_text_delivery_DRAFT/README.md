# Text delivery — draft, not ready for publication

Author: Andrew Fisher · 1 Oct 2026

Andrew reports that a text he sends does not arrive on his phone. The current page calls a provider submission
success "Sent" and closes the result. Provider acceptance does not prove delivery to a phone. The same screen
also hides per-recipient failures and incorrectly calls an uncertain network outcome "Nothing was sent".

The page patch keeps the result open, distinguishes each recipient's acceptance and delivery status, and offers
an explicit delivery check. It prevents accidental repeat submissions after an accepted or uncertain request;
preparing another message requires an explicit action. Dry-run checks describe format validation only.

Source: `sms777_src.js`, applied by `patch_v777.py`. The first UI review build applies to live v7.76. The final
release must include the jointly reviewed navigation correction if it has not already gone live.

Server work is being prepared under `server_v5.86/`: exact provider acceptance classification and an authenticated
delivery-report lookup for message IDs already in this service's own log. The UI handles an older service without
claiming delivery. Its initial review uses synthetic responses; this is not evidence that a real message arrived.

The provider-side cause of non-arrival remains under investigation. No real texts were sent by tests, and no
delivery is claimed without a matching receipt. Account details, actual numbers, message bodies and private
diagnostics do not belong in this public folder.

Publication waits until Claude and Codex have both completed review of the same final page and server candidate,
blocking findings are resolved, the handover is READY TO UPLOAD and the standard desktop/phone checks pass.

## Checks in progress

- The UI build passes the five-script syntax/static/secret checks.
- `evidence/sms_browser.js` intercepts messaging requests and uses synthetic recipients, including mixed outcomes,
  uncertain requests, duplicate prevention, receipt lookup and phone layout. Final results pending.
- Local server provider-mock checks are being added; no provider sends are permitted in tests.
- Full sweeps and final joint review are pending.
