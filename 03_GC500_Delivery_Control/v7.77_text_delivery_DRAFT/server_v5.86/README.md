# Text submission and delivery status — server v5.86 DRAFT

Author: Andrew Fisher · 1 Oct 2026

**Not deployed. Both agents must finish review of the same candidate before activation.** This change corrects
false success and failure reporting and adds read-only delivery checks. It does not yet establish why a particular
phone did not receive a message, change the sender, resend messages, or claim confirmed handset delivery.

The existing provider `SUCCESS` response means accepted/queued. The page used to label it “Sent”, hide mixed
failures and call network uncertainty “Nothing was sent”. The server now returns explicit acceptance counts and
per-recipient states. The compatibility field `sent` remains the number accepted by the provider. Unsupported or
unrecognised results stay unknown; they must not trigger automatic retry.

`GET /api/sms/status?ids=id1,id2` requires edit authentication. It accepts at most 50 distinct IDs, all already
in this service's SMS/MMS log, and refuses the entire request before contacting the provider if an ID is unknown.
It makes only provider GET requests, never marks receipts read, never sends and never changes the local log.

- SMS: `GET /sms/receipts/{message_id}`; returned ID and message type must match.
- MMS: the current documented API has no specific MMS receipt route. `GET /mms/history` uses `date_from` and
  `date_to` around the known submission timestamps, ±60 seconds, `limit=100`, and at most five pages. Only exact
  own-log IDs with matching recipient and outbound direction are returned. An incomplete search is unknown.
- Code **201** confirms handset delivery; **200** remains pending; **300** is pending because the provider retries;
  **301** is failed. “Completed” or “SUCCESS” alone is not handset confirmation. Unfamiliar codes remain unknown.
- Missing reports stay pending; provider/auth/network/schema failures stay unknown; unsupported endpoints are
  labelled unsupported. No automatic resend.
- Responses expose only own message IDs, own recipients, kind, submission/delivery states, numeric status/error
  codes, a small known-status enum and the check time. Provider bodies, free-form errors, account fields, media URLs,
  usernames and credentials are not forwarded.

Submission handling also matches provider recipients by normalised phone number instead of array order, rejects
duplicate matches as unknown, restores the allowance for documented explicit rejections, and retains the allowance
for an uncertain attempt. Timeout responses contain the recipient list and unknown states. The startup banner and
health endpoint both say v5.86.

## Verified provider references

Read from ClickSend's official documentation on 1 Oct 2026:

- [View Specific SMS Receipt](https://developers.clicksend.com/docs/messaging/sms/other/view-specific-sms-receipt):
  `data` is one receipt with `message_id`, `status_code`, `error_code` and `message_type`; the example uses code
  `201` with “Success: Message received on handset.”
- [View MMS History](https://developers.clicksend.com/docs/messaging/mms/other/view-mms-history): `data.data` is a
  paginated list with `message_id`, `direction`, `to`, `status`, `status_code` and `error_code`. The documented date
  filters are Unix timestamps. The implementation uses constructed numeric page queries, never provider URLs.
- [SMS error codes](https://help.clicksend.com/article/8cc479qlbb-list-of-sms-gateway-error-codes), updated
  7 Aug 2026: 200 network/queue; 201 handset; 300 temporary and automatically retried; 301 failed/cancelled.
- [Application status codes](https://developers.clicksend.com/docs/#application-status-codes): exact `SUCCESS`
  and the explicit refusal codes used for the submission classification. Unfamiliar statuses stay unknown.

The older official Node SDK lists `/mms/receipts`, but the current MMS reference does not describe its response.
This draft deliberately uses the current documented history schema.

## Build and checks

`patch_server_v586.py` requires the byte-exact v5.85 base SHA256
`76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684`, applies counted replacements and refuses any
other base or repeat application. `delivery_status.js` is inserted into that server; it is not loaded at runtime.

From this directory:

```sh
node --check server.js
node test_delivery.js
node test_mms_legacy.js
```

The delivery suite has **45 local checks**: auth, own-log allowlist, malformed/over-limit IDs, exact provider
matching, confirmed/pending/failed/temporary states, unsupported/error/malformed reports, bounded MMS history,
privacy fields, mixed submissions, provider/network uncertainty, normalised recipient order and unchanged logs.
The original MMS suite passes **37/37** against this candidate, changing only its expected build label.
Both use a local fake provider, synthetic recipients and a throw-away data directory. No live sends or API writes.

Activation remains a separate server deployment with the existing rollback blob preserved. The page release must
handle an older server truthfully while the deployment changes over. Read-only checks of existing messages can
then establish the actual provider status; a mock test is not proof a real handset received a message.
