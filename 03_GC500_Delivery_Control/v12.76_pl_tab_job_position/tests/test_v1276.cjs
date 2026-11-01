// Author: Andrew Fisher. v12.76 (v12.75's checks with the recheck's wording: the dated job position, "Difference so far", not a margin yet, "Accruals through 31 Oct" prepared for Finance, with what is in them and what is not; the invoices and the forecast apart) on the real Costs & P&L tab, reading the live record, writing nothing. The tab leads with the
// P&L; every figure on it is the pack's (GC500_PL_final.json) to the cent: the four tiles, the branch table, the suppliers, every
// cost line, each branch's lines, the journals and the open items; the data in the page is the reviewed file, byte for byte in
// value; the live model the tab carried before is folded under it, closed, with its own figures and Print still there; the Finance,
// Fencing and Workings folds follow; no console error, no write, and on a phone nothing runs off the side of the page.
//   PAGE=build/GC500_v12.76/GC500_Delivery_Control_hosted.html PLF_JSON=<pack dir>/GC500_PL_final.json [MOB=1] [SHOT=dir] node tests/test_v1276.cjs
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
        printBtn: (() => { const b = document.getElementById('pl1267-fp-print'); return b ? {bound: typeof b.onclick === 'function', inFace: fp.contains(b), w: b.getBoundingClientRect().width} : null; })(),
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
    const lineBad = J.lines.map((l, i) => { const c = r.lines[i].cells; const ok = c[0].startsWith(l.supplier + ' · ' + l.branch) && c[0].includes(l.what) && (!l.po || c[0].includes('PO ' + l.po)) && c[0].includes('Hire contract: ' + l.contract) && c[1] === c2(l.sep) && c[2] === c2(l.oct) && c[3] === c2(l.nov) && c[4] === c2(l.accrue) && c[5].startsWith(l.status); return ok ? null : i; }).filter(x => x !== null);
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
    check(r.folds.map(f => f.id).join() === 'pl1267-fp-lines,pl1267-fp-branch,pl1267-fp-revenue,pl1267-fp-contracts,pl1267-fp-pos,pl1267-fp-labour,pl1267-fp-s17,pl1267-fp-journals,pl1267-fp-open' && r.folds.every(f => !f.open && /plfold765/.test(f.cls)), `${tag}: the detail folds, closed until opened, opened for paper: ` + JSON.stringify(r.folds));
    // the live model, moved not removed
    check(r.live && r.live.tag === 'DETAILS' && !r.live.open && /pl1267-fold/.test(r.live.cls) && /^The live model/.test(r.live.summary) && /not the P&L job position above/.test(r.live.summary), `${tag}: the live model folds under the job position, closed, named the working figures: ` + JSON.stringify(r.live && r.live.summary));
    check(r.live.hasFace && r.live.parts.every(Boolean) && r.live.oldTiles.length === 3 && r.live.oldTiles.every(t => /\d/.test(t)) && r.live.oldPrint, `${tag}: the live model keeps its face, tiles, tables, cards and Print: ` + JSON.stringify(r.live.oldTiles));
    check(r.ties === 'ties' || r.ties === 'differs', `${tag}: the live model still works out its figures (data-pl1267 ${r.ties})`);
    check(r.printBtn && r.printBtn.bound && r.printBtn.inFace && r.printBtn.w > 20, `${tag}: the final P&L has its own Print, bound to the tab's print: ` + JSON.stringify(r.printBtn));
    check(r.footer === '· v12.76', `${tag}: the footer says v12.76: ${r.footer}`);
    // v12.76: the recheck's wording (PACK_v115_RECHECK.md item 4), worked from the data where it names a figure
    const cu = J.lines.filter(l => l.accrue > 0.004 && l.sep > 0.004), cuAmt = cu.reduce((a, l) => a + l.sep, 0), cuWho = [...new Set(cu.map(l => l.supplier))].join(' and ');
    const NOTE = ['the two are shown apart, above and in “Revenue by invoice”', 'Costs are by month of work at job end, except the labour: all of it is in October, with November’s to 13 Nov (the Coates wages hours, the salary allowance and Job Connect), as the revenue for those days is invoiced in October; the rest of November is forecast', 'Some costs are estimates until invoiced (each line says so), and Coates’ own wages are hours only, not yet costed, so the difference so far is not a margin yet',
      'Accruals through 31 Oct are the journals prepared for Finance, not a record of what is posted: work to 31 Oct with no invoice yet' + (cu.length ? `, including September’s part of ${cuWho} (${f2(cuAmt)}) as a catch-up` : ''),
      'Carrier loads to 31 Oct and the consumables and forklift POs are not in them: Finance to confirm (see the open items)'];
    check(NOTE.every(t => r.prose.includes(t)) && cu.length === 1 && Math.abs(cuAmt - 1963.10) < 0.005, `${tag}: the note says what the accruals are and are not, the catch-up from the data (${cuWho}, ${f2(cuAmt)}), the estimates and the wages: missing ` + JSON.stringify(NOTE.filter(t => !r.prose.includes(t))));
    check(r.prose.includes('COSTS BY SUPPLIER AND MONTH OF WORK · ACCRUALS THROUGH 31 OCT') && r.sup.length && r.prose.includes('Journals prepared for Finance, through 31 Oct') && r.jn.some(x => x.cells[0] === 'Accruals through 31 Oct, prepared for Finance (each reverses on 1 Nov; the invoice lands against it)'),
      `${tag}: the suppliers' heading, the journals fold and its total row carry the same name`);
    check(!/To accrue|THE P&L · FINAL|The P&L, final|Journals at 31 Oct|October’s work/.test(r.prose + ' ' + r.eyebrow + ' ' + r.title), `${tag}: no “To accrue”, “final” heading, “Journals at 31 Oct” or “October’s work” left on the face`);
    /* all the labour in October (Andrew, 1 Nov 2026): no salary or Job Connect line has a November figure on the tab */
    const labNov = J.lines.filter(l => /^(Salary|Job Connect)/.test(l.supplier) && l.nov > 0.004);
    check(!labNov.length && J.lines.filter(l => /^(Salary|Job Connect)/.test(l.supplier)).length === 10 && r.lines.filter((x, i) => i < J.lines.length && /^(Salary|Job Connect)/.test(J.lines[i].supplier)).every(x => x.cells[3] === '—'), `${tag}: all the labour is in October: no salary or Job Connect line has a November figure: ` + JSON.stringify(labNov.map(l => l.what)));
    check(!/Codex|Claude|your word|on Andrew/i.test(r.prose), `${tag}: no agent names or provenance words on the face`);
    check(r.doc.sw <= r.doc.cw + 1, `${tag}: nothing runs off the side of the page (${r.doc.sw} ≤ ${r.doc.cw})`);
    if (shot) {   /* evidence: the whole section, in a viewport tall enough to hold it, so nothing is clipped */
      fs.mkdirSync(shot, {recursive: true}); const vw = mobile ? 390 : 1440;
      await p.setViewportSize({width: vw, height: Math.min(Math.ceil(r.box.h) + 400, 7800)}); await p.waitForTimeout(600);
      await p.evaluate(() => document.getElementById('pl1267-fp').scrollIntoView({block: 'start'})); await p.waitForTimeout(400);
      await p.locator('#pl1267-fp').screenshot({path: path.join(shot, `final_pl_${tag}.png`)});
      await p.setViewportSize({width: vw, height: mobile ? 844 : 1000});
    }
    await p.waitForTimeout(800);
    check(!cons.length, `${tag}: no console errors: ` + JSON.stringify(cons.slice(0, 3)));
    check(!s.errors.length, `${tag}: no page errors: ` + JSON.stringify(s.errors.slice(0, 3)));
    check(s.counts.blocked === 0, `${tag}: the page tried no write (${s.counts.blocked})`);
    console.log(`PASS ${checks}/${checks} ${tag}`);
  } catch (e) { console.error('FAIL', tag, e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
