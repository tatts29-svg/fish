/* Author: Andrew Fisher. Servicing percentages use the existing shared state; race lights are presentation only. */
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
function meterHtml(M,cfg,st,refs,g,key,label,size) {
  var stats=refs.map(function(r){return M.S.refStats(cfg,r,M.day,st);});
  var savedDone=stats.length>0&&stats.every(function(r){return r.done&&!r.pending;}),pending=stats.some(function(r){return r.pending;});
  return SvcProgress1102.html({pct:g.pct,savedDone:savedDone,pending:pending,d:g.d,w:g.w,refsDone:g.refsDone,refs:g.refs,label:label,size:size,key:key});
}

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
  var head = '<thead><tr><th scope="col">Reference</th>' + cols.map(function (t) { return '<th scope="col">' + esc(M.D.tasks[t]) + (M.S.isExtra(cfg, t) ? '<small> not in %</small>' : '') + '</th>'; }).join('') + '</tr></thead>';
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
  var g=M.S.groupStats(cfg,a.refs,M.day,st),done=a.refs.length>0&&a.refs.every(function(r){var s=M.S.refStats(cfg,r,M.day,st);return s.done&&!s.pending;});
  return '<details class="svc-area'+(done?' done':'')+'" data-svc-area="'+esc(a.n)+'"'+(M.open&&M.open[a.n]?' open':'')+'>'+
    '<summary><span class="svc-n">'+(a.n?esc(a.n):'–')+'</span><span class="svc-name">'+esc(a.name)+'</span>'+
    meterHtml(M,cfg,st,a.refs,g,'panel-area-'+a.n,a.name+' servicing','area')+
    (done?'<span class="svc1102-finished">Finished '+esc(wdHm(M.S,g.finished))+'</span>':'')+'</summary>'+
    '<div class="svc-refs">'+tasksHtml(M,cfg,st,a.refs)+tableHtml(M,cfg,st,a)+'</div></details>';
}
function svcPanelHtml(M) {
  var S = M.S, D = M.D, cfg = { plans: D.plans, days: D.days, extras: D.extras };
  var st = S.jobStates(M.events || [], M.now), day = S.dayOf(cfg, M.day) || D.days[0];
  var all = [].concat.apply([], D.areas.map(function (a) { return a.refs; }));
  var g = S.groupStats(cfg, all, day.id, st), cur = S.svcDay(M.now);
  var allSaved=all.length>0&&all.every(function(r){var s=S.refStats(cfg,r,day.id,st);return s.done&&!s.pending;});
  var when = day.id === cur ? '<b>on now</b> · service clock ' + esc(S.hm(M.now))
    : day.id > cur ? '<b>starts ' + esc(longDate(day.id)) + ' 08:00</b>' : 'ended';
  var days = D.days.map(function (d) {
    var on = d.id === day.id;
    return '<button type="button" class="btn' + (on ? ' primary' : '') + '" data-svc-day="' + esc(d.id) + '" aria-pressed="' + on + '" data-ro>' +
      esc(d.label) + '<small>' + esc(d.ifNeeded ? 'if needed' : (SMALL[d.plan] || d.plan)) + '</small></button>';
  }).join('');
  var none = g.d === 0 && day.ifNeeded && day.id <= cur;
  return (M.example ? '<div class="svc-ex" role="note"><b>Example progress</b> · made up to show the layout. No crew has ticked anything yet.</div>' : '') +
    '<h3 id="svc1063-h" data-svc1102-key="panel-heading">Servicing tracker <small>crews’ QR codes · track only</small></h3>' +
    '<p class="sub">Crews tick each reference’s jobs from that reference’s own completion QR code. Times only, no names. Each day runs 08:00 to 08:00; open an area to see its references.</p>' +
    '<div class="svc-days" data-svc1102-key="panel-days" role="group" aria-label="Service day">' + days + '</div>' +
    '<p class="svc-win" data-svc1102-key="panel-window">' + esc(longDate(day.id)) + ' 08:00 to ' + esc(longDate(nextId(day.id))) + ' 08:00 · ' + when + '</p>' +
    '<div class="svc-all'+(allSaved?' done':'')+'" data-svc1102-key="panel-overall-wrap">'+
      meterHtml(M,cfg,st,all,g,'panel-overall','Whole night servicing','overall')+
      (g.finished&&allSaved?'<span class="svc1102-finished">All finished '+esc(wdHm(S,g.finished))+'</span>':none?'<span class="svc1102-finished">If needed · no ticks</span>':'')+'</div>'+
    tasksHtml(M, cfg, st, all) + '<div class="svc-areas">' + D.areas.map(function (a) { return areaHtml(M, cfg, st, a); }).join('') + '</div>' +
    '<p class="svc-foot">Nothing here ticks the job record, changes a delivery or a charge. The Event Portables servicing count stays our on-site count.</p>' +
    '<p class="svc-read" data-svc1102-key="panel-read">' + esc(M.readStatus || ('Read from the service every 20 s while this tab is open · last read ' + new Date(M.lastRead + 36e6).toISOString().slice(11, 19))) + '</p>';
}
return { svcPanelHtml: svcPanelHtml, esc: esc };
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcPanel;
