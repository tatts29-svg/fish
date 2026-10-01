/* Author: Andrew Fisher. v5.86: provider acceptance and handset delivery are different facts.
   Official schemas and status meanings are linked in README.md. No provider response body is returned. */
const SMS_REJECTED = new Set(['FAILED', 'INVALID_RECIPIENT', 'INVALID_SENDER_ID', 'INSUFFICIENT_CREDIT',
  'ACCOUNT_NOT_ACTIVATED', 'EMPTY_MESSAGE', 'INVALID_MEDIA_FILE', 'INVALID_SCHEDULE', 'INVALID_CREDENTIALS',
  'MISSING_CREDENTIALS', 'MISSING_REQUIRED_FIELDS', 'COUNTRY_NOT_ENABLED', 'REGISTRATION_NEEDED',
  'SUBJECT_REQUIRED', 'TOO_MANY_RECIPIENTS', 'THROTTLED', 'FORBIDDEN', 'UNAUTHORIZED', 'BAD_REQUEST']);
function smsCode(value) {
  const s = String(value == null ? '' : value).trim().toUpperCase();
  return /^[A-Z][A-Z0-9_]{0,63}$/.test(s) ? s : null;
}
function smsSubmission(entry) {
  const code = smsCode(entry && entry.status);
  return code === 'SUCCESS' ? 'accepted' : SMS_REJECTED.has(code) ? 'rejected' : 'unknown';
}
function smsSubmissionMessage(entry) {
  const submission_status = smsSubmission(entry);
  const code = smsCode(entry.status);
  return Object.assign({}, entry, { status: code === 'SUCCESS' || SMS_REJECTED.has(code) ? code : 'UNKNOWN', submission_status,
    delivery_status: submission_status === 'accepted' ? 'pending' : submission_status === 'rejected' ? 'failed' : 'unknown' });
}
function smsSubmissionSummary(entries) {
  const messages = entries.map(smsSubmissionMessage);
  const accepted = messages.filter(e => e.submission_status === 'accepted').length;
  const rejected = messages.filter(e => e.submission_status === 'rejected').length;
  const unknown = messages.length - accepted - rejected;
  return { sent: accepted, accepted, rejected, unknown, of: messages.length, messages,
    error: unknown ? 'The provider has not confirmed every submission. Check delivery before sending again.'
      : rejected ? 'The provider rejected ' + rejected + ' message' + (rejected === 1 ? '' : 's') + '. See each recipient below.' : undefined };
}
function smsProviderSummary(out) {
  const amount = out.json && out.json.data && out.json.data.total_price;
  const code = smsCode(out.json && out.json.response_code);
  return { http: out.status, response_code: code === 'SUCCESS' || SMS_REJECTED.has(code) ? code : 'UNKNOWN',
    total_price: amount != null && /^\d+(?:\.\d+)?$/.test(String(amount)) ? amount : null };
}
function smsReceiptCode(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return /^\d{1,6}$/.test(s) ? Number(s) : null;
}
function smsReceiptState(row) {
  const code = smsReceiptCode(row && row.status_code), status = smsCode(row && row.status);
  // 300 is temporary: the provider retries. A generic Completed/SUCCESS is never proof of handset delivery.
  if (code === 201) return 'delivered';
  if (code === 301 || ['FAILED', 'CANCELLED', 'CANCELLEDAFTERREVIEW'].includes(status) && code !== 300) return 'failed';
  if (code === 200 || code === 300 || ['QUEUED', 'SCHEDULED', 'WAITAPPROVAL', 'SENT'].includes(status)) return 'pending';
  return 'unknown';
}
function smsReceiptPublic(entry, checked_at, row, delivery_status, note) {
  const out = { message_id: entry.message_id, to: entry.to, kind: entry.kind === 'mms' ? 'mms' : 'sms',
    submission_status: smsSubmission(entry), delivery_status: delivery_status || smsReceiptState(row), checked_at };
  if (row) {
    out.status_code = smsReceiptCode(row.status_code);
    out.error_code = smsReceiptCode(row.error_code);
    const status = smsCode(row.status);
    if (['COMPLETED', 'FAILED', 'CANCELLED', 'CANCELLEDAFTERREVIEW', 'QUEUED', 'SCHEDULED', 'WAITAPPROVAL', 'SENT'].includes(status)) out.provider_status = status;
  }
  if (note) out.note = note;
  return out;
}
async function smsStatus(req, res, url) {
  const raw = String(url.searchParams.get('ids') || '');
  const ids = [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))];
  if (!ids.length || ids.length > SMS_AT_ONCE || ids.some(id => !/^[A-Za-z0-9_-]{1,128}$/.test(id)))
    return send(res, 400, { error: 'Choose between one and ' + SMS_AT_ONCE + ' recorded message IDs.' });
  const log = new Map((sms.log || []).filter(e => e.message_id).map(e => [String(e.message_id), e]));
  // Reject the whole request before any provider call. This is not an account-wide message lookup.
  if (ids.some(id => !log.has(id))) return send(res, 404, { error: 'A message ID is not in this service\'s texting log.' });
  if (!smsReady()) return send(res, 501, { configured: false, error: 'Texting is not configured on this service.' });
  const checked_at = new Date().toISOString(), entries = ids.map(id => log.get(id)), answers = new Map();
  const smsEntries = entries.filter(e => e.kind !== 'mms');
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, smsEntries.length) }, async () => {
    while (next < smsEntries.length) {
      const entry = smsEntries[next++];
      try {
        const out = await clicksend('/sms/receipts/' + encodeURIComponent(entry.message_id), {});
        const row = out.json && out.json.data;
        let result;
        if (out.status === 404) result = smsReceiptPublic(entry, checked_at, null, 'pending', 'No receipt is available yet.');
        else if (out.status === 405 || out.status === 501) result = smsReceiptPublic(entry, checked_at, null, 'unsupported', 'The provider does not support this delivery check.');
        else if (out.status === 200 && smsCode(out.json && out.json.response_code) === 'SUCCESS'
          && row && !Array.isArray(row) && String(row.message_id) === String(entry.message_id)
          && (!row.message_type || String(row.message_type).toLowerCase() === 'sms'))
          result = smsReceiptPublic(entry, checked_at, row);
        else result = smsReceiptPublic(entry, checked_at, null, 'unknown', 'The provider did not return a matching delivery receipt.');
        answers.set(String(entry.message_id), result);
      } catch (e) { answers.set(String(entry.message_id), smsReceiptPublic(entry, checked_at, null, 'unknown', 'The delivery check could not be completed. Do not resend automatically.')); }
    }
  }));
  const mmsEntries = entries.filter(e => e.kind === 'mms');
  if (mmsEntries.length) {
    // Current MMS documentation has history but no per-message receipt endpoint. Read a bounded dated window,
    // match exact own-log IDs and recipients, and expose only the safe status fields above.
    const dates = mmsEntries.map(e => Date.parse(e.at));
    let unsupported = false, incomplete = false, failed = false;
    if (dates.some(t => !Number.isFinite(t))) failed = true;
    else {
      const from = Math.floor(Math.min(...dates) / 1000) - 60, to = Math.ceil(Math.max(...dates) / 1000) + 60;
      const wanted = new Map(mmsEntries.map(e => [String(e.message_id), e]));
      for (let page = 1; page <= 5 && wanted.size; page++) {
        try {
          const out = await clicksend('/mms/history?date_from=' + from + '&date_to=' + to + '&page=' + page + '&limit=100', {});
          if ([404, 405, 501].includes(out.status)) { unsupported = true; break; }
          const data = out.json && out.json.data;
          if (out.status !== 200 || smsCode(out.json && out.json.response_code) !== 'SUCCESS' || !data || !Array.isArray(data.data)) { failed = true; break; }
          for (const row of data.data) {
            const entry = row && wanted.get(String(row.message_id));
            if (!entry || row.direction !== 'out') continue;
            const recipient = smsNumber(row.to);
            if (!recipient.ok || recipient.e164 !== entry.to) continue;
            answers.set(String(entry.message_id), smsReceiptPublic(entry, checked_at, row));
            wanted.delete(String(entry.message_id));
          }
          const last = Number(data.last_page);
          if (Number.isInteger(last) && last >= 1 && page >= last || data.data.length < 100) break;
          if (page === 5) incomplete = true;
        } catch (e) { failed = true; break; }
      }
    }
    for (const entry of mmsEntries) if (!answers.has(String(entry.message_id))) {
      const state = unsupported ? 'unsupported' : failed || incomplete ? 'unknown' : 'pending';
      const note = unsupported ? 'The provider does not support this MMS delivery check.'
        : failed || incomplete ? 'The delivery check was incomplete. Do not resend automatically.' : 'No matching delivery report is available yet.';
      answers.set(String(entry.message_id), smsReceiptPublic(entry, checked_at, null, state, note));
    }
  }
  return send(res, 200, { messages: ids.map(id => answers.get(id)), checked_at });
}
