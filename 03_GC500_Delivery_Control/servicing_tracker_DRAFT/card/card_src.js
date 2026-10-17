/* GC500 servicing tracker: the crew card's one script. Author: Andrew Fisher.
   Andrew, 18 Oct 2026: "purely just a track". Nothing here ticks the job record, changes a delivery state or a charge.
   Two ways in:
     /d/<token>#r=REF.sig  completion QR for ONE reference: tap its jobs for the service day (only that reference).
     /d/<token>            no code: read-only view of every area, with a day chooser. No ticking.
   Days run 08:00 to 08:00 Brisbane time, worked out from the SERVICE's clock (GET .../ticks answers `now`).
   Ticks go through an outbox kept on the phone, so no signal never loses a tap; each tick has its own id, so a resend
   is never counted twice. No names exist anywhere: "Just times". */
(function () {
'use strict';
var D = /*DATA*/null;

var HOUR = 3600000, POLL_MS = 15000, SLOW_MS = 60000, BACKOFF = [5, 10, 20, 40, 60];
var BODY_MAX = 1900;        /* the service takes 2 KB a post; keep under it */
var TASKS = D.tasks, PLANS = D.plans, DAYS = D.days, AREAS = D.areas;
var DAY_IDS = DAYS.map(function (d) { return d.id; });
var FIRST_REAL = (DAYS.filter(function (d) { return !d.ifNeeded; })[0] || DAYS[0]).id;   /* before the event: Friday */
var REFS = Object.create(null), AREA_OF = Object.create(null), LINE = Object.create(null), REF_OF_LINE = Object.create(null);
AREAS.forEach(function (a) { a.refs.forEach(function (r) {
  REFS[r.ref] = r; AREA_OF[r.ref] = a;
  r.lines.forEach(function (l) { LINE[l.id] = l; REF_OF_LINE[l.id] = r.ref; });
}); });
var ALL_REFS = [].concat.apply([], AREAS.map(function (a) { return a.refs; }));
var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ---- address and phone storage: the card shares an origin with the main page, so every key it keeps starts
   gc500.svc1063. and it never reads another key */
var PATH = location.pathname.replace(/\/+$/, '');                     /* /d/<t>/ works the same as /d/<t> */
var TOKEN = (PATH.match(/\/d\/([A-Za-z0-9_-]+)$/) || [])[1] || 'local';
var API = PATH + '/ticks';
var KEY = 'gc500.svc1063.' + TOKEN + '.';
function load(k, dflt) { try { var v = localStorage.getItem(KEY + k); return v == null ? dflt : JSON.parse(v); } catch (e) { return dflt; } }
function keep(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); return true; } catch (e) { return false; } }

/* ---- time: Brisbane is UTC+10 all year, so its clock is a fixed shift; the service's clock always wins */
var offset = 0, synced = false;
function now() { return Date.now() + offset; }
function iso(ms) { return new Date(ms).toISOString(); }
function hm(ms) { return new Date(ms + 10 * HOUR).toISOString().slice(11, 16); }
function hms(ms) { return new Date(ms + 10 * HOUR).toISOString().slice(11, 19); }
function svcDay(ms) { return new Date(ms + 2 * HOUR).toISOString().slice(0, 10); }   /* Brisbane date of (time - 8 h) */
function dayStart(id) { return Date.parse(id + 'T08:00:00+10:00'); }
function dayOf(id) { for (var i = 0; i < DAYS.length; i++) if (DAYS[i].id === id) return DAYS[i]; return null; }
function wday(id) { return WD[new Date(id + 'T00:00:00Z').getUTCDay()]; }
function longDay(id) { return wday(id) + ' ' + Number(id.slice(8, 10)); }
function shortDay(id) { var d = dayOf(id); return d ? d.label : id; }
function nextDay(id) { return svcDay(dayStart(id) + 26 * HOUR); }
function autoDay(ms) {
  var s = svcDay(ms);
  if (s < DAY_IDS[0]) return FIRST_REAL;                  /* before the event it opens on Friday; Thursday is only in case */
  if (s > DAY_IDS[DAY_IDS.length - 1]) return DAY_IDS[DAY_IDS.length - 1];
  var best = DAY_IDS[0];
  DAY_IDS.forEach(function (id) { if (id <= s) best = id; });
  return best;
}
function dayOpen(id) { return id <= svcDay(now()); }       /* the service refuses a day after the current one */

/* ---- what a line needs on a day: the plan's tasks for its kind (Sunday drops the water, adds the lock) */
function tasksFor(line, dayId) { var d = dayOf(dayId); var p = PLANS[line.kind]; return (p && d && p[d.plan]) || []; }
function jobKey(line, task, day) { return line + '|' + task + '|' + day; }

/* ---- the state rule. A job (one task on one line on one day) is done while any done:true tick for it is not
   cancelled; an untick names the tick ids it cancels, so a late untick never wipes a newer tick from another phone.
   Its time is the earliest uncancelled tapped_at, never later than the service's own `at`, never in the future. */
function jobStates(events, nowMs) {
  var byId = Object.create(null), cancelled = Object.create(null), out = Object.create(null);
  events.forEach(function (e) { if (e && e.id) byId[e.id] = e; });
  events.forEach(function (e) {
    if (!e) return;
    if (e.void || e.voided) { if (e.id) cancelled[e.id] = 1; return; }
    if (Array.isArray(e.voids)) { e.voids.forEach(function (id) { cancelled[id] = 1; }); return; }
    if (e.done === false && Array.isArray(e.undoes)) e.undoes.forEach(function (id) {
      var t = byId[id]; if (t && t.line === e.line && t.task === e.task && t.day === e.day) cancelled[id] = 1;
    });
  });
  events.forEach(function (e) {
    if (!e || e.done !== true || cancelled[e.id]) return;
    var at = Date.parse(e.at), tap = Date.parse(e.tapped_at);
    var t = isFinite(tap) ? tap : (isFinite(at) ? at : nowMs);
    if (isFinite(at) && t > at) t = at;
    if (t > nowMs) t = nowMs;
    var k = jobKey(e.line, e.task, e.day);
    var s = out[k] || (out[k] = { at: Infinity, local: true, ids: [] });
    if (t < s.at) s.at = t;
    if (!e.local) s.local = false;
    s.ids.push(e.id);
  });
  return out;
}
/* percentages: a job weighs its line's units (WC07's 20 FWF weigh 20), rounded DOWN so 99.x never shows 100 */
function refStats(r, day, st) {
  var w = 0, d = 0, last = 0, pend = false;
  r.lines.forEach(function (l) { tasksFor(l, day).forEach(function (t) {
    w += l.qty; var s = st[jobKey(l.id, t, day)];
    if (s) { d += l.qty; if (s.at > last) last = s.at; if (s.local) pend = true; }
  }); });
  return { w: w, d: d, done: w > 0 && d === w, last: last, pending: pend };
}
function groupStats(refs, day, st) {
  var w = 0, d = 0, last = 0, refsDone = 0;
  refs.forEach(function (r) { var s = refStats(r, day, st); w += s.w; d += s.d; if (s.done) refsDone++; if (s.last > last) last = s.last; });
  return { w: w, d: d, refsDone: refsDone, refs: refs.length, pct: w ? Math.floor(d * 100 / w) : 0, finished: w > 0 && d === w ? last : 0 };
}

/* ---- shared ticks from the service, plus this phone's own */
var epoch = load('epoch', null), cursor = 0;
var known = Object.create(null);       /* id -> tick as the service listed it */
var acked = Object.create(null);       /* id -> tick the service said it saved, until a read lists it */
var outbox = load('outbox', []); if (!Array.isArray(outbox)) outbox = [];
var sent = load('sent', []); if (!Array.isArray(sent)) sent = [];
var inflight = Object.create(null);
var final = null, degraded = null, full = false, pausedUntil = 0, pollPausedUntil = 0, backoffStep = 0;
var sending = false, polling = false, pollAgain = false, lastOk = 0, netDown = false, busyUntil = 0;
var notices = [];                      /* ticks the service would not take, named plainly */
var needReconcile = false, stale = false, firstUpdated = null, noKey = false;
var MY_DAYS = JSON.stringify(DAYS.map(function (d) { return [d.id, d.plan]; }));

function bySeq(a, b) { return (a.seq || 0) - (b.seq || 0); }
function vals(o) { return Object.keys(o).map(function (k) { return o[k]; }); }
function allEvents() {
  var k = vals(known).sort(bySeq);
  var a = vals(acked).filter(function (e) { return !known[e.id]; }).sort(bySeq);
  var o = outbox.map(function (e) { return Object.assign({ local: true }, e); });
  return k.concat(a, o);
}
function wire(e) { return { id: e.id, ref: e.ref, sig: e.sig, line: e.line, task: e.task, day: e.day, done: e.done, undoes: e.undoes || [], tapped_at: e.tapped_at }; }
function newId() {
  var b = new Uint8Array(12); crypto.getRandomValues(b);
  var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function saveOutbox() { if (!keep('outbox', outbox)) say('This phone could not keep the ticks waiting to send. Keep this page open until they go.'); }
function rememberSent(e) {
  if (sent.some(function (s) { return s.id === e.id; })) return;
  sent.push(wire(e)); if (sent.length > 400) sent = sent.slice(-400); keep('sent', sent);
}

/* ---- where the phone is: mode, reference, day */
var mode = 'view', curRef = null, curSig = null, hashNote = null, focusArea = null, focusPending = true;
var openAreas = Object.create(null), confirmKey = null, showAll = false;
var pick = null;            /* {day, at}: a day someone chose, held until the next 08:00 */
var lastAuto = null, advance = null, lastTapAt = 0, lastTapDay = null;
function readHash() {
  var h = location.hash || '';
  var m = /^#r=([A-Za-z0-9]+)(?:\.([A-Za-z0-9_-]*))?$/.exec(h);
  hashNote = null; focusArea = null; confirmKey = null;
  if (m) {
    var ref = m[1].toUpperCase();
    if (!REFS[ref]) { mode = 'view'; curRef = null; curSig = null; hashNote = 'That QR code names ' + m[1] + ', which is not on this tracker. Showing every area, view only.'; return; }
    if (!/^[A-Za-z0-9_-]{16}$/.test(m[2] || '')) { mode = 'view'; curRef = null; curSig = null; focusArea = AREA_OF[ref].n; openAreas[focusArea] = 1; hashNote = 'That QR code has no completion code, so this phone can only view ' + ref + '.'; return; }
    mode = 'tick'; curRef = ref; curSig = m[2]; showAll = false; return;
  }
  mode = 'view'; curRef = null; curSig = null;
  var a = /^#a(\d{1,2})$/.exec(h);
  if (a && AREAS.some(function (x) { return x.n === +a[1]; })) { focusArea = +a[1]; openAreas[focusArea] = 1; }
}
function shownDay() {
  var cur = svcDay(now());
  if (pick && pick.at !== cur) pick = null;               /* a chosen day lapses at the next 08:00 */
  return pick ? pick.day : autoDay(now());
}
function choose(day) {
  var auto = autoDay(now());
  pick = day === auto ? null : { day: day, at: svcDay(now()) };
  advance = null; confirmKey = null;
}
function watchClock() {
  if (!synced) return;                                   /* the phone's own clock never moves the day */
  var auto = autoDay(now());
  if (lastAuto === null) { lastAuto = auto; return; }
  if (auto !== lastAuto) {
    var hadPick = !!pick; shownDay();
    if (!pick) advance = { from: lastAuto, to: auto, grace: !hadPick && lastTapDay === lastAuto && now() - lastTapAt < HOUR };
  }
  lastAuto = auto;
}

/* ---- talking to the service */
function fetchT(url, opt, ms) {
  var ctl = typeof AbortController === 'function' ? new AbortController() : null;
  var o = Object.assign({ cache: 'no-store', credentials: 'same-origin' }, opt || {}); if (ctl) o.signal = ctl.signal;
  var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
  return fetch(url, o).then(function (res) {
    return res.text().then(function (text) { clearTimeout(t); var j = null; try { j = JSON.parse(text); } catch (e) {} return { status: res.status, j: j, h: res.headers }; });
  }, function (err) { clearTimeout(t); throw err; });
}
function noteServer(j, t0, t1) {
  if (j && j.now) { var sn = Date.parse(j.now); if (isFinite(sn)) { offset = sn - (t0 + t1) / 2; synced = true; } }
}
function stopAll(kind) {
  final = kind; clearTimeout(pollTimer); clearTimeout(pumpTimer); render();
}
function onRefusal(status, j) {
  /* a 404 that comes from this card's own route: withdrawn is final; a card with no tracker waits; a page answer
     (an older service) means it is being updated */
  if (status === 410) { stopAll('expired'); return true; }
  if (status === 404) {
    if (!j) { degraded = 'updating'; pausedUntil = pollPausedUntil = Date.now() + SLOW_MS; return true; }
    if (j.code === 'no_tracker') { degraded = 'no_tracker'; pausedUntil = pollPausedUntil = Date.now() + SLOW_MS; return true; }
    stopAll('withdrawn'); return true;
  }
  return false;
}

var pollTimer = null, pumpTimer = null;
function schedulePoll(ms) {
  clearTimeout(pollTimer); if (final) return;
  pollTimer = setTimeout(function () { if (document.visibilityState !== 'hidden') poll(); }, ms);
}
function schedulePump(ms) { clearTimeout(pumpTimer); if (final) return; pumpTimer = setTimeout(pump, Math.max(250, ms)); }

function poll() {
  if (final) return;
  if (polling) { pollAgain = true; return; }
  if (Date.now() < pollPausedUntil) { schedulePoll(pollPausedUntil - Date.now()); return; }
  polling = true; pollAgain = false;
  var loops = 0;
  function step() {
    var t0 = Date.now();
    return fetchT(API + '?since=' + cursor, { method: 'GET' }, 15000).then(function (r) {
      var t1 = Date.now(), j = r.j;
      if (r.status === 200 && j && Array.isArray(j.ticks)) {
        noteServer(j, t0, t1); netDown = false; degraded = null;
        if (j.updated && firstUpdated === null) firstUpdated = String(j.updated);
        stale = (Array.isArray(j.days) && JSON.stringify(j.days.map(function (d) { return [d && d.id, d && d.plan]; })) !== MY_DAYS) ||
          (!!j.updated && firstUpdated !== null && String(j.updated) !== firstUpdated);
        var ep = j.epoch == null ? null : String(j.epoch);
        var reset = (cursor > 0 && ep !== null && epoch !== null && ep !== String(epoch)) || (typeof j.seq === 'number' && j.seq < cursor);
        if (ep !== null && epoch !== null && ep !== String(epoch)) needReconcile = true;
        if (ep !== null && ep !== epoch) { epoch = ep; keep('epoch', epoch); }
        if (reset) {                                    /* the service recovered: start again from nothing */
          known = Object.create(null); acked = Object.create(null); cursor = 0; needReconcile = true;
          if (++loops < 40) return step();
        }
        var maxSeq = cursor;
        j.ticks.forEach(function (t) { if (t && t.id) { known[t.id] = t; if (t.seq > maxSeq) maxSeq = t.seq; } });
        var more = j.ticks.length > 0 && (j.more === true || (typeof j.seq === 'number' && maxSeq < j.seq));
        cursor = j.ticks.length ? maxSeq : Math.max(cursor, typeof j.seq === 'number' ? j.seq : cursor);
        if (more && ++loops < 40) return step();
        Object.keys(acked).forEach(function (id) { if (known[id] || acked[id].seq <= cursor) delete acked[id]; });
        lastOk = Date.now();
        if (needReconcile) reconcile();
        return;
      }
      if (onRefusal(r.status, j)) return;
      if (r.status === 429) { busyUntil = Date.now() + retryAfter(r.h); pollPausedUntil = busyUntil; return; }
      netDown = true;
    }, function () { netDown = true; });
  }
  step().then(function () {
    polling = false; watchClock(); render();
    if (focusPending) { focusPending = false; scrollToFocus(); }      /* once, after the first answer settles the layout */
    if (final) return;
    if (outbox.length && !sending) pump();
    if (pollAgain) { pollAgain = false; poll(); return; }
    schedulePoll(degraded ? SLOW_MS : POLL_MS);
  });
}
/* after the service recovered from a snapshot, anything this phone had saved that it no longer lists goes again;
   ids make it safe (the service answers "already" for one it still holds) */
function reconcile() {
  needReconcile = false;
  var add = sent.filter(function (s) { return !known[s.id] && !outbox.some(function (o) { return o.id === s.id; }); });
  if (!add.length) return;
  add.forEach(function (s) { outbox.push(Object.assign({}, s, { requeued: true, tries: 0 })); });
  saveOutbox();
}
function retryAfter(h) { var s = parseInt(h && h.get('Retry-After'), 10); return (isFinite(s) && s > 0 ? Math.min(s, 600) : 30) * 1000; }

function pump() {
  if (sending || final || !outbox.length) return;
  if (Date.now() < pausedUntil) { schedulePump(pausedUntil - Date.now()); return; }
  var batch = [], size = 12;
  for (var i = 0; i < outbox.length; i++) {
    var e = outbox[i], s = JSON.stringify(wire(e)).length + 1;
    if (batch.length && (e.solo || batch[0].solo || batch.length >= 20 || size + s > BODY_MAX)) break;
    if (e.done === false && (e.undoes || []).some(function (id) { return batch.some(function (b) { return b.id === id; }); })) break;
    batch.push(e); size += s;
    if (e.solo) break;
  }
  sending = true;
  batch.forEach(function (e) { e.tries = (e.tries || 0) + 1; inflight[e.id] = 1; });
  saveOutbox(); render();
  var t0 = Date.now();
  fetchT(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticks: batch.map(wire) }) }, 20000).then(function (r) {
    return { r: r, t1: Date.now() };
  }, function () { return { r: null }; }).then(function (x) {
    var r = x.r, j = r && r.j;
    batch.forEach(function (e) { delete inflight[e.id]; });
    sending = false;
    if (r && r.status === 200 && j && Array.isArray(j.saved)) {
      noteServer(j, t0, x.t1); netDown = false; backoffStep = 0; degraded = null; full = false; noKey = false;
      if (j.epoch != null && epoch !== null && String(j.epoch) !== String(epoch)) pollAgain = true;
      var took = 0;
      j.saved.forEach(function (sv) {
        var idx = -1; outbox.forEach(function (o, k) { if (o.id === sv.id) idx = k; });
        if (idx < 0) return;
        var ev = outbox[idx]; outbox.splice(idx, 1); took++;
        rememberSent(ev);
        if (sv.voided) return;                        /* set aside on the edit link: it counts for nothing */
        var a = wire(ev); delete a.sig; a.seq = sv.seq; a.at = sv.at; acked[a.id] = a;
      });
      saveOutbox(); render();
      if (!took) { pausedUntil = Date.now() + SLOW_MS; schedulePump(SLOW_MS); poll(); return; }   /* never a tight loop */
      if (outbox.length) pump();
      poll();
      return;
    }
    if (r && [400, 401, 403, 409, 413, 422].indexOf(r.status) >= 0) {
      /* the service names the tick it refused (nothing of that post was kept): drop that one, send the rest */
      var named = null;
      if (j && batch.length > 1) {
        if (typeof j.id === 'string') named = batch.filter(function (e) { return e.id === j.id; })[0] || null;
        if (!named && typeof j.index === 'number' && j.index >= 0 && j.index < batch.length) named = batch[j.index];
      }
      if (!named && batch.length > 1) { batch.forEach(function (e) { e.solo = true; }); saveOutbox(); pump(); return; }
      var bad = named || batch[0];
      outbox = outbox.filter(function (o) { return o.id !== bad.id; }); saveOutbox();
      if (!bad.requeued) notices.push({ id: bad.id, text: tickName(bad) + ': ' + ((j && j.error) || reasonFor(r.status)) });
      render(); pump(); return;
    }
    if (r && (r.status === 404 || r.status === 410) && onRefusal(r.status, j)) { render(); if (!final) schedulePump(pausedUntil - Date.now()); return; }
    if (r && r.status === 429) { pausedUntil = busyUntil = Date.now() + retryAfter(r.h); render(); schedulePump(pausedUntil - Date.now()); return; }
    if (r && r.status === 507 && j && j.full) { full = true; pausedUntil = Date.now() + SLOW_MS; render(); schedulePump(SLOW_MS); return; }
    if (r && r.status === 503 && j && j.code === 'no_key') { noKey = true; pausedUntil = Date.now() + SLOW_MS; render(); schedulePump(SLOW_MS); return; }
    if (!r) netDown = true;
    var wait = BACKOFF[Math.min(backoffStep, BACKOFF.length - 1)] * 1000; backoffStep++;
    pausedUntil = Date.now() + wait; render(); schedulePump(wait);
  });
}
function reasonFor(st) {
  return st === 403 ? 'this QR code is not the one printed for that reference' : st === 409 ? 'the service already has a different tick with that number'
    : st === 413 ? 'too big to send' : 'the service would not take it';
}
function tickName(e) {
  var l = LINE[e.line];
  return (e.done ? '' : 'Undo of ') + e.ref + (l ? ' · ' + l.label : '') + ' · ' + (TASKS[e.task] || e.task) + ' (' + shortDay(e.day) + ')';
}

/* ---- taps */
function tapJob(key) {
  if (mode !== 'tick' || final) return;
  var day = shownDay(); if (!dayOpen(day)) return;
  var p = key.split('|'), lineId = p[0], task = p[1];
  if (REF_OF_LINE[lineId] !== curRef) return;              /* only this QR code's reference */
  var st = jobStates(allEvents(), now())[jobKey(lineId, task, day)];
  if (st) { confirmKey = confirmKey === key ? null : key; render(); refocus('j-' + key); if (confirmKey) reveal('c-' + key); return; }
  var ev = { id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: true, undoes: [], tapped_at: iso(now()), tries: 0 };
  outbox.push(ev); saveOutbox();
  lastTapAt = now(); lastTapDay = day; confirmKey = null;
  render(); refocus('j-' + key); announce(lineId, task, day); pump();
}
function undoJob(key) {
  if (mode !== 'tick' || final) return;
  var day = shownDay(), p = key.split('|'), lineId = p[0], task = p[1];
  if (REF_OF_LINE[lineId] !== curRef) return;
  var st = jobStates(allEvents(), now())[jobKey(lineId, task, day)];
  confirmKey = null;
  if (!st) { render(); return; }
  /* a tap never sent and not on its way is simply taken back; anything the service may hold is cancelled by id */
  var local = st.ids.filter(function (id) { return outbox.some(function (o) { return o.id === id && !inflight[id] && !o.tries; }); });
  outbox = outbox.filter(function (o) { return local.indexOf(o.id) < 0; });
  var rest = st.ids.filter(function (id) { return local.indexOf(id) < 0; });
  if (rest.length) outbox.push({ id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: false, undoes: rest, tapped_at: iso(now()), tries: 0 });
  saveOutbox(); render(); refocus('j-' + key);
  say((TASKS[task] || task) + ' taken off for ' + curRef + '.');
  pump();
}
function announce(lineId, task, day) {
  var st = jobStates(allEvents(), now()), a = AREA_OF[curRef];
  var as = groupStats(a.refs, day, st), os = groupStats(ALL_REFS, day, st);
  say(curRef + ' ' + (TASKS[task] || task) + ' done ' + hm(now()) + '. ' + areaLabel(a) + ' ' + as.pct + ' percent' + (as.finished ? ', area finished' : '') + '. Everything ' + os.pct + ' percent.');
}
function say(t) { var el = document.getElementById('say'); if (el) { el.textContent = ''; setTimeout(function () { el.textContent = t; }, 30); } }
/* bring an element clear of the sticky header */
function reveal(id) {
  var el = document.getElementById(id), hd = document.querySelector('header'); if (!el) return;
  var top = el.getBoundingClientRect().top, bottom = el.getBoundingClientRect().bottom, hh = hd ? hd.getBoundingClientRect().bottom : 0;
  if (top < hh + 8) window.scrollBy(0, top - hh - 8);
  else if (bottom > window.innerHeight - 8) window.scrollBy(0, Math.min(bottom - window.innerHeight + 16, top - hh - 8));
}
function refocus(id) { var el = document.getElementById(id); if (el) try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }

/* ---- drawing. Every value read from data or the service goes through esc() */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var TICK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 17l6 6L25 9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function bar(pct, finished) { return '<div class="bar' + (finished ? ' full' : '') + '" aria-hidden="true"><i style="width:' + pct + '%"></i></div>'; }
function navHtml(r) {
  if (!r.pin) return '<p class="nopin">No pin on the record · ask on site</p>';
  return '<div class="acts"><a class="nav" href="https://www.google.com/maps/dir/?api=1&amp;destination=' + Number(r.pin[0]) + ',' + Number(r.pin[1]) + '" target="_blank" rel="noopener noreferrer">Navigate ↗</a></div>';
}
function contactHtml() {
  var c = D.contact;
  if (c && c.phone) return 'Ring <a href="tel:' + esc(String(c.phone).replace(/[^0-9+]/g, '')) + '">' + esc(c.name || 'the Coates events project manager') + ' on ' + esc(c.phone) + '</a>.';
  return 'Ring the Coates events project manager whose name is on your paperwork.';
}
function areaLabel(a) { return a.n ? 'Area ' + a.n + ' · ' + a.name : a.name; }
function unitsOf(r) { return r.lines.reduce(function (n, l) { return n + l.qty; }, 0); }
function waiting() { return outbox.length; }

function renderStatus() {
  var el = document.getElementById('status'); if (!el) return;
  var n = waiting(), cls = 'status', t;
  var tw = n + ' tick' + (n === 1 ? '' : 's') + ' waiting';
  if (final) { t = final === 'expired' ? 'Finished' : 'Withdrawn'; cls += ' bad'; }
  else if (degraded === 'updating') { t = 'Service being updated' + (n ? ' · ' + tw : ''); cls += ' wait'; }
  else if (Date.now() < busyUntil) { t = 'Busy · trying again in ' + Math.ceil((busyUntil - Date.now()) / 1000) + ' s' + (n ? ' · ' + tw : ''); cls += ' wait'; }
  else if (n && (netDown || !navigator.onLine)) { t = 'No signal · ' + tw + ', they go when signal is back'; cls += ' wait'; }
  else if (n) { t = 'Sending · ' + tw; cls += ' wait'; }
  else if (netDown || !navigator.onLine) { t = 'No signal · showing what this phone last saw'; cls += ' bad'; }
  else if (lastOk) { t = 'Live · updated ' + hms(lastOk + offset); cls += ' live'; }
  else t = 'Connecting…';
  el.className = cls; el.textContent = t;
}
function bannersHtml(day, auto) {
  var b = [];
  if (final === 'withdrawn') b.push('<div class="banner warn" role="alert"><strong>This tracker has been withdrawn</strong><span>Nothing more can be ticked from this card.' + (waiting() ? ' ' + waiting() + ' unsent tick' + (waiting() === 1 ? ' is' : 's are') + ' kept on this phone.' : '') + ' ' + contactHtml() + '</span></div>');
  if (final === 'expired') b.push('<div class="banner warn" role="alert"><strong>Servicing has finished</strong><span>This card stopped working after Monday 26 Oct.' + (waiting() ? ' ' + waiting() + ' unsent tick' + (waiting() === 1 ? ' is' : 's are') + ' kept on this phone.' : '') + ' ' + contactHtml() + '</span></div>');
  if (!final && degraded === 'updating') b.push('<div class="banner info"><span>The service is being updated. Your ticks are kept on this phone and go when it is back.</span></div>');
  if (!final && degraded === 'no_tracker') b.push('<div class="banner info"><span>Ticking is paused on the service. Your ticks are kept on this phone and go when it is back.</span></div>');
  if (!final && noKey) b.push('<div class="banner warn" role="alert"><span>The service cannot check completion codes right now. Your ticks are kept on this phone. ' + contactHtml() + '</span></div>');
  if (!final && full) b.push('<div class="banner warn"><span>The service could not take more ticks. Your ticks are kept on this phone. ' + contactHtml() + '</span></div>');
  if (pick && pick.day !== auto) b.push('<div class="banner loud" role="alert"><strong>You are on ' + esc(longDay(pick.day)) + '\'s service</strong><span>Today\'s service is ' + esc(longDay(auto)) + '. This choice ends at 08:00.</span><div class="bacts"><button class="bbtn" type="button" data-back="1">Back to ' + esc(longDay(auto)) + '</button></div></div>');
  if (advance && !pick) b.push('<div class="banner info" role="status"><strong>Now ' + esc(longDay(advance.to)) + '\'s service</strong><span>It changed at 08:00.' + (advance.grace ? ' Still finishing ' + esc(longDay(advance.from)) + '\'s?' : '') + '</span><div class="bacts">' + (advance.grace ? '<button class="bbtn" type="button" data-stay="' + esc(advance.from) + '">Stay on ' + esc(longDay(advance.from)) + '</button>' : '') + '<button class="bbtn" type="button" data-dismiss="advance">OK</button></div></div>');
  if (svcDay(now()) < DAY_IDS[0] && synced) b.push('<div class="banner info"><span>Servicing has not started. It opens ' + esc(longDay(DAY_IDS[0])) + ' Oct 08:00 if needed, then ' + esc(longDay(FIRST_REAL)) + ' Oct 08:00.' + (mode === 'tick' ? ' Nothing can be ticked yet.' : '') + '</span></div>');
  if (stale && !final) b.push('<div class="banner warn" role="alert"><span>This card has been changed on the service. Reload it to get the new one.</span><div class="bacts"><button class="bbtn" type="button" data-reload="1">Reload</button></div></div>');
  if (hashNote) b.push('<div class="banner info"><span>' + esc(hashNote) + '</span></div>');
  notices.forEach(function (n, i) { b.push('<div class="banner warn" role="alert"><span><b>Not saved:</b> ' + esc(n.text) + '</span><div class="bacts"><button class="bbtn" type="button" data-dismiss="n' + i + '">OK</button></div></div>'); });
  return b.join('');
}
function daysHtml(day, auto) {
  return DAYS.map(function (d) {
    var sub = d.ifNeeded ? 'if needed' : 'to ' + d.to;
    return '<button class="day' + (d.id === auto ? ' today' : '') + '" type="button" id="day-' + esc(d.id) + '" data-day="' + esc(d.id) + '" aria-pressed="' + (d.id === day) + '" aria-label="' + esc(longDay(d.id) + ', 08:00 to 08:00' + (d.ifNeeded ? ', if needed' : '') + (d.id === auto ? ', today' : '')) + '"><b>' + esc(d.label) + '</b><span>' + esc(sub) + '</span></button>';
  }).join('');
}
function windowHtml(day) {
  var d = dayOf(day), s = dayStart(day), e = s + 24 * HOUR, n = now();
  var state = n < s ? 'Opens ' + d.label + ' 08:00' : n >= e ? 'Closed ' + d.to + ' 08:00' : 'Open now · closes 08:00 ' + d.to;
  return '<span><b>' + esc(d.label + ' 08:00 → ' + d.to + ' 08:00') + '</b>' + (d.ifNeeded ? ' · only if Thursday is serviced' : '') + (d.plan === 'final' ? ' · last night' : '') + '</span><span>' + esc(state) + '</span>';
}
function progHtml(label, s, refWord) {
  return '<div><div class="pl"><span class="pn">' + esc(label) + '</span><em>' + s.pct + '%</em></div>' + bar(s.pct, !!s.finished) +
    '<div class="pm">' + (s.finished ? '<span class="fin">' + (refWord === 'area' ? 'Area finished ' : 'All finished ') + hm(s.finished) + '</span> · ' : '') + s.refsDone + ' of ' + s.refs + ' references · ' + s.d + ' of ' + s.w + ' jobs</div></div>';
}
function jobHtml(r, l, task, day, st, open) {
  var key = l.id + '|' + task, s = st[jobKey(l.id, task, day)], label = TASKS[task] || task;
  var cls = 'job' + (s ? (s.local ? ' pending' : ' done') : '');
  var sub = !open ? 'Opens ' + shortDay(day) + ' 08:00' : s ? 'Done ' + hm(s.at) + (s.local ? ' · waiting for signal' : '') : 'Tap when done';
  var aria = label + ', ' + l.label + ', ' + (s ? 'done at ' + hm(s.at) + (s.local ? ', waiting for signal' : '') + '. Tap to undo.' : open ? 'not done yet' : 'not open yet');
  var h = '<button class="' + cls + '" type="button" id="j-' + esc(key) + '" data-job="' + esc(key) + '" aria-pressed="' + (!!s) + '" aria-label="' + esc(aria) + '"' + (open && !final ? '' : ' disabled') + '><span class="jbox">' + TICK + '</span><span class="jtxt"><b>' + esc(label) + '</b><small>' + esc(sub) + '</small></span></button>';
  if (confirmKey === key && s) h += '<div class="confirm" id="c-' + esc(key) + '" role="group" aria-label="Undo ' + esc(label) + '"><p>Undo “' + esc(label) + '” for ' + esc(l.label) + '?</p><div class="bacts"><button class="cbtn undo" type="button" id="u-' + esc(key) + '" data-undo="' + esc(key) + '">Yes, undo</button><button class="cbtn" type="button" data-keep="1">Keep it done</button></div></div>';
  return h;
}
function tickView(day, st) {
  var r = REFS[curRef], a = AREA_OF[curRef], open = dayOpen(day), n = unitsOf(r);
  var h = '<section class="card refcard" aria-labelledby="refh"><h2 class="bigref" id="refh">' + esc(r.ref) + '</h2>' +
    (r.title && r.title !== r.ref ? '<div class="reftitle">' + esc(r.title) + '</div>' : '') +
    '<div class="refarea">' + (a.n ? 'Area ' + a.n + ' <span>· ' + esc(a.name) + '</span>' : esc(a.name)) + '</div>' +
    '<div class="count">' + n + ' unit' + (n === 1 ? '' : 's') + ' at ' + esc(r.ref) + (r.lines.length > 1 ? ' · ' + r.lines.length + ' completion lines' : '') + '</div>' +
    ((r.where || r.drop) ? '<div class="where">' + esc([r.where, r.drop].filter(Boolean).join(' · ')) + '</div>' : '') + navHtml(r);
  r.lines.forEach(function (l) {
    h += '<div class="line"><h3 class="ltitle">' + esc(l.label) + '</h3>' + (l.nos && l.nos.length ? '<p class="nos"><b>Asset nos</b> ' + esc(l.nos.join(', ')) + '</p>' : '') +
      '<div class="jobs" role="group" aria-label="' + esc(l.label + ', ' + longDay(day) + '\'s jobs') + '">' + tasksFor(l, day).map(function (t) { return jobHtml(r, l, t, day, st, open); }).join('') + '</div></div>';
  });
  h += '</section>';
  h += '<button class="showall" type="button" data-showall="1" aria-expanded="' + showAll + '">' + (showAll ? 'Hide the other areas' : 'Show every area (view only)') + '</button>';
  if (showAll) h += areasHtml(day, st, curRef);
  return h;
}
function orowHtml(r, day, st) {
  var rs = refStats(r, day, st);
  var h = '<div class="orow' + (rs.done ? ' done' : '') + '"><div class="rtop"><span class="ref">' + esc(r.ref) + '</span>' + (rs.done ? '<span class="when">Done ' + hm(rs.last) + '</span>' : '') + '</div>';
  r.lines.forEach(function (l) {
    h += '<div class="oline"><b>' + esc(l.label) + '</b><div class="chips">' + tasksFor(l, day).map(function (t) {
      var s = st[jobKey(l.id, t, day)];
      return '<span class="chip' + (s ? (s.local ? ' wt' : ' ok') : '') + '">' + esc(TASKS[t] || t) + (s ? ' ' + hm(s.at) : '') + '</span>';
    }).join('') + '</div>' + (l.nos && l.nos.length ? '<p class="nos"><b>Asset nos</b> ' + esc(l.nos.join(', ')) + '</p>' : '') + '</div>';
  });
  if (r.where || r.drop || r.title !== r.ref) h += '<div class="where">' + esc([r.title !== r.ref ? r.title : '', r.where, r.drop].filter(Boolean).join(' · ')) + '</div>';
  return h + navHtml(r) + '</div>';
}
function areasHtml(day, st, skipRef) {
  return AREAS.map(function (a) {
    var s = groupStats(a.refs, day, st), isOpen = !!openAreas[a.n];
    return '<section class="area' + (s.finished ? ' complete' : '') + '" id="a' + a.n + '"><button class="ahead" type="button" id="ah-' + a.n + '" data-area="' + a.n + '" aria-expanded="' + isOpen + '">' +
      '<span class="anum">' + (a.n || '–') + '</span><span class="aname">' + esc(a.name) + '</span><span class="apct">' + s.pct + '%</span>' +
      '<span class="ameta">' + (s.finished ? '<span class="fin">Area finished ' + hm(s.finished) + '</span> · ' : '') + s.refsDone + ' of ' + s.refs + ' references · ' + a.refs.reduce(function (n, r) { return n + unitsOf(r); }, 0) + ' units</span>' +
      bar(s.pct, !!s.finished) + '</button>' + (isOpen ? '<div class="rows">' + a.refs.map(function (r) { return orowHtml(r, day, st); }).join('') + '</div>' : '') + '</section>';
  }).join('');
}
function viewHtml(day, st) {
  return '<p class="viewonly">View only. To tick a reference, scan the completion QR code printed for it.</p>' + areasHtml(day, st);
}

var lastParts = {};
function render() {
  var day = shownDay(), auto = autoDay(now());
  var st = jobStates(allEvents(), now());
  renderStatus();
  var bars;
  var os = groupStats(ALL_REFS, day, st);
  if (mode === 'tick') {
    var a = AREA_OF[curRef];
    bars = progHtml(areaLabel(a), groupStats(a.refs, day, st), 'area') + progHtml('Everything', os, 'all');
  } else bars = progHtml('Everything · ' + longDay(day), os, 'all');
  var parts = {
    banners: bannersHtml(day, auto), days: daysHtml(day, auto), window: windowHtml(day), bars: bars,
    view: mode === 'tick' ? tickView(day, st) : viewHtml(day, st),
  };
  /* only a part that changed is redrawn, so a poll that changes nothing never replaces a button under a finger */
  var changed = Object.keys(parts).filter(function (k) { return lastParts[k] !== parts[k]; });
  if (!changed.length) return;
  var focusId = document.activeElement && document.activeElement.id;
  changed.forEach(function (k) { var el = document.getElementById(k); if (el) el.innerHTML = parts[k]; lastParts[k] = parts[k]; });
  document.documentElement.setAttribute('data-mode', mode);
  padForHeader();
  if (focusId && document.activeElement !== document.getElementById(focusId)) refocus(focusId);
}

document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-day],[data-job],[data-undo],[data-keep],[data-area],[data-showall],[data-back],[data-stay],[data-dismiss],[data-reload]');
  if (!b || b.disabled) return;
  var ds = b.dataset;
  if (ds.day) { choose(ds.day); render(); refocus('day-' + ds.day); return; }
  if (ds.job) { tapJob(ds.job); return; }
  if (ds.undo) { undoJob(ds.undo); return; }
  if (ds.keep) { var k = confirmKey; confirmKey = null; render(); if (k) refocus('j-' + k); return; }
  if (ds.area) { var n = +ds.area; if (openAreas[n]) delete openAreas[n]; else openAreas[n] = 1; render(); refocus('ah-' + n); return; }
  if (ds.showall) { showAll = !showAll; render(); return; }
  if (ds.reload) { location.reload(); return; }
  if (ds.back) { pick = null; advance = null; render(); return; }
  if (ds.stay) { pick = { day: ds.stay, at: svcDay(now()) }; advance = null; render(); return; }
  if (ds.dismiss) { if (ds.dismiss === 'advance') advance = null; else notices.splice(+ds.dismiss.slice(1), 1); render(); }
});
window.addEventListener('hashchange', function () { readHash(); render(); scrollToFocus(); focusPending = true; poll(); });
['touchstart', 'wheel', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { focusPending = false; }, { passive: true }); });
window.addEventListener('online', function () { netDown = false; if (!busyUntil || Date.now() >= busyUntil) { pausedUntil = 0; backoffStep = 0; } poll(); pump(); render(); });
window.addEventListener('offline', function () { netDown = true; render(); });
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { watchClock(); render(); poll(); pump(); } });
/* the sticky header covers the top of the page: the browser's own jump to #a7, and ours, stop below it */
function padForHeader() { var hd = document.querySelector('header'); if (hd) document.documentElement.style.scrollPaddingTop = (hd.offsetHeight + 8) + 'px'; }
window.addEventListener('resize', padForHeader);
function scrollToFocus() {
  if (mode === 'tick') { window.scrollTo(0, 0); return; }
  if (focusArea != null) {
    padForHeader();
    var el = document.getElementById('a' + focusArea);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }
}
setInterval(function () { if (final) { renderStatus(); return; } watchClock(); render(); }, 5000);

/* for the tests only: pure functions and a read-only look at the state */
window.svc1063 = { svcDay: svcDay, autoDay: autoDay, jobStates: jobStates, groupStats: groupStats, refStats: refStats,
  tasksFor: tasksFor, shownDay: shownDay, now: now, offset: function () { return offset; },
  outbox: function () { return outbox.map(wire); }, mode: function () { return mode; }, final: function () { return final; },
  areas: AREAS, days: DAYS };

readHash();
render(); scrollToFocus();
poll();
if (outbox.length) pump();
})();
