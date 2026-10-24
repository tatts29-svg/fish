/* Author: Andrew Fisher. v11.87 - message the servicing teams.
   Andrew, 24 Oct 2026: "Lets do a message to if things are missing. We can message each team and let them know. 5 teams when u
   message its send message to both.. clear simple and easy."
   On the Servicing tab (edit link, event tracker only) a card lists the five crew groups with what is still to do on the
   selected night, or what was missed once the night has closed, for the jobs that crew does: cleaners clean & restock, the
   water truck water check & refill, the three pump trucks pump out, and the final night's lock-up for pump trucks and cleaners.
   One button opens a message to both people on that crew, sent through the service's own texting (/api/sms, with a result
   for each number, as the v7.77 Text drawer) or from the phone's own Messages. Every job comes from SvcState on the panel's
   own reading (SvcScope1170's active list), so the card can never disagree with the meters above it.
   The two numbers for each crew are kept on this phone only (localStorage). They are never written to the record, the page
   or a log. Nothing here ticks a job or changes a tracker, a crew card, a QR code or a charge. */
var SvcTeams1187 = (function () {
'use strict';
var MAX = 480;                                       /* the service's own wall (SMS_MAX_CHARS, /api/sms max_characters) */
var KEY = 'gc500.teams1187.numbers';
var TASKS = {cleaners: ['clean', 'lockup'], pump1: ['pump', 'lockup'], pump2: ['pump', 'lockup'], pump3: ['pump', 'lockup'], water: ['refill']};
var WORDS = {pump: 'pump out', clean: 'clean & restock', refill: 'water check & refill', lockup: 'final lock-up'};
var ORDER = ['pump', 'clean', 'refill', 'lockup'];

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; });
}
/* "Pump truck — AJ & Kelly" -> role "Pump truck", names ["AJ", "Kelly"] */
function people(label) {
  var s = String(label || '').trim(), i = s.search(/\s[—–-]\s/);
  var role = (i > 0 ? s.slice(0, i) : s).trim(), rest = i > 0 ? s.slice(i + 3).trim() : '';
  var names = rest.split(/\s*(?:&|\+|,|\band\b)\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
  return {role: role || 'Crew', names: names, both: names.join(' & ')};
}
/* "Area 3 Island West" from "Island West — EVL, Race Admin & Merch"; the number is what the crews' cards and the map show */
function areaLabel(a, full) {
  if (!a || !a.n) return 'No area yet';
  if (!full) return 'Area ' + a.n;
  var name = String(a.name || '').split(/\s+[—–\/(]\s*|,\s*|\s+&\s+/)[0].trim();
  return 'Area ' + a.n + (name ? ' ' + name : '');
}
function words(kinds) {
  var w = ORDER.filter(function (k) { return kinds.indexOf(k) >= 0; }).map(function (k) { return WORDS[k]; });
  return w.join(', ');
}
/* GSM plain characters only: one odd character makes every text hold 70 characters instead of 160 */
function plain(s) {
  var t = String(s || '').replace(/[—–]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/×/g, 'x').replace(/·/g, '-');
  if (typeof text747Plain === 'function') { try { return text747Plain(t); } catch (e) {} }
  return t.normalize('NFKD').replace(/[^\n\x20-\x7e]/g, '');
}
function crews(data) {
  var d = data || (typeof SVC1067_CARD === 'object' && SVC1067_CARD && SVC1067_CARD.data) || {};
  var list = typeof SvcCrews1173 === 'object' && SvcCrews1173 ? SvcCrews1173.choices(d) : (d.crewGroups || []);
  return list.filter(function (g) { return g && TASKS[g.id]; });
}

/* What one crew still has to do on a night: its jobs not saved complete, by area, in the panel's own reading. */
function plan(M, id) {
  var S = M.S, D = M.D, cfg = {plans: D.plans, days: D.days, extras: D.extras}, day = M.day, want = TASKS[id] || [];
  var st = S.jobStates(M.events || [], M.now), saved = Object.create(null);
  Object.keys(st).forEach(function (k) { if (!st[k].local) saved[k] = st[k]; });
  var areas = [], places = 0, jobs = 0, kinds = [], doneRefs = 0;
  D.areas.forEach(function (a) {
    var refs = [];
    a.refs.forEach(function (r) {
      var lines = Object.create(null), missing = false, did = false;
      r.lines.forEach(function (l) {
        S.countedFor(cfg, l, day).forEach(function (t) {
          if (want.indexOf(t) < 0) return;
          jobs++; if (kinds.indexOf(t) < 0) kinds.push(t);
          var s = saved[S.jobKey(l.id, t, day)];
          if (!s) { missing = true; lines[l.id] = l.qty || 1; }
          else if (Array.isArray(s.crews) && s.crews.indexOf(id) >= 0) did = true;
        });
      });
      if (missing) refs.push({ref: r.ref, qty: Object.keys(lines).reduce(function (n, k) { return n + lines[k]; }, 0)});
      if (did) doneRefs++;
    });
    if (refs.length) { areas.push({n: a.n, name: a.name, refs: refs}); places += refs.length; }
  });
  var d = S.dayOf(cfg, day), start = S.dayStart(day);
  return {id: id, day: day, dayLabel: ((d && d.label) || day) + ' night', closed: M.now >= start + 24 * S.HOUR, started: M.now >= start,
    kinds: kinds, areas: areas, places: places, jobs: jobs, doneRefs: doneRefs, at: M.now, hm: S.hm(M.now)};
}

/* "Areas 4-14 and no area yet" */
function areaList(rest) {
  var ns = rest.map(function (a) { return a.n; }).filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; }), parts = [], i = 0;
  while (i < ns.length) {
    var j = i; while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    parts.push(j > i + 1 ? ns[i] + '-' + ns[j] : j === i + 1 ? ns[i] + ', ' + ns[j] : String(ns[i])); i = j + 1;
  }
  var txt = parts.length ? (ns.length === 1 ? 'Area ' : 'Areas ') + parts.join(', ') : '';
  if (rest.some(function (a) { return !a.n; })) txt += (txt ? ' and ' : '') + 'no area yet';
  return txt;
}
/* The text: who it is for, the night, what is still to do (or missed), place by place under its area, at most 480 characters. */
function compose(P, team, opt) {
  opt = opt || {};
  var pick = Array.isArray(opt.areas) ? opt.areas : null, sign = plain(opt.sign || 'Andrew') || 'Andrew';
  var hi = team.both ? 'Hi ' + team.both : 'Hi team', w = words(P.kinds);
  var sel = P.areas.filter(function (a) { return !pick || pick.indexOf(a.n) >= 0; });
  var count = sel.reduce(function (n, a) { return n + a.refs.length; }, 0);
  if (!P.jobs) return plain(hi + ' - GC500 servicing, ' + P.dayLabel + ': there are no jobs for your crew on this night. Thanks, ' + sign);
  if (!count) return plain(hi + ' - GC500 servicing, ' + P.dayLabel + ': ' + (P.closed ? 'every ' + w + ' was done' : 'all your ' + w + ' is done') + '. Great work, thank you. ' + sign);
  var many = count + (count === 1 ? ' place' : ' places');
  var head = P.closed ? hi + ' - GC500 servicing. Missed on ' + P.dayLabel + ' - ' + w + ' (' + many + '):'
    : hi + ' - GC500 servicing, ' + P.dayLabel + '. Still to do - ' + w + ' (' + many + '):';
  var tail = (P.closed ? 'Please make sure these are looked after. ' : 'Please get to these and scan the QR at each one when done. ') + 'Thanks, ' + sign;
  var line = function (a, lvl) {
    return areaLabel(a, lvl <= 2) + ': ' + a.refs.map(function (r) { return r.ref + (lvl === 1 && r.qty > 1 ? ' x' + r.qty : ''); }).join(', ');
  };
  for (var lvl = 1; lvl <= 3; lvl++) {
    var text = plain([head].concat(sel.map(function (a) { return line(a, lvl); }), [tail]).join('\n'));
    if (text.length <= MAX) return text;
  }
  /* Too long for one send: as many whole areas as fit (with their names if they still fit), then where the rest are. */
  var best = null;
  [2, 3].forEach(function (lvl) {
    for (var k = sel.length - 1; k >= 0; k--) {
      var rest = sel.slice(k), left = rest.reduce(function (n, a) { return n + a.refs.length; }, 0);
      var more = '+ ' + left + ' more in ' + areaList(rest) + ' (see Not done yet on the servicing card)';
      var cut = plain([head].concat(sel.slice(0, k).map(function (a) { return line(a, lvl); }), [more, tail]).join('\n'));
      if (cut.length <= MAX) { if (!best || k > best.k) best = {k: k, text: cut}; return; }
    }
  });
  return best ? best.text : plain(head + '\nSee Not done yet on the servicing card.\n' + tail).slice(0, MAX);
}

/* The card on the Servicing panel (an escaped HTML string, drawn and reconciled with the rest of the panel). */
function cardHtml(M, data) {
  if (!M || M.operational1160 !== true || M.example) return '';
  var groups = crews(data); if (!groups.length) return '';
  var first = plan(M, groups[0].id);
  var rows = groups.map(function (g) {
    var P = g.id === first.id ? first : plan(M, g.id), t = people(g.label), w = words(P.kinds);
    var status, button = '';
    if (!P.jobs) status = '<span class="teams1187-none">No jobs on this night</span>';
    else if (P.places) status = '<b>' + P.places + '</b> ' + (P.closed ? 'missed' : 'still to do') + ' · ' + esc(w);
    else status = '<span class="teams1187-ok">' + (P.closed ? 'Nothing missed' : 'All done') + '</span> · ' + esc(w);
    if (P.doneRefs) status = '<span class="teams1187-did">' + P.doneRefs + ' done' + (P.closed ? '' : ' tonight') + '</span> · ' + status;
    if (P.jobs) button = '<button type="button" class="btn' + (P.places ? ' primary' : '') + '" data-teams1187="' + esc(g.id) + '">' + (P.places ? 'Message' : 'Say thanks') + '</button>';
    return '<div class="teams1187-row ' + esc(g.id.replace(/\d+$/, '')) + (P.jobs && !P.places ? ' done' : '') + '" data-svc1102-key="teams1187-' + esc(g.id) + '">' +
      '<span class="teams1187-who"><b>' + esc(t.role) + '</b><span>' + esc(t.both || g.label) + '</span></span>' +
      '<span class="teams1187-state">' + status + '</span>' + button + '</div>';
  }).join('');
  return '<section class="teams1187" data-svc1102-key="panel-teams1187" aria-labelledby="teams1187-h">' +
    '<div class="teams1187-head"><h4 id="teams1187-h">Message the teams</h4><span>' + esc(first.dayLabel) + ' · ' + (first.closed ? 'missed' : 'still to do') + '</span></div>' +
    '<div class="teams1187-list">' + rows + '</div>' +
    '<p class="teams1187-note">One text goes to both people on the crew. Their numbers stay on this phone.</p></section>';
}

function number(v) {
  if (typeof sms777Number === 'function') return sms777Number(v);
  var n = String(v == null ? '' : v).replace(/[^\d+]/g, '');
  if (/^04\d{8}$/.test(n)) return '+61' + n.slice(1);
  if (/^4\d{8}$/.test(n)) return '+61' + n;
  if (/^614\d{8}$/.test(n)) return '+' + n;
  return n;
}
function mobile(n) { return /^\+614\d{8}$/.test(n); }
/* The phone's own Messages with both numbers: iPhones take /open?addresses=, other phones a comma list. */
function smsLink(nums, body, ua) {
  var b = encodeURIComponent(body || ''), list = (nums || []).filter(Boolean);
  if (!list.length) return 'sms:?&body=' + b;
  var ios = /iPad|iPhone|iPod/.test(ua || '') || /Macintosh/.test(ua || '') && /Mobile/.test(ua || '');
  return ios ? 'sms:/open?addresses=' + list.join(',') + '&body=' + b : 'sms:' + list.join(',') + '?body=' + b;
}

return {MAX: MAX, KEY: KEY, TASKS: TASKS, people: people, areaLabel: areaLabel, areaList: areaList, words: words, plain: plain, crews: crews, plan: plan,
  compose: compose, cardHtml: cardHtml, number: number, mobile: mobile, smsLink: smsLink, esc: esc};
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcTeams1187;

/* Author: Andrew Fisher. The card on the panel and the message drawer. Reads only what the panel already read; writes nothing
   to the record. A text leaves only when the Send button is pressed, through the same service route as the Text drawer. */
(function (W) {
'use strict';
if (typeof document === 'undefined' || typeof SvcPanel !== 'object' || !SvcPanel || SvcPanel.teams1187) return;
var T = SvcTeams1187, last = null, drawer = null;
function editable() {
  return typeof capability === 'function' && capability() === 'edit' && typeof SYNC !== 'undefined' && !SYNC.readonly && SYNC.claims !== 'view' && SYNC.level === 'edit';
}
var base = SvcPanel.svcPanelHtml;
SvcPanel.svcPanelHtml = function (M) {
  var html = base.apply(this, arguments);
  try {
    var card = T.cardHtml(M); last = card ? M : null;
    if (!card) return html;
    var at = html.indexOf('<div class="svc-areas">');           /* straight after the pump / clean / water meters */
    return at >= 0 ? html.slice(0, at) + card + html.slice(at) : html + card;
  } catch (e) { last = null; return html; }
};
SvcPanel.teams1187 = true;

function stored() { try { var j = JSON.parse(localStorage.getItem(T.KEY) || '{}'); return j && typeof j === 'object' ? j : {}; } catch (e) { return {}; } }
function store(id, list, keep) {
  try {
    var j = stored();
    if (keep && list.some(Boolean)) j[id] = list; else delete j[id];
    if (Object.keys(j).length) localStorage.setItem(T.KEY, JSON.stringify(j)); else localStorage.removeItem(T.KEY);
  } catch (e) {}
}
function signName() {
  var who = document.getElementById('who'), v = who && who.value ? String(who.value).trim() : '';
  var first = v.split(/\s+/)[0];
  return /^[A-Za-z][A-Za-z'-]{1,20}$/.test(first || '') ? first : 'Andrew';
}
function token() { return typeof tokenOf === 'function' ? tokenOf() : ''; }
function close() { if (drawer) { var d = drawer; drawer = null; d.remove(); } }

async function open(id) {
  if (!editable() || !last) return;
  var g = T.crews().filter(function (x) { return x.id === id; })[0]; if (!g) return;
  close();
  var M = last, P = T.plan(M, id), team = T.people(g.label), names = team.names.slice(0, 2);
  while (names.length < 2) names.push(names.length ? 'Second person' : 'First person');
  var keepList = stored()[id] || ['', ''];
  var max = typeof TEXT747_SERVICE_MAX === 'number' ? Math.min(TEXT747_SERVICE_MAX, T.MAX) : T.MAX;
  var d = document.createElement('div'); drawer = d;
  d.className = 'drawer on teams1187-drawer'; d.style.zIndex = 31; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 't1187h');
  var shared = /^pump\d$/.test(id);
  d.innerHTML = '<div class="dh"><div><h2 id="t1187h">Message ' + T.esc(team.role) + (team.both ? ' · ' + T.esc(team.both) : '') + '</h2>' +
    '<div class="sub">' + T.esc(P.dayLabel) + ' · ' + (P.places ? P.places + (P.places === 1 ? ' place ' : ' places ') + (P.closed ? 'missed' : 'still to do') : (P.jobs ? 'nothing ' + (P.closed ? 'missed' : 'left') : 'no jobs')) +
    ' · as at ' + T.esc(P.hm) + '</div></div><button class="close" type="button" aria-label="Close" title="Close">&times;</button></div>' +
    '<div class="db">' +
    '<div class="teams1187-nums">' + [0, 1].map(function (i) {
      return '<div class="f"><label for="t1187n' + i + '">' + T.esc(names[i]) + '’s mobile</label><input id="t1187n' + i + '" type="tel" inputmode="tel" autocomplete="off" placeholder="04xx xxx xxx" value="' + T.esc(keepList[i] || '') + '"></div>';
    }).join('') + '</div>' +
    '<label class="teams1187-keep"><input type="checkbox" id="t1187keep"' + (stored()[id] || !Object.keys(stored()).length ? ' checked' : '') + '> Keep these numbers on this phone only</label>' +
    '<details class="teams1187-areas" id="t1187areas"><summary>Areas in the message · <span id="t1187areasum"></span></summary><div class="teams1187-arealist"></div>' +
      (shared ? '<p class="hint">The three pump trucks share these jobs. Untick any area another truck is doing.</p>' : '') + '</details>' +
    '<div class="f"><label for="t1187tx">Message</label><textarea id="t1187tx" rows="9" style="width:100%;font:inherit"></textarea></div>' +
    '<p class="hint" id="t1187count"></p><p class="hint" id="t1187msg" role="status" aria-live="polite"></p><div id="t1187res" aria-live="polite"></div>' +
    '<div class="df teams1187-buttons" style="padding:0">' +
    '<button class="btn primary" id="t1187go" type="button">Send to both</button>' +
    '<button class="btn" id="t1187check" type="button" hidden>Check delivery</button>' +
    '<button class="btn ghost" id="t1187again" type="button" hidden>Prepare another message</button>' +
    '<a class="btn" id="t1187phone" href="sms:">Text from my phone instead</a>' +
    '<button class="btn ghost" id="t1187copy" type="button">Copy the words</button>' +
    '<button class="btn ghost" id="t1187fresh" type="button">Update the list</button></div></div>';
  if (typeof mounted === 'function') mounted(document.body.appendChild(d)); else document.body.appendChild(d);
  var $ = function (s) { return d.querySelector(s); };
  var tx = $('#t1187tx'), msg = $('#t1187msg'), res = $('#t1187res'), go = $('#t1187go'), check = $('#t1187check'), again = $('#t1187again');
  var ready = false, busy = false, locked = false, rows = [];
  function picked() { return Array.from(d.querySelectorAll('[data-t1187-area]')).filter(function (b) { return b.checked; }).map(function (b) { return Number(b.getAttribute('data-t1187-area')); }); }
  function unpicked() { return Array.from(d.querySelectorAll('[data-t1187-area]')).filter(function (b) { return !b.checked; }).map(function (b) { return Number(b.getAttribute('data-t1187-area')); }); }
  function boxes(off) {
    var fs = $('#t1187areas'); off = off || [];
    fs.querySelector('.teams1187-arealist').innerHTML = P.areas.map(function (a) {
      return '<label class="teams1187-area"><input type="checkbox" data-t1187-area="' + T.esc(a.n) + '"' + (off.indexOf(a.n) >= 0 ? '' : ' checked') + '> <span>' +
        T.esc(T.areaLabel(a, true)) + ' <small>(' + a.refs.length + ')</small></span></label>';
    }).join('');
    fs.hidden = !P.areas.length;
    fs.querySelectorAll('[data-t1187-area]').forEach(function (b) { b.addEventListener('change', compose); });
  }
  function vals() { return [0, 1].map(function (i) { return T.number($('#t1187n' + i).value); }); }
  function nums() { return vals().filter(Boolean); }
  function good() { return nums().filter(T.mobile); }
  function compose() {
    var on = picked().length, all = P.areas.length;
    $('#t1187areasum').textContent = on === all ? 'all ' + all : on + ' of ' + all;
    tx.value = T.compose(P, team, {areas: picked(), sign: signName()}); refresh();
  }
  function refresh() {
    var n = good(), all = nums(), len = tx.value.length;
    $('#t1187count').textContent = len + ' of ' + max + ' characters' + (len > max ? ' — trim it before sending' : '');
    $('#t1187phone').href = T.smsLink(n, tx.value, navigator.userAgent);
    var v = vals(), one = v.map(T.mobile);
    go.textContent = n.length === 1 && all.length === 1 ? 'Send to ' + names[one.indexOf(true)] : 'Send to both';
    go.hidden = !ready;
    go.disabled = busy || locked || !n.length || n.length !== all.length || len > max || !len;
    go.style.opacity = go.disabled ? '0.45' : ''; go.style.cursor = go.disabled ? 'not-allowed' : '';
    check.hidden = !rows.some(function (r) { return r.message_id; }); check.disabled = busy;
    again.hidden = !locked; again.disabled = busy;
    if (!busy && !locked && all.length !== n.length) msg.textContent = 'Check the numbers — each needs to be an Australian mobile, 04xx xxx xxx.';
  }
  function remember() {
    var raw = [0, 1].map(function (i) { var x = $('#t1187n' + i).value.trim(); return T.mobile(T.number(x)) ? x : ''; });
    store(id, raw, $('#t1187keep').checked);
  }
  d.querySelector('.close').onclick = close;
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  [0, 1].forEach(function (i) { var el = $('#t1187n' + i); el.addEventListener('input', function () { msg.textContent = ''; refresh(); }); el.addEventListener('change', remember); });
  $('#t1187keep').addEventListener('change', remember);
  tx.addEventListener('input', refresh);
  $('#t1187phone').addEventListener('click', remember);
  $('#t1187copy').onclick = async function () {
    try { await navigator.clipboard.writeText(tx.value); msg.textContent = 'Copied.'; }
    catch (e) { tx.focus(); tx.select(); msg.textContent = 'Select the words and copy them.'; }
  };
  $('#t1187fresh').onclick = function () {
    if (locked || busy) return;
    if (!last || last.day !== P.day) { msg.textContent = 'The panel is showing another night, so this list stays as it was.'; return; }
    var off = unpicked(); P = T.plan(last, id); boxes(off); compose();
    msg.textContent = 'List updated as at ' + P.hm + '.';
  };
  boxes([]); compose();
  try {
    var r = await fetch('/api/sms', {headers: {'x-gc500-token': token()}, cache: 'no-store'}), j = await r.json();
    ready = !!(r.ok && j && j.configured) && editable();
    if (!ready) msg.textContent = 'Texting is not switched on here. Use Text from my phone instead, or copy the words.';
    else if (j.today && typeof j.today.left === 'number') msg.textContent = j.today.left + ' of today’s ' + j.today.cap + ' texts left.';
  } catch (e) { ready = false; msg.textContent = 'The texting service did not answer. Use Text from my phone instead, or copy the words.'; }
  if (drawer !== d) return;
  refresh();
  var empty = [0, 1].map(function (i) { return $('#t1187n' + i); }).filter(function (el) { return !el.value; })[0];
  (empty || (go.hidden ? $('#t1187phone') : go)).focus({preventScroll: true});

  go.onclick = async function () {
    if (busy || locked || !ready) return;
    if (!editable()) { msg.textContent = 'The edit link is no longer connected. Nothing was sent.'; return; }
    var to = good();
    if (!to.length || to.length !== nums().length) { refresh(); return; }
    if (tx.value.length > max) { msg.textContent = 'Trim the message before sending.'; return; }
    remember(); busy = true; refresh(); msg.textContent = 'Sending…';
    try {
      var who = document.getElementById('who');
      var resp = await fetch('/api/sms', {method: 'POST', headers: {'Content-Type': 'application/json', 'x-gc500-token': token(),
        'x-gc500-who': (who && who.value || '').trim() || 'unnamed'}, body: JSON.stringify({to: to, text: tx.value, dry_run: false})});
      var body = await resp.json();
      rows = typeof sms777Submission === 'function' ? sms777Submission(body, to) : to.map(function (n) { return {to: n, accepted: false, rejected: false, delivery_status: 'unknown'}; });
      if ([400, 401, 403, 413, 429, 501].indexOf(resp.status) >= 0 && !Array.isArray(body.messages)) rows.forEach(function (row) { row.rejected = true; row.delivery_status = 'failed'; row.submission_status = 'NOT_SUBMITTED'; });
      locked = rows.some(function (row) { return !row.rejected; });
      var ok = rows.filter(function (row) { return row.accepted; }).length, bad = rows.filter(function (row) { return row.rejected; }).length;
      msg.textContent = ok === rows.length ? 'Sent to ' + (ok === 2 ? 'both' : ok === 1 ? 'one number' : ok + ' numbers') + '. The messaging service accepted it; delivery is not confirmed yet.'
        : ok ? ok + ' of ' + rows.length + ' accepted. ' + bad + ' not accepted — see each number below.'
        : bad === rows.length ? 'The messaging service did not accept it. ' + (body.error || 'Check each number below.')
        : 'The send result is unknown. Check delivery before trying again.';
    } catch (e) {
      rows = typeof sms777Submission === 'function' ? sms777Submission({}, to) : [];
      locked = true; msg.textContent = 'The connection ended before the answer came back. It may have been sent. Check delivery before trying again.';
    } finally {
      busy = false;
      if (typeof sms777Results === 'function') sms777Results(res, rows);
      refresh();
    }
  };
  check.onclick = async function () {
    var ids = rows.filter(function (row) { return row.message_id; }).map(function (row) { return row.message_id; });
    if (!ids.length || busy) return;
    busy = true; refresh(); msg.textContent = 'Checking delivery…';
    try {
      var r2 = await fetch('/api/sms/status?ids=' + encodeURIComponent(ids.join(',')), {headers: {'x-gc500-token': token()}, cache: 'no-store'});
      if (r2.status === 404 || r2.status === 501) { msg.textContent = 'Delivery tracking is not available. Nothing was sent again.'; return; }
      var j2 = await r2.json(), reports = Array.isArray(j2.messages) ? j2.messages : [];
      rows = rows.map(function (row) {
        var rep = reports.filter(function (x) { return x.message_id === row.message_id && (!x.to || T.number(x.to) === row.to); })[0];
        if (!row.message_id || !rep || row.rejected) return row;
        var state = ['delivered', 'pending', 'failed', 'unknown', 'unsupported'].indexOf(rep.delivery_status) >= 0 ? rep.delivery_status : 'unknown';
        return Object.assign({}, row, {delivery_status: state, status_code: rep.status_code, error_code: rep.error_code, provider_status: rep.provider_status, note: rep.note});
      });
      msg.textContent = rows.every(function (row) { return row.delivery_status === 'delivered'; }) ? 'Delivered to both phones.' : 'Each number has its own result below. Nothing was sent again.';
    } catch (e) { msg.textContent = 'The delivery check lost its connection. Nothing was sent again.'; }
    finally { busy = false; if (typeof sms777Results === 'function') sms777Results(res, rows); refresh(); }
  };
  again.onclick = function () {
    if (busy) return;
    if (!confirm('That message may already have arrived. Another one could be a duplicate. Prepare another message?')) return;
    locked = false; rows = []; res.innerHTML = ''; msg.textContent = 'Check the numbers and the message before pressing Send.'; refresh();
  };
}

document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('[data-teams1187]') : null;
  if (!b) return;
  e.preventDefault(); open(b.getAttribute('data-teams1187'));
});
if (typeof W.applyCapability === 'function') {
  var apply = W.applyCapability;
  W.applyCapability = function () { var out = apply.apply(this, arguments); if (!editable()) { close(); last = null; } return out; };
}
W.addEventListener('pagehide', close);
W.gc500Teams1187 = {open: open, close: close, last: function () { return last; }};
})(typeof window === 'object' ? window : {});
