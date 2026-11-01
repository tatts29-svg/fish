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
function cents(c) { return c ? f2(c / 100) : '<span class="pl1267-dash">—</span>'; }
/* words as typed: lower case, quotes dropped, a thousands comma in a number dropped, spaces collapsed */
function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[“”"‘’`]/g, ' ').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\s+/g, ' ').trim(); }
function words(q) { return norm(q).split(' ').filter(Boolean); }
function hit(text, ws) { for (var i = 0; i < ws.length; i++) if (text.indexOf(ws[i]) < 0) return false; return true; }
function tight(s) { return norm(s).replace(/\s+/g, ''); }
function cpoKey(v) { return tight(String(v == null ? '' : v).split(' (')[0]); }   /* the V8s' PO as keyed, without the note after it */
function poText(po) { var t = String(po == null ? '' : po).trim(); return /^none/i.test(t) ? 'No PO' + (t.length > 4 ? ' (' + t.replace(/^none\s*/i, '') + ')' : '') : 'PO ' + t; }
function xIndex() {
  if (IX) return IX;
  var J = DATA; IX = {po: {}, con: {}, inv: {}, rem: {}, cpo: {}, people: []};
  LT = J.lines.map(function (l) { return norm([l.supplier, l.branch, l.account, l.what, l.po, l.invoice, l.contract, l.status, l.basis, l.category].join(' ')); });
  PT = (J.labourJournal || []).map(function (x) { return norm([x.who, x.type, x.home, x.branch, x.contract, x.journal].join(' ')); });
  (J.purchaseOrders || []).forEach(function (x) { IX.po[tight(x.po)] = x; });
  (J.contracts || []).forEach(function (x) { IX.con[tight(x.contract)] = x; });
  (J.invoices || []).forEach(function (x) { IX.inv[tight(x.inv)] = x; var k = cpoKey(x.customerPO); (IX.cpo[k] = IX.cpo[k] || []).push(x); });
  (J.removedInvoices || []).forEach(function (x) { IX.rem[tight(x.inv)] = x; });
  (J.labourJournal || []).forEach(function (x) { if (IX.people.indexOf(x.who) < 0) IX.people.push(x.who); });
  return IX;
}
/* what the search is: an identifier gives that thing's own figure in the P&L; a branch code or a category name acts as that choice;
   anything else finds the cost lines that mention it */
function xKind(q) {
  var I = xIndex(), qn = norm(q), qc = qn.replace(/\s+/g, '');
  if (!qn) return {kind: ''};
  if (BRS.indexOf(qn.toUpperCase()) >= 0) return {kind: 'branch', br: qn.toUpperCase()};
  var cat = (DATA.categories || []).filter(function (c) { return norm(c.name) === qn; })[0]; if (cat) return {kind: 'category', cat: cat.name};
  if (I.po[qc]) return {kind: 'po', x: I.po[qc]};
  if (I.con[qc]) return {kind: 'contract', x: I.con[qc]};
  if (I.inv[qc]) return {kind: 'invoice', x: I.inv[qc]};
  if (I.rem[qc]) return {kind: 'removed', x: I.rem[qc]};
  if (I.cpo[qc]) return {kind: 'cpo', key: qc, list: I.cpo[qc]};
  var ws = qn.split(' '), who = I.people.filter(function (w) { var nw = norm(w).split(' '); return ws.every(function (x) { return nw.some(function (y) { return y.indexOf(x) === 0; }); }); });
  if (who.length) return {kind: 'person', who: who};
  return {kind: 'text', ws: ws};
}
function xBox() {
  if (!DATA.facts || !DATA.revFacts) return '';
  var o = function (v, t) { return '<option value="' + e(v) + '">' + e(t) + '</option>'; };
  /* data-ro: the page's read-only lock (a view-only link disables every field) leaves these alone; they filter what is shown and write nothing */
  return '<div class="plx" id="plx" data-ro role="search" aria-label="Find in the P&amp;L">'
    + '<div class="plx-top"><p class="fin745-eyebrow">FIND IN THE P&amp;L</p><p class="plx-help">Choose a category, branch or month. Or search a PO, hire contract, invoice, V8s PO or person for its own figure in the P&amp;L, or any word for the cost lines that mention it. Categories group the cost lines for reporting; they are not GL codes. Every figure is the P&amp;L’s own, to the cent.</p></div>'
    + '<div class="plx-bar">'
    + '<label class="plx-f"><span>Category</span><select id="plx-cat">' + o('', 'All categories') + (DATA.categories || []).map(function (c) { return o(c.name, c.name); }).join('') + '</select></label>'
    + '<label class="plx-f"><span>Branch</span><select id="plx-br">' + o('', 'All branches') + BRS.map(function (b) { return o(b, BRN[b]); }).join('') + '</select></label>'
    + '<label class="plx-f"><span>Month</span><select id="plx-mo">' + o('', 'Job end (Sep to Nov)') + MOS.map(function (m) { return o(m, MOL[m]); }).join('') + '</select></label>'
    + '<label class="plx-f plx-qf"><span>Search</span><input type="search" id="plx-q" autocomplete="off" spellcheck="false" placeholder="e.g. 4658850, 9961976, 25122628, Kyle"></label>'
    + '<button type="button" class="btn ghost sm plx-clear" id="plx-clear">Clear</button>'
    + '</div><div class="plx-sum" id="plx-sum" aria-live="polite"></div><div class="plx-out" id="plx-out"></div></div>';
}
var DASH = '<span class="pl1267-dash">—</span>';
var KIND = {'Labour hire': 'Labour hire', 'Salary allowance': 'Salary'};   /* a cost category and the labour journal rows that belong to it */
function kpi(label, cents_, small, neg) { return '<div class="plx-k' + (neg ? ' pl1267-neg' : '') + '"><span>' + e(label) + '</span><b>' + (cents_ === null ? DASH : f2(cents_ / 100)) + '</b><small>' + e(small) + '</small></div>'; }
function invRow(x, amt) { return '<tr><td><b>' + e(x.inv) + '</b><small>' + dmy(x.date) + '</small></td><td>' + e(x.contract) + ' · ' + e(x.branch) + '<small>our POs against it: ' + e(/^no PO/.test(x.pos) ? 'none on the record' : x.pos) + '</small></td><td>' + e(x.customerPO) + '</td><td class="num">' + cents(amt) + '</td></tr>'; }
var INV_HEAD = '<thead><tr><th>Invoice · date</th><th>Hire contract · branch</th><th>V8s PO</th><th class="num">AUD ex GST</th></tr></thead>';
function xRender() {
  var sumEl = D.getElementById('plx-sum'), outEl = D.getElementById('plx-out');
  if (!sumEl || !outEl) return;
  xIndex();
  var J = DATA, K = xKind(XS.q), s = {cat: XS.cat, br: XS.br, mo: XS.mo}, note = '', out = '';
  if (K.kind === 'branch') { s.br = K.br; note = '“' + XS.q.trim() + '” is a branch: showing ' + BRN[K.br] + ', as the Branch choice does.'; K = {kind: ''}; }
  if (K.kind === 'category') { s.cat = K.cat; note = '“' + XS.q.trim() + '” is a category: showing ' + K.cat + ', as the Category choice does.'; K = {kind: ''}; }
  var jobOnly = function (what) { return s.mo ? what + ' is for the job, not by month: choose Job end' : ''; };
  var cols = s.mo ? [s.mo] : MOS;
  var head = function (first, extra) { return '<thead><tr><th>' + first + '</th>' + (extra || '') + cols.map(function (m) { return '<th class="num">' + e(m) + '</th>'; }).join('') + (s.mo ? '' : '<th class="num">Job end</th>') + '</tr></thead>'; };
  var cells = function (by) { var t = 0; var h = cols.map(function (m) { t += by[m] || 0; return '<td class="num">' + cents(by[m] || 0) + '</td>'; }).join(''); return h + (s.mo ? '' : '<td class="num"><b>' + cents(t) + '</b></td>'); };
  var lineFacts = function (ok) { return J.facts.filter(function (f) { return ok(f[0]) && (!s.br || f[1] === s.br) && (!s.mo || f[2] === s.mo); }); };
  var linesTable = function (facts, caption) {
    var ids = [], seen = {}, tot = {}; MOS.forEach(function (m) { tot[m] = 0; });
    facts.forEach(function (f) { tot[f[2]] += f[3]; if (!seen[f[0]]) { seen[f[0]] = 1; ids.push(f[0]); } }); ids.sort(function (a, b) { return a - b; });
    if (!ids.length) return '';
    var lr = ids.map(function (i) { var l = J.lines[i], by = {}, brs = [], mv = false;
      facts.forEach(function (f) { if (f[0] === i) { by[f[2]] = (by[f[2]] || 0) + f[3]; if (brs.indexOf(f[1]) < 0) brs.push(f[1]); if (f[4]) mv = true; } });
      return '<tr><td><b>' + e(l.supplier) + '</b><small>' + e(l.what) + '</small><small>' + e(poText(l.po)) + ' · Hire contract: ' + e(l.contract) + '</small><small class="plx-cat">' + e(l.category) + '</small></td><td>' + e(brs.join(' · ')) + (mv ? '<small>with the branch move</small>' : '') + '</td>' + cells(by) + '</tr>'; }).join('');
    return (caption ? '<p class="fin745-eyebrow plf1272-sub">' + caption + '</p>' : '') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-lines">' + head('Cost line', '<th>Branch</th>') + '<tbody>' + lr
      + '<tr class="pl1267-grand"><td>' + n(ids.length, 'cost line', 'cost lines') + '</td><td></td>' + cells(tot) + '</tr></tbody></table></div>';
  };
  var journals = function (rowsOk, title) {   /* the labour journals: who, home branch, where the hours are journaled to, by month */
    var lj = (J.labourJournal || []).filter(function (x, i) { return (!s.br || x.branch === s.br) && (!s.cat || x.kind === KIND[s.cat]) && rowsOk(x, i); });
    if (s.mo) lj = lj.filter(function (x) { return s.mo === 'Sep' ? x.sep : s.mo === 'Oct' ? x.oct : true; });
    if (!lj.length) return '';
    var t = '<p class="fin745-eyebrow plf1272-sub">' + (title || 'LABOUR JOURNALS' + (s.br ? ' · TO ' + e(s.br) : '')) + '</p>';
    if (s.mo === 'Nov') return t + '<p class="plf1272-note">November’s hours, to 13 Nov, are counted in October: choose October to see them.</p>';
    var hm = s.mo ? [s.mo] : ['Sep', 'Oct'], hs = {Sep: 0, Oct: 0}, lh = 0;
    var jr = lj.map(function (x) { hs.Sep += x.sep; hs.Oct += x.oct; lh += Math.round(x.labourHire * 100);
      return '<tr><td><b>' + e(x.who) + '</b><small>' + e(x.type) + '</small></td><td>' + e(x.home) + '</td><td>' + e(x.journal === 'stays' ? 'stays on ' + x.branch : x.journal) + (x.contract ? '<small>' + e(x.contract) + '</small>' : '') + '</td>'
        + hm.map(function (m) { return '<td class="num">' + hrs(m === 'Sep' ? x.sep : x.oct) + '</td>'; }).join('') + (s.mo ? '' : '<td class="num"><b>' + hrs(x.sep + x.oct) + '</b></td><td class="num">' + cents(Math.round(x.labourHire * 100)) + '</td>') + '</tr>'; }).join('');
    return t + '<p class="plf1272-note">Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). ' + (s.mo ? '' : 'Labour hire $ here is the running sheet’s; the costs carry Job Connect’s invoices and POs where there are any (the bridge, week by week, is in the Labour journals fold). ') + (s.mo === 'Oct' ? 'October’s hours include November’s, to 13 Nov.' : '') + '</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-lj"><thead><tr><th>Person · type</th><th>Home branch</th><th>Journal</th>' + hm.map(function (m) { return '<th class="num">' + e(m === 'Oct' ? 'Oct h (with 1–13 Nov)' : m + ' h') + '</th>'; }).join('')
      + (s.mo ? '' : '<th class="num">Total h</th><th class="num">Labour hire $ (running sheet)</th>') + '</tr></thead><tbody>' + jr
      + '<tr class="pl1267-grand"><td>' + n(lj.length, 'row', 'rows') + '</td><td></td><td></td>' + hm.map(function (m) { return '<td class="num">' + hrs(hs[m]) + '</td>'; }).join('') + (s.mo ? '' : '<td class="num">' + hrs(hs.Sep + hs.Oct) + '</td><td class="num">' + cents(lh) + '</td>') + '</tr></tbody></table></div>';
  };
  var sum = '';
  if (!K.kind) {   /* the choices alone: the parts in whole cents */
    var facts = lineFacts(function (i) { return !s.cat || J.lines[i].category === s.cat; }), cost = 0, nl = {}; facts.forEach(function (f) { cost += f[3]; nl[f[0]] = 1; });
    var rev = null, rf = [];
    if (!s.cat) { rf = J.revFacts.filter(function (r) { return (!s.br || r[1] === s.br) && (!s.mo || r[2] === s.mo); }); rev = 0; rf.forEach(function (r) { rev += r[3]; }); }
    var nInv = rf.filter(function (r) { return r[2] !== 'Nov'; }).length, fc = rf.some(function (r) { return r[2] === 'Nov'; });
    var revWhy = rev === null ? 'not split by cost category' : s.mo === 'Sep' ? 'none in September: the 18 invoices are dated October' : s.mo === 'Nov' ? (fc ? 'the November forecast, not invoiced yet' : 'none in November: the forecast is on NVAC')
      : ((nInv ? n(nInv, 'invoice', 'invoices') : '') + (nInv && fc ? ' and ' : '') + (fc ? 'the November forecast' : '') || 'none on this branch');
    var diff = !s.cat && !s.mo;   /* job end only, for the job or a branch: the revenue is booked in October, the invoice month */
    sum = kpi('Revenue', rev, revWhy) + kpi('Costs', cost, n(Object.keys(nl).length, 'cost line', 'cost lines') + (s.mo === 'Oct' ? ' · with November’s labour' : s.mo === 'Nov' ? ' · forecast' : ''))
      + kpi('Difference so far', diff ? rev - cost : null, diff ? 'revenue less costs, job end · not a margin yet' : s.cat ? 'for the job or a branch, with no category' : 'at job end only: the revenue is booked in October, the invoice month', diff && rev - cost < 0);
    if (!s.cat) {   /* by category, for the branch and month chosen; each opens its lines */
      var tot = {}; MOS.forEach(function (m) { tot[m] = 0; }); facts.forEach(function (f) { tot[f[2]] += f[3]; });
      var rows = (J.categories || []).map(function (c) { var by = {}, t = 0; facts.forEach(function (f) { if (J.lines[f[0]].category === c.name) { by[f[2]] = (by[f[2]] || 0) + f[3]; t += f[3]; } });
        return t ? '<tr><td><button type="button" class="plx-pick" data-cat="' + e(c.name) + '">' + e(c.name) + '</button></td>' + cells(by) + '</tr>' : ''; }).join('');
      out += '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-cats">' + head('Category' + (s.br ? ' · ' + e(s.br) : '')) + '<tbody>' + rows
        + '<tr class="pl1267-grand"><td>' + (s.br ? 'Costs, ' + e(BRN[s.br]) : 'Costs, the job') + '</td>' + cells(tot) + '</tr></tbody></table></div>';
    } else out += linesTable(facts);
    if (s.br || KIND[s.cat]) out += journals(function () { return true; });
  } else if (K.kind === 'po') {   /* a purchase order: its own amount, from the purchase orders in the costs */
    var x = K.x, li = J.lines.map(function (l, i) { return (String(l.po).match(/\b\d{7}\b/g) || []).indexOf(x.po) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
    var cats = li.map(function (i) { return J.lines[i].category; }), off = (s.br && x.branch !== s.br) ? 'this PO is on ' + x.branch : (s.cat && cats.indexOf(s.cat) < 0) ? 'this PO is ' + (cats[0] || 'in another category') : '';
    var amt = Math.round(x.amount * 100);
    sum = kpi('Revenue', null, 'a PO is a cost') + kpi('Costs', off || s.mo ? null : amt, off || jobOnly('a PO’s amount') || 'PO ' + x.po + ', as in Every purchase order in the costs') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">PURCHASE ORDER ' + e(x.po) + '</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-po"><thead><tr><th>PO · supplier</th><th>Hire contract</th><th>Branch</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + '<tr><td><b>' + e(x.po) + ' · ' + e(x.supplier) + '</b><small>' + e(x.what) + '</small><small>' + e(x.status) + '</small></td><td>' + e(x.contract) + '</td><td>' + e(x.branch) + '</td><td class="num"><b>' + f2(x.amount) + '</b></td></tr></tbody></table></div>'
      + (li.length ? '<p class="plf1272-note">On the cost line' + (li.length > 1 ? 's' : '') + ' below. A line can carry more than one PO, so a line’s total is not the PO’s amount.</p>' + linesTable(lineFacts(function (i) { return li.indexOf(i) >= 0; })) : '');
  } else if (K.kind === 'contract') {   /* a hire contract: what we charged on it and the costs tied to it, as in By hire contract */
    var c = K.x, inv = (J.invoices || []).filter(function (x) { return x.contract === c.contract; }), fcl = (J.novForecastLines || []).filter(function (x) { return x.contract === c.contract; });
    var offc = s.br && c.branch !== s.br ? 'this hire contract is on ' + c.branch : '';
    var fcTxt = fcl.length ? ' · plus the November forecast ' + fcl.map(function (x) { return f2(x.amount); }).join(', ') + ', not invoiced yet' : '';
    sum = kpi('Revenue', offc || s.mo || s.cat ? null : Math.round(c.revenue * 100), offc || jobOnly('a hire contract’s charge') || (s.cat ? 'not split by cost category' : n(inv.length, 'invoice', 'invoices') + ' on ' + c.contract + fcTxt))
      + kpi('Costs', offc || s.mo ? null : Math.round(c.costTotal * 100), offc || jobOnly('a hire contract’s costs') || n(c.costs.length, 'cost', 'costs') + ' tied to it, as in By hire contract' + (s.cat ? ' (not split by category)' : ''))
      + kpi('Difference so far', null, 'not for one contract: some costs are tied to none');
    out += '<p class="fin745-eyebrow plf1272-sub">HIRE CONTRACT ' + e(c.contract) + ' · ' + e(c.branch) + ' · THE V8S’ PO ' + e(c.customerPO) + '</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>' + inv.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('')
      + '<tr class="pl1267-grand"><td>Charged on ' + e(c.contract) + '</td><td></td><td></td><td class="num">' + f2(c.revenue) + '</td></tr></tbody></table></div>'
      + fcl.map(function (x) { return '<p class="plf1272-note">Not in the charge above: the November forecast on ' + e(x.contract) + ' ' + e(x.line) + ' (' + e(x.branch) + '), ' + f2(x.amount) + ', ' + e(x.what) + '. It is in the revenue as the November forecast.</p>'; }).join('')
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-con"><thead><tr><th>Cost tied to ' + e(c.contract) + '</th><th>PO</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + (c.costs.length ? c.costs.map(function (x) { return '<tr><td><b>' + e(x.what) + '</b><small>' + e(x.status) + '</small></td><td>' + e(x.po) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; }).join('') : '<tr><td>no supplier PO or cost on the record against it</td><td></td><td class="num">' + c2(0) + '</td></tr>')
      + '<tr class="pl1267-grand"><td>Costs against ' + e(c.contract) + '</td><td></td><td class="num">' + c2(c.costTotal) + '</td></tr></tbody></table></div>';
  } else if (K.kind === 'invoice' || K.kind === 'cpo') {   /* an invoice, or every invoice on a V8s PO, at its amount */
    var L = K.kind === 'invoice' ? [K.x] : K.list, offi = s.br ? L.filter(function (x) { return x.branch === s.br; }) : L, ra = 0;
    offi.forEach(function (x) { ra += Math.round(x.ex * 100); });
    var why = s.cat ? 'not split by cost category' : !offi.length ? 'not on ' + s.br + ': ' + L.map(function (x) { return x.inv + ' is on ' + x.branch; }).join(', ') : (s.mo && s.mo !== 'Oct') ? 'none in ' + MOL[s.mo].split(' ')[0] + ': ' + (L.length === 1 ? 'the invoice is' : 'the invoices are') + ' dated October' : (K.kind === 'invoice' ? 'invoice ' + L[0].inv + ' on ' + L[0].contract : n(offi.length, 'invoice', 'invoices') + ' on the V8s’ PO ' + XS.q.trim().toUpperCase());
    sum = kpi('Revenue', s.cat ? null : (s.mo && s.mo !== 'Oct') ? 0 : ra, why) + kpi('Costs', null, 'an invoice is revenue: its hire contract carries the costs tied to it') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">' + (K.kind === 'invoice' ? 'INVOICE ' + e(L[0].inv) : 'INVOICES ON THE V8S’ PO ' + e(XS.q.trim().toUpperCase())) + '</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>'
      + L.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('') + '<tr class="pl1267-grand"><td>' + n(L.length, 'invoice', 'invoices') + '</td><td></td><td></td><td class="num">' + cents(L.reduce(function (a, x) { return a + Math.round(x.ex * 100); }, 0)) + '</td></tr></tbody></table></div>'
      + '<p class="plf1272-note">' + L.map(function (x) { return '<button type="button" class="plx-go" data-q="' + e(x.contract) + '">Hire contract ' + e(x.contract) + '</button>'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' ') + '</p>';
  } else if (K.kind === 'removed') {
    sum = kpi('Revenue', null, 'not in the revenue') + kpi('Costs', null, 'an invoice is revenue') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="plf1272-note">Invoice ' + e(K.x.inv) + ' on ' + e(K.x.contract) + ' (' + f2(K.x.ex) + ') is not in the revenue: ' + e(K.x.why) + '.</p>';
  } else if (K.kind === 'person') {   /* a person: where their hours go; costs are carried by week and supplier, not by person */
    sum = kpi('Revenue', null, 'charged by line, not by person') + kpi('Costs', null, 'carried by week and supplier, not by person: the labour hire $ below are the running sheet’s') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += journals(function (x) { return K.who.indexOf(x.who) >= 0; }, 'LABOUR JOURNALS · ' + e(K.who.join(', ').toUpperCase())) || '<p class="plx-none">No hours for ' + e(K.who.join(', ')) + ' in that choice.</p>';
  } else {   /* any other words: the cost lines that mention them, whole lines, at their parts in the choice */
    var tf = lineFacts(function (i) { return (!s.cat || J.lines[i].category === s.cat) && hit(LT[i], K.ws); }), tc = 0, tl = {}; tf.forEach(function (f) { tc += f[3]; tl[f[0]] = 1; });
    sum = kpi('Revenue', null, 'search an invoice, hire contract or V8s PO for revenue') + kpi('Matching cost lines', tc, n(Object.keys(tl).length, 'cost line', 'cost lines') + ' that mention “' + XS.q.trim() + '”, whole lines: a line can be shared with other items, so this is not one item’s cost') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += linesTable(tf, 'COST LINES THAT MENTION “' + e(XS.q.trim().toUpperCase()) + '”');
    out += journals(function (x, i) { return hit(PT[i], K.ws); });
  }
  sumEl.innerHTML = (note ? '<p class="plx-note">' + e(note) + '</p>' : '') + sum;
  outEl.innerHTML = out || '<p class="plx-none">Nothing in the P&amp;L matches that choice.</p>';
}
function hrs(h) { return h ? (Math.round(h * 100) / 100).toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2}) : '<span class="pl1267-dash">—</span>'; }
function xBind() {
  var box = D.getElementById('plx'); if (!box || box.__plx) return; box.__plx = true;
  var ids = {cat: 'plx-cat', br: 'plx-br', mo: 'plx-mo', q: 'plx-q'};
  Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = XS[k]; });
  var read = function () { ['cat', 'br', 'mo'].forEach(function (k) { var el = D.getElementById(ids[k]); XS[k] = el ? el.value : ''; }); xRender(); };
  ['plx-cat', 'plx-br', 'plx-mo'].forEach(function (id) { var el = D.getElementById(id); if (el) el.onchange = read; });
  var q = D.getElementById('plx-q'), tq = 0;
  if (q) {   /* the typed words are kept at once, so a redraw while typing loses nothing; the figures follow a moment later */
    q.oninput = function () { XS.q = q.value; clearTimeout(tq); tq = setTimeout(xRender, 120); };
    q.onfocus = function () { XS.f = 1; }; q.onblur = function () { XS.f = 0; };
    if (XS.f) { try { q.focus(); var L = q.value.length; q.setSelectionRange(L, L); } catch (er) {} }
  }
  var c = D.getElementById('plx-clear'); if (c) c.onclick = function () { XS = {cat: '', br: '', mo: '', q: '', f: 0}; Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = ''; }); xRender(); };
  box.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var b = t.closest('.plx-pick'); if (b) { XS.cat = b.getAttribute('data-cat') || ''; var el = D.getElementById('plx-cat'); if (el) el.value = XS.cat; xRender(); return; }
    var g = t.closest('.plx-go'); if (g) { XS.q = g.getAttribute('data-q') || ''; var qi = D.getElementById('plx-q'); if (qi) qi.value = XS.q; xRender(); }
  });
  xRender();
}
function html() {
  var J = DATA, R = J.revenue, C = J.costs;
  var asAt = day(J.asAt), d = asAt.replace(/ \d{4}$/, '');   /* 31 Oct 2026 · 31 Oct */
  var head = '<div class="pl1267-headrow"><p class="fin745-eyebrow">THE P&amp;L · JOB POSITION · AUD EX GST · AS AT ' + e(asAt.toUpperCase()) + '</p>'
    + '<button type="button" class="btn ghost sm" id="pl1267-fp-print" title="The whole P&amp;L, every fold open; the finder stays on the screen">Print full P&amp;L</button></div>'
    + '<h2 id="plf1272Title" class="plf1272-h">The P&amp;L, job position at ' + e(asAt) + '<small>pack ' + e(J.pack) + ' · from ' + e(J.source) + '</small></h2>';
  var tiles = '<div class="pl1267-tiles plf1272-tiles">'
    + tile('Charged to the V8s', f2(R.total), n((J.invoices || []).length, 'invoice', 'invoices') + ' ' + f2(R.invoices) + ' · November forecast ' + f2(R.novForecast) + ', not invoiced yet')
    + tile('What it costs us', f2(C.total), 'Sep ' + f2(C.sep) + ' · Oct ' + f2(C.oct) + ' · Nov ' + f2(C.nov) + ' (forecast) · some estimates until invoiced; Coates wages not yet costed')
    + tile('Difference so far', f2(J.difference), 'revenue less costs, job end · not a margin yet', J.difference < 0 ? 'pl1267-neg' : '')
    + tile('Accruals through ' + d, f2(J.accrue), 'the journals prepared for Finance · what is in them is below')
    + '</div>' + xBox();
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
  var sup = '<p class="fin745-eyebrow plf1272-sub">COSTS BY SUPPLIER AND MONTH (NOVEMBER’S LABOUR IN OCTOBER) · ACCRUALS THROUGH ' + e(d.toUpperCase()) + '</p><div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-sup"><thead><tr><th>Supplier</th>'
    + '<th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Job end</th><th class="num">Accruals</th></tr></thead><tbody>';
  J.suppliers.forEach(function (s) {
    sup += '<tr><td>' + e(s.name) + '</td><td class="num">' + c2(s.sep) + '</td><td class="num">' + c2(s.oct) + '</td><td class="num">' + c2(s.nov) + '</td><td class="num">' + c2(s.total) + '</td><td class="num">' + c2(s.accrue) + '</td></tr>';
  });
  sup += '<tr class="pl1267-grand"><td>Total costs</td><td class="num">' + c2(C.sep) + '</td><td class="num">' + c2(C.oct) + '</td><td class="num">' + c2(C.nov) + '</td><td class="num">' + c2(C.total) + '</td><td class="num">' + c2(J.accrue) + '</td></tr></tbody></table></div>';
  /* what is in the accruals beyond the month: the accrued lines that also carry September work (v12.76) */
  var cu = J.lines.filter(function (l) { return l.accrue > 0.004 && l.sep > 0.004; });
  var cuAmt = cu.reduce(function (a, l) { return a + l.sep; }, 0), cuWho = cu.map(function (l) { return l.supplier; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var note = '<p class="plf1272-note">Revenue is the invoices, booked in October, the invoice month, and the November forecast, a pick-up charge applied but not invoiced yet; the two are shown apart, above and in “Revenue by invoice”. '
    + 'Costs are by month of work at job end, except November’s labour (to 13 Nov: the Coates wages hours, the salary allowance and Job Connect), which is in October with October’s; the rest of November is forecast. Some costs are estimates until invoiced (each line says so), and Coates’ own wages are hours only, not yet costed, so the difference so far is not a margin yet. '
    + 'Accruals through ' + e(d) + ' are the journals prepared for Finance, not a record of what is posted: work to ' + e(d) + ' with no invoice yet' + (cu.length ? ', including September’s part of ' + e(cuWho.join(' and ')) + ' (' + f2(cuAmt) + ') as a catch-up' : '') + '. Carrier loads to ' + e(d) + ' and the consumables and forklift POs are not in them: Finance to confirm (see the open items). '
    + 'Each line below names its purchase order, the hire contract it is charged on, and its invoice or receipt; the folds below tie the invoices, the hire contracts and every purchase order to these totals.</p>';
  var lines = '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plf1272-lines"><thead><tr><th>Supplier · what</th><th class="num">Sep</th><th class="num">Oct</th><th class="num">Nov</th><th class="num">Accruals</th><th>Status</th></tr></thead><tbody>';
  J.lines.forEach(function (l) {
    lines += '<tr><td><b>' + e(l.supplier) + '</b> · ' + e(l.branch) + (l.account ? ' · ' + e(l.account) : '') + '<small>' + e(l.what) + '</small>'
      + ((l.po || l.invoice) ? '<small>' + (l.po ? e(poText(l.po)) : '') + (l.po && l.invoice ? ' · ' : '') + (l.invoice ? e(l.invoice) : '') + '</small>' : '')
      + (l.contract ? '<small class="plf1275-hc">Hire contract: ' + e(l.contract) + '</small>' : '') + (l.category ? '<small class="plx-cat">' + e(l.category) + '</small>' : '')
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
    po += '<tr class="pl1267-grand"><td>The job cost<small>with a PO ' + f2(PT.withPO) + ' · no PO ' + f2(PT.noPO) + '</small></td><td></td><td></td><td class="num">' + c2(PT.total) + '</td></tr></tbody></table></div>';
  }
  var LJ = J.labourJournal, lj = '';
  if (LJ) {   /* v12.77: where everyone's labour is journaled to: each person, home branch, the branch of the work, by month */
    var ljh = {Sep: 0, Oct: 0}, ljl = 0, ljb = {};
    lj = '<p class="plf1272-note">Home branch from each person’s row on the record; the hours go to the branch of the work by the job’s rules (people’s costs on KINP; the water barriers on STPS; the generators, 1.5 h in and 1.5 h out, and the event weekend’s mechanic and electrician on NVAC). November’s hours, to 13 Nov, are counted in October. Coates wages and salary are hours only; labour hire $ is the running sheet’s (the costs carry Job Connect’s invoices where received).</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-ljall"><thead><tr><th>Person · type</th><th>Home branch</th><th>Journal to</th><th class="num">Sep h</th><th class="num">Oct h (with 1–13 Nov)</th><th class="num">Total h</th><th class="num">Labour hire $</th></tr></thead><tbody>';
    LJ.forEach(function (x) { ljh.Sep += x.sep; ljh.Oct += x.oct; ljl += Math.round(x.labourHire * 100); ljb[x.branch] = (ljb[x.branch] || 0) + x.sep + x.oct;
      lj += '<tr data-who="' + e(x.who) + '"><td><b>' + e(x.who) + '</b><small>' + e(x.type) + '</small></td><td>' + e(x.home) + '</td><td>' + e(x.branch) + (x.journal === 'stays' ? '<small>stays</small>' : '<small>journal ' + e(x.journal) + '</small>') + (x.contract ? '<small>' + e(x.contract) + '</small>' : '') + '</td><td class="num">' + hrs(x.sep) + '</td><td class="num">' + hrs(x.oct) + '</td><td class="num">' + hrs(x.sep + x.oct) + '</td><td class="num">' + cents(Math.round(x.labourHire * 100)) + '</td></tr>'; });
    lj += BRS.filter(function (b) { return ljb[b]; }).map(function (b) { return '<tr class="pl1267-tot" data-b="' + b + '"><td>Hours on ' + e(BRN[b]) + ' (the branch of the work)</td><td></td><td></td><td></td><td></td><td class="num">' + hrs(ljb[b]) + '</td><td></td></tr>'; }).join('')
      + '<tr class="pl1267-grand"><td>All hours, ' + n(LJ.length, 'row', 'rows') + '</td><td></td><td></td><td class="num">' + hrs(ljh.Sep) + '</td><td class="num">' + hrs(ljh.Oct) + '</td><td class="num">' + hrs(ljh.Sep + ljh.Oct) + '</td><td class="num">' + cents(ljl) + '</td></tr></tbody></table></div>';
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
  var op = '<ol class="plf1272-open">' + J.open.map(function (o) { return '<li>' + e(o) + '</li>'; }).join('') + '</ol>';
  return '<section id="pl1267-fp" class="card pl1267 plf1272 nosfold" aria-labelledby="plf1272Title">' + head + tiles + br + lc + sup + note
    + folded('pl1267-fp-lines', 'Every cost line', n(J.lines.length, 'line', 'lines') + ', with its purchase order, invoice or receipt, and basis', lines)
    + folded('pl1267-fp-branch', 'Costs by branch, line by line', 'what makes up each branch’s costs', bl)
    + (rv ? folded('pl1267-fp-revenue', 'Revenue by invoice', n(J.invoices.length, 'invoice', 'invoices') + ', each with its hire contract and the V8s’ PO, and the November forecast', rv) : '')
    + (ct ? folded('pl1267-fp-contracts', 'By hire contract', 'what we charged on each of the ' + n(J.contracts.length, 'contract', 'contracts') + ', and the costs and POs against it', ct) : '')
    + (po ? folded('pl1267-fp-pos', 'Every purchase order in the costs', n(PT.count, 'purchase order', 'purchase orders') + ' and the costs with no PO, adding to the job cost', po) : '')
    + (LC ? folded('pl1267-fp-labour', 'Every labour line on the invoices', n(LC.lines.length, 'line', 'lines') + ' coded LABOUR, with its invoice, contract line, hours and rate', lcl) : '')
    + (LJ ? folded('pl1267-fp-lj', 'Labour journals: where everyone’s hours go', n(LJ.length, 'row', 'rows') + ': each person’s home branch and the branch the hours are journaled to, by month', lj) : '')
    + (S7 ? folded('pl1267-fp-s17', 'Transport checked against Schedule 17', n(S7.changes.length, 'load', 'loads') + ' changed, +' + f2(S7.net) + ', each with its Schedule 17 row, docket and hire contract', s7) : '')
    + folded('pl1267-fp-journals', 'Journals prepared for Finance, through ' + d, n(J.journals.length, 'accrual', 'accruals') + (J.moves && J.moves.length ? ' and ' + n(J.moves.length, 'branch move', 'branch moves') : ''), jr)
    + folded('pl1267-fp-open', 'Open items', n(J.open.length, 'item', 'items') + ': paperwork to come and calls still to make', op)
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
function bind() {
  var b = D.getElementById('pl1267-fp-print');
  if (b && !b.__plf1272) { b.__plf1272 = true; b.onclick = function () { try { printCosts(); } catch (er) { try { console.warn('PLF1272: print', er); } catch (_) {} } }; }
  try { xBind(); } catch (er) { try { console.warn('PLF1277: find', er); } catch (_) {} }
}
return {data: DATA, sha: SHA, html: html, wrap: wrap, bind: bind, f2: f2};
})(window, document);
