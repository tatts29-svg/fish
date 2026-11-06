#!/usr/bin/env node
/* Author: Andrew Fisher. GC500 servicing tracker: a LOCAL, IN-MEMORY stand-in for the service, built to the API
   contract of 18 Oct 2026, so the crew card can be developed and tested without the real server. It is not the
   server release and never talks to the live service. It listens on 127.0.0.1 only, with made-up tokens.

     node mock_server.js [--port 8787]        then make a card:  node mock_server.js --demo   (prints the links)

   The drop card is served with the EXACT card Content-Security-Policy read out of the live server.js (v5.87), so a
   card that works here works under the real policy.
   Contract points (all in memory, append-only):
     POST /api/cards (edit)            card body + tracker {days, lines, plans}; 400 bad tracker; 409 tracker dropped on a
                                       re-post; 409 + existing token for a second live tracker of the same load. Answer
                                       carries tracker.links {REF: sig}, sig = base64url(HMAC-SHA256(secret, token:REF))[:16].
                                       The secret (32 random bytes) never leaves this process.
     DELETE /api/cards/<t> (edit)      withdraw.
     GET  /d/<t>                       the card, under the card CSP. Unknown 404 (counted), expired 410.
     GET  /d/<t>/ticks?since=<seq>     {now, epoch, seq, days, ticks}. Writes nothing, counts no open.
     POST /d/<t>/ticks                 {ticks:[1..20]} -> {saved:[{id, seq, at, already}], now, epoch}.
     GET  /api/ticks?token= (edit)     the live v5.89 answer: {now, epoch, service_day, token, load, title, expires, expired,
                                       card_withdrawn, updated, tracker, links, key_kept, seq, ticks (voided ones marked
                                       voided:true), voids [{vid, ids, at}]}; no token: {now, service_day, trackers:[...]};
                                       unknown token 404 no_tracker.
     POST /api/ticks/void (edit)       {token, ids}: appends a void event, never deletes; the epoch changes so phones re-read.
                                       Answers {voided:[ids], already:[ids], epoch}; an id that is not a tick: 400 unknown_ids.
   The edit-link answers and codes are the live server's (aligned 18 Oct 2026 after the end-to-end run on the real v5.89,
   ../integration/): tracker block {links, refs, lines, days, key_new}; 400 bad_tracker; 409 tracker_exists (+ token);
   409 tracker_required; DELETE {withdrawn: token}. Page v10.63 reads these, so they must match what is live.
     POST /d/<t>/report(/scoped)       404 on a tracker card, not counted.
   Unknown /d/<t> answers JSON 404 {code:'withdrawn'} (counted); a card with no tracker JSON 404 {code:'no_tracker'}
   (not counted). Test controls under /__mock/ only when control is on (the default for --port runs is off). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const SERVER_JS = process.env.SERVER_JS || path.join(__dirname, '..', '..', 'server_v5.89_servicing_tracker_DRAFT', 'server.js');
const TASK_WORD = /^[a-z][a-z0-9_]{0,23}$/;   /* the live service's TRACK_WORD_RE (v5.91) for kinds, plans and tasks: pan16, lockup, refill */
const CARD_TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const H = 3600000;

/* the card policy, read from server.js so it is the live one word for word */
function cardCspFromServer(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/const csp = "([^"]*)"\s*\+\s*"script-src '" \+ cardScriptHash\(c\.html\) \+ "'([^"]*)"\s*\+\s*"([^"]*)";/);
  if (!m) throw new Error('could not find the card Content-Security-Policy in ' + file);
  return hash => m[1] + "script-src '" + hash + "'" + m[2] + m[3];
}
function cardScriptHash(html) {     /* server.js v5.87, word for word */
  const m = String(html || '').match(/<script>([\s\S]*?)<\/script>/);
  if (!m) return 'none';
  return 'sha256-' + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
}
const qldDay = at => new Date(at + 10 * H).toISOString().slice(0, 10);
const svcDay = at => new Date(at + 2 * H).toISOString().slice(0, 10);       /* Brisbane date of (time - 8 h) */
const sigFor = (secret, token, ref) => crypto.createHmac('sha256', secret).update(token + ':' + ref).digest('base64url').slice(0, 16);
const sameStr = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const plain = o => o && typeof o === 'object' && !Array.isArray(o);

function validTracker(t) {
  if (!plain(t)) return 'tracker must be an object';
  if (!plain(t.plans)) return 'tracker.plans is needed';
  const kinds = Object.keys(t.plans);
  if (!kinds.length || kinds.length > 10) return 'tracker.plans needs 1 to 10 kinds';
  for (const k of kinds) {
    if (!TASK_WORD.test(k) || !plain(t.plans[k])) return 'bad plan kind';
    for (const p of Object.keys(t.plans[k])) {
      if (!TASK_WORD.test(p)) return 'bad plan name';
      const tasks = t.plans[k][p];
      if (!Array.isArray(tasks) || !tasks.length || tasks.some(x => !TASK_WORD.test(String(x)))) return 'bad tasks in plan ' + k + '.' + p;
    }
  }
  if (!Array.isArray(t.days) || !t.days.length || t.days.length > 10) return 'tracker.days needs 1 to 10 days';
  const dayIds = new Set();
  for (const d of t.days) {
    if (!plain(d) || !DAY_RE.test(String(d.id)) || typeof d.plan !== 'string') return 'bad day';
    if (dayIds.has(d.id)) return 'day twice'; dayIds.add(d.id);
    for (const k of kinds) if (!Array.isArray(t.plans[k][d.plan])) return 'no ' + d.plan + ' plan for ' + k;
  }
  if (!Array.isArray(t.lines) || !t.lines.length || t.lines.length > 500) return 'tracker.lines needs 1 to 500 lines';
  const ids = new Set();
  for (const l of t.lines) {
    if (!plain(l) || !/^[A-Za-z0-9-]{1,40}$/.test(String(l.id)) || !/^[A-Z0-9]{1,16}$/.test(String(l.ref))) return 'bad line';
    if (['__proto__', 'constructor', 'prototype'].indexOf(l.id) >= 0) return 'bad line id';
    if (kinds.indexOf(l.kind) < 0 || !Number.isInteger(l.qty) || l.qty < 1 || l.qty > 500) return 'bad line ' + l.id;
    if (ids.has(l.id)) return 'line twice'; ids.add(l.id);
  }
  return null;
}

function createMock(opts) {
  const o = Object.assign({
    editToken: 'mock-edit-token-not-real-0001', viewToken: 'mock-view-token-not-real-0001',
    host: '127.0.0.1', port: 0, control: false, serverJs: SERVER_JS,
    perAddrPerMin: 120, perTokenPerHour: 3000, perJobCap: 20, pageSize: 500, bodyMax: 2048, retryAfter: 0,
  }, opts || {});
  const csp = cardCspFromServer(o.serverJs);
  let clockOffset = 0;
  const now = () => Date.now() + clockOffset;
  const cards = new Map();          /* token -> card (secret kept here, never sent) */
  const stores = new Map();         /* token -> {events: [], byId, seq, epoch, voided:Set, jobs:Map} */
  const misses = new Map(), addrHits = new Map(), tokenHits = new Map();
  const log = [];                   /* what a test can read back: one line per request */
  const mode = { html404: false, fail500: 0, abortNextPost: 0, noKey: false };

  const newEpoch = () => crypto.randomBytes(6).toString('base64url');
  const storeFor = token => {
    if (!stores.has(token)) stores.set(token, { events: [], byId: new Map(), seq: 0, epoch: newEpoch(), voided: new Set(), jobs: new Map() });
    return stores.get(token);
  };
  const linksFor = c => { const out = {}; [...new Set(c.tracker.lines.map(l => l.ref))].forEach(r => { out[r] = sigFor(c.secret, c.token, r); }); return out; };
  const brief = c => ({ token: c.token, load: c.load, title: c.title, run_date: c.run_date, expires: c.expires, contact: c.contact,
    created: c.created, updated: c.updated, tracker: !!c.tracker, bytes: c.html.length, opens: c.opens });
  const expired = c => !!(c.expires && qldDay(now()) > c.expires);
  const addrOf = req => String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');

  function send(res, status, body, headers) {
    const isStr = typeof body === 'string';
    res.writeHead(status, Object.assign({ 'Content-Type': isStr ? 'text/html; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store' }, headers || {}));
    res.end(isStr ? body : JSON.stringify(body));
  }
  const page = (title, p) => '<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>' + title + '</title></head><body><h1>' + title + '</h1>' + p + '</body></html>';
  function wrongKey(req, res, status, body, headers) {
    const a = addrOf(req), t = now(), list = (misses.get(a) || []).filter(x => t - x < 5 * 60000);
    list.push(t); misses.set(a, list);
    return send(res, status, body, headers);
  }
  const limited = req => { const a = addrOf(req), t = now(); return (misses.get(a) || []).filter(x => t - x < 5 * 60000).length >= 30; };
  function rate(map, key, windowMs, max) {
    const t = now(), list = (map.get(key) || []).filter(x => t - x < windowMs);
    if (list.length >= max) { map.set(key, list); return o.retryAfter || Math.max(1, Math.ceil((windowMs - (t - list[0])) / 1000)); }
    list.push(t); map.set(key, list); return 0;
  }
  function readBody(req, max) {
    return new Promise((resolve, reject) => {
      const chunks = []; let n = 0, over = false;
      req.on('data', c => { if (over) return; n += c.length; if (n > max) { over = true; return; } chunks.push(c); });
      req.on('end', () => over ? reject(Object.assign(new Error('too big'), { tooBig: true })) : resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }
  const pub = e => ({ id: e.id, seq: e.seq, ref: e.ref, line: e.line, task: e.task, day: e.day, done: e.done, undoes: e.undoes, at: e.at, tapped_at: e.tapped_at });

  function editLevel(req, url) {
    const t = req.headers['x-gc500-token'] || url.searchParams.get('t');
    if (t && sameStr(t, o.editToken)) return 'edit';
    if (t && sameStr(t, o.viewToken)) return 'view';
    return t ? 'wrong' : null;
  }

  async function postTicks(req, res, token, c) {
    const a = addrOf(req);
    let wait = rate(addrHits, a, 60000, o.perAddrPerMin) || rate(tokenHits, token, H, o.perTokenPerHour);
    if (wait) return send(res, 429, { error: 'too many ticks at once from here — they are kept on the phone and go again shortly', code: 'rate' }, { 'Retry-After': String(wait) });
    const declared = parseInt(req.headers['content-length'] || '0', 10);
    if (Number.isFinite(declared) && declared > o.bodyMax) return send(res, 413, { error: 'a tick post is 2 KB at most', code: 'size' });
    let body;
    try { body = JSON.parse(await readBody(req, o.bodyMax)); }
    catch (e) { return e.tooBig ? send(res, 413, { error: 'a tick post is 2 KB at most', code: 'size' }) : send(res, 400, { error: 'a JSON object is expected', code: 'json' }); }
    if (!plain(body) || !Array.isArray(body.ticks) || body.ticks.length < 1 || body.ticks.length > 20) return send(res, 400, { error: 'ticks: 1 to 20 are expected', code: 'shape' });
    const st = storeFor(token), tr = c.tracker, nowMs = now(), cur = svcDay(nowMs);
    const lineById = new Map(tr.lines.map(l => [l.id, l]));
    const dayById = new Map(tr.days.map(d => [d.id, d]));
    const refs = new Set(tr.lines.map(l => l.ref));
    const fresh = [], answers = [], batchIds = new Map(), batchJobs = new Map();
    for (let i = 0; i < body.ticks.length; i++) {
      const t = body.ticks[i];
      const named = (status, code, msg) => send(res, status, { error: msg, code, index: i, id: t && typeof t.id === 'string' ? t.id.slice(0, 64) : null });
      if (!plain(t)) return named(400, 'bad_tick', 'a tick is an object');
      const bad = (msg, code) => named(400, code || 'bad_tick', msg);
      if (typeof t.id !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(t.id)) return bad('a tick id is 16 to 64 letters, digits, - or _', 'bad_id');
      if (typeof t.ref !== 'string' || !/^[A-Z0-9]{1,16}$/.test(t.ref) || typeof t.sig !== 'string' || !sameStr(t.sig, sigFor(c.secret, token, t.ref))) return named(403, 'bad_sig', 'this QR code is not the one printed for ' + t.ref);
      if (!refs.has(t.ref)) return bad('that reference is not on this tracker', 'line');
      const line = lineById.get(t.line);
      if (!line || line.ref !== t.ref) return bad('that line is not part of ' + t.ref, 'line');
      const day = dayById.get(t.day);
      if (!day) return bad('that day is not a service day', 'day');
      if (t.day > cur) return bad(t.day + ' has not started yet', 'future_day');
      const allowed = tr.plans[line.kind][day.plan] || [];
      if (allowed.indexOf(t.task) < 0) return bad('that job is not on ' + t.day + ' for this line', 'task');
      if (typeof t.done !== 'boolean') return bad('done is true or false');
      const undoes = t.undoes == null ? [] : t.undoes;
      if (!Array.isArray(undoes) || undoes.length > 20 || undoes.some(x => typeof x !== 'string')) return bad('undoes is a list of tick ids');
      if (t.done && undoes.length) return bad('a tick cannot undo');
      if (!t.done) {
        if (!undoes.length) return bad('an untick names the ticks it cancels');
        for (const u of undoes) {
          const tg = st.byId.get(u) || batchIds.get(u);
          if (!tg || tg.done !== true || tg.ref !== t.ref || tg.line !== t.line || tg.task !== t.task || tg.day !== t.day) return bad('an untick can only cancel a tick of the same job');
        }
      }
      if (t.tapped_at != null && typeof t.tapped_at !== 'string') return bad('tapped_at is a time');
      const content = JSON.stringify([t.ref, t.line, t.task, t.day, t.done, undoes, t.tapped_at == null ? null : t.tapped_at]);
      const prior = st.byId.get(t.id) || (batchIds.get(t.id) && batchIds.get(t.id).content && { content: batchIds.get(t.id).content });
      if (prior) {
        if (prior.content !== content) return named(409, 'id_reused', 'a different tick already has that number');
        if (st.byId.get(t.id)) { answers.push({ t, already: st.byId.get(t.id) }); continue; }
        continue;
      }
      const jk = t.line + '|' + t.task + '|' + t.day;
      const jn = (st.jobs.get(jk) || 0) + (batchJobs.get(jk) || 0);
      if (jn >= o.perJobCap) return bad('that job has been ticked and unticked too many times — ring the project manager', 'job_cap');
      batchJobs.set(jk, (batchJobs.get(jk) || 0) + 1);
      const tap = Date.parse(t.tapped_at);
      const tapped = Number.isFinite(tap) && tap <= nowMs + 5 * 60000 && tap >= nowMs - 48 * H ? new Date(tap).toISOString() : null;
      const ev = { type: 'tick', id: t.id, ref: t.ref, line: t.line, task: t.task, day: t.day, done: t.done, undoes, tapped_at: tapped, content };
      batchIds.set(t.id, ev); fresh.push(ev); answers.push({ t, ev });
    }
    if (mode.fail500 > 0) { mode.fail500--; return send(res, 500, { error: 'pretend failure' }); }
    if (mode.noKey) return send(res, 503, { error: 'this tracker has lost its key on the service', code: 'no_key' });
    const at = new Date(nowMs).toISOString();
    for (const ev of fresh) {
      ev.seq = ++st.seq; ev.at = at;
      st.events.push(ev); st.byId.set(ev.id, ev);
      const jk = ev.line + '|' + ev.task + '|' + ev.day; st.jobs.set(jk, (st.jobs.get(jk) || 0) + 1);
    }
    const saved = answers.map(x => x.ev ? { id: x.ev.id, seq: x.ev.seq, at: x.ev.at, already: false }
      : Object.assign({ id: x.already.id, seq: x.already.seq, at: x.already.at, already: true }, st.voided.has(x.already.id) ? { voided: true } : {}));
    log.push({ at, what: 'ticks', token, n: fresh.length, already: saved.filter(s => s.already).length });
    if (mode.abortNextPost > 0) { mode.abortNextPost--; req.socket.destroy(); return; }
    return send(res, 200, { saved, now: at, epoch: st.epoch });
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = url.pathname; let m;
    log.push({ at: new Date(now()).toISOString(), method: req.method, path: p, addr: addrOf(req) });
    if (p === '/health') return send(res, 200, { ok: true, build: 'mock servicing tracker (local only)', now: new Date(now()).toISOString(), cards: cards.size });

    if (o.control && p.startsWith('/__mock/') && req.method === 'POST') {
      let b = {}; try { b = JSON.parse(await readBody(req, 65536) || '{}'); } catch (e) {}
      if (p === '/__mock/clock') { api.setNow(b.now); return send(res, 200, { now: new Date(now()).toISOString() }); }
      if (p === '/__mock/mode') { Object.assign(mode, b); return send(res, 200, mode); }
      if (p === '/__mock/recover') { return send(res, 200, api.recover(b.token, b.drop || 0)); }
      if (p === '/__mock/limits') { ['perAddrPerMin', 'perTokenPerHour', 'perJobCap', 'pageSize', 'retryAfter'].forEach(k => { if (b[k] != null) o[k] = b[k]; }); addrHits.clear(); tokenHits.clear(); return send(res, 200, { ok: true }); }
      return send(res, 404, { error: 'no such control' });
    }

    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/sw\.js$/)) && req.method === 'GET') {
      const c = cards.get(m[1]);
      if (!c || !c.tracker) return send(res, 404, { code: 'withdrawn' });
      if (expired(c)) return send(res, 410, { code: 'expired' });
      return send(res, 200, fs.readFileSync(path.join(__dirname, 'tracker_sw.js'), 'utf8'), {
        'Content-Type': 'text/javascript; charset=utf-8', 'Service-Worker-Allowed': '/d/' + m[1],
        'Content-Security-Policy': "default-src 'none'; connect-src 'self'; script-src 'self'", 'X-Content-Type-Options': 'nosniff'
      });
    }
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/report(\/scoped)?\/?$/))) {
      const has = cards.has(m[1]), c = has ? cards.get(m[1]) : null;
      if (c && c.tracker) return send(res, 404, { error: 'a servicing tracker takes no reports', code: 'no_reports' });
      return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });
    }
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/ticks\/?$/))) {
      if (mode.html404) return send(res, 404, page('Not found', '<p>Nothing here.</p>'));
      if (limited(req)) return send(res, 429, { error: 'too many wrong links from here', code: 'limit' }, { 'Retry-After': '300' });
      const token = m[1], c = CARD_TOKEN_RE.test(token) && cards.has(token) ? cards.get(token) : null;
      if (!c) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn', code: 'withdrawn' });
      if (expired(c)) return send(res, 410, { error: 'this tracker stopped working after ' + c.expires, code: 'expired' });
      if (!c.tracker) return send(res, 404, { error: 'this card has no tracker', code: 'no_tracker' });
      if (req.method === 'GET') {
        const st = storeFor(token);
        const since = Math.max(0, parseInt(url.searchParams.get('since') || '0', 10) || 0);
        let list = st.events.filter(e => e.type === 'tick' && e.seq > since && !st.voided.has(e.id));
        const more = list.length > o.pageSize; if (more) list = list.slice(0, o.pageSize);
        /* as the v5.89 draft: when there is more, seq is the last one sent and more:true */
        return send(res, 200, { now: new Date(now()).toISOString(), epoch: st.epoch, seq: more ? list[list.length - 1].seq : st.seq, days: c.tracker.days,
          ticks: list.map(pub), service_day: svcDay(now()), updated: c.updated, card_script_hash: cardScriptHash(c.html), more });
      }
      if (req.method === 'POST') return postTicks(req, res, token, c);
      return send(res, 405, { error: 'GET or POST' }, { Allow: 'GET, POST' });
    }
    if ((m = p.match(/^\/d\/([A-Za-z0-9_-]+)\/?$/)) && req.method === 'GET') {
      if (limited(req)) return send(res, 429, page('Slow down', '<p>Too many wrong links from here.</p>'), { 'Retry-After': '300' });
      const c = CARD_TOKEN_RE.test(m[1]) && cards.has(m[1]) ? cards.get(m[1]) : null;
      if (!c) return wrongKey(req, res, 404, page('Not found', '<p>That link is not one of ours, or it has been withdrawn.</p>'));
      if (expired(c)) return send(res, 410, page('This card has expired', '<p>It stopped working after ' + c.expires + '.</p>'));
      c.opens++;
      return send(res, 200, c.html, {
        'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp(cardScriptHash(c.html)) + (c.tracker ? "; worker-src 'self'" : ''),
        'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
      });
    }
    if (p.startsWith('/api/')) {
      const lv = editLevel(req, url);
      if (!lv || lv === 'wrong') return send(res, 401, { error: 'a view or edit token is needed' });
      if (p === '/api/cards' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view but not make drop cards' });
        let body; try { body = JSON.parse(await readBody(req, 2 * 1024 * 1024)); } catch (e) { return send(res, 400, { error: 'a JSON object is expected' }); }
        if (!plain(body) || typeof body.html !== 'string' || !body.html.trim()) return send(res, 400, { error: 'a card needs its html' });
        if (body.expires != null && !DAY_RE.test(String(body.expires))) return send(res, 400, { error: 'expires is a day, yyyy-mm-dd' });
        let tracker = null;
        if (body.tracker !== undefined && body.tracker !== null) {
          const why = validTracker(body.tracker);
          if (why) return send(res, 400, { error: 'tracker: ' + why, code: 'bad_tracker' });
          tracker = { days: body.tracker.days.map(d => ({ id: d.id, plan: d.plan })), lines: body.tracker.lines.map(l => ({ id: l.id, ref: l.ref, kind: l.kind, qty: l.qty })), plans: JSON.parse(JSON.stringify(body.tracker.plans)) };
        }
        const given = CARD_TOKEN_RE.test(String(body.token || '')) && cards.has(String(body.token)) ? String(body.token) : null;
        const prev = given ? cards.get(given) : null;
        if (prev && prev.tracker && !tracker) return send(res, 409, { error: 'this card is a servicing tracker; post it with its tracker', code: 'tracker_required', token: given });
        if (tracker) {   /* as live v5.89: one live tracker per load, whatever other token is posted */
          const live = [...cards.values()].find(x => x.tracker && x.load === String(body.load == null ? '' : body.load).slice(0, 60) && !expired(x) && x.token !== given);
          if (live) return send(res, 409, { error: 'a live tracker for this load already exists', code: 'tracker_exists', token: live.token, url: '/d/' + live.token });
        }
        const token = given || crypto.randomBytes(24).toString('base64url');
        const c = {
          token, load: String(body.load == null ? '' : body.load).slice(0, 60), title: String(body.title || '').slice(0, 160),
          run_date: body.run_date || null, expires: body.expires || null,
          contact: plain(body.contact) ? { name: String(body.contact.name || '').slice(0, 80), phone: String(body.contact.phone || '').slice(0, 30) } : null,
          html: body.html, keys: [], targets: [], tracker,
          secret: prev && prev.secret ? prev.secret : crypto.randomBytes(32),
          created: prev ? prev.created : new Date(now()).toISOString(), updated: new Date(now()).toISOString(), opens: prev ? prev.opens : 0,
        };
        cards.set(token, c);
        const out = { token, url: '/d/' + token, card: brief(c) };
        if (tracker) out.tracker = { links: linksFor(c), refs: new Set(tracker.lines.map(l => l.ref)).size, lines: tracker.lines.length, days: tracker.days, key_new: !(prev && prev.secret) };
        return send(res, 200, out);
      }
      if ((m = p.match(/^\/api\/cards\/([A-Za-z0-9_-]+)$/)) && req.method === 'DELETE') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot withdraw drop cards' });
        if (!cards.has(m[1])) return send(res, 404, { error: 'no such card' });
        cards.delete(m[1]); return send(res, 200, { withdrawn: m[1] });
      }
      if (p === '/api/ticks' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'the edit link only' });
        const token = url.searchParams.get('token'), nowIso = new Date(now()).toISOString();
        if (!token) {
          const toks = [...new Set([...cards.values()].filter(c => c.tracker).map(c => c.token).concat([...stores.keys()]))];
          return send(res, 200, { now: nowIso, service_day: svcDay(now()), trackers: toks.map(k => {
            const c = cards.get(k), st = stores.get(k);
            return { token: k, load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? expired(c) : null,
              card_withdrawn: !c, tracker: !!(c && c.tracker), seq: st ? st.seq : 0, ticks: st ? st.events.filter(e => e.type === 'tick').length : 0,
              voided: st ? st.voided.size : 0, epoch: st ? st.epoch : null };
          }) });
        }
        const c = cards.get(token) || null, st = stores.get(token) || null;
        if (!(c && c.tracker) && !st) return send(res, 404, { error: 'no servicing tracker has that token', code: 'no_tracker' });
        const s2 = st || storeFor(token);
        return send(res, 200, { now: nowIso, epoch: s2.epoch, service_day: svcDay(now()), token,
          load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? expired(c) : null,
          card_withdrawn: !c, updated: c ? c.updated : null, tracker: c && c.tracker ? c.tracker : null,
          links: c && c.tracker ? linksFor(c) : {}, key_kept: true, seq: s2.seq,
          ticks: s2.events.filter(e => e.type === 'tick').map(e => Object.assign(pub(e), s2.voided.has(e.id) ? { voided: true } : {})),
          voids: s2.events.filter(e => e.type === 'void').map(e => ({ vid: e.vid, ids: e.ids, at: e.at })) });
      }
      if (p === '/api/ticks/void' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'the edit link only' });
        let b; try { b = JSON.parse(await readBody(req, 65536)); } catch (e) { return send(res, 400, { error: 'a JSON object is expected' }); }
        if (!plain(b) || typeof b.token !== 'string' || !Array.isArray(b.ids) || !b.ids.length || b.ids.length > 2000) return send(res, 400, { error: 'send {token, ids: [1 to 2000 tick ids]}', code: 'bad_body' });
        const st = stores.get(b.token);
        if (!st) return send(res, 404, { error: 'no ticks are kept under that token', code: 'no_tracker' });
        const unknown = b.ids.filter(id => typeof id !== 'string' || !st.byId.has(id));
        if (unknown.length) return send(res, 400, { error: unknown.length + ' of those are not ticks of this tracker — nothing was set aside', code: 'unknown_ids', unknown: unknown.slice(0, 20).map(x => String(x).slice(0, 64)) });
        const all = [...new Set(b.ids)], ids = all.filter(id => !st.voided.has(id)), already = all.filter(id => st.voided.has(id));
        if (!ids.length) return send(res, 200, { voided: [], already, epoch: st.epoch });
        st.events.push({ type: 'void', vid: crypto.randomBytes(9).toString('base64url'), ids, at: new Date(now()).toISOString() });
        ids.forEach(id => st.voided.add(id));
        st.epoch = newEpoch();
        return send(res, 200, { voided: ids, already, epoch: st.epoch });
      }
      return send(res, 404, { error: 'not here' });
    }
    return send(res, 404, page('Not found', '<p>Nothing here.</p>'));
  }

  const server = http.createServer((req, res) => { handle(req, res).catch(e => { try { send(res, 500, { error: String(e && e.message || e) }); } catch (x) {} }); });
  const api = {
    server, options: o, mode, log, cards, stores,
    now, setNow(isoOrMs) { const t = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs); if (!Number.isFinite(t)) throw new Error('bad time'); clockOffset = t - Date.now(); },
    ticks(token) { const st = stores.get(token); return st ? st.events.filter(e => e.type === 'tick').map(e => Object.assign(pub(e), { voided: st.voided.has(e.id) })) : []; },
    /* a pretend recovery from an older snapshot: the newest `drop` ticks are lost, seq numbers are reused, a new epoch */
    recover(token, drop) {
      const st = stores.get(token); if (!st) return { error: 'no store' };
      const keepN = Math.max(0, st.events.length - drop), lost = st.events.slice(keepN);
      st.events = st.events.slice(0, keepN);
      lost.forEach(e => { if (e.type === 'tick') { st.byId.delete(e.id); const jk = e.line + '|' + e.task + '|' + e.day; st.jobs.set(jk, Math.max(0, (st.jobs.get(jk) || 1) - 1)); } });
      st.seq = st.events.reduce((n, e) => Math.max(n, e.seq || 0), 0); st.epoch = newEpoch();
      return { lost: lost.length, seq: st.seq, epoch: st.epoch };
    },
    listen() { return new Promise(r => server.listen(o.port, o.host, () => { api.port = server.address().port; api.base = 'http://' + o.host + ':' + api.port; r(api); })); },
    close() { return new Promise(r => { server.closeAllConnections && server.closeAllConnections(); server.close(() => r()); }); },
  };
  return api;
}

module.exports = { createMock, cardCspFromServer, cardScriptHash, sigFor, svcDay };

if (require.main === module) {
  const args = process.argv.slice(2);
  const port = args.indexOf('--port') >= 0 ? parseInt(args[args.indexOf('--port') + 1], 10) : 8787;
  const mock = createMock({ port, control: args.indexOf('--control') >= 0 });
  mock.listen().then(async () => {
    console.log('mock servicing tracker on ' + mock.base + ' (local only; edit token ' + mock.options.editToken + ', made up)');
    if (args.indexOf('--demo') >= 0) {
      const { buildCardHtml, trackerConfig } = require('./build_card.js');
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tracker_data.json'), 'utf8'));
      if (args.indexOf('--at') >= 0) mock.setNow(args[args.indexOf('--at') + 1]);
      const body = JSON.stringify({ load: 'servicing-tracker:GC500-2026', title: 'GC500 servicing tracker', expires: '2026-10-26', keys: [], targets: [], html: buildCardHtml(data), tracker: trackerConfig(data) });
      const r = await fetch(mock.base + '/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-gc500-token': mock.options.editToken }, body });
      const j = await r.json();
      console.log('view:      ' + mock.base + j.url);
      ['WC07', 'WC20', 'WC31', 'SPARE'].forEach(ref => console.log(('tick ' + ref + ':').padEnd(11) + mock.base + j.url + '#r=' + ref + '.' + j.tracker.links[ref]));
    }
  });
}
