/* v7.77 — submission is not delivery. Author: Andrew Fisher. */
function sms777Number(value){
 const n = String(value == null ? '' : value).replace(/[^\d+]/g, '');
 if (/^04\d{8}$/.test(n)) return '+61' + n.slice(1);
 if (/^4\d{8}$/.test(n)) return '+61' + n;
 if (/^614\d{8}$/.test(n)) return '+' + n;
 return n;
}
function sms777Submission(body, requested){
 const list = Array.isArray(body.messages) ? body.messages : [];
 const refused = new Set(['FAILED','INVALID_RECIPIENT','INVALID_SENDER_ID','INSUFFICIENT_CREDIT',
  'ACCOUNT_NOT_ACTIVATED','EMPTY_MESSAGE','INVALID_MEDIA_FILE','INVALID_SCHEDULE','INVALID_CREDENTIALS',
  'MISSING_CREDENTIALS','MISSING_REQUIRED_FIELDS','COUNTRY_NOT_ENABLED','REGISTRATION_NEEDED',
  'SUBJECT_REQUIRED','TOO_MANY_RECIPIENTS','THROTTLED','FORBIDDEN','UNAUTHORIZED','BAD_REQUEST']);
 return [...new Set(requested.map(sms777Number))].map(to => {
  const entry = list.find(m => sms777Number(m.to) === to);
  const status = String(entry && entry.status || 'UNKNOWN').toUpperCase();
  const accepted = status === 'SUCCESS';
  const rejected = !accepted && !!entry && (entry.submission_status === 'rejected' ||
   (entry.submission_status !== 'unknown' && refused.has(status)));
  return {to, message_id: entry && entry.message_id || null,
   submission_status: status,
   delivery_status: accepted ? 'pending' : rejected ? 'failed' : 'unknown',
   accepted, rejected};
 });
}
function sms777Results(host, rows){
 host.innerHTML = rows.map(row => {
  const state = row.delivery_status;
  const words = state === 'delivered' ? 'Delivered — confirmed by the phone network'
   : row.rejected ? 'Not accepted by the messaging service'
   : state === 'failed' ? 'Not delivered — the messaging service or phone network reported a failure'
   : state === 'unsupported' ? (row.accepted ? 'Accepted — delivery tracking is unavailable for this message' : 'Delivery tracking is unavailable — check before sending again')
   : state === 'pending' ? (row.accepted ? 'Accepted — waiting for delivery confirmation' : 'Waiting for delivery confirmation — acceptance is unknown')
   : 'Delivery unknown — check before sending again';
  const detail = [row.error_code || row.status_code || (row.rejected ? row.submission_status : ''),
   row.provider_status, row.note].filter(value => value != null && value !== '').map(String).join(' · ');
  return '<div data-sm-recipient="' + esc(row.to) + '" style="padding:10px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere"><b>'
   + esc(row.to) + '</b><br>' + esc(words) + (detail ? '<br><small>' + esc(String(detail)) + '</small>' : '') + '</div>';
 }).join('');
}

async function smsDropBox(a){ /* v7.77 — truthful submission and delivery status */
 let ready = false, today = null, mms = null;
 try { const r = await fetch('/api/sms', {headers: {'x-gc500-token': tokenOf()}}); const j = await r.json();
 ready = !!j.configured && !SYNC.readonly; today = j.today || null; } catch (e) {}
 if (ready) { try { const r = await fetch('/api/mms', {headers: {'x-gc500-token': tokenOf()}}); if (r.ok) mms = await r.json(); } catch (e) { mms = null; } }
 const nt = navTargetFor(a), canPic = !!(nt && nt.ll && DATA.georef && (DATA.sheets || []).some(s => s.key === 'AERIAL' && typeof s.src === 'string'));
 const mmsOn = !!(ready && canPic && mms && mms.configured && !mms.from_needed);
 const text = dropSmsText(a);
 const d = document.createElement('div');
 d.className = 'drawer on'; d.style.zIndex = 31; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
 d.innerHTML = `<div class="dh"><div><h2>Text ${esc(a.key)}</h2>
 <div class="sub">${ready ? 'Goes from this service through ClickSend: what it is, the GPS, a Maps link and the way in' + (canPic ? ', and a picture of the map with the spot marked' : '') + '. The link opens the card with the pictures.'
 : 'Texting is not switched on here, so this copies the words for you to send yourself' + (canPic ? '; the picture can be saved from here.' : '.')}</div></div>
 <button class="close" aria-label="Close" title="Close">&times;</button></div>
 <div class="db">
 ${ready ? `<div class="f"><label for="smTo">Send to</label>
 <input id="smTo" type="tel" inputmode="tel" autocomplete="off" placeholder="04xx xxx xxx — separate numbers with commas"></div>` : ''}
 <div class="f"><label for="smTx">The message</label>
 <textarea id="smTx" rows="7" style="width:100%;font:inherit">${esc(text)}</textarea></div>
 <p class="hint" id="smCount"></p>
 ${canPic ? `<div class="f mms757"><label>The picture of where it goes</label>
 <div class="mms757-pic" id="smPicWrap"><span id="smPicWait">Drawing the picture of the map…</span><img id="smPicImg" alt="${esc('Where ' + a.key + ' goes, on the map')}" hidden></div>
 ${mmsOn ? `<label class="mms757-tick"><input type="checkbox" id="smPic" checked> <span>Send the picture too — as a picture message (MMS). It costs more than a text.</span></label>`
 : ready ? `<p class="hint">Picture messages are not switched on for this service${mms && mms.from_needed ? ' (it needs a sender name, SMS_FROM)' : mms ? '' : ' yet (server v5.85)'} — the words go as a text; the picture can be saved from here.</p>`
 : `<p class="hint">On a phone, press and hold the picture to save or share it.</p>`}
 <p class="hint" id="smPicInfo"></p></div>` : ''}
 <p class="hint" id="smMsg" role="status" aria-live="polite">${today ? esc(today.left + ' of today\'s ' + today.cap + ' left') : ''}</p>
 <div id="smResults" aria-live="polite"></div>
 <div class="df" style="padding:0">
 ${ready ? `<button class="btn ghost" id="smDry">Check it, send nothing</button>
 <button class="btn primary" id="smGo">Send</button>
 <button class="btn" id="smRefresh" type="button" hidden>Check delivery</button>
 <button class="btn ghost" id="smAgain" type="button" hidden>Prepare another message</button>` : ''}
 <button class="btn" id="smCopy">Copy the words</button>
 <button class="btn ghost" id="smLong" type="button">Full details</button>
 <a class="btn" id="smOpen" href="sms:?&body=${encodeURIComponent(text)}">Open a text message</a>
 </div>
 </div>`;
 mounted(document.body.appendChild(d));
 const close = () => d.remove();
 d.querySelector('.close').onclick = close;
 const msg = d.querySelector('#smMsg');
 text747Wire(d, a, ready); /* v7.48 */
 if (canPic) {
 const img = d.querySelector('#smPicImg'), wait = d.querySelector('#smPicWait'), info = d.querySelector('#smPicInfo');
 mms757Picture(a).then(pic => { d._pic = pic; img.src = pic.dataUrl; img.hidden = false; if (wait) wait.remove(); info.textContent = pic.words + ' · ' + pic.w + '×' + pic.h + ' · ' + Math.round(pic.bytes / 1000) + ' kB'; })
.catch(e => { d._picError = String(e && e.message || e); if (wait) wait.textContent = 'The picture could not be drawn: ' + d._picError; const tick = d.querySelector('#smPic'); if (tick) { tick.checked = false; tick.disabled = true; } });
 }
 d.querySelector('#smCopy').onclick = async () => {
 try { await navigator.clipboard.writeText(d.querySelector('#smTx').value); flash('Copied.'); }
 catch (e) { msg.textContent = 'Your browser would not let the page copy — select the words and copy them.'; }
 };
 if (ready) {
 let rows = [];
 const go = d.querySelector('#smGo'), dv = d.querySelector('#smDry');
 const results = d.querySelector('#smResults'), refresh = d.querySelector('#smRefresh'), again = d.querySelector('#smAgain');
 const buttons = () => {
  go.disabled = !!(d._sms777Busy || d._sms777Locked || d.querySelector('#smTx').value.length > TEXT747_SERVICE_MAX);
  go.style.opacity = go.disabled ? '0.45' : '';
  go.style.cursor = go.disabled ? 'not-allowed' : '';
  dv.disabled = !!d._sms777Busy;
  refresh.hidden = !rows.some(row => row.message_id);
  refresh.disabled = !!d._sms777Busy;
  again.hidden = !d._sms777Locked;
  again.disabled = !!d._sms777Busy;
 };
 const show = () => { sms777Results(results, rows); buttons(); };
 const reports = async () => {
  const ids = rows.filter(row => row.message_id).map(row => row.message_id);
  if (!ids.length || d._sms777Busy) return;
  d._sms777Busy = true; buttons(); msg.textContent = 'Checking delivery…';
  try {
   const r = await fetch('/api/sms/status?ids=' + encodeURIComponent(ids.join(',')), {headers: {'x-gc500-token': tokenOf()}, cache: 'no-store'});
   if (r.status === 404 || r.status === 501) { msg.textContent = 'Delivery tracking is not available yet. Acceptance does not confirm arrival; check before sending again.'; return; }
   const j = await r.json();
   if (!r.ok) { msg.textContent = 'Delivery could not be checked. The message has not been sent again.'; return; }
   const reports = Array.isArray(j.messages) ? j.messages : [];
   rows = rows.map(row => {
    const report = reports.find(report => report.message_id === row.message_id && (!report.to || sms777Number(report.to) === row.to));
    if (!row.message_id || !report || row.rejected) return row;
    const state = ['delivered','pending','failed','unknown','unsupported'].includes(report.delivery_status) ? report.delivery_status : 'unknown';
    return Object.assign({}, row, {delivery_status: state, status_code: report.status_code, error_code: report.error_code,
     provider_status: report.provider_status, note: report.note});
   });
   msg.textContent = rows.every(row => row.delivery_status === 'delivered') ? 'Delivery confirmed for every recipient.'
    : 'Delivery check complete. Each number has its own result below. No message was sent again.';
  } catch (e) { msg.textContent = 'The delivery check lost its connection. Delivery is not confirmed; no message was sent again.'; }
  finally { d._sms777Busy = false; show(); }
 };
 const run = async dry => {
  if (d._sms777Busy || (!dry && d._sms777Locked)) return;
  const to = d.querySelector('#smTo').value.split(/[,;\n]+/).map(x => x.replace(/\s+/g, '')).filter(Boolean);
  if (!to.length) { msg.textContent = 'Put a number in first.'; return; }
  const tick = d.querySelector('#smPic'), withPic = !!(mmsOn && tick && tick.checked);
  if (withPic && !d._pic) { msg.textContent = d._picError ? 'The picture could not be drawn — untick it to send the words alone.' : 'The picture is still being drawn — a moment.'; return; }
  if (d.querySelector('#smTx').value.length > TEXT747_SERVICE_MAX) { msg.textContent = 'Trim the message before sending.'; return; }
  d._sms777Busy = true; buttons(); msg.textContent = dry ? 'Checking — nothing will be sent…' : 'Submitting the message…';
  try {
   const body = withPic ? {to, text: d.querySelector('#smTx').value, subject: ('Coates GC500 ' + a.key).slice(0, 20), picture: d._pic.dataUrl, dry_run: !!dry}
    : {to, text: d.querySelector('#smTx').value, dry_run: !!dry};
   const r = await fetch(withPic ? '/api/mms' : '/api/sms', {method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-gc500-token': tokenOf(), 'x-gc500-who': (S.operator || '').trim() || 'unnamed'}, body: JSON.stringify(body)});
   const j = await r.json();
   if (dry) {
    msg.textContent = r.ok && j.dry_run ? 'The message passed the format check. Nothing was sent by this check. This does not test delivery to the phone.'
     : 'The check did not pass. Nothing was sent by this check. ' + (j.error || 'Check the number and message.');
    return;
   }
   rows = sms777Submission(j, to);
   const beforeSend = [400,401,403,413,429,501].includes(r.status) && !Array.isArray(j.messages);
   if (beforeSend) rows.forEach(row => { row.rejected = true; row.delivery_status = 'failed'; row.submission_status = 'NOT_SUBMITTED'; });
   d._sms777Locked = rows.some(row => !row.rejected);
   const accepted = rows.filter(row => row.accepted).length, rejected = rows.filter(row => row.rejected).length;
   msg.textContent = accepted ? accepted + ' of ' + rows.length + ' accepted by the messaging service. Delivery is not confirmed.'
    : rejected === rows.length ? 'The messaging service did not accept these messages. ' + (j.error || 'Check each result below.')
    : 'The send result is unknown. Check delivery before trying again; it may already have been accepted.';
   if (accepted && rejected) msg.textContent += ' ' + rejected + ' rejected; see each number below.';
  } catch (e) {
   if (dry) msg.textContent = 'The format check could not finish. Nothing was sent by this check.';
   else { rows = sms777Submission({}, to); d._sms777Locked = true; msg.textContent = 'The connection ended before the result arrived. The message may have been accepted. Check before sending again.'; }
  } finally { d._sms777Busy = false; show(); }
 };
 refresh.onclick = reports;
 again.onclick = () => {
  if (d._sms777Busy) return;
  const uncertain = rows.some(row => !row.rejected && row.delivery_status !== 'failed');
  if (!confirm(uncertain ? 'The earlier message may already have arrived or still arrive. Preparing another message can send a duplicate. Continue?' : 'Prepare another message? Nothing will be sent until you press Send.')) return;
  d._sms777Locked = false; rows = []; show(); msg.textContent = 'Check the number, message and picture option before pressing Send.';
 };
 d.querySelector('#smGo').onclick = () => run(false);
 d.querySelector('#smDry').onclick = () => run(true);
 d.querySelector('#smTx').addEventListener('input', buttons);
 d.querySelector('#smLong').addEventListener('click', buttons);
 d.querySelector('#smTo').focus(); buttons();
 }
}
