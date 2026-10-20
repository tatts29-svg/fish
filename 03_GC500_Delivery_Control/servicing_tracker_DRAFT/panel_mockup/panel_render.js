/* GC500 servicing tracker: the main page's read-only panel on the Event nights tab (MOCK-UP renderer).
   Author: Andrew Fisher, 18 Oct 2026. Andrew: "purely just a track" · "Remember must show a percentage complete off that
   area" · "Must shows percentage complete for the area. And again for everything" · "must state. Reference number and
   how many in each one" · "Just times".
   One pure function, svcPanelHtml(M) -> HTML string, so the same code draws the static mock-up (node) and redraws it on
   a day change (browser). Every piece of text it shows goes through esc(). Percentages, rounding and finish times come
   only from SvcState (state.js), the copy of the rule the crew card shares word for word.
   M = {D: tracker data {tasks, plans, days, areas}, S: SvcState, events: ticks, now: service time (ms), lastRead: ms,
        day: day id shown, open: {areaNumber: true}, example: true for made-up progress} */
var SvcPanel = (function () {
'use strict';
var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var SMALL = { night: 'night', final: 'last night' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function bris(ms) { return new Date(ms + 10 * 3600000); }
function wdHm(S, ms) { return WD[bris(ms).getUTCDay()] + ' ' + S.hm(ms); }                     /* "Sat 21:32" */
function longDate(id) { var d = new Date(id + 'T00:00:00Z'); return WD[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
function nextId(id) { return new Date(Date.parse(id + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10); }
function bar(pct, done) { return '<span class="svc-bar' + (done ? ' full' : '') + '" aria-hidden="true"><i style="width:' + pct + '%"></i></span>'; }
/* a line's label as printed in the data, kept from breaking between a number and what it counts ("6 m", "2 ×"):
   a no-wrap span, because some browsers break at a no-break space when the line is tight */
function lbl(s) { return esc(s).replace(/(\d+) × /g, '<span class="svc-nw">$1 ×</span> ').replace(/(\d) (m|mm|kVA)\b/g, '<span class="svc-nw">$1 $2</span>'); }
function units(r) { return r.lines.reduce(function (n, l) { return n + l.qty; }, 0); }
var TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

/* the fold: one table per area, one row per completion line, one column per job that day (in Andrew's words), the
   time in the cell. A reference with more than one line gets a row of its own naming it and how many units it has. */
function cellHtml(M, cfg, st, l, t) {
  if (M.S.tasksFor(cfg, l, M.day).indexOf(t) < 0) return '<td class="na"><span aria-hidden="true">\u2013</span><span class="vh">not a job here</span></td>';
  var at = M.S.jobAt(st, l.id, t, M.day);
  return at ? '<td class="ok">' + TICK + '<time>' + esc(M.S.hm(at)) + '</time></td>' : '<td class="no">not yet</td>';
}
function tableHtml(M, cfg, st, a) {
  var used = {}; a.refs.forEach(function (r) { r.lines.forEach(function (l) { M.S.tasksFor(cfg, l, M.day).forEach(function (t) { used[t] = 1; }); }); });
  var cols = Object.keys(M.D.tasks).filter(function (t) { return used[t]; });
  var head = '<thead><tr><th scope="col">Reference</th>' + cols.map(function (t) { return '<th scope="col">' + esc(M.D.tasks[t]) + '</th>'; }).join('') + '</tr></thead>';
  var body = a.refs.map(function (r) {
    var s = M.S.refStats(cfg, r, M.day, st), one = r.lines.length === 1, cls = s.done ? ' done' : '';
    var fin = s.done ? '<em class="fin">done ' + esc(M.S.hm(s.last)) + '</em>' : '';
    if (one) return '<tr class="svc-r1' + cls + '"><th scope="row"><b>' + esc(r.ref) + '</b> <span>' + lbl(r.lines[0].label) + '</span>' + fin + '</th>' +
      cols.map(function (t) { return cellHtml(M, cfg, st, r.lines[0], t); }).join('') + '</tr>';
    return '<tr class="svc-rg' + cls + '"><th scope="rowgroup" colspan="' + (cols.length + 1) + '"><b>' + esc(r.ref) + '</b> <span>' + esc(units(r)) + ' units</span>' + fin + '</th></tr>' +
      r.lines.map(function (l) { return '<tr class="svc-rl' + cls + '"><th scope="row"><span>' + lbl(l.label) + '</span></th>' + cols.map(function (t) { return cellHtml(M, cfg, st, l, t); }).join('') + '</tr>'; }).join('');
  }).join('');
  return '<table class="svc-tbl">' + head + '<tbody>' + body + '</tbody></table>';
}
function tasksHtml(M, cfg, st, refs) {
  var ts = M.S.taskStats(cfg, refs, M.day, st);
  return '<ul class="svc-tasks" aria-label="Progress by job">' + Object.keys(M.D.tasks).filter(function (t) { return ts[t]; }).map(function (t) {
    var g = ts[t];
    return '<li' + (g.d === g.w ? ' class="fin"' : '') + '><span>' + esc(M.D.tasks[t]) + '</span><b>' + g.d + ' of ' + g.w + ' · ' + g.pct + '%</b></li>';
  }).join('') + '</ul>';
}
function areaHtml(M, cfg, st, a) {
  var g = M.S.groupStats(cfg, a.refs, M.day, st), done = !!g.finished;
  return '<details class="svc-area' + (done ? ' done' : '') + '" data-svc-area="' + esc(a.n) + '"' + (M.open && M.open[a.n] ? ' open' : '') + '>' +
    '<summary><span class="svc-n">' + (a.n ? esc(a.n) : '–') + '</span><span class="svc-name">' + esc(a.name) + '</span>' +
    '<span class="svc-pct">' + g.pct + '%</span>' +
    '<span class="svc-meta">' + g.refsDone + ' of ' + g.refs + ' reference' + (g.refs === 1 ? '' : 's') + ' · ' + g.d + ' of ' + g.w + ' jobs · ' +
      (done ? '<span class="fin">finished ' + esc(wdHm(M.S, g.finished)) + '</span>' : 'not finished') + '</span>' +
    bar(g.pct, done) + '</summary>' +
    '<div class="svc-refs">' + tasksHtml(M, cfg, st, a.refs) + tableHtml(M, cfg, st, a) + '</div></details>';
}
function svcPanelHtml(M) {
  var S = M.S, D = M.D, cfg = { plans: D.plans, days: D.days };
  var st = S.jobStates(M.events || [], M.now), day = S.dayOf(cfg, M.day) || D.days[0];
  var all = [].concat.apply([], D.areas.map(function (a) { return a.refs; }));
  var g = S.groupStats(cfg, all, day.id, st), cur = S.svcDay(M.now);
  var when = day.id === cur ? '<b>on now</b> · service clock ' + esc(S.hm(M.now))
    : day.id > cur ? '<b>starts ' + esc(longDate(day.id)) + ' 08:00</b>' : 'ended';
  var days = D.days.map(function (d) {
    var on = d.id === day.id;
    return '<button type="button" class="btn' + (on ? ' primary' : '') + '" data-svc-day="' + esc(d.id) + '" aria-pressed="' + on + '" data-ro>' +
      esc(d.label) + '<small>' + esc(d.ifNeeded ? 'if needed' : (SMALL[d.plan] || d.plan)) + '</small></button>';
  }).join('');
  var none = g.d === 0 && day.ifNeeded && day.id <= cur;
  return (M.example ? '<div class="svc-ex" role="note"><b>Example progress</b> · made up to show the layout. No crew has ticked anything yet.</div>' : '') +
    '<h3 id="svc1063-h">Servicing tracker <small>crews’ QR codes · track only</small></h3>' +
    '<p class="sub">Crews tick each reference’s jobs from that reference’s own completion QR code. Times only, no names. Each day runs 08:00 to 08:00; open an area to see its references.</p>' +
    '<div class="svc-days" role="group" aria-label="Service day">' + days + '</div>' +
    '<p class="svc-win">' + esc(longDate(day.id)) + ' 08:00 to ' + esc(longDate(nextId(day.id))) + ' 08:00 · ' + when + '</p>' +
    '<div class="svc-all' + (g.finished ? ' done' : '') + '"><div class="svc-big"><b>' + g.pct + '%</b><span>everything</span></div>' +
      '<div class="svc-allmeta"><span><b>' + g.refsDone + '</b> of ' + g.refs + ' references</span><span><b>' + g.d + '</b> of ' + g.w + ' jobs</span>' +
      (g.finished ? '<span class="fin">All finished ' + esc(wdHm(S, g.finished)) + '</span>' : none ? '<span>if needed · no ticks</span>' : '<span>not finished</span>') + '</div>' +
      bar(g.pct, !!g.finished) + '</div>' +
    tasksHtml(M, cfg, st, all) + '<div class="svc-areas">' + D.areas.map(function (a) { return areaHtml(M, cfg, st, a); }).join('') + '</div>' +
    '<p class="svc-foot">Nothing here ticks the job record, changes a delivery or a charge. The Event Portables servicing count stays our on-site count.</p>' +
    '<p class="svc-read">' + esc(M.readStatus || ('Read from the service every 20 s while this tab is open · last read ' + new Date(M.lastRead + 36e6).toISOString().slice(11, 19))) + '</p>';
}
return { svcPanelHtml: svcPanelHtml, esc: esc };
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcPanel;
