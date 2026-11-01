/* Author: Andrew Fisher. v12.72 - the final P&L on the P&L tab. Andrew, 1 Nov 2026 (this chat): "make sure all the new P&L data
   this Becomes the new P&L in the GC500 p&L Tab we need thi Accurate to the Cent please".
   The Costs & P&L tab leads with the final P&L pack: revenue (the 18 invoices to V8 Supercars and the November forecast), costs
   by month of work, by branch and by supplier, what to accrue at 31 Oct, every cost line with its purchase order and invoice or
   receipt, the journals, and the open items. Every figure is the pack's own (GC500_PL_final.json, written by
   review_31Oct2026_october_month_end/build_monthend.py and checked against the pack's workbook to the cent by audit_pack.py); the
   build puts the pack's data in DATA below and nothing here works a figure out, so the tab and the pack cannot differ. The live
   model the tab carried before (pl1267: worked from the record as it stands) folds under it, named as the working figures, moved,
   not removed. Nothing is typed here; nothing is written to the record.
   v12.73 - labour we charged the V8s, by branch (Andrew, 1 Nov 2026: "how much labour we charged each MEAD and NVAC and KINP and STPS
   if any so when we journal peoples cost into INSTALL we have a figure we know we are up against"; "yes to 5"): the pack's own figures, every
   line the invoices code LABOUR, with the labour hire already in Installs and what is left; every labour line in a fold.
   v12.74 - the tab on pack v1.13: transport checked against Schedule 17 (1 Nov), every change with its Schedule 17 row, docket and
   hire contract, in a fold; the pack's figures, as above. */
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
function html() {
  var J = DATA, R = J.revenue, C = J.costs;
  var head = '<div class="pl1267-headrow"><p class="fin745-eyebrow">THE P&amp;L · FINAL · AUD EX GST · AS AT ' + e(day(J.asAt).toUpperCase()) + '</p>'
    + '<button type="button" class="btn ghost sm" id="pl1267-fp-print">Print</button></div>'
    + '<h2 id="plf1272Title" class="plf1272-h">The P&amp;L, final<small>pack ' + e(J.pack) + ' · from ' + e(J.source) + '</small></h2>';
  var tiles = '<div class="pl1267-tiles plf1272-tiles">'
    + tile('Charged to the V8s', f2(R.total), '18 invoices ' + f2(R.invoices) + ' · November forecast ' + f2(R.novForecast))
    + tile('What it costs us', f2(C.total), 'Sep ' + f2(C.sep) + ' · Oct ' + f2(C.oct) + ' · Nov ' + f2(C.nov) + ' (forecast)')
    + tile('Difference', f2(J.difference), 'revenue less costs, job end', J.difference < 0 ? 'pl1267-neg' : '')
    + tile('To accrue at 31 Oct', f2(J.accrue), 'work done, not invoiced yet')
    + '</div>';
  var br = '<p class="fin745-eyebrow plf1272-sub">BY BRANCH · JOB END</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-branch"><thead><tr><th>Branch</th>'
    + '<th class="num">Invoiced (Oct)</th><th class="num">November forecast</th><th class="num">Revenue</th><th class="num">Costs</th><th class="num">Difference</th></tr></thead><tbody>';
  var tot = {inv: 0, fc: 0, rev: 0, cost: 0, diff: 0};
  J.branches.forEach(function (b) {
    br += '<tr data-b="' + e(b.b) + '"><td>' + e(b.b) + '</td><td class="num">' + c2(b.invoiced) + '</td><td class="num">' + c2(b.novForecast) + '</td><td class="num">' + c2(b.revenue)
      + '</td><td class="num">' + c2(b.costs) + '</td><td class="num' + (b.difference < 0 ? ' pl1267-neg' : '') + '">' + c2(b.difference) + '</td></tr>';
  });
  br += '<tr class="pl1267-grand" data-b="job"><td>The job</td><td class="num">' + c2(R.invoices) + '</td><td class="num">' + c2(R.novForecast) + '</td><td class="num">' + c2(R.total)
    + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.difference) + '</td></tr></tbody></table></div>';
  var LC = J.labourCharged, lc = '', lcl = '';
  if (LC) {
    lc = '<p class="fin745-eyebrow plf1272-sub">LABOUR WE CHARGED THE V8S, BY BRANCH · WHAT PEOPLE’S COST IN INSTALLS IS SET AGAINST</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lc"><thead><tr><th>Branch</th>'
      + '<th class="num">Labour charged</th><th class="num">Lines</th><th class="num">Labour hire already in Installs</th><th class="num">Left for people’s cost</th></tr></thead><tbody>';
    var nl = 0;
    LC.branches.forEach(function (b) { nl += b.lines; lc += '<tr data-b="' + e(b.b) + '"><td>' + e(b.b) + '</td><td class="num">' + c2(b.charged) + '</td><td class="num">' + b.lines + '</td><td class="num">' + c2(b.installLabourHire) + '</td><td class="num">' + c2(b.left) + '</td></tr>'; });
    lc += '<tr class="pl1267-grand" data-b="job"><td>The job</td><td class="num">' + c2(LC.total) + '</td><td class="num">' + nl + '</td><td class="num">' + c2(LC.installTotal) + '</td><td class="num">' + c2(LC.leftTotal) + '</td></tr></tbody></table></div>'
      + '<p class="plf1272-note">Every line the 18 invoices code LABOUR, as invoiced, on the branch that invoices it.</p><ul class="plf1272-lcnotes">' + (LC.notes || []).map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>';
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
  var sup = '<p class="fin745-eyebrow plf1272-sub">COSTS BY SUPPLIER AND MONTH OF WORK · WHAT TO ACCRUE AT 31 OCT</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-sup"><thead><tr><th>Supplier</th>'
    + '<th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Job end</th><th class="num">To accrue</th></tr></thead><tbody>';
  J.suppliers.forEach(function (s) {
    sup += '<tr><td>' + e(s.name) + '</td><td class="num">' + c2(s.sep) + '</td><td class="num">' + c2(s.oct) + '</td><td class="num">' + c2(s.nov) + '</td><td class="num">' + c2(s.total) + '</td><td class="num">' + c2(s.accrue) + '</td></tr>';
  });
  sup += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.sep) + '</td><td class="num">' + c2(C.oct) + '</td><td class="num">' + c2(C.nov) + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.accrue) + '</td></tr></tbody></table></div>';
  var note = '<p class="plf1272-note">Revenue is booked in October, the invoice month; the November forecast is a pick-up charge applied but not invoiced yet. '
    + 'Costs are by month of work at job end; November is forecast. To accrue is October’s work with no invoice yet. Each line below names its purchase order and invoice or receipt.</p>';
  var lines = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lines"><thead><tr><th>Supplier · what</th><th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">To accrue</th><th>Status</th></tr></thead><tbody>';
  J.lines.forEach(function (l) {
    lines += '<tr><td><b>' + e(l.supplier) + '</b> · ' + e(l.branch) + (l.account ? ' · ' + e(l.account) : '') + '<small>' + e(l.what) + '</small>'
      + ((l.po || l.invoice) ? '<small>' + (l.po ? 'PO ' + e(l.po) : '') + (l.po && l.invoice ? ' · ' : '') + (l.invoice ? e(l.invoice) : '') + '</small>' : '')
      + '</td><td class="num">' + c2(l.sep) + '</td><td class="num">' + c2(l.oct) + '</td><td class="num">' + c2(l.nov) + '</td><td class="num">' + c2(l.accrue) + '</td><td>' + e(l.status) + (l.basis ? '<small>' + e(l.basis) + '</small>' : '') + '</td></tr>';
  });
  lines += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.sep) + '</td><td class="num">' + c2(C.oct) + '</td><td class="num">' + c2(C.nov) + '</td><td class="num">' + c2(J.accrue) + '</td><td></td></tr></tbody></table></div>';
  var bl = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-bl"><thead><tr><th>Branch · line</th><th class="num">Job end</th></tr></thead><tbody>';
  J.branches.forEach(function (b) {
    bl += '<tr class="pl1267-grp"><td colspan="2">' + e(b.b) + '</td></tr>';
    (J.branchLines[b.b] || []).forEach(function (x) { bl += '<tr><td>' + e(x[0]) + '</td><td class="num">' + c2(x[1]) + '</td></tr>'; });
    bl += '<tr class="pl1267-tot" data-b="' + e(b.b) + '"><td>Total ' + e(b.b) + '</td><td class="num">' + c2(b.costs) + '</td></tr>';
  });
  bl += '<tr class="pl1267-grand"><td>The job</td><td class="num">' + c2(C.total) + '</td></tr></tbody></table></div>';
  var jr = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-jn"><thead><tr><th>Journal</th><th>PO</th><th>Account · branch</th><th class="num">Amount</th></tr></thead><tbody>';
  J.journals.forEach(function (j) { jr += '<tr><td>' + e(j.journal) + '<small>' + e(j.contract) + '</small></td><td>' + e(j.po) + '</td><td>' + e(j.account) + '<small>' + e(j.branch) + '</small></td><td class="num">' + c2(j.amount) + '</td></tr>'; });
  jr += '<tr class="pl1267-grand"><td>Accruals at 31 Oct (each reverses on 1 Nov; the invoice lands against it)</td><td></td><td></td><td class="num">' + c2(J.accrue) + '</td></tr>';
  if (J.moves && J.moves.length) {
    jr += '<tr class="pl1267-sub"><td colspan="4">Branch moves (cost journals between branches; they net to nil)</td></tr>';
    J.moves.forEach(function (j) { jr += '<tr><td>' + e(j.journal) + '<small>' + e(j.contract) + '</small></td><td>' + e(j.po) + '</td><td>' + e(j.account) + '<small>' + e(j.branch) + '</small></td><td class="num">' + c2(j.amount) + '</td></tr>'; });
  }
  jr += '</tbody></table></div>';
  var op = '<ol class="plf1272-open">' + J.open.map(function (o) { return '<li>' + e(o) + '</li>'; }).join('') + '</ol>';
  return '<section id="pl1267-fp" class="card pl1267 plf1272 nosfold" aria-labelledby="plf1272Title">' + head + tiles + br + lc + sup + note
    + folded('pl1267-fp-lines', 'Every cost line', n(J.lines.length, 'line', 'lines') + ', with its purchase order, invoice or receipt, and basis', lines)
    + folded('pl1267-fp-branch', 'Costs by branch, line by line', 'what makes up each branch’s costs', bl)
    + (LC ? folded('pl1267-fp-labour', 'Every labour line on the invoices', n(LC.lines.length, 'line', 'lines') + ' coded LABOUR, with its invoice, contract line, hours and rate', lcl) : '')
    + (S7 ? folded('pl1267-fp-s17', 'Transport checked against Schedule 17', n(S7.changes.length, 'load', 'loads') + ' changed, +' + f2(S7.net) + ', each with its Schedule 17 row, docket and hire contract', s7) : '')
    + folded('pl1267-fp-journals', 'Journals at 31 Oct', n(J.journals.length, 'accrual', 'accruals') + (J.moves && J.moves.length ? ' and ' + n(J.moves.length, 'branch move', 'branch moves') : ''), jr)
    + folded('pl1267-fp-open', 'Open items', n(J.open.length, 'item', 'items') + ': paperwork to come and calls still to make', op)
    + '<p class="pl1267-foot plf1272-foot"><span>Pack ' + e(J.pack) + ' · record ' + e(J.record) + ' · as at ' + e(day(J.asAt)) + ' · ' + e(J.basis) + '</span><span>Author: Andrew Fisher</span></p>'
    + '</section>';
}
/* the face the tab carried (the live model) goes into one fold under the final P&L, as it is: every card, figure and button kept */
function wrap(old) {
  var box = D.createElement('div'); box.innerHTML = html();
  var key = 'costs765|pl1267-live', open = false; try { open = typeof SFOLD_OPEN !== 'undefined' && SFOLD_OPEN.has(key); } catch (er) {}
  var live = D.createElement('details'); live.className = 'plfold765 pl1267-fold plf1272-live'; live.id = 'pl1267-live'; live.setAttribute('data-sfold', key); if (open) live.open = true;
  live.innerHTML = '<summary>The live model<small>works from the record as it stands, with quotes and the running sheet where invoices are not in: the working figures, not the final P&amp;L</small></summary>';
  while (old.firstChild) live.appendChild(old.firstChild);
  box.appendChild(live);
  return box;
}
function bind() {
  var b = D.getElementById('pl1267-fp-print');
  if (b && !b.__plf1272) { b.__plf1272 = true; b.onclick = function () { try { printCosts(); } catch (er) { try { console.warn('PLF1272: print', er); } catch (_) {} } }; }
}
return {data: DATA, sha: SHA, html: html, wrap: wrap, bind: bind, f2: f2};
})(window, document);
