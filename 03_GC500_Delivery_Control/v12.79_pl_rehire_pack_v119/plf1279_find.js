/* v12.79 - find in the P&L, its own file (spliced into plf1279_src.js at the find slot by patch_v1279.py): xIndex, xKind, xBox, xRender, xBind
   and their helpers. It uses the module's shared helpers (e, f2, c2, dmy, day, n, cents, hrs, norm, words, hit, tight, cpoKey, poText, DASH,
   BRN, BRS, MOS, MOL, XS, LT, PT, IX, XFOCUS, XPOINTER, XSELECTION, DATA) and changes none of them. */
function xIndex() {
  if (IX) return IX;
  var J = DATA; IX = {po: {}, con: {}, inv: {}, rem: {}, remCon: {}, cpo: {}, people: []};
  LT = J.lines.map(function (l) { return norm([l.supplier, l.branch, l.account, l.what, l.po, l.invoice, l.contract, l.status, l.basis, l.category].join(' ')); });
  PT = (J.labourJournal || []).map(function (x) { return norm([x.who, x.type, x.home, x.branch, x.contract, x.journal].join(' ')); });
  (J.purchaseOrders || []).forEach(function (x) { IX.po[tight(x.po)] = x; });
  (J.contracts || []).forEach(function (x) { IX.con[tight(x.contract)] = x; });
  (J.invoices || []).forEach(function (x) { IX.inv[tight(x.inv)] = x; var k = cpoKey(x.customerPO); (IX.cpo[k] = IX.cpo[k] || []).push(x); });
  (J.removedInvoices || []).forEach(function (x) { IX.rem[tight(x.inv)] = x; IX.remCon[tight(x.contract)] = x; });
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
  if (I.remCon[qc]) return {kind: 'removed', x: I.remCon[qc]};
  if (/^p/.test(qc) && I.cpo[qc.replace(/^p0*/, '')]) return {kind: 'cpo', key: qc, list: I.cpo[qc.replace(/^p0*/, '')]};
  /* a person: every word is a whole part of the name, or the start of one with at least three letters (so "an" stays a word search) */
  var ws = qn.split(' '), who = I.people.filter(function (w) { var nw = norm(w).split(' '); return ws.every(function (x) { return nw.some(function (y) { return y === x || (x.length >= 3 && y.indexOf(x) === 0); }); }); });
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
var KIND = {'Labour hire': 'Labour hire', 'Salary allowance': 'Salary'};   /* a cost category and the labour journal rows that belong to it */
function kpi(label, cents_, small, neg) { return '<div class="plx-k' + (neg ? ' pl1267-neg' : '') + '"><span>' + e(label) + '</span><b>' + (cents_ === null ? DASH : f2(cents_ / 100)) + '</b><small>' + e(small) + '</small></div>'; }
function invRow(x, amt) { return '<tr><td><b>' + e(x.inv) + '</b><small>' + dmy(x.date) + '</small></td><td>' + e(x.contract) + ' · ' + e(x.branch) + '<small>our POs against it: ' + e(/^no PO/.test(x.pos) ? 'none on the record' : x.pos) + '</small></td><td>' + e(x.customerPO) + '</td><td class="num">' + cents(amt) + '</td></tr>'; }
var INV_HEAD = '<thead><tr><th>Invoice · date</th><th>Hire contract · branch</th><th>V8s PO</th><th class="num">AUD ex GST</th></tr></thead>';
function xRender() {
  var sumEl = D.getElementById('plx-sum'), outEl = D.getElementById('plx-out');
  if (!sumEl || !outEl) return;
  xIndex();
  var J = DATA, K = xKind(XS.q), s = {cat: XS.cat, br: XS.br, mo: XS.mo}, note = '', out = '';
  if (K.kind === 'branch') { note = '“' + XS.q.trim() + '” is a branch: showing ' + BRN[K.br] + ', as the Branch choice does' + (s.br && s.br !== K.br ? ' (the Branch choice, ' + s.br + ', is set aside)' : '') + '.'; s.br = K.br; K = {kind: ''}; }
  if (K.kind === 'category') { note = '“' + XS.q.trim() + '” is a category: showing ' + K.cat + ', as the Category choice does' + (s.cat && s.cat !== K.cat ? ' (the Category choice, ' + s.cat + ', is set aside)' : '') + '.'; s.cat = K.cat; K = {kind: ''}; }
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
        + hm.map(function (m) { return '<td class="num">' + hrs(m === 'Sep' ? x.sep : x.oct) + '</td>'; }).join('') + (s.mo ? '<td class="num"><b>' + hrs(s.mo === 'Sep' ? x.paidSep : x.paidOct) + '</b></td>' : '<td class="num"><b>' + hrs(x.sep + x.oct) + '</b></td><td class="num"><b>' + hrs(x.paidSep + x.paidOct) + '</b><small>' + (x.kind === 'Salary' ? 'all normal' : hrs(x.normal) + ' · ' + hrs(x.x15) + ' · ' + hrs(x.x2)) + '</small></td><td class="num">' + cents(Math.round(x.labourHire * 100)) + '</td>') + '</tr>'; }).join('');
    return t + '<p class="plf1272-note">Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). Worked and paid hours differ: the journals use the paid hours. ' + (s.mo ? '' : 'Labour hire $ here is the running sheet’s; the costs carry Job Connect’s invoices and POs where there are any (the bridge, week by week, is in the Labour journals fold). ') + (s.mo === 'Oct' ? 'October’s hours include November’s, to 13 Nov.' : '') + '</p>'
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-lj"><thead><tr><th>Person · type</th><th>Home branch</th><th>Journal</th>' + hm.map(function (m) { return '<th class="num">' + e(m === 'Oct' ? 'Oct worked h (with 1–13 Nov)' : m + ' worked h') + '</th>'; }).join('')
      + (s.mo ? '<th class="num">Paid h (journal basis)</th>' : '<th class="num">Worked h</th><th class="num">Paid h (journal basis)<small>normal · ×1.5 · ×2</small></th><th class="num">Labour hire $ (running sheet)</th>') + '</tr></thead><tbody>' + jr
      + '<tr class="pl1267-grand"><td>' + n(lj.length, 'row', 'rows') + '</td><td></td><td></td>' + hm.map(function (m) { return '<td class="num">' + hrs(hs[m]) + '</td>'; }).join('') + (s.mo ? '<td class="num">' + hrs(lj.reduce(function (a, x) { return a + Math.round((s.mo === 'Sep' ? x.paidSep : x.paidOct) * 100); }, 0) / 100) + '</td>' : '<td class="num">' + hrs(hs.Sep + hs.Oct) + '</td><td class="num">' + hrs(lj.reduce(function (a, x) { return a + Math.round((x.paidSep + x.paidOct) * 100); }, 0) / 100) + '</td><td class="num">' + cents(lh) + '</td>') + '</tr></tbody></table></div>';
  };
  var sum = '', scope = (s.br || s.cat || s.mo) ? '<p class="plf1272-note plx-scope">The table below is the whole ' + '%s' + ', for the job: ' + [s.br ? 'branch ' + s.br : '', s.cat ? 'category ' + s.cat : '', s.mo ? MOL[s.mo] : ''].filter(Boolean).join(', ') + ' is applied in the figures above where the P&amp;L splits it, and not otherwise.</p>' : '';
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
      var grp = J.categoryGroups || [];   /* v12.79: the rehire groups, each with what is inside it, and their subtotal (Rehire, all) from the same parts */
      var rows = (J.categories || []).map(function (c) { var by = {}, t = 0; facts.forEach(function (f) { if (J.lines[f[0]].category === c.name) { by[f[2]] = (by[f[2]] || 0) + f[3]; t += f[3]; } });
        var r = t ? '<tr><td><button type="button" class="plx-pick" data-cat="' + e(c.name) + '">' + e(c.name) + '</button>' + (c.note ? '<small>' + e(c.note) + '</small>' : '') + '</td>' + cells(by) + '</tr>' : '';
        grp.forEach(function (g) { if (g.members[g.members.length - 1] !== c.name) return; var gb = {}, gt = 0;
          facts.forEach(function (f) { if (g.members.indexOf(J.lines[f[0]].category) >= 0) { gb[f[2]] = (gb[f[2]] || 0) + f[3]; gt += f[3]; } });
          if (gt) r += '<tr class="pl1267-tot plx-grp"><td>' + e(g.name) + '</td>' + cells(gb) + '</tr>'; });
        return r; }).join('');
      out += '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-cats">' + head('Category' + (s.br ? ' · ' + e(s.br) : '')) + '<tbody>' + rows
        + '<tr class="pl1267-grand"><td>' + (s.br ? 'Costs, ' + e(BRN[s.br]) : 'Costs, the job') + '</td>' + cells(tot) + '</tr></tbody></table></div>';
    } else out += linesTable(facts);
    if (s.br || KIND[s.cat]) out += journals(function () { return true; });
  } else if (K.kind === 'po') {   /* a purchase order: its own amount, from the purchase orders in the costs */
    var x = K.x, li = J.lines.map(function (l, i) { return (String(l.po).match(/\b\d{7}\b/g) || []).indexOf(x.po) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
    var pf = J.facts.filter(function (f) { return li.indexOf(f[0]) >= 0; }), pb = [], pmv = pf.some(function (f) { return f[4]; });
    pf.forEach(function (f) { if (f[3] && pb.indexOf(f[1]) < 0) pb.push(f[1]); });
    var brOff = !s.br ? '' : pb.indexOf(s.br) < 0 ? 'this PO’s cost is on ' + pb.join(' and ') : (pb.length > 1 || pmv) ? 'not split by branch: its line is on ' + pb.join(' and ') + (pmv ? ', with the branch move' : '') + ': choose All branches' : '';
    var cats = li.map(function (i) { return J.lines[i].category; }), off = brOff || ((s.cat && cats.indexOf(s.cat) < 0) ? 'this PO is ' + (cats[0] || 'in another category') : '');
    var amt = Math.round(x.amount * 100);
    sum = kpi('Revenue', null, 'a PO is a cost') + kpi('Costs', off || s.mo ? null : amt, off || jobOnly('a PO’s amount') || 'PO ' + x.po + ', as in Every purchase order in the costs') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">PURCHASE ORDER ' + e(x.po) + '</p>' + scope.replace('%s', 'PO') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-po"><thead><tr><th>PO · supplier</th><th>Hire contract</th><th>Branch</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + '<tr><td><b>' + e(x.po) + ' · ' + e(x.supplier) + '</b><small>' + e(x.what) + '</small><small>' + e(x.status) + '</small></td><td>' + e(x.contract) + '</td><td>' + e(x.branch) + '</td><td class="num"><b>' + f2(x.amount) + '</b></td></tr></tbody></table></div>'
      + (li.length ? '<p class="plf1272-note">On the cost line' + (li.length > 1 ? 's' : '') + ' below. A line can carry more than one PO, so a line’s total is not the PO’s amount.</p>' + linesTable(lineFacts(function (i) { return li.indexOf(i) >= 0; })) : '');
  } else if (K.kind === 'contract') {   /* a hire contract: what we charged on it and the costs tied to it, as in By hire contract */
    var c = K.x, inv = (J.invoices || []).filter(function (x) { return x.contract === c.contract; }), fcl = (J.novForecastLines || []).filter(function (x) { return x.contract === c.contract; });
    var offc = s.br && c.branch !== s.br ? 'this hire contract’s invoices are on ' + c.branch : '';
    var costOff = s.br ? 'a hire contract’s costs are not split by branch (some sit on other branches): choose All branches' : s.cat ? 'a hire contract’s costs are not split by category' : '';
    var fcTxt = fcl.length ? ' · plus the November forecast ' + fcl.map(function (x) { return f2(x.amount); }).join(', ') + ', not invoiced yet' : '';
    sum = kpi('Revenue', offc || s.mo || s.cat ? null : Math.round(c.revenue * 100), offc || jobOnly('a hire contract’s charge') || (s.cat ? 'not split by cost category' : n(inv.length, 'invoice', 'invoices') + ' on ' + c.contract + fcTxt))
      + kpi('Costs', costOff || s.mo ? null : Math.round(c.costTotal * 100), costOff || jobOnly('a hire contract’s costs') || n(c.costs.length, 'cost', 'costs') + ' tied to it, as in By hire contract')
      + kpi('Difference so far', null, 'not for one contract: some costs are tied to none');
    out += '<p class="fin745-eyebrow plf1272-sub">HIRE CONTRACT ' + e(c.contract) + ' · ' + e(c.branch) + ' · THE V8S’ PO ' + e(c.customerPO) + '</p>' + scope.replace('%s', 'hire contract')
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>' + inv.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('')
      + '<tr class="pl1267-grand"><td>Charged on ' + e(c.contract) + '</td><td></td><td></td><td class="num">' + f2(c.revenue) + '</td></tr></tbody></table></div>'
      + fcl.map(function (x) { return '<p class="plf1272-note">Not in the charge above: the November forecast on ' + e(x.contract) + ' ' + e(x.line) + ' (' + e(x.branch) + '), ' + f2(x.amount) + ', ' + e(x.what) + '. It is in the revenue as the November forecast.</p>'; }).join('')
      + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-con"><thead><tr><th>Cost tied to ' + e(c.contract) + '</th><th>PO</th><th class="num">AUD ex GST</th></tr></thead><tbody>'
      + (c.costs.length ? c.costs.map(function (x) { return '<tr><td><b>' + e(x.what) + '</b><small>' + e(x.status) + '</small></td><td>' + e(x.po) + '</td><td class="num">' + c2(x.amount) + '</td></tr>'; }).join('') : '<tr><td>no supplier PO or cost on the record against it</td><td></td><td class="num">' + c2(0) + '</td></tr>')
      + '<tr class="pl1267-grand"><td>Costs against ' + e(c.contract) + '</td><td></td><td class="num">' + c2(c.costTotal) + '</td></tr></tbody></table></div>';
  } else if (K.kind === 'invoice' || K.kind === 'cpo') {   /* an invoice, or every invoice on a V8s PO, at its amount */
    var L = K.kind === 'invoice' ? [K.x] : K.list, offi = s.br ? L.filter(function (x) { return x.branch === s.br; }) : L, ra = 0;
    offi.forEach(function (x) { ra += Math.round(x.ex * 100); });
    var moOff = s.mo && s.mo !== 'Oct', inChoice = moOff ? 0 : ra, keyed = L.map(function (x) { return String(x.customerPO).split(' (')[0]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var why = s.cat ? 'not split by cost category' : !offi.length ? 'none on ' + s.br + ': ' + L.map(function (x) { return x.inv + ' is on ' + x.branch; }).join(', ') : moOff ? 'none in ' + MOL[s.mo].split(' ')[0] + ': ' + (L.length === 1 ? 'the invoice is' : 'the invoices are') + ' dated October'
      : (K.kind === 'invoice' ? 'invoice ' + L[0].inv + ' on ' + L[0].contract : n(offi.length, 'invoice', 'invoices') + (s.br ? ' on ' + s.br : '') + ' on the V8s’ PO ' + keyed.join(', ') + (keyed.join('').replace(/\s/g, '').toUpperCase() !== XS.q.replace(/\s/g, '').toUpperCase() ? ' (as keyed on the invoice)' : ''));
    var chosen = s.br || moOff, choiceWord = [s.br, moOff ? MOL[s.mo].split(' ')[0] : ''].filter(Boolean).join(', ');
    sum = kpi('Revenue', s.cat ? null : inChoice, why) + kpi('Costs', null, 'an invoice is revenue: its hire contract carries the costs tied to it') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="fin745-eyebrow plf1272-sub">' + (K.kind === 'invoice' ? 'INVOICE ' + e(L[0].inv) : 'INVOICES ON THE V8S’ PO ' + e(keyed.join(', ').toUpperCase())) + '</p>' + scope.replace('%s', K.kind === 'invoice' ? 'invoice' : 'set of invoices') + '<div class="tblwrap"><table class="pl1267-tbl plf1272-tbl plx-inv">' + INV_HEAD + '<tbody>'
      + L.map(function (x) { return invRow(x, Math.round(x.ex * 100)); }).join('') + '<tr class="pl1267-grand"><td>' + (chosen ? 'All ' + n(L.length, 'invoice', 'invoices') + ', every branch and month' : n(L.length, 'invoice', 'invoices')) + '</td><td></td><td></td><td class="num">' + cents(L.reduce(function (a, x) { return a + Math.round(x.ex * 100); }, 0)) + '</td></tr>'
      + (chosen && !s.cat ? '<tr class="pl1267-tot"><td>In the choice (' + e(choiceWord) + ')</td><td></td><td></td><td class="num">' + f2(inChoice / 100) + '</td></tr>' : '') + '</tbody></table></div>'
      + '<p class="plf1272-note">' + L.map(function (x) { return '<button type="button" class="plx-go" data-q="' + e(x.contract) + '">Hire contract ' + e(x.contract) + '</button>'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' ') + '</p>';
  } else if (K.kind === 'removed') {
    sum = kpi('Revenue', null, 'not in the revenue') + kpi('Costs', null, 'an invoice is revenue') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += '<p class="plf1272-note">Invoice ' + e(K.x.inv) + ' on ' + e(K.x.contract) + ' (' + f2(K.x.ex) + ') is not in the revenue: ' + e(K.x.why) + '.</p>';
  } else if (K.kind === 'person') {   /* a person: where their hours go; costs are carried by week and supplier, not by person */
    var firsts = K.who.map(function (w) { return new RegExp('\\b' + norm(w).split(' ')[0] + '\\b'); });
    var pl = lineFacts(function (i) { return (!s.cat || J.lines[i].category === s.cat) && firsts.some(function (r) { return r.test(LT[i]); }); });
    sum = kpi('Revenue', null, 'charged by line, not by person') + kpi('Costs', null, 'not totalled for a person: some lines below are theirs alone (accommodation, meals), others are shared (a week of labour hire); labour hire $ in the journals are the running sheet’s') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += journals(function (x) { return K.who.indexOf(x.who) >= 0; }, 'LABOUR JOURNALS · ' + e(K.who.join(', ').toUpperCase())) + linesTable(pl, 'COST LINES THAT MENTION ' + e(K.who.map(function (w) { return w.split(' ')[0]; }).join(', ').toUpperCase()) + ' (WHOLE LINES; SOME ARE SHARED)');
    if (!out) out = '<p class="plx-none">No hours or cost lines for ' + e(K.who.join(', ')) + ' in that choice.</p>';
  } else {   /* any other words: the cost lines that mention them, whole lines, at their parts in the choice */
    var tf = lineFacts(function (i) { return (!s.cat || J.lines[i].category === s.cat) && hit(LT[i], K.ws); }), tc = 0, tl = {}; tf.forEach(function (f) { tc += f[3]; tl[f[0]] = 1; });
    sum = kpi('Revenue', null, 'search an invoice, hire contract or V8s PO for revenue') + kpi('Matching cost lines', tc, n(Object.keys(tl).length, 'cost line', 'cost lines') + (Object.keys(tl).length === 1 ? ' that mentions “' : ' that mention “') + XS.q.trim() + '”, whole lines: a line can be shared with other items, so this is not one item’s cost') + kpi('Difference so far', null, 'for the job or a branch, with no search');
    out += linesTable(tf, 'COST LINES THAT MENTION “' + e(XS.q.trim().toUpperCase()) + '”');
    out += journals(function (x, i) { return hit(PT[i], K.ws); });
  }
  sumEl.innerHTML = (note ? '<p class="plx-note">' + e(note) + '</p>' : '') + sum;
  outEl.innerHTML = out || '<p class="plx-none">Nothing in the P&amp;L matches that choice.</p>';
}
function xBind() {
  var box = D.getElementById('plx'); if (!box || box.__plx) return; box.__plx = true;
  var ids = {cat: 'plx-cat', br: 'plx-br', mo: 'plx-mo', q: 'plx-q'};
  Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = XS[k]; });
  var read = function () { ['cat', 'br', 'mo'].forEach(function (k) { var el = D.getElementById(ids[k]); XS[k] = el ? el.value : ''; }); xRender(); };
  ['plx-cat', 'plx-br', 'plx-mo'].forEach(function (id) { var el = D.getElementById(id); if (el) el.onchange = read; });
  var q = D.getElementById('plx-q'), tq = 0;
  if (!XPOINTER) {   /* an intentional click away cancels a pending redraw restoration */
    D.addEventListener('pointerdown', function (ev) { if (ev.target !== D.getElementById('plx-q')) { XS.f = 0; XFOCUS++; } }, true);
    XPOINTER = true;
  }
  if (q) {   /* keep the query now; debounce only the figures, never typing or selection */
    var remember = function () { XSELECTION = {value: q.value, start: q.selectionStart, end: q.selectionEnd, direction: q.selectionDirection}; };
    var restore = function (field, selection) { try { field.focus({preventScroll: true}); if (selection && selection.value === field.value) field.setSelectionRange(selection.start, selection.end, selection.direction); } catch (er) {} };
    q.oninput = function () { XS.q = q.value; remember(); clearTimeout(tq); tq = setTimeout(xRender, 120); };
    q.onselect = q.onkeyup = q.onclick = remember;
    q.onfocus = function () { XS.f = 1; XFOCUS++; };
    q.onblur = function (ev) {
      var hadFocus = XS.f; remember(); var selection = XSELECTION, ticket = ++XFOCUS; XS.f = 0;
      if (!hadFocus || (ev && ev.relatedTarget)) return;
      /* The page blurs the still-connected old input before replacing it. Recheck after that synchronous redraw.
         Only a replaced field on the same active tab qualifies; another control or a deliberate click wins. */
      setTimeout(function () {
        var current = D.getElementById('plx-q'), pane = D.getElementById('pane-costs'), active = D.activeElement;
        if (ticket !== XFOCUS || q.isConnected || !current || current === q || !current.isConnected || !pane || !pane.classList.contains('on')) return;
        if (active && active !== D.body && active !== current) return;
        if (D.hasFocus && !D.hasFocus()) return;
        if (current.value !== selection.value || XS.q !== selection.value) return;
        restore(current, selection);
      }, 0);
    };
    if (XS.f) { var pane = D.getElementById('pane-costs'); if (pane && pane.classList.contains('on')) restore(q, XSELECTION); else XS.f = 0; }
  }
  var c = D.getElementById('plx-clear'); if (c) c.onclick = function () { XS = {cat: '', br: '', mo: '', q: '', f: 0}; Object.keys(ids).forEach(function (k) { var el = D.getElementById(ids[k]); if (el) el.value = ''; }); xRender(); };
  box.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    var b = t.closest('.plx-pick'); if (b) { XS.cat = b.getAttribute('data-cat') || ''; var el = D.getElementById('plx-cat'); if (el) el.value = XS.cat; xRender(); if (el) try { el.focus(); } catch (er) {} return; }
    var g = t.closest('.plx-go'); if (g) { XS.q = g.getAttribute('data-q') || ''; var qi = D.getElementById('plx-q'); if (qi) qi.value = XS.q; xRender(); if (qi) try { qi.focus(); } catch (er) {} }
  });
  xRender();
}
