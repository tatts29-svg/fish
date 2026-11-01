/* Author: Andrew Fisher. v12.72 - the P&L pack on the P&L tab. Andrew, 1 Nov 2026 (this chat): "make sure all the new P&L data
   this Becomes the new P&L in the GC500 p&L Tab we need thi Accurate to the Cent please".
   The Costs & P&L tab leads with the P&L pack: revenue (the 18 invoices to V8 Supercars and the November forecast), costs
   by month of work, by branch and by supplier, the accruals through 31 Oct, every cost line with its purchase order and invoice or
   receipt, the journals, and the open items. Every figure is the pack's own (GC500_PL_final.json, written by
   review_31Oct2026_october_month_end/build_monthend.py and checked against the pack's workbook to the cent by audit_pack.py); the
   build puts the pack's data in DATA below and nothing here works a figure out, so the tab and the pack cannot differ. The live
   model the tab carried before (pl1267: worked from the record as it stands) folds under it, named as the working figures, moved,
   not removed. Nothing is typed here; nothing is written to the record.
   v12.73 - labour we charged the V8s, by branch (Andrew, 1 Nov 2026: "how much labour we charged each MEAD and NVAC and KINP and STPS
   if any so when we journal peoples cost into INSTALL we have a figure we know we are up against"; "yes to 5"): the pack's own figures, every
   line the invoices code LABOUR, with the labour hire already in Installs and what is left; every labour line in a fold.
   v12.74 - the tab on pack v1.14 (the two forklift POs in the costs): transport checked against Schedule 17 (1 Nov), every change with its Schedule 17 row, docket and
   hire contract, in a fold; the pack's figures, as above.
   v12.75 - every PO and every hire contract named, and everything ties (Andrew, 1 Nov 2026: "Please make sure we mentioned purchase order
   numbers. And hire contract numbers. Everything must talk to each other. And all add up and match."): each cost line names the hire
   contract it is charged on; three folds: the 18 invoices with their hire contract and the V8s' PO; each hire contract with what we
   charged on it and the costs and POs against it; every purchase order in the costs and every cost with no PO, adding to the job cost.
   v12.76 - the wording of the independent recheck of pack v1.15 (1 Nov 2026, item 4), on pack v1.16: the dated job position, not a
   "final"; "Difference so far", not a margin yet; "Accruals through 31 Oct", the journals prepared for Finance, with what is in them
   (September's part of a line, as a catch-up) and the classes that are not, for Finance to confirm; the invoices and the November
   forecast shown apart; Coates' own wages hours only and the estimates named. November's labour, to 13 Nov, in October
   (Andrew, 1 Nov 2026); the P&L's print carries no twin-steer rule (Andrew, 1 Nov 2026: "I dont want the no twin steer on here").
   v12.77 - find in the P&L (Andrew, 1 Nov 2026: "If you want to search by category you can or by branch. Or by month have these options
   available. And its accurate to the cent"; "we need to know labour where everyone needs to be jornled to"): a category, branch and month
   filter and a search, every figure added up in whole cents from the pack's own parts (DATA.facts, DATA.revFacts), which the pack proves
   add to every total it prints; and the labour journals: each person, home branch, the branch the hours are journaled to, by month. */
var PLF1272 = (function (W, D) {
'use strict';
var DATA = __PLF1272_DATA__;
var SHA = '__PLF1272_SHA__';
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
/* dollars and cents exactly as the pack prints them: thousands with commas, two decimals, a true minus; nil as a dash */
function f2(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '—';
  var a = Math.abs(v).toFixed(2).split('.');
  return (v < -0.004 ? '−' : '') + a[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + a[1];
}
function c2(v) { return typeof v === 'number' && Math.abs(v) >= 0.005 ? f2(v) : '<span class="pl1267-dash">—</span>'; }
function dmy(s) { var p = String(s || '').split('/'); return p.length === 3 ? Number(p[0]) + ' ' + e(MON[Number(p[1]) - 1]) + ' ' + e(p[2]) : e(s); }   /* 27/10/2026 -> 27 Oct 2026 */
function day(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] + ' ' + p[0] : e(iso); }
function n(x, one, many) { return x + ' ' + (x === 1 ? one : many); }
function folded(id, title, small, body) {
  var key = 'costs765|' + id, open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (er) {}
  return '<details class="plfold765 plf1272-more" id="' + id + '" data-sfold="' + key + '"' + (open ? ' open' : '') + '><summary>' + e(title)
    + (small ? '<small>' + e(small) + '</small>' : '') + '</summary>' + body + '</details>';
}
function tile(label, big, small, cls) {
  return '<div class="pl1267-tile' + (cls ? ' ' + cls : '') + '"><div class="pl1267-tl">' + e(label) + '</div><div class="pl1267-tv">' + big + '</div><div class="pl1267-ts">' + small + '</div></div>';
}
/* v12.77 - find in the P&L: a category, branch and month filter and a search. Every figure is a sum, in whole cents, of the pack's own parts:
   DATA.facts is each cost line split by branch and month ([line, branch, month, cents, branch move]) and DATA.revFacts each invoice and the
   November forecast ([invoice, branch, month, cents]); the pack's build stops unless the parts add to every total it prints. */
var BRN = {KINP: 'KINP · Brisbane Portables', STPS: 'STPS · Brisbane Traffic', NVAC: 'NVAC · North Power and HVAC', MEAD: 'MEAD · Brisbane Mechanical Specialist'};
var BRS = ['KINP', 'STPS', 'NVAC', 'MEAD'], MOS = ['Sep', 'Oct', 'Nov'];
var MOL = {Sep: 'September', Oct: 'October (with November’s labour)', Nov: 'November (forecast)'};
var XS = {cat: '', br: '', mo: '', q: '', f: 0};   /* the choice survives the tab being drawn again when the record syncs; f: the search box had the focus */
var LT = null, PT = null, IX = null;
var XFOCUS = 0, XPOINTER = false, XSELECTION = null;
function cents(c) { return c ? f2(c / 100) : '<span class="pl1267-dash">—</span>'; }
/* words as typed: lower case, quotes dropped, a thousands comma in a number dropped, spaces collapsed */
function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[“”"‘’`']/g, ' ').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\s+/g, ' ').trim(); }
function words(q) { return norm(q).split(' ').filter(Boolean); }
function hit(text, ws) { for (var i = 0; i < ws.length; i++) if (text.indexOf(ws[i]) < 0) return false; return true; }
function tight(s) { return norm(s).replace(/\s+/g, ''); }
function cpoKey(v) { return tight(String(v == null ? '' : v).split(' (')[0]).replace(/^p0*/, ''); }   /* the V8s' PO as keyed, without the note after it, and without the P and its leading zeros (P028607 and P28607 are one PO) */
function poText(po) { var t = String(po == null ? '' : po).trim(); return /^none/i.test(t) ? 'No PO' + (t.length > 4 ? ' (' + t.replace(/^none\s*/i, '') + ')' : '') : 'PO ' + t; }
var DASH = '<span class="pl1267-dash">—</span>';
function hrs(h) { return h ? (Math.round(h * 100) / 100).toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '<span class="pl1267-dash">—</span>'; }
/*__PLF1279_FIND__*/
/* v12.79: what a line's status adds to its state (the pack's 'ACCRUE (…)' becomes its note; a status that only repeats the state is not repeated) */
function stNote(l) {
  var s = String(l.status || '').replace(/^ACCRUE\s*/, '').replace(/^\((.*)\)$/, '$1').trim();
  return s && s.toLowerCase() !== String(l.state || '').toLowerCase() ? s : '';
}
function html() {
  var J = DATA, R = J.revenue, C = J.costs, ME = J.monthEnd, TE = J.transportEstimate;
  var asAt = day(J.asAt), d = asAt.replace(/ \d{4}$/, '');   /* 31 Oct 2026 · 31 Oct */
  var cwPaid = (J.labourJournal || []).reduce(function (a, x) { return x.kind === 'Coates wages' ? a + Math.round(x.paidSep * 100) + Math.round(x.paidOct * 100) : a; }, 0);   /* v12.79: paid hours, not costed */
  var head = '<div class="pl1267-headrow"><p class="fin745-eyebrow">THE P&amp;L · JOB POSITION · AUD EX GST · AS AT ' + e(asAt.toUpperCase()) + '</p>'
    + '<button type="button" class="btn ghost sm" id="pl1267-fp-print" title="The whole P&amp;L, every fold open; the finder stays on the screen">Print full P&amp;L</button></div>'
    + '<h2 id="plf1272Title" class="plf1272-h">The P&amp;L, job position at ' + e(asAt) + '<small>pack ' + e(J.pack) + ' · from ' + e(J.source) + '</small></h2>';
  var tiles = '<div class="pl1267-tiles plf1272-tiles">'
    + tile('Charged to the V8s', f2(R.total), n((J.invoices || []).length, 'invoice', 'invoices') + ' ' + f2(R.invoices) + ' · November forecast ' + f2(R.novForecast) + ', not invoiced yet')
    + tile('What it costs us', f2(C.total), 'Sep ' + f2(C.sep) + ' · Oct ' + f2(C.oct) + (ME && ME.novLabourInOct ? ' (with November’s labour to 13 Nov, ' + f2(ME.novLabourInOct.total) + ')' : '') + ' · Nov ' + f2(C.nov) + ' (forecast) · some estimates until invoiced; Coates wages not yet costed' + (cwPaid ? ' (' + hrs(cwPaid / 100) + ' paid h)' : ''))
    + tile('Difference so far', f2(J.difference), 'revenue less costs, job end · not a margin yet', J.difference < 0 ? 'pl1267-neg' : '')
    + tile('Accruals through ' + d, f2(J.accrue), 'the journals prepared for Finance · what is in them is below')
    + '</div>' + xBox();
  var br = '<p class="fin745-eyebrow plf1272-sub">BY BRANCH · JOB END</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-branch"><thead><tr><th>Branch</th>'
    + '<th class="num">Invoiced (Oct)</th><th class="num">November forecast</th><th class="num">Revenue</th><th class="num">Costs</th><th class="num">Difference</th></tr></thead><tbody>';
  var tot = {inv: 0, fc: 0, rev: 0, cost: 0, diff: 0};
  J.branches.forEach(function (b) {
    br += '<tr data-b="' + e(b.b) + '"><td>' + e(BRN[b.b] || b.b) + '</td><td class="num">' + c2(b.invoiced) + '</td><td class="num">' + c2(b.novForecast) + '</td><td class="num">' + c2(b.revenue)
      + '</td><td class="num">' + c2(b.costs) + '</td><td class="num' + (b.difference < 0 ? ' pl1267-neg' : '') + '">' + c2(b.difference) + '</td></tr>';
  });
  br += '<tr class="pl1267-grand" data-b="job"><td>The job</td><td class="num">' + c2(R.invoices) + '</td><td class="num">' + c2(R.novForecast) + '</td><td class="num">' + c2(R.total)
    + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.difference) + '</td></tr></tbody></table></div>';
  var LC = J.labourCharged, lc = '', lcl = '';
  if (LC) {
    lc = '<p class="fin745-eyebrow plf1272-sub">LABOUR WE CHARGED THE V8S, BY BRANCH</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lc"><thead><tr><th>Branch</th>'
      + '<th class="num">Labour charged</th><th class="num">Lines</th><th class="num">Labour hire already in Installs</th><th class="num">Left for people’s cost</th></tr></thead><tbody>';
    var nl = 0;
    LC.branches.forEach(function (b) { nl += b.lines; lc += '<tr data-b="' + e(b.b) + '"><td>' + e(BRN[b.b] || b.b) + '</td><td class="num">' + c2(b.charged) + '</td><td class="num">' + b.lines + '</td><td class="num">' + c2(b.installLabourHire) + '</td><td class="num">' + c2(b.left) + '</td></tr>'; });
    lc += '<tr class="pl1267-grand" data-b="job"><td>The job</td><td class="num">' + c2(LC.total) + '</td><td class="num">' + nl + '</td><td class="num">' + c2(LC.installTotal) + '</td><td class="num">' + c2(LC.leftTotal) + '</td></tr></tbody></table></div>'
      + '<p class="plf1272-note">Every line the 18 invoices code LABOUR, as invoiced, on the branch that invoices it: what people’s cost in Installs is set against.</p><ul class="plf1272-lcnotes">' + (LC.notes || []).map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>';
    lcl = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lclines"><thead><tr><th>Branch · invoice · contract line · what</th><th class="num">Hours or units</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>';
    LC.lines.forEach(function (x) { lcl += '<tr><td><b>' + e(x.b) + '</b> · ' + e(x.inv) + ' · ' + e(x.contract) + ' L' + e(x.line) + '<small>' + e(x.what) + (x.note ? ' (' + e(x.note) + ')' : '') + '</small></td><td class="num">' + (x.hours == null ? '—' : e(String(x.hours))) + '</td><td class="num">' + c2(x.rate) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; });
    lcl += '<tr class="pl1267-grand"><td>The job, ' + n(LC.lines.length, 'line', 'lines') + '</td><td></td><td></td><td class="num">' + c2(LC.total) + '</td></tr></tbody></table></div>';
  }
  var S7 = J.schedule17, s7 = '';
  if (S7) {   /* v12.74: transport checked against Schedule 17, one row per change */
    s7 = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-s17"><thead><tr><th>Load · date · what</th><th class="num">Schedule 17</th><th>On the record before</th><th class="num">Change</th><th>Branch</th></tr></thead><tbody>';
    S7.changes.forEach(function (x) {
      s7 += '<tr><td><b>' + e(x.ref) + '</b> · ' + e(x.date) + '<small>' + e(x.what) + '</small><small>' + e(x.contractDocket) + ' · ' + e(x.row) + '</small></td><td class="num">' + c2(x.figure)
        + '</td><td>' + e(x.before) + '</td><td class="num">' + (x.change > 0.004 ? '+' : '') + c2(x.change) + '</td><td>' + e(x.branch) + '</td></tr>';
    });
    s7 += '<tr class="pl1267-grand"><td>' + n(S7.changes.length, 'load', 'loads') + '<small>forecasts replaced ' + f2(S7.forecastsReplaced) + '</small></td><td class="num">' + c2(S7.added) + '</td><td></td><td class="num">+' + c2(S7.net) + '</td><td></td></tr></tbody></table></div>'
      + '<ul class="plf1272-s17notes">' + (S7.notes || []).map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>';
  }
  var sup = '<p class="fin745-eyebrow plf1272-sub">COSTS BY SUPPLIER AND MONTH · ACCRUALS THROUGH ' + e(d.toUpperCase()) + '</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-sup"><thead><tr><th>Supplier</th>'
    + '<th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Job end</th><th class="num">Accruals</th></tr></thead><tbody>';
  J.suppliers.forEach(function (s) {
    sup += '<tr><td>' + e(s.name) + '</td><td class="num">' + c2(s.sep) + '</td><td class="num">' + c2(s.oct) + '</td><td class="num">' + c2(s.nov) + '</td><td class="num">' + c2(s.total) + '</td><td class="num">' + c2(s.accrue) + '</td></tr>';
  });
  sup += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.sep) + '</td><td class="num">' + c2(C.oct) + '</td><td class="num">' + c2(C.nov) + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.accrue) + '</td></tr></tbody></table></div>';
  /* v12.79: costs by category and month, on the face (the finder's own table stays on the screen; this one prints), with the rehire group's subtotal */
  var cats = '', grp = J.categoryGroups || [];
  if (J.categories && J.categories.length) {
    var crow = function (cls, label, small, a) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + label + (small ? '<small>' + e(small) + '</small>' : '') + '</td><td class="num">' + c2(a[0] / 100) + '</td><td class="num">' + c2(a[1] / 100) + '</td><td class="num">' + c2(a[2] / 100) + '</td><td class="num">' + c2(a[3] / 100) + '</td></tr>'; };
    var cc = function (x) { var s = Math.round(x.sep * 100), o = Math.round(x.oct * 100), v = Math.round(x.nov * 100); return [s, o, v, s + o + v]; };
    var ctot = [0, 0, 0, 0];
    cats = '<p class="fin745-eyebrow plf1272-sub">COSTS BY CATEGORY AND MONTH · JOB END</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1279-cats"><thead><tr><th>Category</th><th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Job end</th></tr></thead><tbody>'
      + J.categories.map(function (c) { var a = cc(c); for (var i = 0; i < 4; i++) ctot[i] += a[i];
          var r = crow('', '<button type="button" class="plf1279-pick" data-cat="' + e(c.name) + '" title="Open its cost lines in Find in the P&amp;L">' + e(c.name) + '</button>', c.note, a);
          grp.forEach(function (g) { if (g.members[g.members.length - 1] === c.name) r += crow('pl1267-tot plx-grp', e(g.name), g.members.length + ' categories', cc(g)); });
          return r; }).join('')
      + crow('pl1267-grand', 'Total costs', '', ctot) + '</tbody></table></div>'
      + '<p class="plf1272-note">Categories group the cost lines for reporting; they are not GL codes (the codes are under Costs by GL account). The rehire categories are each supplier’s 2126 hire, with their other codes named. A category’s name opens its lines in Find in the P&amp;L.</p>';
  }
  /* v12.79: the transport estimate named on the face; each leg is in its fold */
  var teLine = '', cand = J.lines.filter(function (l) { return l.state === 'Not accrued: manual accrual candidate'; });
  var candSep = cand.reduce(function (a, l) { return a + Math.round(l.sep * 100); }, 0), candOct = cand.reduce(function (a, l) { return a + Math.round(l.oct * 100); }, 0);
  if (TE) {
    var mvAmt = TE.moved.reduce(function (a, m) { return a + Math.round(m.amount * 100); }, 0);
    teLine = '<ul class="plf1279-tenotes plf1279-face"><li><b>Transport not accrued to ' + e(d) + ': ' + f2((candSep + candOct) / 100) + '</b> (September ' + f2(candSep / 100) + ', October ' + f2(candOct / 100) + '): no carrier has a PO or an invoice, so the carrier loads are not in the accruals; a manual accrual candidate for Finance. '
      + 'It includes the 1 Nov estimate for trucks that ran by ' + e(d) + ' with no figure, ' + f2(TE.ranBy31Oct) + ' (ESTIMATE). Pick-ups still to come for gear on site are ' + f2(TE.stillOnSite) + ', in November, and the October pick-ups of gear still on site (' + TE.moved.map(function (m) { return e(m.ref); }).join(', ') + ', ' + f2(mvAmt / 100) + ') are in November too. Each leg: <a href="#pl1267-fp-test" class="plf1279-jump">Transport estimate</a>.</li></ul>';
  }
  /* v12.79: October at month end, where each cost stands (the pack's monthEnd: the states add to October to the cent) */
  var me = '';
  if (ME && ME.rows) {
    var who = function (st) { return J.lines.filter(function (l) { return l.state === st && Math.abs(l.oct) > 0.004; }).map(function (l) { return l.supplier; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' · '); };
    var accRow = ME.rows.filter(function (x) { return x.state === 'Accrued at 31 Oct'; })[0];
    me = '<p class="fin745-eyebrow plf1272-sub" id="plf1279-me">OCTOBER COSTS AT ' + e(d.toUpperCase()) + ' · WHERE EACH STANDS</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1279-me"><thead><tr><th>October costs by where they stand</th><th class="num">October</th></tr></thead><tbody>'
      + ME.rows.map(function (x) { return '<tr><td><b>' + e(x.state) + '</b><small>' + e(who(x.state)) + (x.state === 'Not accrued: manual accrual candidate' && candSep ? ': October’s loads; with September’s (' + f2(candSep / 100) + '), transport not accrued to ' + e(d) + ' is ' + f2((candSep + candOct) / 100) + (TE ? ', including the 1 Nov estimate ' + f2(TE.ranBy31Oct) : '') : '') + '</small></td><td class="num">' + c2(x.oct) + '</td></tr>'; }).join('')
      + '<tr class="pl1267-grand"><td>October costs, as in the P&amp;L</td><td class="num">' + c2(ME.oct) + '</td></tr>'
      + (ME.novLabourInOct ? '<tr><td>of which November’s labour, 1–13 Nov<small>salary allowance ' + f2(ME.novLabourInOct.salary) + ' · Job Connect ' + f2(ME.novLabourInOct.jobConnect) + ' (w/e 8 and 15 Nov)</small></td><td class="num">' + c2(ME.novLabourInOct.total) + '</td></tr>'
        + '<tr class="pl1267-tot"><td>October’s own work, without it</td><td class="num">' + c2(ME.octWithoutNovLabour) + '</td></tr>' : '')
      + '</tbody></table></div>'
      + (accRow ? '<p class="plf1272-note">The accruals through ' + e(d) + ', ' + f2(J.accrue) + ', are the October part above (' + f2(accRow.oct) + ') and September’s part of the same lines (' + f2(ME.accruedSep) + '), as a catch-up. What is not accrued is for Finance to decide: the open items say what each is.</p>' : '');
  }
  /* what is in the accruals beyond the month: the accrued lines that also carry September work (v12.76) */
  var cu = J.lines.filter(function (l) { return l.accrue > 0.004 && l.sep > 0.004; });
  var cuAmt = cu.reduce(function (a, l) { return a + l.sep; }, 0), cuWho = cu.map(function (l) { return l.supplier; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var note = '<p class="plf1272-note">Revenue is the invoices, booked in October, the invoice month, and the November forecast, a pick-up charge applied but not invoiced yet; the two are shown apart, above and in “Revenue by invoice”. '
    + 'Costs are by month of work at job end, except November’s labour (to 13 Nov: the Coates wages hours, the salary allowance and Job Connect), which is in October with October’s; the rest of November is forecast. Some costs are estimates until invoiced (each line says so), and Coates’ own wages are hours only, not yet costed, so the difference so far is not a margin yet. '
    + 'Accruals through ' + e(d) + ' are the journals prepared for Finance, not a record of what is posted: work to ' + e(d) + ' with no invoice yet' + (cu.length ? ', including September’s part of ' + e(cuWho.join(' and ')) + ' (' + f2(cuAmt) + ') as a catch-up' : '') + '. Carrier loads to ' + e(d) + ' and the consumables and forklift POs are not in them: Finance to confirm (see the open items). '
    + 'Each line below names its purchase order, the hire contract it is charged on, and its invoice or receipt; the folds below tie the invoices, the hire contracts and every purchase order to these totals.</p>';
  var lines = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lines"><thead><tr><th>Supplier · what</th><th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Job end</th><th class="num">Accruals</th><th>Status</th></tr></thead><tbody>';
  J.lines.forEach(function (l) {
    lines += '<tr><td><b>' + e(l.supplier) + '</b> · ' + e(l.branch) + (l.account ? ' · ' + e(l.account) : '') + '<small>' + e(l.what) + '</small>'
      + ((l.po || l.invoice) ? '<small>' + (l.po ? e(poText(l.po)) : '') + (l.po && l.invoice ? ' · ' : '') + (l.invoice ? e(l.invoice) : '') + '</small>' : '')
      + (l.contract ? '<small class="plf1275-hc">Hire contract: ' + e(l.contract) + '</small>' : '') + (l.category ? '<small class="plx-cat">' + e(l.category) + '</small>' : '')
      + '</td><td class="num">' + c2(l.sep) + '</td><td class="num">' + c2(l.oct) + '</td><td class="num">' + c2(l.nov) + '</td><td class="num">' + c2((Math.round(l.sep * 100) + Math.round(l.oct * 100) + Math.round(l.nov * 100)) / 100) + '</td><td class="num">' + c2(l.accrue) + '</td><td>'
      + (l.state ? '<b class="plf1279-state">' + e(l.state) + '</b>' + (stNote(l) ? '<small>' + e(stNote(l)) + '</small>' : '') : e(l.status)) + (l.basis ? '<small>' + e(l.basis) + '</small>' : '') + '</td></tr>';
  });
  lines += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.sep) + '</td><td class="num">' + c2(C.oct) + '</td><td class="num">' + c2(C.nov) + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.accrue) + '</td><td></td></tr></tbody></table></div>';
  var bl = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-bl"><thead><tr><th>Branch · line</th><th class="num">Job end</th></tr></thead><tbody>';
  J.branches.forEach(function (b) {
    bl += '<tr class="pl1267-grp"><td colspan="2">' + e(BRN[b.b] || b.b) + '</td></tr>';
    (J.branchLines[b.b] || []).forEach(function (x) { bl += '<tr><td>' + e(x[0]) + '</td><td class="num">' + c2(x[1]) + '</td></tr>'; });
    bl += '<tr class="pl1267-tot" data-b="' + e(b.b) + '"><td>Total ' + e(b.b) + '</td><td class="num">' + c2(b.costs) + '</td></tr>';
  });
  bl += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.total) + '</td></tr></tbody></table></div>';
  var jr = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-jn"><thead><tr><th>Journal</th><th>PO</th><th>Account · branch</th><th class="num">Amount</th></tr></thead><tbody>';
  J.journals.forEach(function (j) { jr += '<tr><td>' + e(j.journal) + '<small>' + e(j.contract) + '</small></td><td>' + e(j.po) + '</td><td>' + e(j.account) + '<small>' + e(j.branch) + '</small></td><td class="num">' + c2(j.amount) + '</td></tr>'; });
  jr += '<tr class="pl1267-grand"><td>Accruals through ' + e(d) + ', prepared for Finance (each reverses on 1 Nov; the invoice lands against it)</td><td></td><td></td><td class="num">' + c2(J.accrue) + '</td></tr>';
  if (J.moves && J.moves.length) {
    jr += '<tr class="pl1267-sub"><td colspan="4">Branch moves (cost journals between branches; they net to nil)</td></tr>';
    J.moves.forEach(function (j) { jr += '<tr><td>' + e(j.journal) + '<small>' + e(j.contract) + '</small></td><td>' + e(j.po) + '</td><td>' + e(j.account) + '<small>' + e(j.branch) + '</small></td><td class="num">' + c2(j.amount) + '</td></tr>'; });
  }
  jr += '</tbody></table></div>';
  /* v12.75: the 18 invoices, each with its hire contract and the V8s' PO; then the November forecast line */
  var MT = J.matchTotals || {}, PT = J.poTotals || {}, rv = '', ct = '', po = '';
  if (J.invoices) {
    rv = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1275-rev"><thead><tr><th>Invoice · date</th><th>Hire contract · branch</th><th>The V8s’ PO</th><th class="num">Ex GST</th></tr></thead><tbody>';
    J.invoices.forEach(function (x) {
      rv += '<tr data-inv="' + e(x.inv) + '"><td><b>' + e(x.inv) + '</b> · ' + dmy(x.date) + '</td><td>' + e(x.contract) + ' · ' + e(x.branch) + '<small>our POs against it: ' + (/^no PO/.test(String(x.pos)) ? 'none on the record' : e(x.pos)) + '</small></td><td>' + e(x.customerPO) + '</td><td class="num">' + c2(x.ex) + '</td></tr>';
    });
    rv += '<tr class="pl1267-tot"><td>' + n(J.invoices.length, 'invoice', 'invoices') + '</td><td></td><td></td><td class="num">' + c2(R.invoices) + '</td></tr>';
    (J.novForecastLines || []).forEach(function (x) {
      rv += '<tr><td>November forecast<small>' + e(x.what) + '</small></td><td>' + e(x.contract) + ' ' + e(x.line) + ' · ' + e(x.branch) + '</td><td>' + e((J.contractPOs || {})[x.contract] || '') + '</td><td class="num">' + c2(x.amount) + '</td></tr>';
    });
    rv += '<tr class="pl1267-grand"><td>Charged to the V8s</td><td></td><td></td><td class="num">' + c2(R.total) + '</td></tr></tbody></table></div>'
      + (J.removedInvoices || []).map(function (x) { return '<p class="plf1272-note">Not in the revenue: invoice ' + e(x.inv) + ' on ' + e(x.contract) + ' (' + f2(x.ex) + '), ' + e(x.why) + '.</p>'; }).join('');
  }
  /* each hire contract: what we charged on it, and the costs and POs against it; then the costs not tied to one contract */
  if (J.contracts) {
    ct = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1275-con"><thead><tr><th>Hire contract · our costs against it</th><th>PO</th><th class="num">Charged to the V8s</th><th class="num">Cost</th></tr></thead><tbody>';
    J.contracts.forEach(function (c) {
      ct += '<tr class="pl1267-grp" data-c="' + e(c.contract) + '"><td>' + e(c.contract) + ' · ' + e(c.branch) + '<small>the V8s’ PO ' + e(c.customerPO) + ' · invoice ' + e(c.invoice) + (c.onIt && c.onIt !== '—' ? ' · ' + e(c.onIt) : '') + (c.note ? ' · ' + e(c.note) : '') + '</small></td><td></td><td class="num">' + c2(c.revenue) + '</td><td></td></tr>';
      if (!c.costs.length) ct += '<tr><td>no supplier PO or cost on the record against it</td><td></td><td></td><td class="num">' + c2(0) + '</td></tr>';
      c.costs.forEach(function (x) { ct += '<tr><td>' + e(x.what) + '<small>' + e(x.status) + '</small></td><td>' + e(x.po) + '</td><td></td><td class="num">' + c2(x.amount) + '</td></tr>'; });
      ct += '<tr class="pl1267-tot" data-c="' + e(c.contract) + '"><td>Costs against ' + e(c.contract) + '</td><td></td><td></td><td class="num">' + c2(c.costTotal) + '</td></tr>';
    });
    ct += '<tr class="pl1267-grp" data-c="none"><td colspan="4">Not tied to one contract</td></tr>';
    (J.notTied || []).forEach(function (x) { ct += '<tr><td>' + e(x.what) + '<small>' + e(x.status) + '</small></td><td>' + e(x.po) + '</td><td></td><td class="num">' + c2(x.amount) + '</td></tr>'; });
    ct += '<tr class="pl1267-tot" data-c="none"><td>Not tied to one contract</td><td></td><td></td><td class="num">' + c2(MT.notTied) + '</td></tr>';
    ct += '<tr class="pl1267-grand"><td>The job<small>charged on the ' + n(J.contracts.length, 'contract', 'contracts') + ' (the November forecast ' + f2(R.novForecast) + ' is not invoiced yet) · costs tied to a contract ' + f2(MT.tied) + ', not tied ' + f2(MT.notTied) + '</small></td><td></td><td class="num">' + c2(MT.invoices) + '</td><td class="num">' + c2(MT.costs) + '</td></tr></tbody></table></div>';
  }
  /* every purchase order in the costs, and every cost with no PO on the record: together, the job cost */
  if (J.purchaseOrders) {
    po = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1275-po"><thead><tr><th>PO · supplier · what</th><th>Hire contract</th><th>Branch</th><th class="num">In the P&amp;L</th></tr></thead><tbody>';
    J.purchaseOrders.forEach(function (x) { po += '<tr data-po="' + e(x.po) + '"><td><b>' + e(x.po) + '</b> · ' + e(x.supplier) + '<small>' + e(x.what) + '</small><small>' + e(x.status) + '</small></td><td>' + e(x.contract) + '</td><td>' + e(x.branch) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; });
    po += '<tr class="pl1267-tot"><td>' + n(PT.count, 'purchase order', 'purchase orders') + '</td><td></td><td></td><td class="num">' + c2(PT.withPO) + '</td></tr>';
    po += '<tr class="pl1267-grp"><td colspan="4">No PO on the record</td></tr>';
    (J.noPO || []).forEach(function (x) { po += '<tr><td>' + e(x.supplier) + '<small>' + e(x.what) + '</small><small>' + e(x.why) + '</small></td><td>' + e(x.contract) + '</td><td>' + e(x.branch) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; });
    po += '<tr class="pl1267-tot"><td>No PO on the record</td><td></td><td></td><td class="num">' + c2(PT.noPO) + '</td></tr>';
    po += '<tr class="pl1267-grand"><td>Total costs<small>with a PO ' + f2(PT.withPO) + ' · no PO ' + f2(PT.noPO) + '</small></td><td></td><td></td><td class="num">' + c2(PT.total) + '</td></tr></tbody></table></div>';
  }
  var LJ = J.labourJournal, lj = '';
  if (LJ) {   /* v12.77: where everyone's labour is journaled to: each person, home branch, the branch of the work, by month */
    var ljh = {Sep: 0, Oct: 0}, ljl = 0, ljb = {};
    lj = '<p class="plf1272-note">Home branch from each person’s row on the record; the hours go to the branch of the work by the job’s rules (people’s costs on KINP; the water barriers on STPS; the generators, 1.5 h in and 1.5 h out, and the event weekend’s mechanic and electrician on NVAC). November’s hours, to 13 Nov, are counted in October. The job’s labour starts on 14 Sep (7–11 Sep is not in it); the event weekend, 23–25 Oct, is the planned 12 h days. Coates wages are hours only; the salary allowance is costed; labour hire $ is the running sheet’s (the costs carry Job Connect’s invoices where received).</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-ljall"><thead><tr><th>Person · type</th><th>Home branch</th><th>Journal to</th><th class="num">Sep worked h</th><th class="num">Oct worked h (with 1–13 Nov)</th><th class="num">Worked h</th><th class="num">Labour hire $</th></tr></thead><tbody>';
    LJ.forEach(function (x) { ljh.Sep += x.sep; ljh.Oct += x.oct; ljl += Math.round(x.labourHire * 100); ljb[x.branch] = (ljb[x.branch] || 0) + x.sep + x.oct;
      lj += '<tr data-who="' + e(x.who) + '"><td><b>' + e(x.who) + '</b><small>' + e(x.type) + '</small></td><td>' + e(x.home) + '</td><td>' + e(x.branch) + (x.journal === 'stays' ? '<small>stays</small>' : '<small>journal ' + e(x.journal) + '</small>') + (x.contract ? '<small>' + e(x.contract) + '</small>' : '') + '</td><td class="num">' + hrs(x.sep) + '</td><td class="num">' + hrs(x.oct) + '</td><td class="num">' + hrs(x.sep + x.oct) + '</td><td class="num">' + cents(Math.round(x.labourHire * 100)) + '</td></tr>'; });
    lj += BRS.filter(function (b) { return ljb[b]; }).map(function (b) { return '<tr class="pl1267-tot" data-b="' + b + '"><td>Hours on ' + e(BRN[b]) + ' (the branch of the work)</td><td></td><td></td><td></td><td></td><td class="num">' + hrs(ljb[b]) + '</td><td></td></tr>'; }).join('')
      + '<tr class="pl1267-grand"><td>All hours, ' + n(LJ.length, 'row', 'rows') + '</td><td></td><td></td><td class="num">' + hrs(ljh.Sep) + '</td><td class="num">' + hrs(ljh.Oct) + '</td><td class="num">' + hrs(ljh.Sep + ljh.Oct) + '</td><td class="num">' + cents(ljl) + '</td></tr></tbody></table></div>';
    if (LJ.length && LJ[0].paidSep != null) {   /* paid hours, the journal basis (what payroll pays), with Coates wages' normal / x1.5 / x2 */
      var pt = {}, pc = [0, 0, 0, 0, 0];
      var prow = function (lbl, a, cls, attr) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + (attr || '') + '><td>' + lbl + '</td><td class="num">' + hrs(a[0]) + '</td><td class="num">' + hrs(a[1]) + '</td><td class="num">' + hrs(a[0] + a[1]) + '</td><td class="num">' + hrs(a[2]) + '</td><td class="num">' + hrs(a[3]) + '</td><td class="num">' + hrs(a[4]) + '</td></tr>'; };
      var cents100 = function (v) { return Math.round(v * 100); }, sumIn = function (t, v) { for (var i = 0; i < 5; i++) t[i] += cents100(v[i]); };
      var prows = LJ.map(function (x) { var v = [x.paidSep, x.paidOct, x.normal, x.x15, x.x2]; sumIn(pt[x.branch] = pt[x.branch] || [0, 0, 0, 0, 0], v); if (x.kind === 'Coates wages') sumIn(pc, v);
        return prow('<b>' + e(x.who) + '</b><small>' + e(x.kind) + ' · journal to ' + e(x.branch) + '</small>', v, '', ' data-who="' + e(x.who) + '" data-b="' + e(x.branch) + '"'); }).join('');
      var h100 = function (a) { return a.map(function (v) { return v / 100; }); };
      lj += '<p class="fin745-eyebrow plf1272-sub">PAID HOURS, THE JOURNAL BASIS: NORMAL, ×1.5 AND ×2</p><p class="plf1272-note">' + e(J.paidNote || '') + '</p>'
        + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-paid"><thead><tr><th>Person · type · journal to</th><th class="num">Sep paid h</th><th class="num">Oct paid h (with 1–13 Nov)</th><th class="num">Paid h</th><th class="num">Normal</th><th class="num">×1.5</th><th class="num">×2</th></tr></thead><tbody>'
        + prows + BRS.filter(function (b) { return pt[b]; }).map(function (b) { return prow('Paid hours on ' + e(BRN[b]), h100(pt[b]), 'pl1267-tot', ' data-b="' + b + '"'); }).join('')
        + prow('Coates wages, the job', h100(pc), 'pl1267-grand') + '</tbody></table></div>';
    }
    var BR = J.labourHireBridge;
    if (BR) {   /* the running sheet's labour hire dollars beside the cost the P&L carries, week by week (the pack proves each figure and the totals) */
      var bt = {rs: 0, ct: 0, df: 0};
      BR.forEach(function (x) { bt.rs += Math.round(x.runningSheet * 100); bt.ct += Math.round(x.cost * 100); bt.df += Math.round(x.difference * 100); });
      lj += '<p class="fin745-eyebrow plf1272-sub">LABOUR HIRE: THE RUNNING SHEET BESIDE THE COSTS</p><p class="plf1272-note">The labour hire $ above are the running sheet’s (' + f2(bt.rs / 100) + '); the costs carry Job Connect’s invoices where received, the PO amount where there is one, and the running sheet where neither (' + f2(bt.ct / 100) + ', the Labour hire category). The difference, ' + f2(bt.df / 100) + ', is each week’s invoice or PO against the running sheet.</p>'
        + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-bridge"><thead><tr><th>Week · PO</th><th>Invoice or PO against the running sheet</th><th class="num">Running sheet</th><th class="num">Costs (the P&amp;L)</th><th class="num">Difference</th></tr></thead><tbody>'
        + BR.map(function (x) { return '<tr><td><b>' + e(x.week) + '</b><small>' + e(x.po === 'none yet' ? 'no PO yet' : 'PO ' + x.po) + '</small></td><td>' + e(x.invoice) + '</td><td class="num">' + f2(x.runningSheet) + '</td><td class="num">' + f2(x.cost) + '</td><td class="num">' + c2(x.difference) + '</td></tr>'; }).join('')
        + '<tr class="pl1267-grand"><td>' + n(BR.length, 'week', 'weeks') + '</td><td></td><td class="num">' + f2(bt.rs / 100) + '</td><td class="num">' + f2(bt.ct / 100) + '</td><td class="num">' + f2(bt.df / 100) + '</td></tr></tbody></table></div>';
    }
  }
  var GA = J.byAccount, ga = '';
  if (GA && GA.length) {   /* v12.79: costs by GL account, from the account on each cost line */
    var gat = 0; GA.forEach(function (g) { gat += Math.round(g.total * 100); });
    ga = '<p class="plf1272-note">From the account on each cost line. Where a line names two accounts with amounts, each takes its own; where it names two with no split on the record (transport, 2120 or 2140; meals and expenses, 3520 or 3501), the line sits under both codes together, so nothing is guessed. The rows add to the job cost.</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-gl"><thead><tr><th>GL account</th><th>What is in it</th><th class="num">Job end</th></tr></thead><tbody>'
      + GA.map(function (g) { return '<tr><td><b>' + e(g.code) + '</b>' + (g.name ? '<small>' + e(g.name) + '</small>' : (g.split ? '' : '<small>not split on the record</small>')) + '</td><td>' + g.holds.map(function (h) { return e(h.category) + ' ' + f2(h.amount); }).join('<br>') + '</td><td class="num">' + f2(g.total) + '</td></tr>'; }).join('')
      + '<tr class="pl1267-grand"><td>Total costs</td><td></td><td class="num">' + f2(gat / 100) + '</td></tr></tbody></table></div>';
  }
  var TE = J.transportEstimate, te = '';
  if (TE) {   /* v12.79: the transport estimate of 1 Nov, each leg (the pack's section 2h) */
    var tg = {oct_ran: 'Ran by 31 Oct', nov_on_site: 'Still on site'}, tsum = {oct_ran: 0, nov_on_site: 0};
    TE.legs.forEach(function (x) { tsum[x.group] += Math.round(x.amount * 100); });
    var tbr = function (o) { return BRS.filter(function (b) { return o[b]; }).map(function (b) { return b + ' ' + f2(o[b]); }).join(' · '); };
    te = '<p class="plf1272-note">No carrier has invoiced Coates for any GC500 load, and none has a PO. These are the trucks the record and Schedule 17 show ran by 31 Oct with no figure in the costs, and the Coates gear still on site with no pick-up in the costs, each as an ESTIMATE: ' + e(TE.method) + '. Whatever the record shows on site is on site; when a departure is recorded, its pick-up falls in that month. Event Portables collect their own (already in their accrual).</p>'
      + '<ul class="plf1279-tenotes"><li><b>Ran by 31 Oct: ' + f2(TE.ranBy31Oct) + '</b> (' + e(tbr(TE.byBranch.ranBy31Oct)) + '), in October: a manual accrual candidate for Finance.</li>'
      + '<li><b>Still on site: ' + f2(TE.stillOnSite) + '</b> (' + e(tbr(TE.byBranch.stillOnSite)) + '), in November.</li>'
      + '<li>Moved to November, still on site: ' + TE.moved.map(function (m) { return e(m.ref) + ' ' + f2(m.amount); }).join(', ') + ' (in the planned loads).</li>'
      + (TE.notIn && TE.notIn.length ? '<li>Not in it (who pays is not on the record): ' + TE.notIn.map(function (x) { return e(x.what) + ', ' + f2(x.amount); }).join('; ') + '.</li>' : '') + '</ul>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-test"><thead><tr><th>Ref · what</th><th>Branch</th><th>Leg · date</th><th class="num">Loads</th><th class="num">Rate</th><th>Rate from</th><th class="num">Estimate</th></tr></thead><tbody>'
      + ['oct_ran', 'nov_on_site'].map(function (g) {
          return '<tr class="pl1267-grp"><td colspan="7">' + e(tg[g]) + (g === 'oct_ran' ? ' (October)' : ' (November)') + '</td></tr>'
            + TE.legs.filter(function (x) { return x.group === g; }).map(function (x) { return '<tr data-b="' + e(x.branch) + '"><td><b>' + e(x.ref) + '</b><small>' + e(x.what) + '</small></td><td>' + e(x.branch) + '</td><td>' + e(x.kind) + '<small>' + e(day(x.date)) + '</small></td><td class="num">' + e(String(x.loads)) + '</td><td class="num">' + f2(x.rate) + '</td><td><small>' + e(x.rate_source) + '</small></td><td class="num">' + f2(x.amount) + '</td></tr>'; }).join('')
            + '<tr class="pl1267-tot"><td>' + e(tg[g]) + ', ESTIMATE</td><td></td><td></td><td></td><td></td><td></td><td class="num">' + f2(tsum[g] / 100) + '</td></tr>';
        }).join('')
      + '<tr class="pl1267-grand"><td>The transport estimate</td><td></td><td></td><td></td><td></td><td></td><td class="num">' + f2((tsum.oct_ran + tsum.nov_on_site) / 100) + '</td></tr></tbody></table></div>';
  }
  var op = J.openGroups && J.openGroups.length ? J.openGroups.map(function (g) { return '<p class="plf1279-og">' + e(g.name) + '</p><ol class="plf1272-open">' + g.items.map(function (i) { return '<li value="' + i + '">' + e(J.open[i - 1]) + '</li>'; }).join('') + '</ol>'; }).join('')
    : '<ol class="plf1272-open">' + J.open.map(function (o) { return '<li>' + e(o) + '</li>'; }).join('') + '</ol>';
  return '<section id="pl1267-fp" class="card pl1267 plf1272 nosfold" aria-labelledby="plf1272Title">' + head + tiles + br + cats + sup + teLine + me + note
    + folded('pl1267-fp-journals', 'Journals prepared for Finance, through ' + d, n(J.journals.length, 'accrual', 'accruals') + (J.moves && J.moves.length ? ' and ' + n(J.moves.length, 'branch move', 'branch moves') : ''), jr)
    + folded('pl1267-fp-open', 'Open items', n(J.open.length, 'item', 'items') + ': paperwork to come and calls still to make', op)
    + folded('pl1267-fp-lines', 'Every cost line', n(J.lines.length, 'line', 'lines') + ', with its purchase order, invoice or receipt, and basis', lines)
    + (TE ? folded('pl1267-fp-test', 'Transport estimate: trucks that ran with no figure, and pick-ups still to come', n(TE.legs.length, 'leg', 'legs') + ' · ' + f2(TE.ranBy31Oct) + ' ran by 31 Oct · ' + f2(TE.stillOnSite) + ' still on site · ESTIMATE, 1 Nov', te) : '')
    + (ga ? folded('pl1267-fp-gl', 'Costs by GL account', n(GA.length, 'account', 'accounts') + ' as coded on the cost lines, adding to the job cost', ga) : '')
    + folded('pl1267-fp-branch', 'Costs by branch, line by line', 'what makes up each branch’s costs', bl)
    + (rv ? folded('pl1267-fp-revenue', 'Revenue by invoice', n(J.invoices.length, 'invoice', 'invoices') + ', each with its hire contract and the V8s’ PO, and the November forecast', rv) : '')
    + (ct ? folded('pl1267-fp-contracts', 'By hire contract', 'what we charged on each of the ' + n(J.contracts.length, 'contract', 'contracts') + ', and the costs and POs against it', ct) : '')
    + (po ? folded('pl1267-fp-pos', 'Every purchase order in the costs', n(PT.count, 'purchase order', 'purchase orders') + ' and the costs with no PO, adding to the job cost', po) : '')
    + (LC ? folded('pl1267-fp-labour', 'Labour charged to the V8s, by branch, and every labour line', n(LC.lines.length, 'line', 'lines') + ' coded LABOUR, by branch and one by one, with its invoice, contract line, hours and rate', lc + lcl) : '')
    + (LJ ? folded('pl1267-fp-lj', 'Labour journals: where everyone’s hours go', n(LJ.length, 'row', 'rows') + ': each person’s home branch and the branch the hours are journaled to, by month', lj) : '')
    + (S7 ? folded('pl1267-fp-s17', 'Transport checked against Schedule 17', n(S7.changes.length, 'load', 'loads') + ' changed, +' + f2(S7.net) + ', each with its Schedule 17 row, docket and hire contract', s7) : '')
    + '<p class="plf1272-note plf1279-printonly">Not on this paper: the finder, and the working figures from the live record (the live model, its ledger lines, fencing and the workings). They are on the Costs &amp; P&amp;L tab, under the P&amp;L.</p>'
    + '<p class="pl1267-foot plf1272-foot"><span>Pack ' + e(J.pack) + ' · record ' + e(J.record) + ' · as at ' + e(day(J.asAt)) + ' · ' + e(J.basis) + '</span><span>Author: Andrew Fisher</span></p>'
    + '</section>';
}
/* the face the tab carried (the live model) goes into one fold under the P&L job position, as it is: every card, figure and button kept */
function wrap(old) {
  var box = D.createElement('div'); box.innerHTML = html();
  var key = 'costs765|pl1267-live', open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (er) {}
  var live = D.createElement('details'); live.className = 'plfold765 pl1267-fold plf1272-live'; live.id = 'pl1267-live'; live.setAttribute('data-sfold', key); if (open) live.open = true;
  live.innerHTML = '<summary>The live model<small>works from the record as it stands, with quotes and the running sheet where invoices are not in: the working figures, not the P&amp;L job position above</small></summary>';
  while (old.firstChild) live.appendChild(old.firstChild);
  box.appendChild(live);
  return box;
}
/* v12.79: the paper. A4 landscape with margins office printers keep, and on every page what it is and its page number */
function pageRule() {
  var q = function (s) { return '"' + String(s).replace(/["\\\n]/g, '') + '"'; };
  var font = 'font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:7pt;color:#555';
  return '@page{size:A4 landscape;margin:10mm 10mm 12mm;@bottom-left{content:' + q('GC500 · The P&L, job position at ' + day(DATA.asAt) + ' · AUD ex GST · pack ' + DATA.pack + ' · Author: Andrew Fisher')
    + ';' + font + '}@bottom-right{content:"Page " counter(page) " of " counter(pages);' + font + '}}';
}
/* v12.79: the working figures from the live record (the live model, its ledger lines, fencing and the workings) under one closed fold (#pl1267-papers)
   below the P&L, named for what they are; every card and figure in them is kept as it is */
function papers() {
  var live = D.getElementById('pl1267-live'); if (!live || !live.parentNode) return;
  var g = D.getElementById('pl1267-papers');   /* its id starts pl1267, so the pane's late-card sweep keeps it where it is */
  if (g && !g.contains(live)) { if (g.parentNode) g.parentNode.removeChild(g); g = null; }   /* one from an earlier draw */
  if (!g) {
    var key = 'costs765|pl1267-papers', open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (er) {}
    g = D.createElement('details'); g.id = 'pl1267-papers'; g.className = 'plfold765 pl1267-fold'; g.setAttribute('data-sfold', key); if (open) g.open = true;
    g.innerHTML = '<summary>Working figures from the live record<small>not the P&amp;L at ' + e(day(DATA.asAt).replace(/ \d{4}$/, '')) + ' above: the live model, its ledger lines, fencing and the workings; their totals differ from the P&amp;L</small></summary>'
      + '<p class="plf1272-note">These work from the record as it stands, with quotes and the running sheet where invoices are not in. The P&amp;L above is the position for Finance.</p>';
    live.parentNode.insertBefore(g, live);
  }
  ['pl1267-live', 'pl1267-finance', 'pl1267-fence', 'pl1267-work'].forEach(function (id) { var el = D.getElementById(id); if (el && el.parentNode !== g) g.appendChild(el); });
}
var PRINTED = false;
function bind() {
  var b = D.getElementById('pl1267-fp-print');
  if (b && !b.__plf1272) { b.__plf1272 = true; b.onclick = function () { try { printCosts(); var st = D.getElementById('costPage'); if (st) st.textContent = pageRule(); } catch (er) { try { console.warn('PLF1272: print', er); } catch (_) {} } }; }
  ['pl1267-print', 'printCosts'].forEach(function (id) {   /* the working figures' Print buttons: the same paper (the P&L at 31 Oct) with its page footer */
    var pb = D.getElementById(id); if (pb && b && b.onclick) pb.onclick = b.onclick;
  });
  var fp = D.getElementById('pl1267-fp');
  if (fp && !fp.__plf1279) {   /* a link on the face opens its fold and goes to it (no change to the address) */
    fp.__plf1279 = true;
    fp.addEventListener('click', function (ev) {
      var pk = ev.target && ev.target.closest ? ev.target.closest('.plf1279-pick') : null;
      if (pk) {   /* a category on the face opens its lines in Find in the P&L, through the finder's own Category choice */
        var sel = D.getElementById('plx-cat'); if (!sel) return;
        sel.value = pk.getAttribute('data-cat') || ''; sel.dispatchEvent(new Event('change', {bubbles: true}));
        try { sel.focus({preventScroll: true}); D.getElementById('plx').scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (er) {}
        return;
      }
      var a = ev.target && ev.target.closest ? ev.target.closest('a.plf1279-jump') : null; if (!a) return;
      var t = D.getElementById((a.getAttribute('href') || '').replace(/^#/, '')); if (!t) return;
      ev.preventDefault(); if (t.tagName === 'DETAILS') t.open = true;
      try { t.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (er) { try { t.scrollIntoView(); } catch (_) {} }
    });
  }
  try { papers(); } catch (er) { try { console.warn('PLF1279: working figures', er); } catch (_) {} }
  if (!PRINTED && typeof W.addEventListener === 'function') {   /* the browser's own print (Ctrl+P) on this tab gives the same paper as Print full P&L */
    PRINTED = true;
    W.addEventListener('beforeprint', function () {
      var pane = D.getElementById('pane-costs');
      if (!pane || !pane.classList.contains('on') || !D.getElementById('pl1267-fp') || D.getElementById('costPage')) return;
      if (Array.prototype.some.call(D.body.classList, function (c) { return /^printing/.test(c); })) return;
      var st = D.createElement('style'); st.id = 'costPage'; st.textContent = pageRule(); D.head.appendChild(st); D.body.classList.add('printing-costs');
      var shut = Array.prototype.slice.call(D.querySelectorAll('#pl1267-fp details.plf1272-more:not([open])')); shut.forEach(function (d) { d.open = true; });
      W.addEventListener('afterprint', function () { st.remove(); D.body.classList.remove('printing-costs'); shut.forEach(function (d) { d.open = false; }); }, {once: true});
    });
  }
  try { xBind(); } catch (er) { try { console.warn('PLF1277: find', er); } catch (_) {} }
}
return {data: DATA, sha: SHA, html: html, wrap: wrap, bind: bind, f2: f2};
})(window, document);
