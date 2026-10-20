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
/*SHARED_STATE*/

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
   gc500.svc1067. and it never reads another key */
var PATH = location.pathname.replace(/\/+$/, '');                     /* /d/<t>/ works the same as /d/<t> */
var TOKEN = (PATH.match(/\/d\/([A-Za-z0-9_-]+)$/) || [])[1] || 'local';
var API = PATH + '/ticks';
var KEY = 'gc500.svc1067.' + TOKEN + '.';
function load(k, dflt) { try { var v = localStorage.getItem(KEY + k); return v == null ? dflt : JSON.parse(v); } catch (e) { return dflt; } }
function keep(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); return true; } catch (e) { storageFailed = true; return false; } }
function forget(k) { try { localStorage.removeItem(KEY + k); return true; } catch (e) { return false; } }
/* Each immutable event owns a key. No read/merge/write array can overwrite another tab's tap. */
function stored(prefix) {
  var out = [], start = KEY + prefix;
  try { for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf(start) === 0) { var e = JSON.parse(localStorage.getItem(key)); if (e && e.id) out.push(e); }
  } } catch (e) {}
  return out;
}
function latestSnapshot() {
  var snapshots = stored('snapshot.');
  snapshots.sort(function (a, b) { return b.serverAt - a.serverAt || b.cursor - a.cursor; });
  return snapshots[0] || null;
}
var cached = latestSnapshot();


/* ---- time: Brisbane is UTC+10 all year, so its clock is a fixed shift; the service's clock always wins */
var clock = load('clock', null);
var offset = clock && isFinite(clock.offset) ? clock.offset : 0, synced = !!(clock && isFinite(clock.offset));
function now() { return Date.now() + offset; }
function iso(ms) { return new Date(ms).toISOString(); }
function hm(ms) { return new Date(ms + 10 * HOUR).toISOString().slice(11, 16); }
function hms(ms) { return new Date(ms + 10 * HOUR).toISOString().slice(11, 19); }
function savedWhen(ms) { var d = new Date(ms + 10 * HOUR).toISOString(); return d.slice(0, 10) + ' ' + d.slice(11, 16); }
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
function dayOpen(id) { return synced && id <= svcDay(now()); }       /* the service refuses a day after the current one */

/* ---- what a line needs on a day: the plan's tasks for its kind (Sunday drops the water, adds the lock) */
function tasksFor(line, dayId) { var d = dayOf(dayId); var p = PLANS[line.kind]; return (p && d && p[d.plan]) || []; }
function jobKey(line, task, day) { return line + '|' + task + '|' + day; }

/* Exactly the same rule is embedded in the main-page panel. */
var jobStates = SvcState.jobStates;
function refStats(r, day, st) { return SvcState.refStats(D, r, day, st); }
function groupStats(refs, day, st) { return SvcState.groupStats(D, refs, day, st); }

/* ---- shared ticks from the service, plus this phone's own */
var epoch = cached ? cached.epoch : load('epoch', null), cursor = cached ? cached.cursor : 0;
var known = Object.create(null);
if (cached) (cached.ticks || []).forEach(function (t) { if (t && t.id) known[t.id] = t; });       /* id -> tick as the service listed it */
var acked = Object.create(null);       /* id -> tick the service said it saved, until a read lists it */
var outbox = stored('ob.'), sent = stored('sent.');
var memoryOutbox = Object.create(null), storageFailed = false;
var inflight = Object.create(null);
var final = null, degraded = null, full = false, pausedUntil = 0, pollPausedUntil = 0, backoffStep = 0;
var sending = false, polling = false, pollAgain = false, lastOk = 0, netDown = false, busyUntil = 0;
var notices = [];                      /* ticks the service would not take, named plainly */
var needReconcile = false, stale = false, firstUpdated = null, noKey = false;
var offlineReady = false, offlineError = false, ownScriptHash = null, lastCardScriptHash = null, identityFailed = false;
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
function refreshOutbox() {
  var entries = stored('ob.'), ids = Object.create(null);
  entries.forEach(function (e) { ids[e.id] = 1; });
  vals(memoryOutbox).forEach(function (e) { if (!ids[e.id]) entries.push(e); });
  outbox = orderOutbox(entries); sent = stored('sent.');
}
function orderOutbox(entries) {
  var byId = Object.create(null), result = [], visiting = Object.create(null), added = Object.create(null);
  entries.forEach(function (e) { byId[e.id] = e; });
  function add(e) {
    if (added[e.id] || visiting[e.id]) return;
    visiting[e.id] = true;
    (e.undoes || []).forEach(function (id) { if (byId[id]) add(byId[id]); });
    added[e.id] = true; result.push(e);
  }
  entries.sort(function (a, b) { return Date.parse(a.tapped_at) - Date.parse(b.tapped_at) || a.id.localeCompare(b.id); }).forEach(add);
  return result;
}
function queueEvent(e) {
  if (!keep('ob.' + e.id, e)) { memoryOutbox[e.id] = e; storageFailed = true; }
  refreshOutbox();
}
function removeQueued(id) { forget('ob.' + id); delete memoryOutbox[id]; refreshOutbox(); }
function rememberSent(e) {
  if (!keep('sent.' + e.id, wire(e))) { storageFailed = true; return false; }
  sent = stored('sent.'); return true;
}
function saveSnapshot(serverAt) {
  var snap = { id: newId(), epoch: epoch, cursor: cursor, ticks: vals(known).concat(vals(acked).filter(function (e) { return !known[e.id]; })), updated: firstUpdated, serverAt: serverAt };
  if (keep('snapshot.' + snap.id, snap)) {
    cached = snap;
    /* Retain a few immutable snapshots. Never let an older tab replace a newer read. */
    var snapshots = stored('snapshot.').sort(function (a, b) { return b.serverAt - a.serverAt || b.cursor - a.cursor; });
    snapshots.slice(3).forEach(function (x) { forget('snapshot.' + x.id); });
  }
}
function lastTap() {
  var taps = outbox.concat(sent), latest = null;
  taps.forEach(function (t) { var at = Date.parse(t.tapped_at); if (isFinite(at) && at <= now() && (!latest || at > latest.at)) latest = { day: t.day, at: at }; });
  return latest;
}

/* ---- where the phone is: mode, reference, day */
var mode = 'view', curRef = null, curSig = null, hashNote = null, focusArea = null, focusPending = true;
var openAreas = Object.create(null), confirmKey = null, showAll = false;
var pick = null; /* Past-day choices last at most two hours, or 30 minutes without a tap. */
var lastAuto = null, advance = null, drawnDay = null, boundaryTimer = null;
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
function pickEnds() { return pick ? Math.min(pick.expires, pick.late ? pick.activity + HOUR / 2 : Infinity) : 0; }
function shownDay() {
  if (pick && now() >= pickEnds()) pick = null;
  return pick ? pick.day : autoDay(now());
}
function choose(day) {
  var at = now(), auto = autoDay(at), late = day < auto;
  pick = day === auto ? null : { day: day, late: late, activity: at,
    expires: Math.min(dayStart(svcDay(at)) + 24 * HOUR, at + (late ? 2 * HOUR : 24 * HOUR)) };
  advance = null; confirmKey = null;
}
function watchClock() {
  if (!synced) return;
  refreshOutbox();
  var auto = autoDay(now()), previous = lastAuto, tap = lastTap();
  if (previous === null && tap && tap.day < auto && now() - tap.at >= 0 && now() - tap.at < HOUR) previous = tap.day;
  if (previous !== null && auto !== previous) {
    var hadPick = !!pick; shownDay();
    if (!pick) advance = { from: previous, to: auto, grace: !hadPick && !!tap && tap.day === previous && now() - tap.at >= 0 && now() - tap.at < HOUR };
  }
  lastAuto = auto;
}
function armBoundary() {
  clearTimeout(boundaryTimer); if (!synced || final) return;
  var next = dayStart(svcDay(now())) + 24 * HOUR;
  if (pick) next = Math.min(next, pickEnds());
  boundaryTimer = setTimeout(function () { watchClock(); render(); armBoundary(); }, Math.max(1, next - now()));
}
function identityPending() { return !!(lastCardScriptHash && !ownScriptHash); }
function validDrawnDay() {
  watchClock();
  if (!synced || stale || identityPending() || drawnDay !== shownDay()) { confirmKey = null; render(); return false; }
  return dayOpen(drawnDay);
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
  if (j && j.now) { var sn = Date.parse(j.now); if (isFinite(sn)) { offset = sn - (t0 + t1) / 2; synced = true; keep('clock', { offset: offset, at: sn }); armBoundary(); } }
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
        lastCardScriptHash = j.card_script_hash || null;
        stale = !!(ownScriptHash && lastCardScriptHash && ownScriptHash !== lastCardScriptHash) || (Array.isArray(j.days) && JSON.stringify(j.days.map(function (d) { return [d && d.id, d && d.plan]; })) !== MY_DAYS) ||
          (!!j.updated && firstUpdated !== null && String(j.updated) !== firstUpdated);
        var ep = j.epoch == null ? null : String(j.epoch);
        var reset = (ep !== null && epoch !== null && ep !== String(epoch)) || (typeof j.seq === 'number' && j.seq < cursor);
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
        saveSnapshot(Date.parse(j.now) || now());
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
  add.forEach(function (s) { queueEvent(Object.assign({}, s, { requeued: true, tries: 0 })); });
}
function retryAfter(h) { var s = parseInt(h && h.get('Retry-After'), 10); return (isFinite(s) && s > 0 ? Math.min(s, 600) : 30) * 1000; }

function pump() {
  refreshOutbox();
  if (sending || final || !outbox.length) return;
  if (Date.now() < pausedUntil) { schedulePump(pausedUntil - Date.now()); return; }
  var batch = [], size = 12, resumeAt = Infinity;
  for (var i = 0; i < outbox.length; i++) {
    var e = outbox[i], deferred = load('defer.' + e.ref, 0);
    if (deferred > Date.now()) { resumeAt = Math.min(resumeAt, deferred); continue; }
    var s = JSON.stringify(wire(e)).length + 1;
    if (batch.length && (e.solo || batch[0].solo || batch.length >= 20 || size + s > BODY_MAX)) break;
    if (e.done === false && (e.undoes || []).some(function (id) { return batch.some(function (b) { return b.id === id; }); })) break;
    batch.push(e); size += s;
    if (e.solo) break;
  }
  if (!batch.length) { if (isFinite(resumeAt)) schedulePump(resumeAt - Date.now()); return; }
  sending = true;
  batch.forEach(function (e) { e.tries = (e.tries || 0) + 1; inflight[e.id] = 1; });
  render();
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
        var ev = outbox[idx];
        if (!rememberSent(ev)) return; /* keep the durable outbox until the recovery copy is safe */
        removeQueued(ev.id); took++;
        if (sv.voided) return;                        /* set aside on the edit link: it counts for nothing */
        var a = wire(ev); delete a.sig; a.seq = sv.seq; a.at = sv.at; acked[a.id] = a;
      });
      saveSnapshot(Date.parse(j.now) || now());
      render();
      if (!took) { pausedUntil = Date.now() + SLOW_MS; schedulePump(SLOW_MS); poll(); return; }   /* never a tight loop */
      if (outbox.length) pump();
      poll();
      return;
    }
    if (r && r.status === 400 && j && j.code === 'job_cap') {
      full = true; pausedUntil = Date.now() + SLOW_MS; render(); schedulePump(SLOW_MS); poll(); return;
    }
    if (r && [400, 401, 403, 409, 413, 422].indexOf(r.status) >= 0) {
      /* the service names the tick it refused (nothing of that post was kept): drop that one, send the rest */
      var named = null;
      if (j && batch.length > 1) {
        if (typeof j.id === 'string') named = batch.filter(function (e) { return e.id === j.id; })[0] || null;
        if (!named && typeof j.index === 'number' && j.index >= 0 && j.index < batch.length) named = batch[j.index];
      }
      if (!named && batch.length > 1) { batch.forEach(function (e) { e.solo = true; queueEvent(e); }); pump(); return; }
      var bad = named || batch[0];
      if (j && j.code === 'undoes' && bad.done === false) {
        var missing = sent.filter(function (e) { return (bad.undoes || []).indexOf(e.id) >= 0 && !known[e.id]; });
        if (missing.length) {
          missing.forEach(function (e) { queueEvent(Object.assign({}, e, { requeued: true })); });
          pausedUntil = Date.now() + 1000; schedulePump(1000); poll(); return;
        }
      }
      removeQueued(bad.id);
      if (!bad.requeued) notices.push({ id: bad.id, text: tickName(bad) + ': ' + ((j && j.error) || reasonFor(r.status)) });
      render(); pump(); return;
    }
    if (r && (r.status === 404 || r.status === 410) && onRefusal(r.status, j)) { render(); if (!final) schedulePump(pausedUntil - Date.now()); return; }
    if (r && r.status === 429) {
      var retryAt = Date.now() + retryAfter(r.h);
      if (j && REFS[j.ref]) { keep('defer.' + j.ref, retryAt); render(); pump(); return; }
      pausedUntil = busyUntil = retryAt; render(); schedulePump(pausedUntil - Date.now()); return;
    }
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
  if (!validDrawnDay()) return;
  var day = drawnDay;
  var p = key.split('|'), lineId = p[0], task = p[1];
  if (REF_OF_LINE[lineId] !== curRef) return;              /* only this QR code's reference */
  var st = jobStates(allEvents(), now())[jobKey(lineId, task, day)];
  if (st) { confirmKey = confirmKey === key ? null : key; render(); refocus('j-' + key); if (confirmKey) reveal('c-' + key); return; }
  var ev = { id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: true, undoes: [], tapped_at: iso(now()), tries: 0 };
  queueEvent(ev);
  if (pick) pick.activity = now(); confirmKey = null;
  render(); refocus('j-' + key); announce(lineId, task, day); pump();
}
function undoJob(key) {
  if (mode !== 'tick' || final) return;
  if (!validDrawnDay()) return;
  var day = drawnDay, p = key.split('|'), lineId = p[0], task = p[1];
  if (REF_OF_LINE[lineId] !== curRef) return;
  var st = jobStates(allEvents(), now())[jobKey(lineId, task, day)];
  confirmKey = null;
  if (!st) { render(); return; }
  /* Another tab may already be sending this tick. Always queue an explicit undo, with its dependencies first. */
  queueEvent({ id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: false, undoes: st.ids.slice(), tapped_at: iso(now()), tries: 0 });
  if (pick) pick.activity = now();
  render(); refocus('j-' + key);
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
  return 'Contact the Coates events project manager on site.';
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
  else if (netDown || !navigator.onLine) { t = cached ? 'No signal · saved copy ' + savedWhen(cached.serverAt) : 'No signal · waiting for first read'; cls += ' bad'; }
  else if (lastOk) { t = 'Live · updated ' + hms(lastOk + offset); cls += ' live'; }
  else t = cached ? 'Saved copy ' + savedWhen(cached.serverAt) + ' · connecting…' : 'Connecting…';
  el.className = cls; el.textContent = t;
}
function bannersHtml(day, auto) {
  var b = [];
  if (!synced && !final) b.push('<div class="banner info" role="status">Waiting for the service clock. Connect once before ticking.</div>');
  if (identityFailed) b.push('<div class="banner warn" role="alert">This browser could not check the servicing card. Reload it or open it in an up-to-date browser before ticking.</div>');
  if (storageFailed) b.push('<div class="banner warn" role="alert">This phone cannot keep all waiting ticks. Keep this page open and reconnect before leaving.</div>');
  if (final === 'withdrawn') b.push('<div class="banner warn" role="alert"><strong>This tracker has been withdrawn</strong><span>Nothing more can be ticked from this card.' + (waiting() ? ' ' + waiting() + ' unsent tick' + (waiting() === 1 ? ' is' : 's are') + ' kept on this phone.' : '') + ' ' + contactHtml() + '</span></div>');
  if (final === 'expired') b.push('<div class="banner warn" role="alert"><strong>Servicing has finished</strong><span>This card stopped working after Monday 26 Oct.' + (waiting() ? ' ' + waiting() + ' unsent tick' + (waiting() === 1 ? ' is' : 's are') + ' kept on this phone.' : '') + ' ' + contactHtml() + '</span></div>');
  if (!final && degraded === 'updating') b.push('<div class="banner info"><span>The service is being updated. Your ticks are kept on this phone and go when it is back.</span></div>');
  if (!final && degraded === 'no_tracker') b.push('<div class="banner info"><span>Ticking is paused on the service. Your ticks are kept on this phone and go when it is back.</span></div>');
  if (!final && noKey) b.push('<div class="banner warn" role="alert"><span>The service cannot check completion codes right now. Your ticks are kept on this phone. ' + contactHtml() + '</span></div>');
  if (!final && full) b.push('<div class="banner warn"><span>The service could not take more ticks. Your ticks are kept on this phone. ' + contactHtml() + '</span></div>');
  if (pick && pick.day !== auto) b.push('<div class="banner loud" role="alert"><strong>You are on ' + esc(longDay(pick.day)) + '\'s service</strong><span>Today\'s service is ' + esc(longDay(auto)) + '. This choice ends ' + hm(pickEnds()) + ' ' + esc(shortDay(svcDay(pickEnds()))) + ' (or after 30 minutes without a tap for late ticks).</span><div class="bacts"><button class="bbtn" type="button" data-back="1">Back to ' + esc(longDay(auto)) + '</button></div></div>');
  if (advance && !pick) b.push('<div class="banner info" role="status"><strong>Now ' + esc(longDay(advance.to)) + '\'s service</strong><span>It changed at 08:00.' + (advance.grace ? ' Still finishing ' + esc(longDay(advance.from)) + '\'s?' : '') + '</span><div class="bacts">' + (advance.grace ? '<button class="bbtn" type="button" data-stay="' + esc(advance.from) + '">Stay on ' + esc(longDay(advance.from)) + '</button>' : '') + '<button class="bbtn" type="button" data-dismiss="advance">OK</button></div></div>');
  if (svcDay(now()) < DAY_IDS[0] && synced) b.push('<div class="banner info"><span>Servicing has not started. It opens ' + esc(longDay(DAY_IDS[0])) + ' Oct 08:00 if needed, then ' + esc(longDay(FIRST_REAL)) + ' Oct 08:00.' + (mode === 'tick' ? ' Nothing can be ticked yet.' : '') + '</span></div>');
  if (stale && !final) b.push('<div class="banner warn" role="alert"><span>This card has been changed on the service. Reload it to get the new one.</span><div class="bacts"><button class="bbtn" type="button" data-reload="1">Reload</button></div></div>');
  if (hashNote) b.push('<div class="banner info"><span>' + esc(hashNote) + '</span></div>');
  if (notices.length) b.push('<div class="banner warn" role="alert"><span><b>Not saved: ' + notices.length + ' tick' + (notices.length === 1 ? '' : 's') + '</b></span>' + (notices.length === 1 ? '<span>' + esc(notices[0].text) + '</span>' : '<details><summary>More info</summary><ul>' + notices.map(function (n) { return '<li>' + esc(n.text) + '</li>'; }).join('') + '</ul></details>') + '<div class="bacts"><button class="bbtn" type="button" data-dismiss="notices">OK</button></div></div>');
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
  var state = !synced ? 'Waiting for the service clock' : pick && pick.late ? 'Late ticks for ' + longDay(day) + '\'s service' : n < s ? 'Opens ' + d.label + ' 08:00' : n >= e ? 'Closed ' + d.to + ' 08:00' : 'Open now · closes 08:00 ' + d.to;
  return '<span><b>' + esc(d.label + ' 08:00 → ' + d.to + ' 08:00') + '</b>' + (d.ifNeeded ? ' · only if Thursday is serviced' : '') + (d.plan === 'final' ? ' · last night' : '') + '</span><span>' + esc(state) + '</span>';
}
function progHtml(label, s, refWord) {
  return '<div><div class="pl"><span class="pn">' + esc(label) + '</span><em>' + s.pct + '%</em></div>' + bar(s.pct, !!s.finished) +
    '<div class="pm">' + (s.finished ? '<span class="fin">' + (refWord === 'area' ? 'Area finished ' : 'All finished ') + hm(s.finished) + '</span> · ' : '') + s.refsDone + ' of ' + s.refs + ' references · ' + s.d + ' of ' + s.w + ' jobs</div></div>';
}
function taskProgress(refs, day, st) {
  var stats = SvcState.taskStats(D, refs, day, st);
  return '<dl class="task-progress">' + Object.keys(stats).map(function (task) {
    var s = stats[task];
    return '<div><dt>' + esc(TASKS[task] || task) + '</dt><dd>' + s.d + '/' + s.w + ' jobs · ' + s.pct + '%</dd></div>';
  }).join('') + '</dl>';
}
function compactHtml(day, os, st) {
  var a = mode === 'tick' ? AREA_OF[curRef] : null;
  var as = a ? groupStats(a.refs, day, st) : null;
  return '<span class="compact-day">' + esc(shortDay(day)) + '</span>' + (as ? '<span>' + (a.n ? 'Area ' + a.n : esc(a.name)) + ' <b>' + as.pct + '%</b></span>' : '') + '<span>Everything <b>' + os.pct + '%</b></span>';
}
function jobHtml(r, l, task, day, st, open) {
  var key = l.id + '|' + task, s = st[jobKey(l.id, task, day)], label = TASKS[task] || task;
  var cls = 'job' + (s ? (s.local ? ' pending' : ' done') : '');
  var sub = !synced ? 'Waiting for the service clock' : !open ? 'Opens ' + shortDay(day) + ' 08:00' : s ? 'Done ' + hm(s.at) + (s.local ? ' · waiting for signal' : '') : 'Tap when done';
  var aria = label + ', ' + l.label + ', ' + (s ? 'done at ' + hm(s.at) + (s.local ? ', waiting for signal' : '') + '. Tap to undo.' : open ? 'not done yet' : 'not open yet');
  var h = '<button class="' + cls + '" type="button" id="j-' + esc(key) + '" data-job="' + esc(key) + '" aria-pressed="' + (!!s) + '" aria-label="' + esc(aria) + '"' + (open && !final && !stale && !identityPending() ? '' : ' disabled') + '><span class="jbox">' + TICK + '</span><span class="jtxt"><b>' + esc(label) + '</b><small>' + esc(sub) + '</small></span></button>';
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
  h += '<section class="card progress-detail"><h3>' + esc(areaLabel(a)) + ' · jobs</h3>' + taskProgress(a.refs, day, st) + '</section>';
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
      bar(s.pct, !!s.finished) + '</button>' + (isOpen ? '<div class="rows">' + taskProgress(a.refs, day, st) + a.refs.map(function (r) { return orowHtml(r, day, st); }).join('') + '</div>' : '') + '</section>';
  }).join('');
}
function viewHtml(day, st) {
  return '<p class="viewonly">View only. To tick a reference, scan the completion QR code printed for it.</p>' + areasHtml(day, st);
}

var lastParts = {};
function render() {
  var day = shownDay(), auto = autoDay(now());
  drawnDay = day; armBoundary();
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
    compact: compactHtml(day, os, st), readiness: identityPending() ? 'Checking this card before ticking…' : stale ? 'Card changed · reload before ticking' : offlineReady && synced && cached && !storageFailed ? 'Ready for offline scans' : offlineError || storageFailed ? 'Offline scans not ready · keep this tab open with signal' : 'Preparing offline scans…',
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
  if (ds.stay) { choose(ds.stay); render(); return; }
  if (ds.dismiss) { if (ds.dismiss === 'advance') advance = null; else if (ds.dismiss === 'notices') notices = []; else notices.splice(+ds.dismiss.slice(1), 1); render(); }
});
window.addEventListener('hashchange', function () { readHash(); render(); scrollToFocus(); focusPending = true; poll(); });
['touchstart', 'wheel', 'keydown'].forEach(function (t) { window.addEventListener(t, function () { focusPending = false; }, { passive: true }); });
window.addEventListener('online', function () { netDown = false; if (!busyUntil || Date.now() >= busyUntil) { pausedUntil = 0; backoffStep = 0; } poll(); pump(); render(); });
window.addEventListener('offline', function () { netDown = true; render(); });
window.addEventListener('storage', function (ev) {
  if (ev.key && ev.key.indexOf(KEY) !== 0) return;
  refreshOutbox(); watchClock(); render(); if (!sending && outbox.length) schedulePump(250);
});
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { watchClock(); render(); poll(); pump(); } });
/* the sticky header covers the top of the page: the browser's own jump to #a7, and ours, stop below it */
function padForHeader() { var hd = document.querySelector('header'); if (hd) { var tall = hd.offsetHeight > window.innerHeight * .35; hd.style.position = tall ? 'static' : ''; document.documentElement.style.scrollPaddingTop = (tall ? 8 : hd.offsetHeight + 8) + 'px'; } }
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
window.svc1067 = { svcDay: svcDay, autoDay: autoDay, jobStates: jobStates, groupStats: groupStats, refStats: refStats,
  tasksFor: tasksFor, shownDay: shownDay, now: now, offset: function () { return offset; },
  outbox: function () { return outbox.map(wire); }, mode: function () { return mode; }, final: function () { return final; },
  areas: AREAS, days: DAYS };

/* The worker caches only this exact card, never a tick API or the main page. Its acknowledgement is required
   before promising fresh offline scans. A first-ever scan still needs signal. */
function prepareIdentity() {
  if (!crypto.subtle || typeof TextEncoder === 'undefined') { identityFailed = true; return; }
  var script = document.querySelector('script'); if (!script) return;
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(script.textContent)).then(function (bytes) {
    ownScriptHash = 'sha256-' + btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
    if (lastCardScriptHash && ownScriptHash !== lastCardScriptHash) stale = true;
    render();
  }).catch(function () { identityFailed = true; render(); });
}
function prepareOffline() {
  if (!navigator.serviceWorker || TOKEN === 'local') { offlineError = true; render(); return; }
  navigator.serviceWorker.register(PATH + '/sw.js', { scope: PATH, updateViaCache: 'none' }).then(function (reg) {
    function prime(worker) {
      if (!worker) { offlineError = true; render(); return; }
      var channel = new MessageChannel(), timer = setTimeout(function () { offlineError = true; render(); }, 20000);
      channel.port1.onmessage = function (ev) {
        clearTimeout(timer); offlineReady = !!(ev.data && ev.data.ready); offlineError = !offlineReady; render();
      };
      worker.postMessage({ type: 'CACHE_CARD' }, [channel.port2]);
    }
    if (reg.active) prime(reg.active);
    else { var w = reg.installing || reg.waiting;
      if (!w) { offlineError = true; render(); return; }
      w.addEventListener('statechange', function () { if (w.state === 'activated') prime(w); });
    }
  }).catch(function () { offlineError = true; render(); });
}
prepareIdentity();
prepareOffline();
readHash();
render(); scrollToFocus();
poll();
if (outbox.length) pump();
})();
