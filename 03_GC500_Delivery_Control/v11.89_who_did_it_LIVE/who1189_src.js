/* Author: Andrew Fisher. v11.89 - servicing: tap a place to see who did it.
   Andrew, 24 Oct 2026: "Also i want to be able to tap on something thats already been done find out who did it. So much was missed
   last night."
   On the Servicing tab (edit link, event tracker): tap any place in an area table, or "Who did it" beside "Share map + jobs" on the
   servicing map, for a sheet of that place's jobs on the selected night - the time each was done and the crew saved with it, every
   tick, untick and cancel in order, and for a job not done, whose job it is (cleaners, the water truck, the three pump trucks). Tap a
   crew's done count on "Message the teams" for every place saved with that crew's name.
   The crew is only what the completion itself carries (crew_group, kept from the crew cards' update on Sat 24 Oct, 10:20). Friday's
   completions were saved before that: they show the job and the time, and say the crew was not recorded. No crew is ever guessed.
   Also: in the area tables the crew sat beside the time and ran into the next column on a phone; it now sits under the time, the
   people's names only, and "Group not recorded" is said once in the sheet instead of in every cell. And the area tables and the
   shift report printed a saved crew as "Crew group cleaners" (they looked the label up in the reference list, which has no crew
   groups); they now read the crew card's own list. Reads only what the panel read; writes nothing. */
var SvcWho1189 = (function () {
'use strict';
var SINCE = Date.parse('2026-10-24T10:20:44+10:00');      /* the crew cards started saving the crew group (v11.73 crew page live) */
var WHOSE = {clean: ['cleaners'], refill: ['water'], pump: ['pump1', 'pump2', 'pump3'], lockup: ['pump1', 'pump2', 'pump3', 'cleaners']};
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function groups(data) {
  var d = data || (typeof SVC1067_CARD === 'object' && SVC1067_CARD && SVC1067_CARD.data) || {};
  return typeof SvcCrews1173 === 'object' && SvcCrews1173 ? SvcCrews1173.choices(d) : (d.crewGroups || []);
}
/* "Pump truck — AJ & Kelly" -> {role: "Pump truck", names: "AJ & Kelly"} */
function split(label) {
  var s = String(label || ''), i = s.search(/\s[—–-]\s/);
  return i > 0 ? {role: s.slice(0, i).trim(), names: s.slice(i + 3).trim()} : {role: s.trim(), names: ''};
}
function crewWords(data, id) {
  var g = groups(data).filter(function (x) { return x.id === id; })[0];
  if (!g) return {id: id, label: 'Crew ' + id, role: 'Crew', names: id};
  var p = split(g.label); return {id: id, label: g.label, role: p.role, names: p.names || p.role};
}
function tapAt(e) { var t = Date.parse(e.tapped_at), a = Date.parse(e.at); return isFinite(t) ? (isFinite(a) && t > a ? a : t) : (isFinite(a) ? a : 0); }

/* Everything the record holds about one place's jobs on the selected night. */
function place(M, ref) {
  var S = M.S, D = M.D, cfg = {plans: D.plans, days: D.days, extras: D.extras}, day = M.day, events = M.events || [];
  var area = null, r = null;
  D.areas.forEach(function (a) { a.refs.forEach(function (x) { if (!r && x.ref === ref) { r = x; area = a; } }); });
  if (!r) return null;
  var st = S.jobStates(events, M.now), closed = M.now >= S.dayStart(day) + 24 * S.HOUR, d = S.dayOf(cfg, day);
  var voided = Object.create(null);
  events.forEach(function (e) {
    if (!e) return;
    if (e.void || e.voided) voided[e.id] = {at: tapAt(e)};
    if (Array.isArray(e.voids)) e.voids.forEach(function (id) { voided[id] = {at: tapAt(e)}; });
  });
  var unrecorded = false, before = false;
  var lines = r.lines.map(function (l) {
    var jobs = S.tasksFor(cfg, l, day).map(function (t) {
      var mine = events.filter(function (e) { return e && e.line === l.id && e.task === t && e.day === day && (e.done === true || e.done === false); });
      var undone = Object.create(null);
      mine.forEach(function (e) { if (e.done === false && Array.isArray(e.undoes)) e.undoes.forEach(function (id) { undone[id] = 1; }); });
      var log = [];
      mine.forEach(function (e) {
        var c = SvcCrews1173.valid(e.crew_group) ? crewWords(null, e.crew_group) : null, at = tapAt(e);
        if (e.done === true) log.push({kind: 'ticked', at: at, crew: c, local: !!e.local, undone: !!undone[e.id], voided: !!voided[e.id], early: at < SINCE});
        else log.push({kind: 'unticked', at: at, crew: c, local: !!e.local});
        if (e.done === true && voided[e.id]) log.push({kind: 'cancelled', at: voided[e.id].at || at, crew: null});
      });
      log.sort(function (a, b) { return a.at - b.at; });
      var s = st[S.jobKey(l.id, t, day)], state = s ? (s.local ? 'pending' : 'done') : (closed ? 'missed' : 'todo');
      var by = [], none = false;
      if (s) {
        /* as SvcCrews1173.text: a tick still waiting to sync keeps its crew apart until it is saved */
        ((s.local ? s.pendingCrews : s.crews) || []).forEach(function (id) { by.push(crewWords(null, id)); });
        if ((s.local ? s.pendingUnassigned : s.unassigned) || !by.length) {
          none = true;
          if (s.at < SINCE) before = true;
          unrecorded = true;
        }
      }
      return {task: t, label: D.tasks[t] || t, extra: S.isExtra(cfg, t), state: state, at: s ? s.at : 0, by: by, none: none, early: s ? s.at < SINCE : false,
        log: log, whose: (WHOSE[t] || []).map(function (id) { return crewWords(null, id); })};
    });
    return {id: l.id, label: l.label || l.kind, qty: l.qty, jobs: jobs};
  });
  return {ref: r.ref, area: area, day: day, dayLabel: ((d && d.label) || day) + ' night', closed: closed, hm: S.hm(M.now), lines: lines, unrecorded: unrecorded, before: before};
}

/* Every place saved with one crew's name on the selected night. The places are counted as "Message the teams" counts that crew's
   done places (its own counted jobs), so the number tapped is the number listed; any other crew's job saved with its name is listed
   apart. */
function crewPlaces(M, id) {
  var S = M.S, D = M.D, cfg = {plans: D.plans, days: D.days, extras: D.extras}, day = M.day;
  var st = S.jobStates(M.events || [], M.now), d = S.dayOf(cfg, day), areas = [], other = [], count = 0, jobs = 0;
  D.areas.forEach(function (a) {
    var refs = [];
    a.refs.forEach(function (r) {
      var done = [], also = [];
      r.lines.forEach(function (l) {
        var counted = S.countedFor(cfg, l, day);
        S.tasksFor(cfg, l, day).forEach(function (t) {
          var s = st[S.jobKey(l.id, t, day)];
          if (!s || s.local || (s.crews || []).indexOf(id) < 0) return;
          var j = {task: t, label: D.tasks[t] || t, at: s.at, line: r.lines.length > 1 ? (l.label || l.kind) : ''};
          ((WHOSE[t] || []).indexOf(id) >= 0 && counted.indexOf(t) >= 0 ? done : also).push(j);
        });
      });
      var by = function (x, y) { return x.at - y.at; };
      if (done.length) { refs.push({ref: r.ref, done: done.concat(also).sort(by)}); jobs += done.length; }
      else if (also.length) other.push({ref: r.ref, area: a.n, done: also.sort(by)});
    });
    if (refs.length) { areas.push({n: a.n, name: a.name, refs: refs}); count += refs.length; }
  });
  return {crew: crewWords(null, id), day: day, dayLabel: ((d && d.label) || day) + ' night', areas: areas, other: other, places: count, jobs: jobs, hm: S.hm(M.now),
    before: M.now >= SINCE && S.dayStart(day) + 24 * S.HOUR <= SINCE, own: Object.keys(WHOSE).filter(function (t) { return WHOSE[t].indexOf(id) >= 0; })};
}

function crewName(c) { return c ? c.names + (c.role && c.role !== c.names ? ' · ' + c.role : '') : ''; }
function placeHtml(P, S) {
  if (!P) return '<p>No servicing jobs at this place on this night.</p>';
  var h = '<p class="who1189-area">' + (P.area && P.area.n ? 'Area ' + esc(P.area.n) + ' · ' : '') + esc(P.area ? P.area.name : '') + '</p>';
  P.lines.forEach(function (l) {
    h += '<section class="who1189-line">' + (P.lines.length > 1 || l.qty > 1 ? '<h3>' + esc(String(l.label).replace(/×/g, '×')) + '</h3>' : '') + '<ul class="who1189-jobs">';
    l.jobs.forEach(function (j) {
      var st = j.state === 'done' ? '✓ Done ' + esc(S.hm(j.at)) : j.state === 'pending' ? 'Waiting to sync' : j.state === 'missed' ? 'Missed' : 'Not done yet';
      var by = '';
      if (j.state === 'done' || j.state === 'pending') {
        by = j.by.length ? 'By ' + j.by.map(function (c) { return esc(crewName(c)); }).join(' and ') + (j.none ? ' · one tick has no crew' : '')
          : (j.early ? 'Crew not recorded · saved before crew names were kept' : 'Crew not recorded · the crew page used did not send one');
      } else if (j.whose.length) {
        by = (j.whose.length > 1 ? 'Whose job: the ' + (j.task === 'lockup' ? 'pump trucks and the cleaners' : 'pump trucks') + ' (' : 'Whose job: ') +
          j.whose.map(function (c) { return esc(j.whose.length > 1 ? c.names : crewName(c)); }).join(', ') + (j.whose.length > 1 ? ')' : '');
      }
      var log = '';
      var busy = j.log.length > 1 || j.log.some(function (e) { return e.kind !== 'ticked'; });
      if (busy) log = '<ol class="who1189-log">' + j.log.map(function (e) {
        var what = e.kind === 'ticked' ? 'ticked' + (e.undone ? ' (later unticked)' : '') : e.kind === 'unticked' ? 'unticked' : 'cancelled from the edit link';
        return '<li><time>' + esc(S.hm(e.at)) + '</time> ' + what + (e.crew ? ' · ' + esc(e.crew.names) : (e.kind === 'cancelled' ? '' : ' · crew not recorded')) + '</li>';
      }).join('') + '</ol>';
      h += '<li class="who1189-job ' + j.state + '"><div class="who1189-top"><b>' + esc(j.label) + (j.extra ? ' <small>(not counted)</small>' : '') + '</b><span class="who1189-st">' + st + '</span></div>' +
        (by ? '<div class="who1189-by">' + by + '</div>' : '') + log + '</li>';
    });
    h += '</ul></section>';
  });
  if (P.before) h += '<p class="who1189-note">Crew names are saved with each completion from Sat 24 Oct, 10:20. Anything earlier shows the job and the time only; the record does not say who did it, so no crew is guessed.</p>';
  return h;
}
function crewHtml(C, S) {
  if (!C.places && !C.other.length) return '<p>No places saved with ' + esc(C.crew.names) + '’s name on ' + esc(C.dayLabel) + '.</p>' +
    (C.before ? '<p class="who1189-note">That night was before crew names were kept (from Sat 24 Oct, 10:20).</p>' : '');
  var row = function (r) {
    return '<li class="who1189-job done"><div class="who1189-top"><b><button type="button" class="who1189-ref" data-who1189="' + esc(r.ref) + '">' + esc(r.ref) + '</button></b><span class="who1189-st">' +
      r.done.map(function (j) { return esc(j.label + (j.line ? ' (' + j.line + ')' : '') + ' ' + S.hm(j.at)) + (C.own.indexOf(j.task) < 0 ? ' <small>(another crew’s job)</small>' : ''); }).join(' · ') + '</span></div></li>';
  };
  var h = '';
  C.areas.forEach(function (a) { h += '<section class="who1189-line"><h3>' + (a.n ? 'Area ' + esc(a.n) + ' · ' : '') + esc(a.name) + '</h3><ul class="who1189-jobs">' + a.refs.map(row).join('') + '</ul></section>'; });
  if (C.other.length) h += '<section class="who1189-line"><h3>Also saved with their name · another crew’s job</h3><ul class="who1189-jobs">' + C.other.map(row).join('') + '</ul></section>';
  return h + '<p class="who1189-note">Only completions saved with this crew’s name are listed. Tap a place for its full history.</p>';
}

/* The panel's table cells and the shift report ask for crew labels with the reference list, which carries no crew groups, so a saved
   crew read "Crew group cleaners". Labels now come from the crew card's own list (the one the crews choose from) whenever the data
   given has none. The crews' QR pages carry their own copy and are not touched. */
function fixLabels(C, card) {
  if (!C || C.who1189 || typeof C.text !== 'function' || typeof C.label !== 'function') return C;
  var text = C.text, label = C.label;
  var withGroups = function (d) { return d && Array.isArray(d.crewGroups) && d.crewGroups.length ? d : (card && Array.isArray(card.crewGroups) ? card : d); };
  C.text = function (data, state) { return text.call(this, withGroups(data), state); };
  C.label = function (data, id) { return label.call(this, withGroups(data), id); };
  C.who1189 = true;
  return C;
}

/* The panel's own HTML, tidied: people's names under the time; the reference names become buttons. */
function tidy(html, data, operational) {
  var map = Object.create(null);
  groups(data).forEach(function (g) { var p = split(g.label); map[esc(g.label)] = map[esc('Crew group ' + g.id)] = esc(p.names || p.role); });
  html = html.replace(/<small class="crew1173-report">([^<]*)<\/small>/g, function (all, txt) {
    var parts = txt.split(' · ').filter(function (x) { return x && x !== 'Group not recorded'; }).map(function (x) { return map[x] || x; });
    return parts.length ? '<small class="crew1173-report who1189-names">' + parts.join(' · ') + '</small>' : '';
  });
  if (operational) html = html.replace(/<table class="svc-tbl">/g, '<table class="svc-tbl who1189-tbl">')
    .replace(/(<th scope="row(?:group)?"(?: colspan="\d+")?>)<b>([^<]+)<\/b>/g, '$1<b><button type="button" class="who1189-ref" data-who1189="$2" title="Who did it">$2</button></b>');
  return html;
}

return {SINCE: SINCE, WHOSE: WHOSE, split: split, crewWords: crewWords, place: place, crewPlaces: crewPlaces, placeHtml: placeHtml, crewHtml: crewHtml, tidy: tidy, fixLabels: fixLabels, esc: esc};
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcWho1189;

/* Author: Andrew Fisher. Where the taps go. Reads the panel's last verified reading; writes nothing. */
(function (W) {
'use strict';
if (typeof document === 'undefined' || typeof SvcPanel !== 'object' || !SvcPanel || SvcPanel.who1189) return;
var Wh = SvcWho1189, drawer = null;
if (typeof SvcCrews1173 === 'object') Wh.fixLabels(SvcCrews1173, typeof SVC1067_CARD === 'object' && SVC1067_CARD ? SVC1067_CARD.data : null);
function model() { return W.gc500Teams1187 && typeof W.gc500Teams1187.last === 'function' ? W.gc500Teams1187.last() : null; }
var base = SvcPanel.svcPanelHtml;
SvcPanel.svcPanelHtml = function (M) {
  var html = base.apply(this, arguments);
  try {
    html = Wh.tidy(html, null, !!(M && M.operational1160 === true && !M.example));
    return html.replace(/(data-svc1102-key="teams1187-([a-z0-9]+)">(?:(?!teams1187-row)[\s\S])*?)<span class="teams1187-did">([^<]*)<\/span>/g,
      '$1<button type="button" class="teams1187-did who1189-crew" data-who1189-crew="$2" title="Places saved with this crew">$3</button>');
  } catch (e) { return html; }
};
SvcPanel.who1189 = true;

function close() { if (drawer) { var d = drawer; drawer = null; d.remove(); } }
function sheet(title, sub, body) {
  close();
  var d = document.createElement('div'); drawer = d;
  d.className = 'drawer on who1189-drawer'; d.style.zIndex = 31; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'w1189h');
  d.innerHTML = '<div class="dh"><div><h2 id="w1189h">' + title + '</h2><div class="sub">' + sub + '</div></div><button class="close" type="button" aria-label="Close" title="Close">&times;</button></div><div class="db">' + body + '</div>';
  if (typeof mounted === 'function') mounted(document.body.appendChild(d)); else document.body.appendChild(d);
  d.querySelector('.close').onclick = close;
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  d.querySelector('.close').focus({preventScroll: true});
  return d;
}
function openPlace(ref) {
  var M = model(); if (!M) return false;
  var P = Wh.place(M, ref);
  sheet(Wh.esc(ref) + ' · who did it', P ? Wh.esc(P.dayLabel) + ' · as at ' + Wh.esc(P.hm) : '', Wh.placeHtml(P, M.S));
  return true;
}
function openCrew(id) {
  var M = model(); if (!M) return false;
  var C = Wh.crewPlaces(M, id);
  sheet(Wh.esc(C.crew.names) + ' · ' + Wh.esc(C.crew.role), Wh.esc(C.dayLabel) + ' · ' + C.places + (C.places === 1 ? ' place' : ' places') + ' saved with their name · as at ' + Wh.esc(C.hm), Wh.crewHtml(C, M.S));
  return true;
}
function refOfRow(tr) {
  var b = tr.querySelector('th [data-who1189], th b');
  if (b && (tr.classList.contains('svc-r1') || tr.classList.contains('svc-rg'))) return b.getAttribute('data-who1189') || b.textContent.trim();
  for (var x = tr.previousElementSibling; x; x = x.previousElementSibling) if (x.classList.contains('svc-rg')) { var g = x.querySelector('th [data-who1189], th b'); return g ? (g.getAttribute('data-who1189') || g.textContent.trim()) : ''; }
  return '';
}
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  var b = t.closest('[data-who1189]');
  if (b) { e.preventDefault(); openPlace(b.getAttribute('data-who1189')); return; }
  var c = t.closest('[data-who1189-crew]');
  if (c) { e.preventDefault(); e.stopPropagation(); openCrew(c.getAttribute('data-who1189-crew')); return; }
  var tr = t.closest('#svc1067 .who1189-tbl tbody tr');
  if (tr && model()) { var ref = refOfRow(tr); if (ref) openPlace(ref); }
});
/* "Who did it" beside "Share map + jobs" on the servicing map's selected place */
function decorateDetail(root) {
  (root || document).querySelectorAll('.svc1099-detail [data-share1164-ref]').forEach(function (s) {
    if (s.parentNode.querySelector('[data-who1189]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-who1189', s.getAttribute('data-share1164-ref')); b.setAttribute('data-ro', ''); b.className = 'who1189-detail'; b.textContent = 'Who did it';
    s.insertAdjacentElement('beforebegin', b);
  });
}
function watchDetail() {
  var el = document.querySelector('#svc1067 .svc1099-detail'); if (!el || el.__who1189) return;
  el.__who1189 = new MutationObserver(function () { decorateDetail(el.parentNode); });
  el.__who1189.observe(el, {childList: true, subtree: true}); decorateDetail(el.parentNode);
}
if (W.SvcMap1099 && typeof W.SvcMap1099.update === 'function' && !W.SvcMap1099.update.__who1189) {
  var up = W.SvcMap1099.update;
  W.SvcMap1099.update = function () { var out = up.apply(this, arguments); try { watchDetail(); decorateDetail(); } catch (e) {} return out; };
  W.SvcMap1099.update.__who1189 = true;
}
if (typeof W.applyCapability === 'function') {
  var apply = W.applyCapability;
  W.applyCapability = function () { var out = apply.apply(this, arguments); try { if (!(typeof capability === 'function' && capability() === 'edit' && !SYNC.readonly)) close(); } catch (e) {} return out; };
}
W.addEventListener('pagehide', close);
W.gc500Who1189 = {openPlace: openPlace, openCrew: openCrew, close: close};
if (typeof W.renderServicing1084 === 'function') W.renderServicing1084();
})(typeof window === 'object' ? window : {});
