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

## Frozen candidate and checks

Built on live v7.76, applying the jointly reviewed corrected v7.75 patch first, then this page patch:
**8,682,471 bytes**, SHA256 `577c69b20fbe1b89cb2e270755a5e19aadd836b074a69ff784bcb5870a29d87d`.
Server v5.86: **236,308 bytes**, SHA256 `f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9`.

- Five-script syntax/static/secret checks and uploader dry-run pass; no upload was made.
- `evidence/sms_browser.js`: **24/24 desktop and 24/24 phone**, messaging requests intercepted with synthetic
  recipients. Mixed outcomes, uncertain requests, duplicate prevention, receipt lookup and picture paths covered.
- Corrected v7.75 focus/empty-pane/editor-save checks: **11/11 desktop and 11/11 phone** on the combined page.
- Pure message-state checks: **10/10**, no browser or network.
- Both sweeps: **21 tabs, 7 deep links, zero page and console errors**. Phone screenshot inspected.
- Server provider-mock checks: **45/45**, plus **37/37** existing MMS checks. No real messages or record writes.
- Aggregate evidence: `evidence/final_verification.json`; private logs and screenshots stay outside this folder.

Codex's review and checks on these exact candidates are complete. Claude's final page/server review is pending.
The actual handset non-arrival remains unverified until an existing attempt's provider report can be read.
