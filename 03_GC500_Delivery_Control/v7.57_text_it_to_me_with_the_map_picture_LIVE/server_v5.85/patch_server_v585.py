#!/usr/bin/env python3
"""server v5.85 - MMS: a text with a picture of the map. Andrew, 1 Oct 2026: "I want a picture of the map of where it
goes ... enter in mobile number and it will text it to you, MMS, I don't mind the cost."

Applied to the v5.84 server (sha256 264363128c…), exact-once replacements, nothing else touched:
  - POST /api/mms  (edit link only): {to, text, subject, picture, dry_run}. The picture is a JPEG the page drew (a data
    URL or base64), at most 250 kB - ClickSend's wall for MMS media. It is kept under its SHA-256 in $DATA_DIR/mms and
    served to ClickSend at /p/<sha256>.jpg (no key: ClickSend has to fetch it; a 64-hex content hash is not guessable,
    and only what an editor sent is ever there). Sent through ClickSend /mms/send; counted against the same daily cap
    as texts (one a recipient), on the same log with kind 'mms', the price ClickSend gives back recorded.
  - GET /api/mms (edit): whether it is set up, today's allowance, the limits, the last pictures sent.
  - GET|HEAD /p/<sha256>.jpg (public): the picture, image/jpeg, cached a day; pictures older than 14 days are swept.
  - The service's own address for the picture link: PUBLIC_BASE if set, else the request's X-Forwarded-Host/Host.
  - /health build v5.85.
    python3 patch_server_v585.py <server.js>"""
import sys
p = sys.argv[1]
t = open(p, encoding='utf-8').read()
if "build: 'v5.85'" in t: sys.exit('v5.85 already applied')

def rep(text, old, new, what):
    if text.count(old) != 1: sys.exit(what + ': expected exactly one match, found ' + str(text.count(old)))
    return text.replace(old, new)

t = rep(t, "record_recovered: STARTUP_RECOVERY.length ? STARTUP_RECOVERY : null, build: 'v5.84' });",
           "record_recovered: STARTUP_RECOVERY.length ? STARTUP_RECOVERY : null, build: 'v5.85' });", 'health')

# the public picture route, beside /health (before any key is looked at)
t = rep(t, """    if (p === '/' ) return send(res, 200, page('GC500', '<p>This page opens from its link. If you have one, use it; if not, ask Andrew Fisher.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
""", """    if (p === '/' ) return send(res, 200, page('GC500', '<p>This page opens from its link. If you have one, use it; if not, ask Andrew Fisher.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });
    /* v5.85 - the picture an MMS carries, for ClickSend to fetch. No key: the name IS the picture's SHA-256. */
    if ((m = p.match(/^\\/p\\/([a-f0-9]{64})\\.jpg$/))) return serveMmsPicture(req, res, m[1]);
""", 'public picture route')
# 'let m;' is declared after the '/' line; the picture route uses it, so declare it before
t = rep(t, """    if (p === '/health') return send(res, diskFault ? 503 : 200,""", """    let m;
    if (p === '/health') return send(res, diskFault ? 503 : 200,""", 'let m up')
t = rep(t, """    let m;
    if ((m = p.match(/^\\/(v|e)\\/([A-Za-z0-9_-]+)\\/?$/))) {""", """    if ((m = p.match(/^\\/(v|e)\\/([A-Za-z0-9_-]+)\\/?$/))) {""", 'let m down')

# the api routes, beside /api/sms
t = rep(t, """      if (p === '/api/sms' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send texts' });
        return smsSend(req, res, String(req.headers['x-gc500-who'] || '').slice(0, 80) || null);
      }
""", """      if (p === '/api/sms' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send texts' });
        return smsSend(req, res, String(req.headers['x-gc500-who'] || '').slice(0, 80) || null);
      }
      /* v5.85 - a text with a picture of the map (MMS). The edit link only, as texting is. */
      if (p === '/api/mms' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send pictures' });
        return send(res, 200, mmsBrief(req));
      }
      if (p === '/api/mms' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not send pictures' });
        return mmsSend(req, res, String(req.headers['x-gc500-who'] || '').slice(0, 80) || null);
      }
""", 'api routes')

# the code, after smsSend
MMS = r"""
/* v5.85 - MMS: A TEXT WITH A PICTURE OF THE MAP. Andrew, 1 Oct 2026: "I want a picture of the map of where it goes
   ... enter in mobile number and it will text it to you, MMS, I don't mind the cost." The page draws the picture
   (the aerial with the master plan over it, the pin, the reference) and sends it here as a JPEG. ClickSend does not
   take the bytes: it takes a URL and fetches the picture itself, so the picture is kept here under its SHA-256 and
   served at /p/<sha256>.jpg with no key on it - the name is the hash of the bytes, 64 hex characters nobody can
   guess, and nothing is ever there but what an editor sent. Pictures are swept after MMS_KEEP_DAYS. ClickSend's
   own walls: the media file 250 kB, the body 1,500 characters (500 when not plain), the subject 20. Counted against
   the same daily cap as texts, one a recipient, on the same log with kind 'mms'. */
const MMS_DIR = path.join(DATA_DIR, 'mms');
fs.mkdirSync(MMS_DIR, { recursive: true });
const MMS_MAX_BYTES = 250 * 1000, MMS_MIN_BYTES = 1000, MMS_MAX_CHARS = 1500, MMS_MAX_CHARS_UCS2 = 500, MMS_SUBJECT_MAX = 20, MMS_KEEP_DAYS = 14;
const MMS_BODY_LIMIT = 700 * 1024;    // the JSON around a 250 kB picture in base64
const PUBLIC_BASE = String(process.env.PUBLIC_BASE || '').trim().replace(/\/+$/, '');
function publicBase(req) {
  if (PUBLIC_BASE) return PUBLIC_BASE;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || (host.startsWith('127.0.0.1') || host.startsWith('localhost') ? 'http' : 'https')).split(',')[0].trim();
  return /^[A-Za-z0-9.\-:]+$/.test(host) ? proto + '://' + host : null;
}
function mmsSweep() {
  try {
    const cut = Date.now() - MMS_KEEP_DAYS * 86400000;
    fs.readdirSync(MMS_DIR).forEach(n => { if (/^[a-f0-9]{64}\.jpg$/.test(n)) { const fp = path.join(MMS_DIR, n); try { if (fs.statSync(fp).mtimeMs < cut) fs.unlinkSync(fp); } catch (e) { /* gone already */ } } });
  } catch (e) { /* the folder is not there yet */ }
}
mmsSweep(); setInterval(mmsSweep, 6 * 3600 * 1000).unref();
function serveMmsPicture(req, res, sha) {
  if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'GET or HEAD required' }, { Allow: 'GET, HEAD' });
  const fp = path.join(MMS_DIR, sha + '.jpg');
  let size; try { size = fs.statSync(fp).size; } catch (e) { return send(res, 404, { error: 'no such picture' }); }
  const etag = '"' + sha.slice(0, 16) + '"';
  const headers = { 'Content-Type': 'image/jpeg', 'Content-Length': size, 'Cache-Control': 'public, max-age=86400', ETag: etag, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Disposition': 'inline; filename="gc500-map.jpg"' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, headers); if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(fp); stream.on('error', () => res.destroy()); stream.pipe(res);
}
function mmsBrief(req) {
  return { configured: smsReady(), from: SMS_FROM || null, from_needed: !SMS_FROM, today: smsToday(), at_once: SMS_AT_ONCE,
    max_bytes: MMS_MAX_BYTES, max_characters: MMS_MAX_CHARS, max_characters_not_plain: MMS_MAX_CHARS_UCS2, subject_max: MMS_SUBJECT_MAX,
    keep_days: MMS_KEEP_DAYS, public_base: publicBase(req),
    sent: (sms.log || []).filter(e => e.kind === 'mms').slice(-20).reverse() };
}
/* the picture as the page sends it: a data URL or bare base64, JPEG only, within ClickSend's wall */
function mmsPicture(raw) {
  let s = String(raw == null ? '' : raw).trim();
  if (!s) return { error: 'there is no picture' };
  const m = /^data:image\/jpeg;base64,(.*)$/is.exec(s);
  if (m) s = m[1]; else if (/^data:/i.test(s)) return { error: 'the picture must be a JPEG (image/jpeg)' };
  if (!/^[A-Za-z0-9+/=\s]+$/.test(s)) return { error: 'the picture did not read as base64' };
  const bytes = Buffer.from(s.replace(/\s+/g, ''), 'base64');
  if (bytes.length < MMS_MIN_BYTES) return { error: 'the picture is too small to be a picture (' + bytes.length + ' bytes)' };
  if (bytes.length > MMS_MAX_BYTES) return { error: 'the picture is ' + Math.round(bytes.length / 1000) + ' kB - ClickSend takes at most ' + (MMS_MAX_BYTES / 1000) + ' kB. Draw it smaller.' };
  if (!(bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF)) return { error: 'the picture is not a JPEG' };
  return { bytes, sha: sha256(bytes) };
}
async function mmsSend(req, res, who) {
  if (!smsReady()) return send(res, 501, { error: 'Texting is not set up on this server yet. CLICKSEND_USERNAME and CLICKSEND_API_KEY are the two Railway variables it needs.', configured: false });
  if (!SMS_FROM) return send(res, 501, { error: 'A picture message needs a sender: ClickSend requires "from" for MMS, and SMS_FROM is not set on this service.', configured: true, from_needed: true });
  let body;
  try { body = JSON.parse((await readBody(req, MMS_BODY_LIMIT)).toString('utf8')); }
  catch (e) { return send(res, e && e.message === 'too large' ? 413 : 400, { error: e && e.message === 'too large' ? 'that is too much to send - the picture must be under ' + (MMS_MAX_BYTES / 1000) + ' kB' : 'a JSON object is expected' }); }
  if (!body || typeof body !== 'object') return send(res, 400, { error: 'a JSON object is expected' });

  const text = String(body.text == null ? '' : body.text).trim();
  if (!text) return send(res, 400, { error: 'there is no message to send' });
  const shape = smsShape(text);
  const wall = shape.encoding === 'GSM-7' ? MMS_MAX_CHARS : MMS_MAX_CHARS_UCS2;
  if (text.length > wall) return send(res, 400, { error: 'that message is ' + text.length + ' characters - a picture message carries ' + wall + (shape.encoding === 'GSM-7' ? '' : ' when it is not in the plain alphabet') + '.' });
  let subject = String(body.subject == null ? 'Coates GC500' : body.subject).trim() || 'Coates GC500';
  if (subject.length > MMS_SUBJECT_MAX) subject = subject.slice(0, MMS_SUBJECT_MAX).trim();

  const pic = mmsPicture(body.picture);
  if (pic.error) return send(res, 400, { error: 'nothing was sent. ' + pic.error });

  const raw = Array.isArray(body.to) ? body.to : [body.to];
  if (!raw.length || raw.length > SMS_AT_ONCE) return send(res, 400, { error: 'between one and ' + SMS_AT_ONCE + ' numbers in one send' });
  const read = raw.map(smsNumber);
  const bad = read.filter(x => !x.ok);
  if (bad.length) return send(res, 400, { error: 'nothing was sent. ' + bad.length + ' of ' + read.length + ' numbers did not read:', numbers: bad });
  const to = [];
  read.forEach(x => { if (to.indexOf(x.e164) < 0) to.push(x.e164); });

  const base = publicBase(req);
  if (!base) return send(res, 500, { error: 'this service does not know its own address, so ClickSend could not be told where the picture is. Set PUBLIC_BASE on the service.' });
  const today = smsToday();
  if (to.length > today.left) return send(res, 429, { error: 'nothing was sent. That is ' + to.length + ' messages and ' + today.left + ' left of today\'s ' + SMS_CAP + '. The count starts again at midnight Queensland time.', today });

  /* the picture goes on the disk before anything is sent, under its hash; the same picture twice is one file */
  const fp = path.join(MMS_DIR, pic.sha + '.jpg');
  try { if (!fs.existsSync(fp)) atomicBytes(fp, pic.bytes); else fs.utimesSync(fp, new Date(), new Date()); }
  catch (e) { return send(res, 507, { error: 'the picture could not be kept on the disk: ' + (e && e.message) }); }
  const media = base + '/p/' + pic.sha + '.jpg';

  const at = new Date().toISOString();
  const plan = { to, text, subject, shape, from: SMS_FROM, messages: to.length, picture: { sha256: pic.sha, bytes: pic.bytes.length, url: media }, today };
  if (body.dry_run) return send(res, 200, Object.assign({ dry_run: true, sent: false }, plan));

  sms.sent[today.day] = (sms.sent[today.day] || 0) + to.length;
  Object.keys(sms.sent).forEach(d => { if (d < smsDay(Date.now() - 90 * 86400000)) delete sms.sent[d]; });
  persistSms();

  let out;
  try {
    out = await clicksend('/mms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_file: media, messages: to.map(n => ({ source: 'gc500', subject, body: text, to: n, from: SMS_FROM })) }),
    });
  } catch (e) {
    const why = e && e.name === 'AbortError' ? 'ClickSend did not answer within ' + (SMS_TIMEOUT / 1000) + ' seconds' : ('could not reach ClickSend: ' + (e && e.message));
    const entry = to.map(n => ({ at, to: n, text, by: who || null, kind: 'mms', picture: pic.sha, bytes: pic.bytes.length, parts: 1, encoding: shape.encoding, status: 'UNKNOWN', why }));
    sms.log = (sms.log || []).concat(entry).slice(-SMS_KEEP); persistSms();
    logWrite({ at, what: 'mms unknown', n: to.length, by: who || null, why });
    return send(res, 502, { error: why + '. These are counted against today and marked unknown - check ClickSend before sending them again.', today: smsToday(), to });
  }

  const results = smsResults(out.json);
  const byNumber = {};
  (results || []).forEach(r => { if (r.to) byNumber[String(r.to).replace(/[^\d+]/g, '')] = r; });
  const entries = to.map(n => {
    const r = byNumber[n] || (results && results.length === to.length ? results[to.indexOf(n)] : null);
    return { at, to: n, text, by: who || null, kind: 'mms', picture: pic.sha, bytes: pic.bytes.length, parts: 1, encoding: shape.encoding,
      status: r ? (r.status || 'UNKNOWN') : (out.status === 200 ? 'UNKNOWN' : 'FAILED'),
      message_id: r ? r.message_id : null, price: r ? r.price : null,
      why: results ? null : ('ClickSend answered ' + out.status + ' in a shape this does not recognise') };
  });
  sms.log = (sms.log || []).concat(entries).slice(-SMS_KEEP);
  const refused = entries.filter(e => String(e.status).toUpperCase() === 'FAILED').length;
  if (refused) sms.sent[today.day] = Math.max(0, (sms.sent[today.day] || 0) - refused);
  persistSms();
  logWrite({ at, what: 'mms', n: to.length, went: entries.filter(e => smsWent(e)).length, by: who || null, http: out.status, picture: pic.sha });

  const went = entries.filter(e => smsWent(e)).length;
  return send(res, out.status === 200 && went ? 200 : 502, {
    sent: went, of: to.length, messages: entries, picture: plan.picture, today: smsToday(),
    clicksend: { http: out.status, response_code: out.json && out.json.response_code, says: (out.json && out.json.response_msg) || out.text || null,
      total_price: out.json && out.json.data && out.json.data.total_price },
    error: went === to.length ? undefined
      : (went ? 'Some went and some did not - the list says which.'
              : 'Nothing went. ClickSend answered ' + out.status + (out.json && out.json.response_msg ? ': ' + out.json.response_msg : '') + '.'),
  });
}
"""
t = rep(t, """/* v5.84 — WRONG KEYS, COUNTED PER ADDRESS.""", MMS.lstrip('\n') + """
/* v5.84 — WRONG KEYS, COUNTED PER ADDRESS.""", 'mms code')
open(p, 'w', encoding='utf-8').write(t); print('ok', p)
