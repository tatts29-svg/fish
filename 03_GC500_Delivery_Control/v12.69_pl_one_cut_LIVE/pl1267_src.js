/* Author: Andrew Fisher. v12.67 - the P&L tab in one cut of the costs.
   Andrew, 30 Oct 2026 (this chat, 20:2x AEST): "I also want the p&l reviewed again. I want it clean and clear. Easy to understand.
   And u understand where costs are." The review (review_30Oct2026_pl_again/) found the costs cut three ways on the one tab and two
   "difference so far" figures; the mock-up proposed one cut, in plain words. Andrew, 31 Oct 2026 06:5x AEST: "Yes proceed".
   The face of the Costs & P&L pane becomes: three tiles (Charged to the V8s · What it costs us · Difference so far, job end under
   each); What we charge the V8s, by stream in plain words with the ledger code in small print; Where the costs are, one table under
   the eight categories management expect, each line naming who we pay and what for, so far and job end; By branch, job end, as
   cards (the project manager's ruling of 29 Oct 2026: the people's event labour revenue, their travel, accommodation and meals sit
   on KINP); Not in it yet; then three closed folds: Finance's lines (the ledger table of v12.65 as it was, gross margin and
   contribution), Fencing, everything included, and Workings (every other card, moved, not removed, every button still bound).
   Every figure is the page's own models' (pl770Model, moneySummary, fh866Model, cj764Model) and the face says whether it ties:
   What it costs us is the Finance handover's total to the cent; Difference so far is the Forecast P&L's difference, which from
   v12.67 takes the labour hire so far off as its job-end figure always did, so the face, At a glance and the Forecast P&L show one
   difference. Nothing is typed here; nothing is written to the record. */
var PL1267 = (function (W, D) {
'use strict';
var KEEP = ['rochip', 'finance857-nav', 'panehead'];
function num(n) { return typeof n === 'number' && isFinite(n); }
function r2(n) { return Math.round(n * 100) / 100; }
function cents(a, b) { return num(a) && num(b) && Math.abs(r2(a) - r2(b)) < 0.005; }
function dash() { return '<span class="pl1267-dash">—</span>'; }
function m(v) { return v == null || !num(v) || Math.abs(v) < 0.005 ? dash() : esc(money(v)); }
function hrs(v) { return v == null || !num(v) ? dash() : '<span class="pl1267-h">' + esc(fmtNum(v)) + ' h</span>'; }
function pc(v) { return v == null || !num(v) ? '' : (Math.round(v * 1000) / 10).toFixed(1) + '%'; }
function line(list, key) { for (var i = 0; i < (list || []).length; i++) if (list[i].key === key) return list[i]; return null; }
function add(a, b) { var n = num(a) ? a : 0, o = num(b) ? b : 0; return (num(a) || num(b)) ? r2(n + o) : null; }
function sumBy(rows, f) { var t = 0, any = false; (rows || []).forEach(function (r) { var v = f(r); if (num(v)) { t += v; any = true; } }); return any ? r2(t) : null; }
function branchNames() {
  var out = {}; try { var meta = D.querySelector('meta[name="gc500-branches"]'); String(meta && meta.content || '').split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); } catch (e) {}
  return out;
}

/* Finance's lines: the v12.65 face, unchanged - the P&L in the ledger's lines, gross margin and contribution, and the by-branch
   table. Every figure the page's own model's. */
function ledger() {
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
  var accom = k.accommodation ? k.accommodation.amount : null, meals = add(k.meals ? k.meals.amount : null, k.misc ? k.misc.amount : null);
  var fAccom = null, fMeals = null; (F.costs || []).forEach(function (s) { if (s.kind === 'expenses' && /accommodation/i.test(s.stream)) fAccom = s; else if (s.kind === 'expenses') fMeals = s; });
  var allowance = num(W_.allowanceForecast) ? W_.allowanceForecast : 0;
  var labourNow = num(W_.known) ? W_.known : (num(W_.toDate) ? W_.toDate : null), labourJob = num(W_.job) ? r2(W_.job - allowance) : null;
  var op = [
    {code: '3210 · 2143', name: 'Labour hire', now: labourNow, job: labourJob, note: 'the hired-in people on the running sheet, priced by the run rules'},
    {code: '3210', name: 'Salary allowance', now: null, job: allowance || null, note: 'job end'},
    {code: '3520 · 3501', name: 'Travel and accommodation', now: accom, job: fAccom ? fAccom.job : accom, note: k.accommodation ? fmtNum(k.accommodation.nights) + ' nights' : ''},
    {code: '3520 · 3501', name: 'Meals and expenses', now: meals, job: fMeals ? fMeals.job : meals, note: ''},
    {code: '3210', name: 'Coates wages', now: null, job: null, hours: {now: W_.hoursOnlyToDate, job: W_.hoursOnly}, note: 'hours only, no hourly rate (the project manager, 23 Oct 2026)'}
  ];
  var opNow = sumBy(op, function (r) { return r.now; }), opJob = sumBy(op, function (r) { return r.job; });
  var contrib = {now: add(gm.now, -opNow), job: add(gm.job, -opJob)};
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
  var taken = [];
  var bRows = streams.map(function (st) {
    var by = zero(), job = 0;
    (F.costs || []).forEach(function (s, i) { if (taken.indexOf(i) >= 0 || !st.test(s)) return; taken.push(i); var sj = num(s.job) ? s.job : 0; job = r2(job + sj); if (st.kinp) by.KINP = r2(by.KINP + sj); else Object.keys(s.by || {}).forEach(function (b) { if (b in by) by[b] = r2(by[b] + (s.by[b] || 0)); else by.KINP = r2(by.KINP + (s.by[b] || 0)); }); });
    return {name: st.name, by: by, job: job};
  });
  var restBy = zero(), rest = 0; (F.costs || []).forEach(function (s, i) { if (taken.indexOf(i) >= 0) return; var sj = num(s.job) ? s.job : 0; rest = r2(rest + sj); Object.keys(s.by || {}).forEach(function (b) { if (b in restBy) restBy[b] = r2(restBy[b] + (s.by[b] || 0)); }); });
  if (rest) bRows.push({name: 'Other costs', by: restBy, job: rest});
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

/* the face: one cut of the costs, in plain words; every figure the page's own models' */
function model() {
  var L = ledger();
  var P = pl770Model(), M = moneySummary(), F = fh866Model(), X = cj764Model(), k = M.cost || {}, c = M.charge || {}, W_ = P.wages || {};
  var LH = k.labour_hire1267 || {};
  var words = {
    hire: ['Our gear on hire', 'the contracts at their rate, the card where a line has none'],
    rehire: ['Hired-in gear at our rates', 'Advanced’s fencing, Event Portables’ toilets, the sub-hired boards and plant · job end adds the fencing to come'],
    transport: ['Delivery and pick-up', ''],
    pump: ['Toilet pump-outs', 'water included'],
    install: ['Install, levelling, steps, cleaning, demob and the people over the event', ''],
    cons: ['Consumables', 'toilet paper, hand towels, shade cloth'],
    event_support: ['Accommodation and travel in the event scope', 'ledger line for Finance to confirm'],
    contract_services1224: ['Contract services, miscellaneous', '']
  };
  var order = ['hire', 'rehire', 'transport', 'pump', 'install', 'cons', 'event_support', 'contract_services1224'];
  var live = function (l) { return l && (num(l.now) && l.now !== 0 || num(l.job) && l.job !== 0); };
  var rev = [], used = {cleaning: 1};
  var clean = line(P.rev, 'cleaning');
  order.forEach(function (key) {
    var l = line(P.rev, key); used[key] = 1; if (!l) return;
    var row = {key: key, code: l.code || '—', name: words[key][0], note: words[key][1], now: l.now, job: l.job};
    if (key === 'install' && live(clean)) { row.now = add(l.now, clean.now); row.job = add(l.job, clean.job); row.code = (l.code || '1047') + ' · ' + (clean.code || '1025'); }
    if (live(row)) rev.push(row);
  });
  (P.rev || []).forEach(function (l) { if (!used[l.key] && live(l)) rev.push({key: l.key, code: l.code || '—', name: l.line || l.key, note: '', now: l.now, job: l.job}); });
  var revNow = sumBy(rev, function (r) { return r.now; }), revJob = sumBy(rev, function (r) { return r.job; });

  /* the Finance handover's cost streams, by kind */
  var kind = function (test) { var out = {toDate: 0, toCome: 0, job: 0, by: {}, n: 0}; (F.costs || []).forEach(function (s) { if (!test(s)) return; out.n++; out.toDate = r2(out.toDate + (num(s.toDate) ? s.toDate : 0)); out.toCome = r2(out.toCome + (num(s.toCome) ? s.toCome : 0)); out.job = r2(out.job + (num(s.job) ? s.job : 0)); Object.keys(s.by || {}).forEach(function (b) { out.by[b] = r2((out.by[b] || 0) + (s.by[b] || 0)); }); }); return out; };
  var fence = kind(function (s) { return s.kind === 'fencing'; }), toil = kind(function (s) { return s.kind === 'toilets'; }), sub = kind(function (s) { return s.kind === 'rehire'; });
  var trans = kind(function (s) { return s.kind === 'transport'; }), accom = kind(function (s) { return s.kind === 'expenses' && /accommodation/i.test(s.stream); }), meals = kind(function (s) { return s.kind === 'expenses' && !/accommodation/i.test(s.stream); });
  var hire = kind(function (s) { return s.kind === 'labour' && /labour hire/i.test(s.stream); }), allow = kind(function (s) { return s.kind === 'labour' && /allowance/i.test(s.stream); });
  var inst = line(P.cost, 'install') || {now: 0, job: 0}, pump = line(P.cost, 'pump') || {now: null, job: null}, cons = line(P.cost, 'cons') || {now: null, job: null}, tr = line(P.cost, 'transport') || {now: null, job: null};
  var qk = P.qk || {};
  var fBr = 'STPS', tBr = 'KINP'; try { if (typeof pl760FencingBranch === 'function') fBr = pl760FencingBranch() || fBr; } catch (e) {} try { if (typeof pl760ToiletBranch === 'function') tBr = pl760ToiletBranch() || tBr; } catch (e) {}
  var byWords = function (by) { return Object.keys(by || {}).filter(function (b) { return by[b]; }).sort(function (a, b) { return by[b] - by[a]; }).map(function (b) { return b + ' ' + money0(by[b]); }).join(' · '); };
  /* the sub-hire suppliers as the record names them, in reading case: "PREMIAIR SERVICES PTY LTD" reads Premiair Services */
  var tidy = function (name) { return String(name || '').replace(/\s*\/\s*\(/g, ' (').replace(/\bPTY\.?\s*LTD\.?/gi, '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/(^|[\s(])([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); }); };
  var suppliers = ''; try { if (typeof Source949 !== 'undefined') { var acc = {}, ord = []; (Source949.model() || []).forEach(function (f) { if (!f || !f.supplier) return; var key = f.supplier + '|' + (f.costBranch || ''); if (!acc[key]) { acc[key] = {name: f.supplier, branch: f.costBranch || '', est: 0}; ord.push(key); } acc[key].est = r2(acc[key].est + (Number(f.estimate) || 0)); }); suppliers = ord.map(function (key) { var x = acc[key]; return tidy(x.name) + ' ' + money0(x.est) + (x.branch ? ' (' + x.branch + ')' : ''); }).join(' · '); } } catch (e) {}
  var plus = k.transport && k.transport.schedule ? k.transport.schedule.plus : 0;
  var nights = k.accommodation ? k.accommodation.nights : null, unpriced = k.accommodation ? k.accommodation.unpriced : 0;
  var dockets = c.fencing_dockets || 0;
  var g = [];
  var grp = function (name, chip, lines) { lines = lines.filter(function (l) { return l && (l.hours || num(l.now) && l.now !== 0 || num(l.job) && l.job !== 0); }); if (lines.length) g.push({name: name, chip: chip, lines: lines}); };
  grp('Temporary fencing and crowd control', fBr, [
    {name: 'Advanced’s gear on the dockets, at their sheet', code: '2126', now: r2(fence.toDate - (inst.now || 0)), job: r2(fence.job - (inst.job || 0)), note: (dockets ? fmtNum(dockets) + ' dockets · ' : '') + 'receipted orders at their amount' + (fence.toCome ? ' · job end adds the programme to come' : '')}
  ]);
  grp('External contractor costs', '', [
    {name: 'Advanced’s crew: the dockets and the green book', code: '2142', now: inst.now, job: inst.job, note: fBr},
    {name: 'The hired-in people on the running sheet, by the run rules', code: '3210 · 2143', now: num(LH.known) ? LH.known : hire.toDate, job: hire.job, note: 'KINP · labour hire at the rates on the record · job end adds the shifts still to work'}
  ]);
  var epClean = P.qClean && num(qk.rehire) && num(qk.pump) && num(qk.cons) && cents(qk.rehire + qk.pump + qk.cons, toil.job);
  grp('Rehire costs', tBr, epClean ? [
    {name: 'Event Portables: toilet hire, their labour, delivery and pick-up', code: '2126', now: qk.rehire, job: qk.rehire, note: k.rehire_approved ? 'the quotes approved · the final total may change' : 'the quotes'},
    {name: 'Event Portables: servicing on our site count', code: '3325', now: pump.now, job: pump.job, note: ''},
    {name: 'Event Portables: water deliveries and the tank', code: '2144', now: cons.now, job: cons.job, note: ''},
    {name: 'Sub-hired boards and plant, supplier estimates', code: '2126', now: sub.toDate || null, job: sub.job, note: [suppliers || byWords(sub.by), 'no invoice yet'].filter(Boolean).join(' · ')}
  ] : [
    {name: 'Event Portables: toilet hire, servicing and water', code: '2126 · 3325 · 2144', now: toil.toDate, job: toil.job, note: 'the quotes, carried whole'},
    {name: 'Sub-hired boards and plant, supplier estimates', code: '2126', now: sub.toDate || null, job: sub.job, note: [suppliers || byWords(sub.by), 'no invoice yet'].filter(Boolean).join(' · ')}
  ]);
  grp('Internal labour hours and overtime', 'KINP', [
    {name: 'Coates wages', code: '3210', hours: {now: W_.hoursOnlyToDate, job: W_.hoursOnly}, note: 'hours only, never priced here (the project manager, 23 Oct 2026)'},
    {name: 'Salary allowance, living away', code: '3210', now: null, job: allow.job, note: 'forecast, job end'}
  ]);
  grp('Any other event-related expenses', '', [
    {name: 'Transport paid to the carriers', code: '2120 · 2140', now: tr.now, job: tr.job, note: [byWords(trans.by), plus ? fmtNum(plus) + ' schedule figures written with a plus, so at least that' : ''].filter(Boolean).join(' · ')},
    {name: 'Accommodation' + (nights ? ', ' + fmtNum(nights) + ' nights' : ''), code: '3520 · 3501', now: accom.toDate, job: accom.job, note: ['KINP', unpriced ? fmtNum(unpriced) + ' nights not priced yet, at the person’s own average' : ''].filter(Boolean).join(' · ')},
    {name: 'Meals and expenses', code: '3520 · 3501', now: meals.toDate, job: meals.job, note: 'KINP'}
  ]);
  var none = (M.categories || []).filter(function (x) { return !x.known && !x.hours; }).map(function (x) { return x.category; });
  var all = []; g.forEach(function (x) { x.lines.forEach(function (l) { all.push(l); }); });
  var costNow = sumBy(all, function (l) { return l.hours ? null : l.now; }), costJob = sumBy(all, function (l) { return l.hours ? null : l.job; });
  var diffNow = add(revNow, -costNow), diffJob = add(revJob, -costJob);
  var hand = F.costTotal || {};
  var checks = {
    revenue: cents(revNow, P.revNow) && cents(revNow, c.total) && cents(revJob, P.revJob),
    costs: cents(costNow, hand.toDate) && cents(costJob, num(F.plJob) ? F.plJob : hand.job),
    difference: cents(diffNow, M.difference) && cents(diffNow, L.contrib.now) && (!P.diff || !num(P.diff.job) || cents(diffJob, P.diff.job)),
    labourHire: !num(LH.known) || cents(LH.known, hire.toDate),
    ledger: L.ok
  };
  var ok = Object.keys(checks).every(function (x) { return checks[x]; });
  var names = branchNames();
  var branches = L.cols.map(function (col) { return {code: col, name: names[col] || '', rev: L.revJobB[col], cost: L.costB[col], diff: L.contribB[col]}; });
  var gaps = L.gaps.slice(); gaps.push({what: 'Coates wages, hours only', owner: 'never priced here (the project manager, 23 Oct 2026)'});
  return {asAt: P.asAt, rev: rev, revNow: revNow, revJob: revJob, groups: g, none: none, costNow: costNow, costJob: costJob, diffNow: diffNow, diffJob: diffJob,
    pcNow: revNow ? diffNow / revNow : null, pcJob: revJob ? diffJob / revJob : null, branches: branches, job: {rev: L.revJobT, cost: L.costJobB, diff: L.contribT}, moved: L.moved, gaps: gaps, checks: checks, ok: ok, L: L};
}

function tick(good, words) { return '<span class="pl1267-tick ' + (good ? 'ok' : 'bad') + '">' + (good ? '✓' : '✗') + ' ' + esc(words) + '</span>'; }
function code(c) { return c && c !== '—' ? '<span class="pl1267-code">' + esc(c) + '</span>' : ''; }
function cell(l, side) { if (l.hours) return hrs(l.hours[side]); return m(l[side]); }

function faceHtml(Mo) {
  var eyebrow = function (t) { return '<p class="fin745-eyebrow">' + t + '</p>'; };
  var tile = function (label, big, small, cls) { return '<div class="pl1267-tile' + (cls ? ' ' + cls : '') + '"><div class="pl1267-tl">' + esc(label) + '</div><div class="pl1267-tv">' + big + '</div><div class="pl1267-ts">' + small + '</div></div>'; };
  var t1 = '<section id="pl1267" class="card pl1267 nosfold" aria-labelledby="pl1267Title">'
    + eyebrow('P&amp;L · WHOLE JOB · AUD EX GST · AS AT ' + esc(fmtDate(Mo.asAt).toUpperCase()))
    + '<h2 id="pl1267Title" class="vh">P&amp;L</h2>'
    + '<div class="pl1267-tiles">'
    + tile('Charged to the V8s', m(Mo.revNow), 'so far on the record · ' + m(Mo.revJob) + ' at job end')
    + tile('What it costs us', m(Mo.costNow), 'so far · ' + m(Mo.costJob) + ' at job end')
    + tile('Difference so far', m(Mo.diffNow) + '<small>' + pc(Mo.pcNow) + '</small>', m(Mo.diffJob) + ' · ' + pc(Mo.pcJob) + ' at job end · not a margin until the costs are complete', Mo.diffNow < 0 ? 'pl1267-neg' : '')
    + '</div></section>';
  var head = '<thead><tr><th>' + '$1' + '</th><th class="num">So far</th><th class="num">Job end</th></tr></thead>';
  var row = function (l, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + esc(l.name) + code(l.code) + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</td><td class="num">' + cell(l, 'now') + '</td><td class="num">' + cell(l, 'job') + '</td></tr>'; };
  var tot = function (name, now, job, cls, pcNow, pcJob) { return '<tr class="' + cls + '"><td>' + esc(name) + '</td><td class="num">' + m(now) + (pcNow != null ? '<span class="pl1267-pc">' + pc(pcNow) + '</span>' : '') + '</td><td class="num">' + m(job) + (pcJob != null ? '<span class="pl1267-pc">' + pc(pcJob) + '</span>' : '') + '</td></tr>'; };
  var t2 = '<section id="pl1267-rev" class="card pl1267-rev nosfold">' + eyebrow('WHAT WE CHARGE THE V8S · REVENUE')
    + '<div class="tblwrap"><table class="pl1267-tbl">' + head.replace('$1', 'What') + '<tbody>'
    + Mo.rev.map(function (r) { return row(r); }).join('')
    + tot('Charged to the V8s', Mo.revNow, Mo.revJob, 'pl1267-tot')
    + '</tbody></table></div>'
    + '<p class="pl1267-foot">' + tick(Mo.checks.revenue, 'the Forecast P&L’s revenue to the cent') + '</p></section>';
  var t3 = '<section id="pl1267-cost" class="card pl1267-cost nosfold">' + eyebrow('WHERE THE COSTS ARE · THE EIGHT CATEGORIES MANAGEMENT EXPECT · WHO WE PAY')
    + '<div class="tblwrap"><table class="pl1267-tbl">' + head.replace('$1', 'Who we pay, and what for') + '<tbody>'
    + Mo.groups.map(function (gr) { return '<tr class="pl1267-grp"><td colspan="3">' + esc(gr.name) + (gr.chip ? '<span>' + esc(gr.chip) + '</span>' : '') + '</td></tr>' + gr.lines.map(function (l) { return row(l); }).join(''); }).join('')
    + (Mo.none.length ? '<tr class="pl1267-none"><td colspan="3"><small>Nothing recorded under ' + esc(Mo.none.join(', ')) + '.</small></td></tr>' : '')
    + tot('What it costs us', Mo.costNow, Mo.costJob, 'pl1267-tot')
    + tot('Difference so far', Mo.diffNow, Mo.diffJob, 'pl1267-diff' + (Mo.diffNow < 0 ? ' pl1267-neg' : ''), Mo.pcNow, Mo.pcJob)
    + '</tbody></table></div>'
    + '<p class="pl1267-foot">' + tick(Mo.checks.costs, 'ties to the Finance handover to the cent') + ' ' + tick(Mo.checks.difference, 'one difference: the Forecast P&L’s, the same figure on At a glance') + '</p></section>';
  var br = function (b, cls) { return '<div class="pl1267-br' + (cls ? ' ' + cls : '') + '"><div class="pl1267-bb">' + esc(b.code) + (b.name ? ' · ' + esc(b.name) : '') + '</div><div class="pl1267-r"><span>Charged</span><span>' + m(b.rev) + '</span></div><div class="pl1267-r"><span>Costs</span><span>' + m(b.cost) + '</span></div><div class="pl1267-r"><span>Difference</span><span>' + m(b.diff) + '</span></div></div>'; };
  var t4 = '<section id="pl1267-branch" class="card pl1267-branch nosfold">' + eyebrow('BY BRANCH · JOB END')
    + '<div class="pl1267-brs">' + Mo.branches.map(function (b) { return br(b); }).join('') + br({code: 'THE JOB', name: '', rev: Mo.job.rev, cost: Mo.job.cost, diff: Mo.job.diff}, 'pl1267-job') + '</div>'
    + '<p class="pl1267-foot">' + tick(Mo.L.checks.branchesRevenue && Mo.L.checks.branchesCost && Mo.L.checks.branchesContribution, 'the branches foot to the job') + ' <span class="pl1267-rule">The people’s event labour revenue' + (Mo.moved ? ' (' + esc(money(Mo.moved)) + ')' : '') + ', their travel, accommodation and meals sit on KINP (the project manager, 29 Oct 2026). Gear and moves sit on the branch of the gear.</span></p></section>';
  var t5 = '<section id="pl1267-gaps" class="card pl1267-gaps nosfold">' + eyebrow('NOT IN IT YET · NAMED, NEVER ADDED')
    + (Mo.gaps.length ? '<ul>' + Mo.gaps.map(function (x) { return '<li>' + esc(x.what) + (x.owner ? '<small>' + esc(x.owner) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p>Nothing named.</p>') + '</section>';
  return t1 + t2 + t3 + t4 + t5;
}

/* Finance's lines: the v12.65 ledger tables, inside their fold */
function ledgerHtml(L) {
  var row = function (r) { return '<tr><td class="pl1267-lcode">' + (r.code ? '<span class="chip ref mono">' + esc(r.code) + '</span>' : '') + '</td><td>' + esc(r.name) + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</td><td class="num">' + (r.hours ? hrs(r.hours.now || 0) : m(r.now)) + '</td><td class="num">' + (r.hours ? hrs(r.hours.job || 0) : m(r.job)) + '</td></tr>'; };
  var tot = function (name, now, job, cls, pcNow, pcJob) { return '<tr class="' + (cls || 'pl1267-tot') + '"><td></td><td>' + esc(name) + '</td><td class="num">' + m(now) + (pcNow != null ? '<span class="pl1267-pc">' + pc(pcNow) + '</span>' : '') + '</td><td class="num">' + m(job) + (pcJob != null ? '<span class="pl1267-pc">' + pc(pcJob) + '</span>' : '') + '</td></tr>'; };
  var sub = function (name) { return '<tr class="pl1267-sub"><td colspan="4">' + esc(name) + '</td></tr>'; };
  var cols = L.cols;
  var bh = '<tr><th></th>' + cols.map(function (c) { return '<th class="num">' + esc(c) + '</th>'; }).join('') + '<th class="num">Job</th></tr>';
  var brow = function (name, by, job, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + esc(name) + '</td>' + cols.map(function (c) { return '<td class="num">' + m(by[c]) + '</td>'; }).join('') + '<td class="num">' + m(job) + '</td></tr>'; };
  return '<div class="pl1267-ledger">'
    + '<p class="fin745-eyebrow">THE SAME FIGURES ON THE LEDGER’S LINES · ON THE RECORD AND JOB END</p>'
    + '<div class="tblwrap"><table class="pl1267-tbl pl1267-ltbl"><thead><tr><th>Code</th><th>Line</th><th class="num">On the record</th><th class="num">Job end</th></tr></thead><tbody>'
    + sub('Revenue') + L.rev.map(row).join('') + tot('Revenue', L.revNow, L.revJob, 'pl1267-grand')
    + sub('Cost of sales') + L.cost.map(row).join('') + tot('Cost of sales', L.direct, L.directJob)
    + tot('Gross margin', L.gm.now, L.gm.job, 'pl1267-grand', L.gmPc.now, L.gmPc.job)
    + sub('Operating costs') + L.op.map(row).join('') + tot('Operating costs', L.opNow, L.opJob)
    + tot('Contribution', L.contrib.now, L.contrib.job, 'pl1267-grand pl1267-final', L.contribPc.now, L.contribPc.job)
    + '</tbody></table></div>'
    + '<p class="pl1267-foot">' + tick(L.checks.revenue && L.checks.direct, 'revenue and cost of sales tie to the Forecast P&L to the cent') + ' ' + tick(L.checks.contribution, 'contribution is the P&L’s difference to job end') + '</p>'
    + '<h3 class="pl1267-h3">By branch · job end</h3>'
    + '<div class="tblwrap"><table class="pl1267-tbl pl1267-ltbl pl1267-branchtbl"><thead>' + bh + '</thead><tbody>'
    + brow('Revenue · on the record', L.revRec, L.revRecT)
    + brow('Revenue · job end', L.revJobB, L.revJobT, 'pl1267-grand')
    + L.bRows.map(function (r) { return brow(r.name, r.by, r.job); }).join('')
    + brow('Costs · job end', L.costB, L.costJobB, 'pl1267-tot')
    + brow('Contribution · job end', L.contribB, L.contribT, 'pl1267-grand pl1267-final')
    + '</tbody></table></div></div>';
}

function fold(id, title, small) {
  var key = 'costs765|' + id, open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (e) {}
  var d = D.createElement('details'); d.className = 'plfold765 pl1267-fold'; d.id = id; d.setAttribute('data-sfold', key); if (open) d.open = true;
  d.innerHTML = '<summary>' + esc(title) + (small ? '<small>' + esc(small) + '</small>' : '') + '</summary>';
  return d;
}
function isKept(el) { if (!el || el.nodeType !== 1) return false; if (el.id === 'panehead-costs') return true; for (var i = 0; i < KEEP.length; i++) if (el.classList.contains(KEEP[i])) return true; return /^pl1267/.test(el.id || ''); }
function fenceWords(card) { try { var t = (card.textContent || '').replace(/\s+/g, ' '); var a = t.match(/Charge to the V8s (\$[\d,]+\.\d\d)/), b = t.match(/we pay (\$[\d,]+\.\d\d)/); return (a ? 'charged ' + a[1] : '') + (a && b ? ' · ' : '') + (b ? 'we pay ' + b[1] : ''); } catch (e) { return ''; } }

var busy = false;
function apply() {
  if (busy) return; var pane = D.getElementById('pane-costs'); if (!pane || !D.getElementById('pl770') || D.getElementById('pl1267')) return;
  busy = true;
  try {
    var Mo; try { Mo = typeof holdAssets === 'function' ? holdAssets(model) : model(); } catch (e) { try { console.warn('PL1267: the face could not be worked out', e); } catch (_) {} return; }
    var kept = [], rest = []; Array.prototype.slice.call(pane.children).forEach(function (el) { (isKept(el) ? kept : rest).push(el); });
    var fence = D.getElementById('fence-allin12423');
    var wrap = D.createElement('div'); wrap.innerHTML = faceHtml(Mo);
    var fin = fold('pl1267-finance', 'Finance’s lines', 'the ledger codes · cost of sales, gross margin ' + pc(Mo.L.gmPc.job) + ' and contribution, as Finance reads it');
    var finBody = D.createElement('div'); finBody.innerHTML = ledgerHtml(Mo.L); while (finBody.firstChild) fin.appendChild(finBody.firstChild);
    /* the fencing card's own script puts it back at the top after each render, sometimes after this runs: its fold is always
       there, hidden while empty, and the card goes into it whenever it arrives */
    var fenceFold = fold('pl1267-fence', 'Fencing, everything included', fence ? fenceWords(fence) : '');
    var work = fold('pl1267-work', 'Workings', 'every card the figures come from · At a glance · the Forecast P&L · month-end for Finance · ticks and controls');
    rest.forEach(function (el) { if (el === fence) fenceFold.appendChild(el); else work.appendChild(el); });
    fenceFold.classList.toggle('pl1267-empty', !fence);
    var frag = D.createDocumentFragment();
    while (wrap.firstChild) frag.appendChild(wrap.firstChild);
    frag.appendChild(fin);
    frag.appendChild(fenceFold);
    frag.appendChild(work);
    pane.appendChild(frag);
    pane.setAttribute('data-pl1267', Mo.ok ? 'ties' : 'differs');
  } finally { busy = false; }
}
function takeFence(card) {
  var f = D.getElementById('pl1267-fence'); if (!f) return false;
  f.appendChild(card); f.classList.remove('pl1267-empty');
  var sm = f.querySelector('summary small'), words = fenceWords(card);
  if (words) { if (!sm) { sm = D.createElement('small'); f.querySelector('summary').appendChild(sm); } sm.textContent = words; }
  return true;
}
/* a card that arrives after the face is built (another script's late insert) goes under its fold or Workings, never above the P&L */
function late(muts) {
  var pane = D.getElementById('pane-costs'), work = D.getElementById('pl1267-work'); if (!pane || !work || busy) return;
  muts.forEach(function (mu) { Array.prototype.slice.call(mu.addedNodes || []).forEach(function (n) { if (n.nodeType !== 1 || n.parentNode !== pane || isKept(n)) return; if (n.id === 'fence-allin12423' && takeFence(n)) return; work.appendChild(n); }); });
}
function hook() {
  if (typeof renderCosts !== 'function' || renderCosts.pl1267) return;
  var R0 = renderCosts;
  renderCosts = function () { var out = R0.apply(this, arguments); try { apply(); } catch (e) { try { console.warn('PL1267', e); } catch (_) {} } return out; };
  renderCosts.pl1267 = true; try { W.renderCosts = renderCosts; } catch (e) {}
  var pane = D.getElementById('pane-costs'); if (pane && !pane.__pl1267) { pane.__pl1267 = true; new MutationObserver(late).observe(pane, {childList: true}); }
  try { apply(); } catch (e) {}
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', hook); else hook();
return {model: model, ledger: ledger, faceHtml: faceHtml, ledgerHtml: ledgerHtml, apply: apply};
})(window, document);
