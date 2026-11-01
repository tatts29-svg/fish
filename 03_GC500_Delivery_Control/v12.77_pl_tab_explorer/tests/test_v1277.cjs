// Author: Andrew Fisher. v12.77 (v12.76's checks, plus find in the P&L: every category, branch and month and every combination of them, to the cent against
// the pack's own figures, searches by PO, hire contract, invoice, supplier and person, the labour journals and the labour hire bridge) on the real Costs & P&L tab, reading the live record, writing nothing. The tab leads with the
// P&L; every figure on it is the pack's (GC500_PL_final.json) to the cent: the four tiles, the branch table, the suppliers, every
// cost line, each branch's lines, the journals and the open items; the data in the page is the reviewed file, byte for byte in
// value; the live model the tab carried before is folded under it, closed, with its own figures and Print still there; the Finance,
// Fencing and Workings folds follow; no console error, no write, and on a phone nothing runs off the side of the page.
//   PAGE=build/GC500_v12.77/GC500_Delivery_Control_hosted.html PLF_JSON=<pack dir>/GC500_PL_final.json [MOB=1] [SHOT=dir] node tests/test_v1277.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {open} = require('../../toolchain/harness/open_page');
const f2 = v => (typeof v !== 'number' || !isFinite(v)) ? '—' : (v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2).split('.').map((p, i) => i ? p : p.replace(/\B(?=(\d{3})+(?!\d))/g, ',')).join('.');
const c2 = v => (typeof v === 'number' && Math.abs(v) >= 0.005) ? f2(v) : '—';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dmy = s => { const q = String(s).split('/'); return q.length === 3 ? Number(q[0]) + ' ' + MON[Number(q[1]) - 1] + ' ' + q[2] : s; };
(async () => {
  const mobile = !!process.env.MOB, tag = mobile ? 'phone' : 'desktop', shot = process.env.SHOT;
  const raw = fs.readFileSync(process.env.PLF_JSON), J = JSON.parse(raw.toString('utf-8')), sha = crypto.createHash('sha256').update(raw).digest('hex');
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, hash: '#costs'}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267-fp') && document.getElementById('pl1267-live') && document.getElementById('pl1267-work'), null, {timeout: 60000});
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
      const fp = document.getElementById('pl1267-fp'), pane = document.getElementById('pane-costs'), live = document.getElementById('pl1267-live');
      const kids = [...pane.children].map(e => e.id || '');
      const rows = sel => [...fp.querySelectorAll(sel + ' tbody tr')].map(tr => ({cls: tr.className, b: tr.getAttribute('data-b'), cells: [...tr.children].map(td => txt(td))}));
      const firstCell = sel => [...fp.querySelectorAll(sel + ' tbody tr')].map(tr => tr.children[0] ? [...tr.children[0].childNodes].filter(n => n.nodeType === 1 && n.tagName === 'B' || n.nodeType === 3).map(n => n.textContent).join('').trim() : '');
      const box = fp.getBoundingClientRect();
      return {
        data: window.PLF1272 && PLF1272.data, sha: window.PLF1272 && PLF1272.sha, kids,
        eyebrow: txt(fp.querySelector('.fin745-eyebrow')), title: txt(fp.querySelector('#plf1272Title')),
        tiles: [...fp.querySelectorAll('.pl1267-tile')].map(t => ({l: txt(t.querySelector('.pl1267-tl')), v: txt(t.querySelector('.pl1267-tv')), s: txt(t.querySelector('.pl1267-ts')), top: Math.round(t.getBoundingClientRect().top), w: Math.round(t.getBoundingClientRect().width)})),
        branch: rows('table.plf1272-branch'), lc: rows('table.plf1272-lc'), lcl: rows('table.plf1272-lclines'), lcn: [...fp.querySelectorAll('ul.plf1272-lcnotes li')].map(txt), s17: rows('table.plf1272-s17'), s17n: [...fp.querySelectorAll('ul.plf1272-s17notes li')].map(txt), sup: rows('table.plf1272-sup'), lines: rows('table.plf1272-lines'), bl: rows('table.plf1272-bl'), jn: rows('table.plf1272-jn'), rev: rows('table.plf1275-rev'), con: rows('table.plf1275-con'), pot: rows('table.plf1275-po'), revNote: [...fp.querySelectorAll('#pl1267-fp-revenue p.plf1272-note')].map(txt),
        open: [...fp.querySelectorAll('ol.plf1272-open li')].map(txt),
        folds: [...fp.querySelectorAll('details.plf1272-more')].map(d => ({id: d.id, open: d.open, cls: d.className})),
        live: live ? {tag: live.tagName, open: live.open, cls: live.className, summary: txt(live.querySelector('summary')), hasFace: !!live.querySelector('#pl1267'), parts: ['pl1267-rev', 'pl1267-cost', 'pl1267-branch', 'pl1267-gaps'].map(id => !!live.querySelector('#' + id)),
          oldTiles: [...live.querySelectorAll('#pl1267 .pl1267-tile .pl1267-tv')].map(txt), oldPrint: !!live.querySelector('#pl1267-print')} : null,
        printBtn: (() => { const b = document.getElementById('pl1267-fp-print'); return b ? {bound: typeof b.onclick === 'function', inFace: fp.contains(b), w: b.getBoundingClientRect().width, text: b.textContent.trim()} : null; })(),
        box: {w: box.width, h: box.height, top: box.top}, doc: {sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth},
        ties: pane.getAttribute('data-pl1267'), footer: (document.body.innerText.match(/· v12\.\d+/g) || []).slice(-1)[0] || null,
        prose: [...fp.querySelectorAll('p, summary, h2, li, td, th')].map(txt).join(' ')
      };
    });
    // the data in the page is the reviewed pack data
    check(r.sha === sha, `${tag}: the page carries the reviewed pack data (${String(r.sha).slice(0, 12)} = ${sha.slice(0, 12)})`);
    check(JSON.stringify(r.data) === JSON.stringify(J), `${tag}: the data in the page equals GC500_PL_final.json, value for value`);
    // where it sits
    const ix = id => r.kids.indexOf(id);
    check(ix('pl1267-fp') >= 0 && ix('pl1267-fp') < ix('pl1267-live') && ix('pl1267-live') < ix('pl1267-finance') && ix('pl1267-finance') < ix('pl1267-fence') && ix('pl1267-fence') < ix('pl1267-work'),
      `${tag}: the final P&L leads the tab, then the live model, Finance, Fencing and Workings: ` + JSON.stringify(r.kids.filter(k => /^pl1267/.test(k))));
    check(r.box.h > 200 && r.box.w > 300, `${tag}: the final P&L is drawn (${Math.round(r.box.w)} × ${Math.round(r.box.h)})`);
    check(/^THE P&L · JOB POSITION · AUD EX GST · AS AT 31 OCT 2026/.test(r.eyebrow) && r.title.startsWith('The P&L, job position at 31 Oct 2026') && r.title.includes('pack ' + J.pack) && r.title.includes(J.source), `${tag}: heading names the dated job position, the pack and its sources: ` + r.eyebrow + ' | ' + r.title);
    // the tiles
    const T = [['Charged to the V8s', f2(J.revenue.total), `18 invoices ${f2(J.revenue.invoices)} · November forecast ${f2(J.revenue.novForecast)}, not invoiced yet`],
               ['What it costs us', f2(J.costs.total), `Sep ${f2(J.costs.sep)} · Oct ${f2(J.costs.oct)} · Nov ${f2(J.costs.nov)} (forecast) · some estimates until invoiced; Coates wages not yet costed`],
               ['Difference so far', f2(J.difference), 'revenue less costs, job end · not a margin yet'], ['Accruals through 31 Oct', f2(J.accrue), 'the journals prepared for Finance · what is in them is below']];
    check(r.tiles.length === 4 && T.every((t, i) => r.tiles[i].l.toUpperCase() === t[0].toUpperCase() && r.tiles[i].v === t[1] && r.tiles[i].s === t[2]), `${tag}: the four tiles, to the cent: ` + JSON.stringify(r.tiles));
    const tops = [...new Set(r.tiles.map(t => t.top))];
    check(mobile ? tops.length === 4 : tops.length === 1, `${tag}: the tiles ${mobile ? 'stack one under another' : 'sit in one row'} (rows at ${JSON.stringify(tops)}, widths ${JSON.stringify(r.tiles.map(t => t.w))})`);
    // by branch
    const B = J.branches.map(b => [b.b, c2(b.invoiced), c2(b.novForecast), c2(b.revenue), c2(b.costs), c2(b.difference)]).concat([['The job', c2(J.revenue.invoices), c2(J.revenue.novForecast), c2(J.revenue.total), c2(J.costs.total), c2(J.difference)]]);
    check(r.branch.length === B.length && B.every((w, i) => JSON.stringify(r.branch[i].cells) === JSON.stringify(w)), `${tag}: by branch, every figure to the cent: ` + JSON.stringify(r.branch.map(x => x.cells)));
    // labour we charged the V8s, by branch (v12.73)
    const L = J.labourCharged, nl = L.branches.reduce((a, b) => a + b.lines, 0);
    const LB = L.branches.map(b => [b.b, c2(b.charged), String(b.lines), c2(b.installLabourHire), c2(b.left)]).concat([['The job', c2(L.total), String(nl), c2(L.installTotal), c2(L.leftTotal)]]);
    check(r.lc.length === LB.length && LB.every((w, i) => JSON.stringify(r.lc[i].cells) === JSON.stringify(w)), `${tag}: labour charged by branch, already in Installs and left, to the cent: ` + JSON.stringify(r.lc.map(x => x.cells)));
    check(r.lcl.length === L.lines.length + 1 && L.lines.every((x, i) => { const c = r.lcl[i].cells; return c[0].startsWith(x.b + ' · ' + x.inv + ' · ' + x.contract + ' L' + x.line) && c[0].includes(x.what) && c[2] === c2(x.rate) && c[3] === c2(x.amount); }) && r.lcl[L.lines.length].cells[3] === c2(L.total),
      `${tag}: every labour line, its invoice, contract line, rate and amount, and the total (${L.lines.length})`);
    check(JSON.stringify(r.lcn) === JSON.stringify(L.notes), `${tag}: the labour notes, word for word (${r.lcn.length})`);
    // transport checked against Schedule 17 (v12.74)
    const S7 = J.schedule17, sg = v => (v > 0.004 ? '+' : '') + c2(v);
    check(r.s17.length === S7.changes.length + 1 && S7.changes.every((x, i) => { const c = r.s17[i].cells; return c[0].startsWith(x.ref + ' · ' + x.date) && c[0].includes(x.what) && c[0].includes(x.contractDocket + ' · ' + x.row) && c[1] === c2(x.figure) && c[2] === x.before && c[3] === sg(x.change) && c[4] === x.branch; }),
      `${tag}: every Schedule 17 change, its row, docket, figure, what it replaced, the change and branch, to the cent: ` + JSON.stringify(r.s17.slice(0, 2).map(x => x.cells)));
    const sgt = r.s17[S7.changes.length].cells;
    check(sgt[0].startsWith(S7.changes.length + ' loads') && sgt[0].includes('forecasts replaced ' + f2(S7.forecastsReplaced)) && sgt[1] === c2(S7.added) && sgt[3] === '+' + c2(S7.net), `${tag}: Schedule 17's total: figures, forecasts replaced and the net change: ` + JSON.stringify(sgt));
    check(JSON.stringify(r.s17n) === JSON.stringify(S7.notes), `${tag}: the Schedule 17 notes, word for word (${r.s17n.length})`);
    // the suppliers
    const S = J.suppliers.map(x => [x.name, c2(x.sep), c2(x.oct), c2(x.nov), c2(x.total), c2(x.accrue)]).concat([['Total costs', c2(J.costs.sep), c2(J.costs.oct), c2(J.costs.nov), c2(J.costs.total), c2(J.accrue)]]);
    check(r.sup.length === S.length && S.every((w, i) => JSON.stringify(r.sup[i].cells) === JSON.stringify(w)), `${tag}: costs by supplier and month, to the cent (${J.suppliers.length} suppliers and the total)`);
    // every cost line
    check(r.lines.length === J.lines.length + 1, `${tag}: every cost line is on the tab (${r.lines.length - 1} of ${J.lines.length})`);
    const lineBad = J.lines.map((l, i) => { const c = r.lines[i].cells; const ok = c[0].startsWith(l.supplier + ' · ' + l.branch) && c[0].includes(l.what) && (!l.po || c[0].includes(/^none/i.test(String(l.po).trim()) ? 'No PO' : 'PO ' + l.po)) && c[0].includes('Hire contract: ' + l.contract) && c[1] === c2(l.sep) && c[2] === c2(l.oct) && c[3] === c2(l.nov) && c[4] === c2(l.accrue) && c[5].startsWith(l.status); return ok ? null : i; }).filter(x => x !== null);
    check(!lineBad.length, `${tag}: each line's supplier, what, PO, hire contract, months, accrual and status, to the cent: bad rows ` + JSON.stringify(lineBad));
    check(J.lines.every(l => String(l.po).trim() && String(l.contract).trim()), `${tag}: every cost line names its PO (or that there is none) and the hire contract it is charged on`);
    const lt = r.lines[r.lines.length - 1].cells;
    check(lt[0] === 'Total costs' && lt[1] === c2(J.costs.sep) && lt[2] === c2(J.costs.oct) && lt[3] === c2(J.costs.nov) && lt[4] === c2(J.accrue), `${tag}: the lines' total row = the costs by month and the accruals`);
    // each branch's lines
    const BL = []; J.branches.forEach(b => { BL.push([b.b]); J.branchLines[b.b].forEach(x => BL.push([x[0], c2(x[1])])); BL.push(['Total ' + b.b, c2(b.costs)]); }); BL.push(['The job', c2(J.costs.total)]);
    check(r.bl.length === BL.length && BL.every((w, i) => JSON.stringify(r.bl[i].cells) === JSON.stringify(w)), `${tag}: costs by branch, line by line, to the cent`);
    check(Object.values(J.branchLines).every(L => L.every(x => /\bPOs?\b|no PO/.test(x[0]))), `${tag}: every branch line names its POs, or says there is none`);
    // the journals and moves
    const jAmt = r.jn.filter(x => x.cells.length === 4).map(x => x.cells[3]);
    const JW = J.journals.map(j => c2(j.amount)).concat([c2(J.accrue)]).concat(J.moves.map(j => c2(j.amount)));
    check(JSON.stringify(jAmt) === JSON.stringify(JW), `${tag}: the journals, the accruals total and the branch moves, to the cent: ` + JSON.stringify(jAmt));
    check(r.jn.filter(x => x.cells.length === 4).slice(0, J.journals.length).every((x, i) => x.cells[0].startsWith(J.journals[i].journal) && x.cells[1] === J.journals[i].po), `${tag}: each journal names its line and PO`);
    // v12.75: the 18 invoices, each with its hire contract, the V8s' PO and our POs against it; the forecast line; the total charged
    const RV = J.invoices.map(x => [x.inv + ' · ' + dmy(x.date), x.contract + ' · ' + x.branch + 'our POs against it: ' + (/^no PO/.test(x.pos) ? 'none on the record' : x.pos), x.customerPO, c2(x.ex)])
      .concat([[J.invoices.length + ' invoices', '', '', c2(J.revenue.invoices)]])
      .concat(J.novForecastLines.map(x => ['November forecast' + x.what, x.contract + ' ' + x.line + ' · ' + x.branch, J.contractPOs[x.contract] || '', c2(x.amount)]))
      .concat([['Charged to the V8s', '', '', c2(J.revenue.total)]]);
    const rvBad = RV.map((w, i) => r.rev[i] && JSON.stringify(r.rev[i].cells.map(c => c.replace(/\s+/g, ''))) === JSON.stringify(w.map(c => c.replace(/\s+/g, ''))) ? null : i).filter(x => x !== null);
    check(r.rev.length === RV.length && !rvBad.length, `${tag}: revenue by invoice: each invoice, its date, hire contract, branch, the V8s' PO, our POs and amount; the forecast; the total: bad rows ` + JSON.stringify(rvBad.slice(0, 3).map(i => [r.rev[i] && r.rev[i].cells, RV[i]])));
    check(r.rev.filter(x => /^\d{8}/.test(x.cells[0])).length === 18 && JSON.stringify(r.revNote) === JSON.stringify(J.removedInvoices.map(x => `Not in the revenue: invoice ${x.inv} on ${x.contract} (${f2(x.ex)}), ${x.why}.`)), `${tag}: 18 invoices, and the invoice not in the revenue named with why: ` + JSON.stringify(r.revNote));
    // each hire contract: what we charged, the costs and POs against it, its total; then the costs not tied; then the job
    const CT = []; J.contracts.forEach(c => {
      CT.push([c.contract + ' · ' + c.branch + 'the V8s’ PO ' + c.customerPO + ' · invoice ' + c.invoice + (c.onIt && c.onIt !== '—' ? ' · ' + c.onIt : '') + (c.note ? ' · ' + c.note : ''), '', c2(c.revenue), '']);
      if (!c.costs.length) CT.push(['no supplier PO or cost on the record against it', '', '', c2(0)]);
      c.costs.forEach(x => CT.push([x.what + x.status, x.po, '', c2(x.amount)]));
      CT.push(['Costs against ' + c.contract, '', '', c2(c.costTotal)]);
    });
    CT.push(['Not tied to one contract']); J.notTied.forEach(x => CT.push([x.what + x.status, x.po, '', c2(x.amount)])); CT.push(['Not tied to one contract', '', '', c2(J.matchTotals.notTied)]);
    CT.push(['The job' + `charged on the ${J.contracts.length} contracts (the November forecast ${f2(J.revenue.novForecast)} is not invoiced yet) · costs tied to a contract ${f2(J.matchTotals.tied)}, not tied ${f2(J.matchTotals.notTied)}`, '', c2(J.matchTotals.invoices), c2(J.matchTotals.costs)]);
    const ctBad = CT.map((w, i) => r.con[i] && JSON.stringify(r.con[i].cells.map(c => c.replace(/\s+/g, ''))) === JSON.stringify(w.map(c => c.replace(/\s+/g, ''))) ? null : i).filter(x => x !== null);
    check(r.con.length === CT.length && !ctBad.length, `${tag}: by hire contract: each contract, the V8s' PO, invoice and amount, every cost and PO against it, its total; the costs not tied; the job: bad rows ` + JSON.stringify(ctBad.slice(0, 3).map(i => [r.con[i] && r.con[i].cells, CT[i]])));
    check(J.contracts.length === 18 && Math.abs(J.contracts.reduce((a, c) => a + c.revenue, 0) - J.revenue.invoices) < 0.005 && Math.abs(J.contracts.reduce((a, c) => a + c.costTotal, 0) + J.notTied.reduce((a, x) => a + x.amount, 0) - J.costs.total) < 0.005,
      `${tag}: the 18 contracts carry the 18 invoices, and their costs with the costs not tied are the job cost, to the cent`);
    // every purchase order in the costs, and every cost with no PO: together the job cost
    const PO = J.purchaseOrders.map(x => [x.po + ' · ' + x.supplier + x.what + x.status, x.contract, x.branch, c2(x.amount)])
      .concat([[J.poTotals.count + ' purchase orders', '', '', c2(J.poTotals.withPO)], ['No PO on the record']])
      .concat(J.noPO.map(x => [x.supplier + x.what + x.why, x.contract, x.branch, c2(x.amount)]))
      .concat([['No PO on the record', '', '', c2(J.poTotals.noPO)], ['The job cost' + `with a PO ${f2(J.poTotals.withPO)} · no PO ${f2(J.poTotals.noPO)}`, '', '', c2(J.poTotals.total)]]);
    const poBad = PO.map((w, i) => r.pot[i] && JSON.stringify(r.pot[i].cells.map(c => c.replace(/\s+/g, ''))) === JSON.stringify(w.map(c => c.replace(/\s+/g, ''))) ? null : i).filter(x => x !== null);
    check(r.pot.length === PO.length && !poBad.length, `${tag}: every purchase order, its supplier, what, status, hire contract, branch and amount; every cost with no PO and why; the totals: bad rows ` + JSON.stringify(poBad.slice(0, 3).map(i => [r.pot[i] && r.pot[i].cells, PO[i]])));
    const poNums = new Set(J.purchaseOrders.map(x => x.po)), linePOs = new Set(J.lines.flatMap(l => String(l.po).match(/\b4\d{6}\b/g) || []));
    check(poNums.size === J.purchaseOrders.length && [...linePOs].every(x => poNums.has(x)) && [...poNums].every(x => linePOs.has(x)) && Math.abs(J.poTotals.total - J.costs.total) < 0.005 && r.pot[r.pot.length - 1].cells[3] === c2(J.costs.total),
      `${tag}: the ${poNums.size} POs are exactly the POs on the cost lines, and with the costs with no PO they are the job cost, ${f2(J.costs.total)}`);
    // the open items
    check(JSON.stringify(r.open) === JSON.stringify(J.open), `${tag}: the open items, word for word (${r.open.length})`);
    check(r.folds.map(f => f.id).join() === 'pl1267-fp-lines,pl1267-fp-branch,pl1267-fp-revenue,pl1267-fp-contracts,pl1267-fp-pos,pl1267-fp-labour,pl1267-fp-lj,pl1267-fp-s17,pl1267-fp-journals,pl1267-fp-open' && r.folds.every(f => !f.open && /plfold765/.test(f.cls)), `${tag}: the detail folds, closed until opened, opened for paper: ` + JSON.stringify(r.folds));
    // the live model, moved not removed
    check(r.live && r.live.tag === 'DETAILS' && !r.live.open && /pl1267-fold/.test(r.live.cls) && /^The live model/.test(r.live.summary) && /not the P&L job position above/.test(r.live.summary), `${tag}: the live model folds under the job position, closed, named the working figures: ` + JSON.stringify(r.live && r.live.summary));
    check(r.live.hasFace && r.live.parts.every(Boolean) && r.live.oldTiles.length === 3 && r.live.oldTiles.every(t => /\d/.test(t)) && r.live.oldPrint, `${tag}: the live model keeps its face, tiles, tables, cards and Print: ` + JSON.stringify(r.live.oldTiles));
    check(r.ties === 'ties' || r.ties === 'differs', `${tag}: the live model still works out its figures (data-pl1267 ${r.ties})`);
    check(r.printBtn && r.printBtn.bound && r.printBtn.inFace && r.printBtn.w > 20 && r.printBtn.text === 'Print full P&L', `${tag}: the final P&L has its own Print, bound to the tab's print: ` + JSON.stringify(r.printBtn));
    check(r.footer === '· v12.77', `${tag}: the footer says v12.77: ${r.footer}`);
    // v12.76: the recheck's wording (PACK_v115_RECHECK.md item 4), worked from the data where it names a figure
    const cu = J.lines.filter(l => l.accrue > 0.004 && l.sep > 0.004), cuAmt = cu.reduce((a, l) => a + l.sep, 0), cuWho = [...new Set(cu.map(l => l.supplier))].join(' and ');
    const NOTE = ['the two are shown apart, above and in “Revenue by invoice”', 'Costs are by month of work at job end, except November’s labour (to 13 Nov: the Coates wages hours, the salary allowance and Job Connect), which is in October with October’s; the rest of November is forecast', 'Some costs are estimates until invoiced (each line says so), and Coates’ own wages are hours only, not yet costed, so the difference so far is not a margin yet',
      'Accruals through 31 Oct are the journals prepared for Finance, not a record of what is posted: work to 31 Oct with no invoice yet' + (cu.length ? `, including September’s part of ${cuWho} (${f2(cuAmt)}) as a catch-up` : ''),
      'Carrier loads to 31 Oct and the consumables and forklift POs are not in them: Finance to confirm (see the open items)'];
    check(NOTE.every(t => r.prose.includes(t)) && cu.length === 1 && Math.abs(cuAmt - 1963.10) < 0.005, `${tag}: the note says what the accruals are and are not, the catch-up from the data (${cuWho}, ${f2(cuAmt)}), the estimates and the wages: missing ` + JSON.stringify(NOTE.filter(t => !r.prose.includes(t))));
    check(r.prose.includes('COSTS BY SUPPLIER AND MONTH (NOVEMBER’S LABOUR IN OCTOBER) · ACCRUALS THROUGH 31 OCT') && r.sup.length && r.prose.includes('Journals prepared for Finance, through 31 Oct') && r.jn.some(x => x.cells[0] === 'Accruals through 31 Oct, prepared for Finance (each reverses on 1 Nov; the invoice lands against it)'),
      `${tag}: the suppliers' heading, the journals fold and its total row carry the same name`);
    check(!/To accrue|THE P&L · FINAL|The P&L, final|Journals at 31 Oct|October’s work/.test(r.prose + ' ' + r.eyebrow + ' ' + r.title), `${tag}: no “To accrue”, “final” heading, “Journals at 31 Oct” or “October’s work” left on the face`);
    /* all the labour in October (Andrew, 1 Nov 2026): no salary or Job Connect line has a November figure on the tab */
    const labNov = J.lines.filter(l => /^(Salary|Job Connect)/.test(l.supplier) && l.nov > 0.004);
    check(!labNov.length && J.lines.filter(l => /^(Salary|Job Connect)/.test(l.supplier)).length === 10 && r.lines.filter((x, i) => i < J.lines.length && /^(Salary|Job Connect)/.test(J.lines[i].supplier)).every(x => x.cells[3] === '—'), `${tag}: all the labour is in October: no salary or Job Connect line has a November figure: ` + JSON.stringify(labNov.map(l => l.what)));
    check(!/Codex|Claude|your word|on Andrew/i.test(r.prose), `${tag}: no agent names or provenance words on the face`);
    check(r.doc.sw <= r.doc.cw + 1, `${tag}: nothing runs off the side of the page (${r.doc.sw} ≤ ${r.doc.cw})`);
    // ---------------------------------------------------------------- v12.77: find in the P&L
    const ct = v => Math.round(v * 100), F = J.facts, RF = J.revFacts, CATS = J.categories.map(c => c.name), BRS = ['KINP', 'STPS', 'NVAC', 'MEAD'], MOS = ['Sep', 'Oct', 'Nov'];
    const mk = {Sep: 'sep', Oct: 'oct', Nov: 'nov'};
    // the parts are the pack's figures (independently of the page): by line and month, by branch, by category and month, the revenue by branch
    check(J.lines.every((l, i) => MOS.every(m => F.filter(f => f[0] === i && f[2] === m).reduce((a, f) => a + f[3], 0) === ct(l[mk[m]]))), `${tag}: the parts of each cost line add to its months, to the cent`);
    check(J.branches.every(b => F.filter(f => f[1] === b.b).reduce((a, f) => a + f[3], 0) === ct(b.costs) && RF.filter(x => x[1] === b.b).reduce((a, x) => a + x[3], 0) === ct(b.revenue)), `${tag}: the parts add to each branch's costs and revenue, to the cent`);
    check(J.categories.every(c => MOS.every(m => F.filter(f => J.lines[f[0]].category === c.name && f[2] === m).reduce((a, f) => a + f[3], 0) === ct(c[mk[m]]))), `${tag}: the parts add to each category's months, to the cent`);
    const fx = await p.evaluate(() => { const g = id => document.getElementById(id), o = id => g(id) ? [...g(id).options].map(x => [x.value, x.textContent]) : null, fp = g('pl1267-fp'), kids = [...fp.querySelectorAll('*')];
      return {cat: o('plx-cat'), br: o('plx-br'), mo: o('plx-mo'), q: !!g('plx-q'), clear: !!g('plx-clear'), after: (() => { const t = fp.querySelector('.plf1272-tiles'), x = g('plx'), b = fp.querySelector('table.plf1272-branch'); return !!(t && x && b) && (t.compareDocumentPosition(x) & 4) && (x.compareDocumentPosition(b) & 4); })(),
        h: g('plx-cat') ? Math.round(g('plx-cat').getBoundingClientRect().height) : 0, lineCats: [...fp.querySelectorAll('table.plf1272-lines tbody tr')].map(tr => { const c = tr.querySelector('small.plx-cat'); return c ? c.textContent : null; }) }; });
    check(fx.cat && JSON.stringify(fx.cat) === JSON.stringify([['', 'All categories']].concat(CATS.map(c => [c, c]))) && fx.br.map(x => x[0]).join() === ',KINP,STPS,NVAC,MEAD' && fx.mo.map(x => x[0]).join() === ',Sep,Oct,Nov' && fx.mo[2][1] === 'October (with November’s labour)' && fx.mo[3][1] === 'November (forecast)' && fx.q && fx.clear,
      `${tag}: Find in the P&L: Category (all and the pack's ${CATS.length}), Branch (all and the four), Month (job end, Sep, Oct with November's labour, Nov forecast), a search and Clear: ` + JSON.stringify([fx.cat && fx.cat.length, fx.br, fx.mo]));
    check(fx.after, `${tag}: the finder sits under the tiles, above the branch table`);
    /* on the view-only link the page locks every field; the finder writes nothing, so it stays usable: a person's own choices, typed and clicked */
    const ro = await p.evaluate(() => ({readonly: document.body.classList.contains('viewonly') && document.body.getAttribute('data-cap') !== 'edit', cap: document.body.getAttribute('data-cap'), dis: ['plx-cat', 'plx-br', 'plx-mo', 'plx-q', 'plx-clear'].map(id => document.getElementById(id).disabled)}));
    await p.selectOption('#plx-cat', 'Fencing', {timeout: 5000}); await p.selectOption('#plx-br', 'STPS', {timeout: 5000}); await p.selectOption('#plx-mo', 'Oct', {timeout: 5000}); await p.waitForTimeout(200);
    const byHand = await p.evaluate(() => document.querySelectorAll('#plx-sum .plx-k b')[1].textContent.trim());
    await p.fill('#plx-q', 'Advanced', {timeout: 5000}); await p.waitForTimeout(400);
    const byHandQ = await p.evaluate(() => document.querySelectorAll('#plx-sum .plx-k b')[1].textContent.trim());
    await p.click('#plx-clear', {timeout: 5000}); await p.waitForTimeout(200);
    const fSO = F.filter(f => J.lines[f[0]].category === 'Fencing' && f[1] === 'STPS' && f[2] === 'Oct'), fSOq = fSO.filter(f => /advanced/i.test(J.lines[f[0]].supplier + ' ' + J.lines[f[0]].what + ' ' + J.lines[f[0]].invoice));
    check(ro.readonly && ro.dis.every(d => !d) && byHand === f2(fSO.reduce((a, f) => a + f[3], 0) / 100) && byHandQ === f2(fSOq.reduce((a, f) => a + f[3], 0) / 100),
      `${tag}: on the view-only link the finder is not locked, and choosing and typing by hand gives the figures to the cent: ` + JSON.stringify({ro, byHand, byHandQ}));
    check(fx.h >= (mobile ? 40 : 32), `${tag}: the choices are a comfortable height to tap (${fx.h} px)`);
    check(J.lines.every((l, i) => fx.lineCats[i] === l.category), `${tag}: every cost line names its category`);
    // every combination of category, branch and month (${11 × 5 × 4}): the page's revenue, costs and difference against the parts, to the cent
    const combos = []; ['', ...CATS].forEach(c => ['', ...BRS].forEach(b => ['', ...MOS].forEach(m => combos.push([c, b, m]))));
    const seen = await p.evaluate(async (combos) => {
      const g = id => document.getElementById(id), set = (id, v) => { const el = g(id); el.value = v; el.dispatchEvent(new Event('change', {bubbles: true})); };
      const out = [];
      for (const [c, b, m] of combos) {
        set('plx-cat', c); set('plx-br', b); set('plx-mo', m);
        const k = [...document.querySelectorAll('#plx-sum .plx-k')].map(x => x.querySelector('b').textContent.trim());
        const grand = document.querySelector('#plx-out table.plx-cats tr.pl1267-grand, #plx-out table.plx-lines tr.pl1267-grand');
        out.push({k, rows: [...document.querySelectorAll('#plx-out table.plx-cats tbody tr:not(.pl1267-grand)')].map(tr => [...tr.children].map(td => td.textContent.trim())),
          lines: document.querySelectorAll('#plx-out table.plx-lines tbody tr:not(.pl1267-grand)').length, grand: grand ? [...grand.children].map(td => td.textContent.trim()) : null, none: !!document.querySelector('#plx-out .plx-none')});
      }
      return out; }, combos);
    const bad = [];
    combos.forEach(([c, b, m], i) => {
      const fs_ = F.filter(f => (!c || J.lines[f[0]].category === c) && (!b || f[1] === b) && (!m || f[2] === m)), cost = fs_.reduce((a, f) => a + f[3], 0);
      const rev = c ? null : RF.filter(x => (!b || x[1] === b) && (!m || x[2] === m)).reduce((a, x) => a + x[3], 0);
      const want = [rev === null ? '—' : f2(rev / 100), f2(cost / 100), !c && !m ? f2((rev - cost) / 100) : '—'];
      const got = seen[i]; let ok = JSON.stringify(got.k) === JSON.stringify(want);
      if (!c) {   // by category: one row per category with a cost, each to the cent, and the grand row
        const cr = CATS.map(cn => { const by = MOS.map(mm => fs_.filter(f => J.lines[f[0]].category === cn && f[2] === mm).reduce((a, f) => a + f[3], 0)); return [cn, by]; }).filter(x => x[1].some(Boolean));
        const cells = cr.map(([cn, by]) => [cn].concat(m ? [c2(by[MOS.indexOf(m)] / 100)] : by.map(v => c2(v / 100)).concat([c2(by.reduce((a, v) => a + v, 0) / 100)])));
        ok = ok && JSON.stringify(got.rows) === JSON.stringify(cells) && got.grand && got.grand[got.grand.length - 1] === c2(cost / 100);
      } else {     // the category's lines, and their total
        const ids = new Set(fs_.map(f => f[0]));
        ok = ok && (ids.size ? got.lines === ids.size && got.grand && got.grand[got.grand.length - 1] === c2(cost / 100) : got.lines === 0 && !got.grand && (got.none || ['Labour hire', 'Salary allowance'].includes(c)));   // Labour hire and Salary show their people even with no cost in the choice
      }
      if (!ok) bad.push({c, b, m, got: got.k, want, rows: got.rows.length});
    });
    check(!bad.length, `${tag}: every category × branch × month (${combos.length} choices): revenue, costs, difference and the table, to the cent: bad ` + JSON.stringify(bad.slice(0, 3)));
    // the independent figures: the job, each branch, each category, each month (the pack's own totals, not the parts)
    const at = (c, b, m) => seen[combos.findIndex(x => x[0] === c && x[1] === b && x[2] === m)].k;
    check(JSON.stringify(at('', '', '')) === JSON.stringify([f2(J.revenue.total), f2(J.costs.total), f2(J.difference)]), `${tag}: with nothing chosen: the job's revenue, costs and difference, as the tiles: ` + JSON.stringify(at('', '', '')));
    check(J.branches.every(b => JSON.stringify(at('', b.b, '')) === JSON.stringify([c2(b.revenue) === '—' ? '0.00' : f2(b.revenue), f2(b.costs), f2(b.difference)])), `${tag}: each branch: its revenue, costs and difference as the branch table: ` + JSON.stringify(BRS.map(b => at('', b, ''))));
    check(MOS.every(m => at('', '', m)[1] === f2(J.costs[mk[m]])) && at('', '', 'Sep')[0] === '0.00' && at('', '', 'Oct')[0] === f2(J.revenue.invoices) && at('', '', 'Nov')[0] === f2(J.revenue.novForecast), `${tag}: each month: the costs by month; the revenue in its invoice month (Sep none, Oct the 18 invoices, Nov the forecast)`);
    check(J.categories.every(cg => at(cg.name, '', '')[1] === f2(cg.total) && MOS.every(m => at(cg.name, '', m)[1] === f2(cg[mk[m]]))), `${tag}: each category and each of its months, as the pack's category totals`);
    // searches: an identifier gives that thing's own figure in the P&L (the PO, contract and revenue folds); a branch code or category name acts as the choice; other words find the lines that mention them
    const S_ = async (q, ch) => p.evaluate(async ([q, ch]) => { const g = id => document.getElementById(id); ['plx-cat', 'plx-br', 'plx-mo'].forEach(id => { g(id).value = (ch && ch[id]) || ''; g(id).dispatchEvent(new Event('change')); });
      g('plx-q').value = q; g('plx-q').dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 300));
      const T = sel => [...document.querySelectorAll('#plx-out ' + sel + ' tbody tr:not(.pl1267-grand)')].map(tr => [...tr.children].map(td => td.textContent.trim()));
      return {k: [...document.querySelectorAll('#plx-sum .plx-k')].map(x => x.querySelector('b').textContent.trim()), small: [...document.querySelectorAll('#plx-sum .plx-k small')].map(x => x.textContent.trim()), note: (document.querySelector('#plx-sum .plx-note') || {}).textContent || '',
        lines: T('table.plx-lines').map(r => r[0]), po: T('table.plx-po'), inv: T('table.plx-inv'), con: T('table.plx-con'), lj: T('table.plx-lj').map(r => r[0]), none: !!document.querySelector('#plx-out .plx-none'),
        cats: T('table.plx-cats')}; }, [q, ch || null]);
    const sBad = [];
    for (const x of J.purchaseOrders) { const g = await S_(x.po); if (JSON.stringify(g.k) !== JSON.stringify(['—', f2(x.amount), '—']) || g.po.length !== 1 || g.po[0][3] !== f2(x.amount) || !g.po[0][0].startsWith(x.po + ' · ' + x.supplier)) sBad.push(['po', x.po, g.k, g.po]); }
    check(!sBad.length, `${tag}: every one of the ${J.purchaseOrders.length} POs searched gives its own amount in the costs, as in Every purchase order in the costs: bad ` + JSON.stringify(sBad.slice(0, 3)));
    const cBad = [];
    for (const c of J.contracts) { const g = await S_(c.contract), inv = J.invoices.filter(x => x.contract === c.contract);
      if (JSON.stringify(g.k) !== JSON.stringify([f2(c.revenue), f2(c.costTotal), '—']) || g.inv.filter(r => /^\d{8}/.test(r[0])).length !== inv.length || g.con.length !== Math.max(c.costs.length, 1) || (c.costs.length && !c.costs.every((y, i) => g.con[i][2] === c2(y.amount)))) cBad.push(['contract', c.contract, g.k, [c.revenue, c.costTotal]]); }
    check(!cBad.length, `${tag}: every one of the ${J.contracts.length} hire contracts searched gives what we charged on it and the costs tied to it, as in By hire contract: bad ` + JSON.stringify(cBad.slice(0, 3)));
    const iBad = [];
    for (const x of J.invoices) { const g = await S_(x.inv); if (JSON.stringify(g.k) !== JSON.stringify([f2(x.ex), '—', '—']) || g.inv.length !== 1 || g.inv[0][3] !== f2(x.ex)) iBad.push(['invoice', x.inv, g.k]); }
    const cpoK = v => String(v).split(' (')[0].toLowerCase().replace(/\s+/g, ''), cpos = [...new Set(J.invoices.map(x => cpoK(x.customerPO)))];
    for (const k of cpos) { const L = J.invoices.filter(x => cpoK(x.customerPO) === k), g = await S_(k.toUpperCase()); if (g.k[0] !== f2(L.reduce((a, x) => a + ct(x.ex), 0) / 100) || g.inv.length !== L.length) iBad.push(['V8s PO', k, g.k, L.length]); }
    check(!iBad.length, `${tag}: every invoice searched gives its own amount, and every V8s PO (${cpos.length}) the invoices on it and nothing else: bad ` + JSON.stringify(iBad.slice(0, 3)));
    const rm = J.removedInvoices[0], gr = await S_(rm.inv); check(gr.k[0] === '—' && /not in the revenue/.test(gr.small[0]), `${tag}: the invoice not in the revenue says so: ` + JSON.stringify(gr.k));
    const pBad = [];
    for (const who of [...new Set(J.labourJournal.map(x => x.who))]) { const g = await S_(who), n_ = J.labourJournal.filter(x => x.who === who).length; if (g.lj.length !== n_ || !g.lj.every(r => r.startsWith(who)) || g.k[1] !== '—' || g.k[0] !== '—') pBad.push(['person', who, g.lj.length, n_, g.k]); }
    const gk = await S_('Kyle'), gkW = J.labourJournal.filter(x => x.who.startsWith('Kyle'));
    check(!pBad.length && gk.lj.length === gkW.length && gk.k[1] === '—', `${tag}: every person searched (full name or first name) gives their labour journal rows, and no cost figure that is not theirs: bad ` + JSON.stringify(pBad.slice(0, 3)));
    const tBad = [];
    for (const b of BRS) { const g = await S_(b.toLowerCase()), w = at('', b, ''); if (JSON.stringify(g.k) !== JSON.stringify(w) || !/is a branch/.test(g.note)) tBad.push(['branch', b, g.k, w]); }
    for (const c of CATS) { const g = await S_(c.toLowerCase()), w = at(c, '', ''); if (JSON.stringify(g.k) !== JSON.stringify(w) || !/is a category/.test(g.note)) tBad.push(['category', c, g.k, w]); }
    check(!tBad.length, `${tag}: a branch code or category name typed gives exactly what the Branch or Category choice gives (${BRS.length + CATS.length}): bad ` + JSON.stringify(tBad.slice(0, 3)));
    const lowq = t => String(t == null ? '' : t).toLowerCase().replace(/[“”"‘’`']/g, ' ').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/\s+/g, ' ').trim();
    const lineText = l => lowq([l.supplier, l.branch, l.account, l.what, l.po, l.invoice, l.contract, l.status, l.basis, l.category].join(' '));
    const words_ = ['Event Portables', 'Advanced', 'accrue', 'water barriers'], wBad = [];
    for (const w of words_) { const ws = lowq(w).split(' '), li = J.lines.map((l, i) => ws.every(x => lineText(l).includes(x)) ? i : -1).filter(i => i >= 0), cost = F.filter(f => li.includes(f[0])).reduce((a, f) => a + f[3], 0), g = await S_(w);
      if (JSON.stringify(g.k) !== JSON.stringify(['—', f2(cost / 100), '—']) || g.lines.length !== li.length || !/that mention/.test(g.small[1]) || !/whole lines/.test(g.small[1])) wBad.push([w, g.k, f2(cost / 100), g.lines.length, li.length]); }
    check(!wBad.length, `${tag}: other words find the cost lines that mention them, labelled as whole lines, to the cent: bad ` + JSON.stringify(wBad));
    // the second independent review's cases: under a branch or category, only that branch's or category's own figure, else a reason
    const rv = {};
    for (const [lbl, q, ch] of [['nvacCon', '9961976', {'plx-br': 'NVAC'}], ['fenceCon', '9968955', {'plx-cat': 'Fencing'}], ['kinpMove', '4668970', {'plx-br': 'KINP'}], ['stpsFork', '4647983', {'plx-br': 'STPS'}], ['meadFork', '4654789', {'plx-br': 'MEAD'}],
                                ['meadCpo', 'P029416', {'plx-br': 'MEAD'}], ['meadInv', '25120720', {'plx-br': 'MEAD'}], ['p028607', 'P028607'], ['alfie', 'Alfie'], ['apos', "Ludwig Chee's"], ['an', 'an'], ['remCon', J.removedInvoices[0].contract], ['typed', 'STPS', {'plx-br': 'KINP'}]]) rv[lbl] = await S_(q, ch);
    const lin = id => J.lines.map((l, i) => i).filter(i => F.some(f => f[0] === i && f[1] === id));
    const meadP = J.invoices.filter(x => cpoK(x.customerPO) === 'p029416' && x.branch === 'MEAD').reduce((a, x) => a + ct(x.ex), 0);
    const p286 = J.invoices.filter(x => cpoK(x.customerPO) === 'p28607');
    const alfieLines = J.lines.filter(l => /\balfie\b/.test(lineText(l))).length;
    check(rv.nvacCon.k[1] === '—' && /not split by branch/.test(rv.nvacCon.small[1]) && rv.fenceCon.k[1] === '—' && /not split by category/.test(rv.fenceCon.small[1]) && rv.kinpMove.k[1] === '—' && /branch move/.test(rv.kinpMove.small[1])
      && rv.stpsFork.k[1] === f2(2820) && rv.meadFork.k[1] === f2(950), `${tag}: a hire contract or PO under a branch or category gives only that branch's or category's own figure, else the reason: ` + JSON.stringify([rv.nvacCon.k, rv.fenceCon.k, rv.kinpMove.k, rv.stpsFork.k, rv.meadFork.k]));
    check(rv.meadCpo.k[0] === f2(meadP / 100) && rv.meadCpo.inv.some(r => r[0].startsWith('In the choice (MEAD)') && r[3] === f2(meadP / 100)) && rv.meadInv.k[0] === '0.00' && rv.meadInv.inv.some(r => r[0].startsWith('In the choice (MEAD)') && r[3] === '0.00'),
      `${tag}: invoices under a branch: the revenue is the branch's own, and the table says what is in the choice: ` + JSON.stringify([rv.meadCpo.k, rv.meadInv.k]));
    check(p286.length === 1 && rv.p028607.k[0] === f2(p286[0].ex) && /as keyed/.test(rv.p028607.small[0]), `${tag}: P028607 finds the invoice keyed P28607, and says how it is keyed: ` + JSON.stringify(rv.p028607.k));
    check(rv.alfie.k[1] === '—' && rv.alfie.lines.length === alfieLines && alfieLines > 0 && rv.alfie.lj.length === J.labourJournal.filter(x => x.who.startsWith('Alfie')).length, `${tag}: a person gives their journal rows and the cost lines that mention them, with no total that is not theirs (${alfieLines} lines)`);
    check(rv.apos.lines.length > 0 && /that mention/.test(rv.apos.small[1]) && /that mention/.test(rv.an.small[1]) && rv.an.k[1] !== '—' && /not in the revenue/.test(rv.remCon.small[0]) && /set aside/.test(rv.typed.note),
      `${tag}: a straight apostrophe searches like a curly one; "an" is a word search, not a person; the removed invoice's contract points to its note; a typed branch says the Branch choice is set aside: ` + JSON.stringify({apos: [rv.apos.lines.length, rv.apos.small[1]], an: [rv.an.k, rv.an.small[1]], rem: rv.remCon.small[0], typed: rv.typed.note}));
    const gm = await S_('4658850', {'plx-mo': 'Oct'}), gi = await S_('25122628', {'plx-mo': 'Sep'}), gb = await S_('4658850', {'plx-br': 'KINP'});
    check(gm.k[1] === '—' && /choose Job end/.test(gm.small[1]) && gi.k[0] === '0.00' && /dated October/.test(gi.small[0]) && gb.k[1] === '—' && /is on STPS/.test(gb.small[1]), `${tag}: a PO with a month, an invoice in September and a PO on another branch each say why, with no wrong figure: ` + JSON.stringify([gm.k, gm.small[1], gi.k, gi.small[0], gb.small[1]]));
    const redraw = await p.evaluate(async () => { const g = id => document.getElementById(id); g('plx-clear').click(); const q = g('plx-q'); q.focus(); q.value = '4658850'; q.dispatchEvent(new Event('input'));
      const before = g('plx'); render(); await new Promise(r => setTimeout(r, 1500));   /* the page's own redraw, as when the record syncs while someone types */
      const synced = {q: g('plx-q').value, focus: document.activeElement && document.activeElement.id, redrawn: before !== g('plx')};
      go('today'); go('costs'); await new Promise(r => setTimeout(r, 1500));
      return {q: g('plx-q').value, k: [...document.querySelectorAll('#plx-sum .plx-k b')].map(x => x.textContent.trim()), focus: synced.focus, syncedQ: synced.q, redrawn: synced.redrawn}; });
    check(redraw.redrawn && redraw.syncedQ === '4658850' && redraw.focus === 'plx-q' && redraw.q === '4658850' && redraw.k[1] === f2(J.purchaseOrders.find(x => x.po === '4658850').amount), `${tag}: a redraw while typing keeps the typed search, the cursor in the box and its figure, and a tab switch keeps the search: ` + JSON.stringify(redraw));
    const qz = await S_('zzzz nothing'); check(qz.none && qz.k[1] === '0.00', `${tag}: a search that finds nothing says so`);
    // a category opens from the by-category table; Clear puts it all back; the choice survives the tab being drawn again
    const flow = await p.evaluate(async () => { const g = id => document.getElementById(id); g('plx-clear').click(); await new Promise(r => setTimeout(r, 100));
      const b = [...document.querySelectorAll('#plx-out .plx-pick')].find(x => x.dataset.cat === 'Transport'); b.click(); await new Promise(r => setTimeout(r, 100));
      const picked = {cat: g('plx-cat').value, costs: document.querySelectorAll('#plx-sum .plx-k b')[1].textContent.trim(), lines: document.querySelectorAll('#plx-out table.plx-lines tbody tr:not(.pl1267-grand)').length};
      g('plx-br').value = 'STPS'; g('plx-br').dispatchEvent(new Event('change'));
      go('today'); await new Promise(r => setTimeout(r, 1500)); go('costs'); await new Promise(r => setTimeout(r, 2500));
      const kept = {cat: g('plx-cat') && g('plx-cat').value, br: g('plx-br') && g('plx-br').value, costs: document.querySelectorAll('#plx-sum .plx-k b')[1] && document.querySelectorAll('#plx-sum .plx-k b')[1].textContent.trim()};
      g('plx-clear').click(); await new Promise(r => setTimeout(r, 100));
      return {picked, kept, cleared: {cat: g('plx-cat').value, br: g('plx-br').value, mo: g('plx-mo').value, q: g('plx-q').value, rows: document.querySelectorAll('#plx-out table.plx-cats tbody tr:not(.pl1267-grand)').length}}; });
    const tr = J.categories.find(c => c.name === 'Transport'), trS = F.filter(f => J.lines[f[0]].category === 'Transport' && f[1] === 'STPS').reduce((a, f) => a + f[3], 0);
    check(flow.picked.cat === 'Transport' && flow.picked.costs === f2(tr.total) && flow.picked.lines === J.lines.filter(l => l.category === 'Transport').length, `${tag}: a category in the by-category table opens its lines at its total: ` + JSON.stringify(flow.picked));
    check(flow.kept.cat === 'Transport' && flow.kept.br === 'STPS' && flow.kept.costs === f2(trS / 100), `${tag}: the choice survives the tab being drawn again: ` + JSON.stringify(flow.kept));
    check(!flow.cleared.cat && !flow.cleared.br && !flow.cleared.mo && !flow.cleared.q && flow.cleared.rows === J.categories.filter(c => Math.abs(c.total) >= 0.005).length, `${tag}: Clear puts everything back: ` + JSON.stringify(flow.cleared));
    // the labour journals in the finder: a branch gives the people whose hours are journaled to it, their hours to the hour
    const ljb = await p.evaluate(async () => { const g = id => document.getElementById(id); g('plx-br').value = 'STPS'; g('plx-br').dispatchEvent(new Event('change'));
      const rows = [...document.querySelectorAll('#plx-out table.plx-lj tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())); g('plx-clear').click(); return rows; });
    const ljS = J.labourJournal.filter(x => x.branch === 'STPS'), hh = h => h ? (Math.round(h * 100) / 100).toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 2}) : '—';
    check(ljb.length === ljS.length + 1 && ljS.every((x, i) => ljb[i][0].startsWith(x.who) && ljb[i][1] === x.home && ljb[i][3] === hh(x.sep) && ljb[i][4] === hh(x.oct) && ljb[i][5] === hh(x.sep + x.oct) && ljb[i][6] === c2(x.labourHire)) && ljb[ljS.length][5] === hh(ljS.reduce((a, x) => a + x.sep + x.oct, 0)),
      `${tag}: the finder's labour journals for STPS: each person, home branch, hours and labour hire $ (${ljS.length}): ` + JSON.stringify(ljb.slice(0, 2)));
    // the labour journals fold: every row, the hours on each branch, the total; the labour hire bridge, week by week, and its totals
    const lj = await p.evaluate(() => ({rows: [...document.querySelectorAll('#pl1267-fp table.plx-ljall tbody tr')].map(tr => ({cls: tr.className, b: tr.getAttribute('data-b'), c: [...tr.children].map(td => td.textContent.trim())})),
      br: [...document.querySelectorAll('#pl1267-fp table.plx-bridge tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim()))}));
    const LJ = J.labourJournal, ljPeople = lj.rows.filter(x => !x.cls), ljTot = lj.rows.filter(x => x.b), ljAll = lj.rows.filter(x => /pl1267-grand/.test(x.cls));
    check(ljPeople.length === LJ.length && LJ.every((x, i) => { const c = ljPeople[i].c; return c[0].startsWith(x.who) && c[0].includes(x.type) && c[1] === x.home && c[2].startsWith(x.branch) && (x.journal === 'stays' ? c[2].includes('stays') : c[2].includes('journal ' + x.journal)) && (!x.contract || c[2].includes(x.contract)) && c[3] === hh(x.sep) && c[4] === hh(x.oct) && c[5] === hh(x.sep + x.oct) && c[6] === c2(x.labourHire); }),
      `${tag}: the labour journals: every person and type, home branch, where the hours are journaled to (and the contract outside KINP), Sep and Oct hours, labour hire $ (${LJ.length})`);
    check(LJ.some(x => x.who === 'Andrew Fisher' && x.kind === 'Salary') && ljPeople.some(x => x.c[0].startsWith('Andrew Fisher')), `${tag}: the salaried row names its person (a who-field, kept as the record's who-fields are)`);
    const byB = {}; LJ.forEach(x => byB[x.branch] = (byB[x.branch] || 0) + x.sep + x.oct);
    check(ljTot.length === Object.keys(byB).length && ljTot.every(x => x.c[5] === hh(byB[x.b])) && ljAll.length === 1 && ljAll[0].c[3] === hh(LJ.reduce((a, x) => a + x.sep, 0)) && ljAll[0].c[4] === hh(LJ.reduce((a, x) => a + x.oct, 0)) && ljAll[0].c[6] === c2(LJ.reduce((a, x) => a + ct(x.labourHire), 0) / 100),
      `${tag}: the hours on each branch, all the hours and all the labour hire $, to the hour and the cent: ` + JSON.stringify(ljTot.map(x => x.c[0] + ' ' + x.c[5])));
    const BR = J.labourHireBridge, lhCat = J.categories.find(c => c.name === 'Labour hire');
    check(lj.br.length === BR.length + 1 && BR.every((x, i) => lj.br[i][0].startsWith(x.week) && lj.br[i][1] === x.invoice && lj.br[i][2] === f2(x.runningSheet) && lj.br[i][3] === f2(x.cost) && lj.br[i][4] === c2(x.difference)) && BR.every(x => ct(x.difference) === ct(x.runningSheet) - ct(x.cost)),
      `${tag}: the labour hire bridge: each week, its PO, the running sheet, the costs and the difference, to the cent (${BR.length})`);
    const bt = lj.br[BR.length], rsT = BR.reduce((a, x) => a + ct(x.runningSheet), 0), cT = BR.reduce((a, x) => a + ct(x.cost), 0);
    check(bt[2] === f2(rsT / 100) && bt[3] === f2(cT / 100) && bt[4] === f2((rsT - cT) / 100) && cT === ct(lhCat.total) && rsT === LJ.reduce((a, x) => a + ct(x.labourHire), 0), `${tag}: the bridge's totals: the running sheet = the labour journals' labour hire $; the costs = the Labour hire category: ` + JSON.stringify(bt));
    if (shot) {   /* evidence: the whole section, in a viewport tall enough to hold it, so nothing is clipped */
      fs.mkdirSync(shot, {recursive: true}); const vw = mobile ? 390 : 1440;
      await p.setViewportSize({width: vw, height: Math.min(Math.ceil(r.box.h) + 400, 7800)}); await p.waitForTimeout(600);
      await p.evaluate(() => document.getElementById('pl1267-fp').scrollIntoView({block: 'start'})); await p.waitForTimeout(400);
      await p.locator('#pl1267-fp').screenshot({path: path.join(shot, `final_pl_${tag}.png`)});
      await p.setViewportSize({width: vw, height: mobile ? 844 : 1000});
    }
    const bn = await p.evaluate(async () => { const b = () => { const x = document.getElementById('ts1053-banner'); return x ? getComputedStyle(x).display : 'absent'; };
      const onCosts = b(); go('today'); await new Promise(r => setTimeout(r, 1500)); const onToday = b(); go('costs'); await new Promise(r => setTimeout(r, 1500)); return {onCosts, onToday}; });
    check(bn.onCosts === 'none' && bn.onToday !== 'none' && bn.onToday !== 'absent', `${tag}: the twin-steer banner is not on the Costs & P&L tab, and is still on the others: ` + JSON.stringify(bn));
    await p.waitForTimeout(800);
    check(!cons.length, `${tag}: no console errors: ` + JSON.stringify(cons.slice(0, 3)));
    check(!s.errors.length, `${tag}: no page errors: ` + JSON.stringify(s.errors.slice(0, 3)));
    check(s.counts.blocked === 0, `${tag}: the page tried no write (${s.counts.blocked})`);
    console.log(`PASS ${checks}/${checks} ${tag}`);
  } catch (e) { console.error('FAIL', tag, e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
