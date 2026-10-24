/* Author: Andrew Fisher. v11.94 - Costs: the P&L all in.
   Andrew, 25 Oct 2026 (this chat): "costs sorted. P&L sorted. Clean and tidy. All costs should be all in. We should know how
   much. Including demob. Apart from fencing. Should be simple. Whats the additional forecasf. This should be 0 ... Only thing we
   wont know. Is fencing"; and "We now have amanagrmnt looking".
   The P&L card shows each line's job total, all in: the record so far plus the rest of the job at the known rates, demob
   included. Beside it is the one estimate still to come, fencing's remaining programme (Advanced's decon weeks: the 2026 card
   for Revenue, Advanced's own rates for cost) until the dockets come in; every other line's still-to-come is nil. What is not
   in it yet is named in one line, never added. Presentation only: every figure comes from the page's own models (pl770Model,
   cj764Model, branchFinancial978), unchanged, and if the lines do not tie to the cent the card is left exactly as it was. */
var PL1194 = (function () {
'use strict';
/* the P&L card's own grouping of the ledger lines (pnl-clarity981) */
var REV = [['Hire Revenue', ['1005']], ['Rehire Revenue', ['1010']], ['Transport Revenue', ['1030 · 1031', '1032']], ['Other Revenue', ['1020', '1047', '1025', '1015']]];
var COST = [['Total Repairs & Maintenance', ['2357']], ['Transport', ['2120 · 2140', '3325']], ['Rehire', ['2126']], ['Other Direct Costs', ['2144', '2142']]];
function num(n) { return typeof n === 'number' && isFinite(n); }
function r2(n) { return Math.round(n * 100) / 100; }
function group(lines, spec, pending) {
  var codes = [];
  spec.forEach(function (s) { codes = codes.concat(s[1]); });
  var out = spec.map(function (s) { return {label: s[0], rows: (lines || []).filter(function (l) { return s[1].indexOf(l.code) >= 0; })}; });
  out.push({label: pending, rows: (lines || []).filter(function (l) { return codes.indexOf(l.code) < 0; })});
  return out.filter(function (g) { return g.rows.length; }).map(function (g) {
    var priced = g.rows.filter(function (l) { return num(l.job); });
    return {label: g.label, job: priced.length ? r2(priced.reduce(function (n, l) { return n + l.job; }, 0)) : null, unpriced: g.rows.length - priced.length, fence: 0};
  });
}
/* the statement: each line's job total all in, with fencing's remaining programme - the one estimate - beside it */
function rows(m) {
  var fr = num(m.fenceRevenue) ? m.fenceRevenue : 0, fc = num(m.fenceCost) ? m.fenceCost : 0;
  var rev = group(m.rev, REV, 'Revenue · allocation pending'), cost = group(m.cost, COST, 'Direct costs · allocation pending');
  rev.forEach(function (g) { if (g.label === 'Rehire Revenue') g.fence = fr; });
  cost.forEach(function (g) { if (g.label === 'Rehire') g.fence = fc; });
  var gm = num(m.revJob) && num(m.directJob) ? r2(m.revJob - m.directJob) : null;
  return [{section: 'Revenue'}].concat(rev, [
    {label: 'Total Revenue', job: m.revJob, fence: fr, total: true},
    {section: 'Direct costs'}], cost, [
    {label: 'Total Direct Costs', job: m.directJob, fence: fc, total: true},
    {label: 'Gross Margin · all in', job: gm, fence: r2(fr - fc), total: true, pct: num(gm) && m.revJob ? gm / m.revJob : null},
    {section: 'Overheads and wages'},
    {label: 'Labour hire and salary allowance', job: m.wagesJob, fence: 0},
    {label: 'Coates wages and salary', text: (m.hoursText || '0') + ' h on the running sheet, hours only, not priced (the project manager, 23 Oct 2026)'},
    {label: 'Travel, accommodation, meals and printing', job: m.overJob, fence: 0},
    {label: 'Difference · all in, not a margin yet', job: m.differenceJob, fence: r2(fr - fc), total: true, result: true}]);
}
/* the statement ties to the cent, or it is not shown */
function checks(m) {
  var rev = group(m.rev, REV, 'p'), cost = group(m.cost, COST, 'p'), sum = function (gs) { return r2(gs.reduce(function (n, g) { return n + (num(g.job) ? g.job : 0); }, 0)); };
  var out = {revenue: num(m.revJob) && sum(rev) === r2(m.revJob), costs: num(m.directJob) && sum(cost) === r2(m.directJob),
    difference: [m.revJob, m.directJob, m.wagesJob, m.overJob, m.differenceJob].every(num) && r2(m.revJob - m.directJob - m.wagesJob - m.overJob) === r2(m.differenceJob),
    fencing: (!num(m.fenceRevenue) || m.fenceRevenue >= 0) && (!num(m.fenceCost) || m.fenceCost >= 0)};
  out.all = out.revenue && out.costs && out.difference && out.fencing;
  return out;
}
/* what is not in it yet, named from the cost gaps; Coates wages are hours, never dollars */
function notYet(gaps, hoursText) {
  var out = (Array.isArray(gaps) ? gaps : []).map(function (g) { return g && g.what ? String(g.what).trim() : ''; }).filter(Boolean);
  if (hoursText) out.push('Coates wages and salary, ' + hoursText + ' h, hours only');
  return out;
}
return {REV: REV, COST: COST, group: group, rows: rows, checks: checks, notYet: notYet};
})();
if (typeof module === 'object' && module && module.exports) module.exports = PL1194;

(function (W) {
'use strict';
if (typeof document === 'undefined' || W.__pl1194) return;
W.__pl1194 = true;
if (typeof pl770Card !== 'function') return;
var P1194 = PL1194, prior = pl770Card;
function h(s) { return typeof esc === 'function' ? esc(String(s)) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
function dollars(n) { return typeof money === 'function' ? money(n) : '$' + Number(n).toFixed(2); }
function cell(n) { return n == null ? '<span class="pl-todo">Unpriced</span>' : h(dollars(n)); }
function fence(n) { return n ? h(dollars(n)) : '<span class="pl1194-nil" aria-label="nil">—</span>'; }
function label(r) {
  return (r.total ? '<b>' : '') + h(r.label) + (r.total ? '</b>' : '') +
    (r.pct != null ? ' <span class="pl1194-pct">' + h((r.pct * 100).toFixed(1) + '%') + '</span>' : '') +
    (r.unpriced ? ' <span class="chip warn">' + h(r.unpriced) + ' unpriced</span>' : '');
}
function statement(R) {
  var desk = '<div class="branch978-desktop tblwrap" data-pl1194><table class="pl-tbl pl1194-tbl"><thead><tr><th>GC500</th>' +
    '<th class="num">Job total · all in</th><th class="num">Of which · fencing still to come</th></tr></thead><tbody>' +
    R.map(function (r) {
      if (r.section) return '<tr><th colspan="3">' + h(r.section) + '</th></tr>';
      if (r.text) return '<tr data-pl1194-text><td>' + h(r.label) + '</td><td colspan="2" class="acc761-w">' + h(r.text) + '</td></tr>';
      return '<tr' + (r.total ? ' class="tot"' : '') + (r.result ? ' data-pl1194-result' : '') + '><td>' + label(r) + '</td><td class="num">' + cell(r.job) + '</td><td class="num pl1194-fence">' + fence(r.fence) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  var mob = '<div class="branch978-mobile" data-pl1194>' + R.map(function (r) {
    if (r.section) return '<h3>' + h(r.section) + '</h3>';
    if (r.text) return '<article class="card pl1194-card" data-pl1194-text><b>' + h(r.label) + '</b><p class="acc761-w">' + h(r.text) + '</p></article>';
    return '<article class="card pl1194-card"' + (r.result ? ' data-pl1194-result' : '') + '><b>' + label(r) + '</b><div class="pl1194-fig"><span>Job total · all in</span><b>' + cell(r.job) + '</b>' +
      (r.fence ? '<span>Of which · fencing still to come</span><span>' + fence(r.fence) + '</span>' : '') + '</div></article>';
  }).join('') + '</div>';
  return desk + mob;
}
var DEFS = {
  'Job forecast': ['Job total · all in', 'Every line to job end: the current record plus the rest of the job at the known rates, demob included. That means transport back at the card’s cost per load (the average so far where the card has none), the running sheet’s planned shifts, the booked nights and sub-hire to its off-hire date.'],
  'Gross Margin · known costs': ['Gross Margin · all in', 'Total Revenue less Total Direct Costs, all in. The percentage is Gross Margin ÷ Total Revenue.'],
  'Difference so far': ['Difference · all in', 'Revenue less every priced cost to job end, including overheads and the wages priced (labour hire and the salary allowance). Not a margin yet: Coates wages and salary are hours, not dollars, and what is named under “Not in it yet” has no price.']
};
var FENCE_DEF = ['Of which · fencing still to come', 'Advanced’s remaining programme weeks (decon): Revenue at the 2026 card, cost at Advanced’s own rates. It is the one estimate left, it sits inside the job total, and the dockets replace it as the work is done.'];
function transform(out) {
  var box = document.createElement('div'); box.innerHTML = out;
  var sec = box.querySelector('#pl770'); if (!sec) return out;
  var P = pl770Model(), X = cj764Model(), C = branchFinancial978(pl752Rows(), moneySummary()).total;
  var hours = typeof fmtNum === 'function' ? fmtNum(P.wages.hoursOnly || 0) : String(P.wages.hoursOnly || 0);
  var m = {rev: P.rev, cost: P.cost, revJob: P.revJob, directJob: P.directJob, wagesJob: P.wages.job, overJob: P.overJob, differenceJob: C.contributionJob,
    fenceRevenue: X.fencing && X.fencing.revenue, fenceCost: X.fencing && X.fencing.cost, hoursText: hours};
  if (!P1194.checks(m).all) return out;
  var desk = sec.querySelector(':scope > .branch978-desktop'), mob = sec.querySelector(':scope > .branch978-mobile');
  if (!desk || !mob) return out;
  var title = sec.querySelector('#pl770Title'); if (title) title.textContent = 'Whole-job P&L · all in';
  var basis = sec.querySelector('[data-pnl981-basis]');
  if (basis) basis.textContent = 'All in · every line to job end, demob included · fencing’s remaining programme is the one estimate still to come';
  var wrap = document.createElement('div'); wrap.innerHTML = statement(P1194.rows(m));
  mob.remove(); desk.replaceWith.apply(desk, [].slice.call(wrap.childNodes));
  var named = P1194.notYet(X.gaps, hours), table = sec.querySelector(':scope > .branch978-mobile[data-pl1194]');
  if (named.length && table) {
    var p = document.createElement('p'); p.className = 'pl1194-not';
    p.innerHTML = '<b>Not in it yet</b>, named and never added: ' + named.map(h).join(' · ') + '.';
    table.after(p);
  }
  sec.querySelectorAll('dl > dt').forEach(function (dt) {
    var d = DEFS[dt.textContent.trim()], dd = dt.nextElementSibling; if (!d) return;
    dt.textContent = d[0]; if (dd && dd.tagName === 'DD') dd.textContent = d[1];
    if (d[0] === 'Job total · all in' && dd) {
      var t = document.createElement('dt'), e = document.createElement('dd'); t.textContent = FENCE_DEF[0]; e.textContent = FENCE_DEF[1];
      dd.after(t, e);
    }
  });
  sec.setAttribute('data-pl1194', '');
  return box.innerHTML;
}
pl770Card = function () {
  var out = prior.apply(this, arguments);
  try { return transform(out); } catch (e) { return out; }
};
W.gc500PL1194 = {transform: transform};
})(typeof window === 'object' ? window : {});
