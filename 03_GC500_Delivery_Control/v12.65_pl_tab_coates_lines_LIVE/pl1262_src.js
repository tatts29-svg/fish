/* Author: Andrew Fisher. v12.62 - the P&L tab cleaned up: the P&L in Coates P&L lines, whole job and by branch, figures first.
   Andrew, 30 Oct 2026 (this chat): "We need to clean up the p&L tab layout. Needs improving. Think terminology with coates p&l
   layout and what belongs in and against each branch. And then also as a whole.." and "I want the p&l tab cleaned up".
   The face of the Costs & P&L pane becomes: the P&L (whole job, Coates lines, On the record and Job end; then by branch, job
   end, KINP STPS NVAC MEAD and the job), "Not in it yet" (named, never added), then two closed folds: "Fencing, everything
   included" (the card that sat at the top) and "Workings" (every card the figures are worked out from, month-end for Finance,
   the ticks and the controls - all moved, nothing removed, every button still bound). Presentation only: every figure is the
   page's own model's (pl770Model, moneySummary, fh866Model, cj764Model), unchanged, and the face says whether it ties.
   The branch split follows the project manager's ruling of 29 Oct 2026 ("me an my guys should be kinp"): the people's event
   labour revenue and their travel, accommodation and meals sit on KINP; everything else on the branch of the gear or the move. */
var PL1262 = (function (W, D) {
'use strict';
var KEEP = ['rochip', 'finance857-nav', 'panehead'];
function num(n) { return typeof n === 'number' && isFinite(n); }
function r2(n) { return Math.round(n * 100) / 100; }
function cents(a, b) { return Math.abs(r2(a) - r2(b)) < 0.005; }
function m(v) { return v == null || !num(v) ? '<span class="pl1262-dash">—</span>' : Math.abs(v) < 0.005 ? '<span class="pl1262-dash">—</span>' : esc(money(v)); }
function pc(v) { return v == null || !num(v) ? '' : (Math.round(v * 1000) / 10).toFixed(1) + '%'; }
function line(list, key) { for (var i = 0; i < (list || []).length; i++) if (list[i].key === key) return list[i]; return null; }
function add(a, b) { var n = num(a) ? a : 0, o = num(b) ? b : 0; return (num(a) || num(b)) ? r2(n + o) : null; }
function sumBy(rows, f) { var t = 0, any = false; (rows || []).forEach(function (r) { var v = f(r); if (num(v)) { t += v; any = true; } }); return any ? r2(t) : null; }

/* the figures, every one the page's own model's */
function model() {
  var P = pl770Model(), M = moneySummary(), F = fh866Model(), X = cj764Model(), k = M.cost || {};
  var W_ = P.wages || {};
  var used = {};
  var pick = function (key) { used[key] = true; return line(P.rev, key); };
  var rows = function (list) { return list.filter(function (r) { return r && (num(r.now) && r.now !== 0 || num(r.job) && r.job !== 0); }); };
  var rev = [];
  var push = function (code, name, l, note) { if (!l) return; rev.push({code: code, name: name, now: l.now, job: l.job, note: note || ''}); };
  push('1005', 'Hire Revenue', pick('hire'));
  push('1010', 'Rehire Revenue', pick('rehire'), 'hired-in gear at our rates');
  push('1030 · 1031', 'Transport Revenue', pick('transport'));
  push('1032', 'Toilet Pump-outs', pick('pump'));
  var inst = pick('install'), clean = pick('cleaning');
  if (inst || clean) rev.push({code: '1047', name: 'Installation', now: add(inst && inst.now, clean && clean.now), job: add(inst && inst.job, clean && clean.job), note: clean && (clean.now || clean.job) ? 'cleaning inside, as Baseplan bills it' : ''});
  push('1020', 'Consumables', pick('cons'));
  push('—', 'Event labour scope: accommodation and travel', pick('event_support'), 'ledger line for Finance to confirm');
  push('—', 'Contract services, miscellaneous', pick('contract_services1224'));
  (P.rev || []).forEach(function (l) { if (!used[l.key] && (l.now || l.job)) rev.push({code: l.code || '—', name: l.line || l.key, now: l.now, job: l.job, note: ''}); });
  rev = rows(rev);
  var revNow = sumBy(rev, function (r) { return r.now; }), revJob = sumBy(rev, function (r) { return r.job; });
  var cost = [];
  var cl = function (key) { return line(P.cost, key); };
  var pushC = function (code, name, l, note) { if (!l) return; cost.push({code: code, name: name, now: l.now, job: l.job, note: note || ''}); };
  pushC('2126', 'Rehire cost', cl('rehire'), 'Event Portables, Advanced’s gear, sub-hired plant');
  pushC('3325', 'Toilet Pump-out cost', cl('pump'), 'Event Portables servicing');
  pushC('2120 · 2140', 'Transport cost, carriers', cl('transport'));
  pushC('2142', 'Installation, external contractors', cl('install'), 'Advanced’s crew');
  pushC('2144', 'Consumables cost', cl('cons'), 'water deliveries and the tank');
  var usedC = {rehire: 1, pump: 1, transport: 1, install: 1, cons: 1};
  (P.cost || []).forEach(function (l) { if (!usedC[l.key] && (l.now || l.job)) cost.push({code: l.code || '—', name: l.line || l.key, now: l.now, job: l.job, note: ''}); });
  cost = rows(cost);
  var direct = sumBy(cost, function (r) { return r.now; }), directJob = sumBy(cost, function (r) { return r.job; });
  var gm = {now: add(revNow, -direct), job: add(revJob, -directJob)};
  /* operating costs: the hired-in people, the allowance, the travel and the meals - the Forecast P&L's overheads and wages */
  var accom = k.accommodation ? k.accommodation.amount : null, meals = add(k.meals ? k.meals.amount : null, k.misc ? k.misc.amount : null);
  var fAccom = null, fMeals = null; (F.costs || []).forEach(function (s) { if (s.kind === 'expenses' && /accommodation/i.test(s.stream)) fAccom = s; else if (s.kind === 'expenses') fMeals = s; });
  var allowance = num(W_.allowanceForecast) ? W_.allowanceForecast : 0;
  var labourNow = num(W_.known) ? W_.known : (num(W_.toDate) ? W_.toDate : null), labourJob = num(W_.job) ? r2(W_.job - allowance) : null;
  var op = [
    {code: '', name: 'Labour hire', now: labourNow, job: labourJob, note: 'Job Connect’s people on the running sheet, priced by the run rules'},
    {code: '', name: 'Salary allowance', now: null, job: allowance || null, note: 'job end'},
    {code: '', name: 'Travel and accommodation', now: accom, job: fAccom ? fAccom.job : accom, note: k.accommodation ? fmtNum(k.accommodation.nights) + ' nights' : ''},
    {code: '', name: 'Meals and expenses', now: meals, job: fMeals ? fMeals.job : meals, note: ''},
    {code: '', name: 'Coates wages', now: null, job: null, hours: {now: W_.hoursOnlyToDate, job: W_.hoursOnly}, note: 'hours only, no hourly rate (the project manager, 23 Oct 2026)'}
  ];
  var opNow = sumBy(op, function (r) { return r.now; }), opJob = sumBy(op, function (r) { return r.job; });
  var contrib = {now: add(gm.now, -opNow), job: add(gm.job, -opJob)};
  /* by branch, job end, under the ruling */
  var cols = (F.cols && F.cols.length ? F.cols : ['KINP', 'STPS', 'NVAC', 'MEAD']).slice();
  var zero = function () { var o = {}; cols.forEach(function (c) { o[c] = 0; }); return o; };
  var revRec = zero(), revJobB = zero();
  (F.inv || []).forEach(function (r) { if (r.branch in revRec) { revRec[r.branch] = r2(revRec[r.branch] + (r.onRecord || 0)); revJobB[r.branch] = r2(revJobB[r.branch] + (r.job || 0)); } });
  var moved = 0;
  try { (scopeBranchAllocation978() || []).forEach(function (s) { if (/staffing/i.test(s.source || '') && s.branch !== 'KINP' && s.branch in revRec) { revRec[s.branch] = r2(revRec[s.branch] - (s.recorded || 0)); revJobB[s.branch] = r2(revJobB[s.branch] - (s.job || 0)); revRec.KINP = r2(revRec.KINP + (s.recorded || 0)); revJobB.KINP = r2(revJobB.KINP + (s.job || 0)); moved = r2(moved + (s.job || 0)); } }); } catch (e) {}
  var streams = [
    {name: 'Fencing: Advanced’s orders, gear and crew', test: function (s) { return s.kind === 'fencing'; }},
    {name: 'Event Portables: toilet hire, servicing, water', test: function (s) { return s.kind === 'toilets'; }},
    {name: 'Sub-hired plant', test: function (s) { return s.kind === 'rehire'; }},
    {name: 'Transport, carriers', test: function (s) { return s.kind === 'transport'; }},
    {name: 'Labour hire and allowance', test: function (s) { return s.kind === 'labour'; }, kinp: true},
    {name: 'Travel, accommodation and meals', test: function (s) { return s.kind === 'expenses'; }, kinp: true}
  ];
  var other = {name: 'Other costs', test: function () { return true; }};
  var taken = [];
  var bRows = streams.map(function (st) {
    var by = zero(), job = 0;
    (F.costs || []).forEach(function (s, i) { if (taken.indexOf(i) >= 0 || !st.test(s)) return; taken.push(i); var sj = num(s.job) ? s.job : 0; job = r2(job + sj); if (st.kinp) by.KINP = r2(by.KINP + sj); else Object.keys(s.by || {}).forEach(function (b) { if (b in by) by[b] = r2(by[b] + (s.by[b] || 0)); else by.KINP = r2(by.KINP + (s.by[b] || 0)); }); });
    return {name: st.name, by: by, job: job};
  });
  var restBy = zero(), rest = 0; (F.costs || []).forEach(function (s, i) { if (taken.indexOf(i) >= 0) return; var sj = num(s.job) ? s.job : 0; rest = r2(rest + sj); Object.keys(s.by || {}).forEach(function (b) { if (b in restBy) restBy[b] = r2(restBy[b] + (s.by[b] || 0)); }); });
  if (rest) bRows.push({name: other.name, by: restBy, job: rest});
  var costB = zero(), costJobB = 0; bRows.forEach(function (r) { cols.forEach(function (c) { costB[c] = r2(costB[c] + r.by[c]); }); costJobB = r2(costJobB + r.job); });
  var contribB = zero(); cols.forEach(function (c) { contribB[c] = r2(revJobB[c] - costB[c]); });
  var revRecT = sumBy(cols, function (c) { return revRec[c]; }), revJobT = sumBy(cols, function (c) { return revJobB[c]; }), contribT = sumBy(cols, function (c) { return contribB[c]; });
  var plJob = num(F.plJob) ? F.plJob : (F.costTotal ? F.costTotal.job : null);
  var checks = {
    revenue: cents(revNow, P.revNow) && cents(revJob, P.revJob),
    direct: cents(direct, P.direct) && cents(directJob, P.directJob),
    gm: !P.gm || (cents(gm.now, P.gm.now) && cents(gm.job, P.gm.job)),
    contribution: !P.diff || !num(P.diff.job) || cents(contrib.job, P.diff.job),
    branchesRevenue: cents(revRecT, P.revNow) && cents(revJobT, P.revJob),
    branchesCost: plJob == null || cents(costJobB, plJob),
    branchesContribution: cents(contribT, contrib.job)
  };
  var ok = Object.keys(checks).every(function (c) { return checks[c]; });
  return {asAt: P.asAt, rev: rev, revNow: revNow, revJob: revJob, cost: cost, direct: direct, directJob: directJob, gm: gm, gmPc: {now: revNow ? gm.now / revNow : null, job: revJob ? gm.job / revJob : null}, op: op, opNow: opNow, opJob: opJob, contrib: contrib, contribPc: {now: revNow ? contrib.now / revNow : null, job: revJob ? contrib.job / revJob : null},
    cols: cols, revRec: revRec, revJobB: revJobB, bRows: bRows, costB: costB, costJobB: costJobB, contribB: contribB, revRecT: revRecT, revJobT: revJobT, contribT: contribT, moved: moved, plJob: plJob,
    gaps: (X.gaps || []).map(function (g) { return {what: g.what || '', owner: g.owner || ''}; }), checks: checks, ok: ok};
}

function html(Mo) {
  var row = function (r, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td class="pl1262-code">' + (r.code ? '<span class="chip ref mono">' + esc(r.code) + '</span>' : '') + '</td><td>' + esc(r.name) + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</td><td class="num">' + (r.hours ? '<span class="pl1262-h">' + esc(fmtNum(r.hours.now || 0)) + ' h</span>' : m(r.now)) + '</td><td class="num">' + (r.hours ? '<span class="pl1262-h">' + esc(fmtNum(r.hours.job || 0)) + ' h</span>' : m(r.job)) + '</td></tr>'; };
  var tot = function (name, now, job, cls, pcNow, pcJob) { return '<tr class="' + (cls || 'pl1262-tot') + '"><td></td><td>' + esc(name) + '</td><td class="num">' + m(now) + (pcNow != null ? ' <span class="pl1262-pc">' + pc(pcNow) + '</span>' : '') + '</td><td class="num">' + m(job) + (pcJob != null ? ' <span class="pl1262-pc">' + pc(pcJob) + '</span>' : '') + '</td></tr>'; };
  var sub = function (name) { return '<tr class="pl1262-sub"><td colspan="4">' + esc(name) + '</td></tr>'; };
  var tick = function (good, words) { return '<span class="pl1262-tick ' + (good ? 'ok' : 'bad') + '">' + (good ? '✓' : '✗') + ' ' + esc(words) + '</span>'; };
  var kpi = function (label, value, small) { return '<div class="pl1262-kpi"><div class="pl1262-kpi-l">' + esc(label) + '</div><div class="pl1262-kpi-v">' + value + '</div><div class="pl1262-kpi-s">' + small + '</div></div>'; };
  var t1 = '<section id="pl1262" class="card pl1262 nosfold" aria-labelledby="pl1262Title">'
    + '<p class="fin745-eyebrow">P&amp;L · WHOLE JOB · COATES P&amp;L LINES · AUD EX GST · AS AT ' + esc(fmtDate(Mo.asAt).toUpperCase()) + '</p>'
    + '<h2 id="pl1262Title" class="vh">P&amp;L</h2>'
    + '<div class="pl1262-kpis">' + kpi('Revenue · job end', m(Mo.revJob), m(Mo.revNow) + ' on the record')
    + kpi('Cost of sales · job end', m(Mo.directJob), m(Mo.direct) + ' on the record')
    + kpi('Gross margin · job end', m(Mo.gm.job) + ' <span class="pl1262-pc">' + pc(Mo.gmPc.job) + '</span>', m(Mo.gm.now) + ' · ' + pc(Mo.gmPc.now) + ' on the record')
    + kpi('Contribution · job end', m(Mo.contrib.job) + ' <span class="pl1262-pc">' + pc(Mo.contribPc.job) + '</span>', 'after labour hire, allowance, travel and meals') + '</div>'
    + '<div class="tblwrap"><table class="pl1262-tbl"><thead><tr><th>Code</th><th>Line</th><th class="num">On the record</th><th class="num">Job end</th></tr></thead><tbody>'
    + sub('Revenue') + Mo.rev.map(function (r) { return row(r); }).join('') + tot('Revenue', Mo.revNow, Mo.revJob, 'pl1262-grand')
    + sub('Cost of sales') + Mo.cost.map(function (r) { return row(r); }).join('') + tot('Cost of sales', Mo.direct, Mo.directJob)
    + tot('Gross margin', Mo.gm.now, Mo.gm.job, 'pl1262-grand', Mo.gmPc.now, Mo.gmPc.job)
    + sub('Operating costs') + Mo.op.map(function (r) { return row(r); }).join('') + tot('Operating costs', Mo.opNow, Mo.opJob)
    + tot('Contribution', Mo.contrib.now, Mo.contrib.job, 'pl1262-grand pl1262-final', Mo.contribPc.now, Mo.contribPc.job)
    + '</tbody></table></div>'
    + '<p class="pl1262-foot">' + tick(Mo.checks.revenue && Mo.checks.direct, 'revenue and cost of sales tie to the Forecast P&L to the cent') + ' ' + tick(Mo.checks.contribution, 'contribution is the P&L’s difference to job end') + '</p>';
  var cols = Mo.cols;
  var bh = '<tr><th></th>' + cols.map(function (c) { return '<th class="num">' + esc(c) + '</th>'; }).join('') + '<th class="num">Job</th></tr>';
  var brow = function (name, by, job, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + esc(name) + '</td>' + cols.map(function (c) { return '<td class="num">' + m(by[c]) + '</td>'; }).join('') + '<td class="num">' + m(job) + '</td></tr>'; };
  var t2 = '<h3 class="pl1262-h3">By branch · job end</h3>'
    + '<div class="tblwrap"><table class="pl1262-tbl pl1262-branch"><thead>' + bh + '</thead><tbody>'
    + brow('Revenue · on the record', Mo.revRec, Mo.revRecT)
    + brow('Revenue · job end', Mo.revJobB, Mo.revJobT, 'pl1262-grand')
    + Mo.bRows.map(function (r) { return brow(r.name, r.by, r.job); }).join('')
    + brow('Costs · job end', Mo.costB, Mo.costJobB, 'pl1262-tot')
    + brow('Contribution · job end', Mo.contribB, Mo.contribT, 'pl1262-grand pl1262-final')
    + '</tbody></table></div>'
    + '<p class="pl1262-foot">' + tick(Mo.checks.branchesRevenue && Mo.checks.branchesCost && Mo.checks.branchesContribution, 'the branches foot to the job on every row') + ' <span class="pl1262-rule">The people’s event labour revenue' + (Mo.moved ? ' (' + esc(money(Mo.moved)) + ')' : '') + ', their travel, accommodation and meals sit on KINP — the project manager, 29 Oct 2026. Gear and moves sit on the branch of the gear.</span></p>'
    + '</section>';
  var gaps = '<section id="pl1262-gaps" class="card pl1262-gaps nosfold"><p class="fin745-eyebrow">NOT IN IT YET · NAMED, NEVER ADDED</p>'
    + (Mo.gaps.length ? '<ul>' + Mo.gaps.map(function (g) { return '<li>' + esc(g.what) + (g.owner ? '<small>' + esc(g.owner) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p>Nothing named.</p>') + '</section>';
  return t1 + t2 + gaps;
}

function fold(id, title, small) {
  var key = 'costs765|' + id, open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (e) {}
  var d = D.createElement('details'); d.className = 'plfold765 pl1262-fold'; d.id = id; d.setAttribute('data-sfold', key); if (open) d.open = true;
  d.innerHTML = '<summary>' + esc(title) + (small ? '<small>' + esc(small) + '</small>' : '') + '</summary>';
  return d;
}
function isKept(el) { if (!el || el.nodeType !== 1) return false; if (el.id === 'panehead-costs') return true; for (var i = 0; i < KEEP.length; i++) if (el.classList.contains(KEEP[i])) return true; return /^pl1262/.test(el.id || ''); }
function fenceWords(card) { try { var t = (card.textContent || '').replace(/\s+/g, ' '); var a = t.match(/Charge to the V8s (\$[\d,]+\.\d\d)/), b = t.match(/we pay (\$[\d,]+\.\d\d)/); return (a ? 'charged ' + a[1] : '') + (a && b ? ' · ' : '') + (b ? 'we pay ' + b[1] : ''); } catch (e) { return ''; } }

var busy = false;
function apply() {
  if (busy) return; var pane = D.getElementById('pane-costs'); if (!pane || !D.getElementById('pl770') || D.getElementById('pl1262')) return;
  busy = true;
  try {
    var Mo; try { Mo = typeof holdAssets === 'function' ? holdAssets(model) : model(); } catch (e) { try { console.warn('PL1262: the face could not be worked out', e); } catch (_) {} return; }
    var kept = [], rest = []; Array.prototype.slice.call(pane.children).forEach(function (el) { (isKept(el) ? kept : rest).push(el); });
    var fence = D.getElementById('fence-allin12423');
    var wrap = D.createElement('div'); wrap.innerHTML = html(Mo);
    /* the fencing card's own script puts it back at the top after each render, sometimes after this runs: its fold is always
       there, hidden while empty, and the card goes into it whenever it arrives */
    var fenceFold = fold('pl1262-fence', 'Fencing, everything included', fence ? fenceWords(fence) : '');
    var work = fold('pl1262-work', 'Workings', 'every card the figures come from · month-end for Finance · ticks and controls');
    rest.forEach(function (el) { if (el === fence) fenceFold.appendChild(el); else work.appendChild(el); });
    fenceFold.classList.toggle('pl1262-empty', !fence);
    var frag = D.createDocumentFragment();
    while (wrap.firstChild) frag.appendChild(wrap.firstChild);
    frag.appendChild(fenceFold);
    frag.appendChild(work);
    pane.appendChild(frag);
    pane.setAttribute('data-pl1262', Mo.ok ? 'ties' : 'differs');
  } finally { busy = false; }
}
function takeFence(card) {
  var f = D.getElementById('pl1262-fence'); if (!f) return false;
  f.appendChild(card); f.classList.remove('pl1262-empty');
  var sm = f.querySelector('summary small'), words = fenceWords(card);
  if (words) { if (!sm) { sm = D.createElement('small'); f.querySelector('summary').appendChild(sm); } sm.textContent = words; }
  return true;
}
/* a card that arrives after the face is built (another script's late insert) goes under its fold or Workings, never above the P&L */
function late(muts) {
  var pane = D.getElementById('pane-costs'), work = D.getElementById('pl1262-work'); if (!pane || !work || busy) return;
  muts.forEach(function (mu) { Array.prototype.slice.call(mu.addedNodes || []).forEach(function (n) { if (n.nodeType !== 1 || n.parentNode !== pane || isKept(n)) return; if (n.id === 'fence-allin12423' && takeFence(n)) return; work.appendChild(n); }); });
}
function hook() {
  if (typeof renderCosts !== 'function' || renderCosts.pl1262) return;
  var R0 = renderCosts;
  renderCosts = function () { var out = R0.apply(this, arguments); try { apply(); } catch (e) { try { console.warn('PL1262', e); } catch (_) {} } return out; };
  renderCosts.pl1262 = true; try { W.renderCosts = renderCosts; } catch (e) {}
  var pane = D.getElementById('pane-costs'); if (pane && !pane.__pl1262) { pane.__pl1262 = true; new MutationObserver(late).observe(pane, {childList: true}); }
  try { apply(); } catch (e) {}
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', hook); else hook();
return {model: model, html: html, apply: apply};
})(window, document);
