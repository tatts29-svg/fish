// Author: Andrew Fisher. v12.72 on the real Costs & P&L tab, reading the live record, writing nothing. The tab leads with the final
// P&L; every figure on it is the pack's (GC500_PL_final.json) to the cent: the four tiles, the branch table, the suppliers, every
// cost line, each branch's lines, the journals and the open items; the data in the page is the reviewed file, byte for byte in
// value; the live model the tab carried before is folded under it, closed, with its own figures and Print still there; the Finance,
// Fencing and Workings folds follow; no console error, no write, and on a phone nothing runs off the side of the page.
//   PAGE=build/GC500_v12.72/GC500_Delivery_Control_hosted.html PLF_JSON=<pack dir>/GC500_PL_final.json [MOB=1] [SHOT=dir] node tests/test_v1272.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {open} = require('../../toolchain/harness/open_page');
const f2 = v => (typeof v !== 'number' || !isFinite(v)) ? '—' : (v < -0.004 ? '−' : '') + Math.abs(v).toFixed(2).split('.').map((p, i) => i ? p : p.replace(/\B(?=(\d{3})+(?!\d))/g, ',')).join('.');
const c2 = v => (typeof v === 'number' && Math.abs(v) >= 0.005) ? f2(v) : '—';
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
        branch: rows('table.plf1272-branch'), sup: rows('table.plf1272-sup'), lines: rows('table.plf1272-lines'), bl: rows('table.plf1272-bl'), jn: rows('table.plf1272-jn'),
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
    check(/^THE P&L · FINAL · AUD EX GST · AS AT 31 OCT 2026/.test(r.eyebrow) && r.title.startsWith('The P&L, final') && r.title.includes('pack ' + J.pack) && r.title.includes(J.source), `${tag}: heading names the final P&L, the pack and its sources: ` + r.title);
    // the tiles
    const T = [['Charged to the V8s', f2(J.revenue.total), `18 invoices ${f2(J.revenue.invoices)} · November forecast ${f2(J.revenue.novForecast)}`],
               ['What it costs us', f2(J.costs.total), `Sep ${f2(J.costs.sep)} · Oct ${f2(J.costs.oct)} · Nov ${f2(J.costs.nov)} (forecast)`],
               ['Difference', f2(J.difference), 'revenue less costs, job end'], ['To accrue at 31 Oct', f2(J.accrue), 'work done, not invoiced yet']];
    check(r.tiles.length === 4 && T.every((t, i) => r.tiles[i].l.toUpperCase() === t[0].toUpperCase() && r.tiles[i].v === t[1] && r.tiles[i].s === t[2]), `${tag}: the four tiles, to the cent: ` + JSON.stringify(r.tiles));
    const tops = [...new Set(r.tiles.map(t => t.top))];
    check(mobile ? tops.length === 4 : tops.length === 1, `${tag}: the tiles ${mobile ? 'stack one under another' : 'sit in one row'} (rows at ${JSON.stringify(tops)}, widths ${JSON.stringify(r.tiles.map(t => t.w))})`);
    // by branch
    const B = J.branches.map(b => [b.b, c2(b.invoiced), c2(b.novForecast), c2(b.revenue), c2(b.costs), c2(b.difference)]).concat([['The job', c2(J.revenue.invoices), c2(J.revenue.novForecast), c2(J.revenue.total), c2(J.costs.total), c2(J.difference)]]);
    check(r.branch.length === B.length && B.every((w, i) => JSON.stringify(r.branch[i].cells) === JSON.stringify(w)), `${tag}: by branch, every figure to the cent: ` + JSON.stringify(r.branch.map(x => x.cells)));
    // the suppliers
    const S = J.suppliers.map(x => [x.name, c2(x.sep), c2(x.oct), c2(x.nov), c2(x.total), c2(x.accrue)]).concat([['Total costs', c2(J.costs.sep), c2(J.costs.oct), c2(J.costs.nov), c2(J.costs.total), c2(J.accrue)]]);
    check(r.sup.length === S.length && S.every((w, i) => JSON.stringify(r.sup[i].cells) === JSON.stringify(w)), `${tag}: costs by supplier and month, to the cent (${J.suppliers.length} suppliers and the total)`);
    // every cost line
    check(r.lines.length === J.lines.length + 1, `${tag}: every cost line is on the tab (${r.lines.length - 1} of ${J.lines.length})`);
    const lineBad = J.lines.map((l, i) => { const c = r.lines[i].cells; const ok = c[0].startsWith(l.supplier + ' · ' + l.branch) && c[0].includes(l.what) && (!l.po || c[0].includes('PO ' + l.po)) && c[1] === c2(l.sep) && c[2] === c2(l.oct) && c[3] === c2(l.nov) && c[4] === c2(l.accrue) && c[5].startsWith(l.status); return ok ? null : i; }).filter(x => x !== null);
    check(!lineBad.length, `${tag}: each line's supplier, what, PO, months, accrual and status, to the cent: bad rows ` + JSON.stringify(lineBad));
    const lt = r.lines[r.lines.length - 1].cells;
    check(lt[0] === 'Total costs' && lt[1] === c2(J.costs.sep) && lt[2] === c2(J.costs.oct) && lt[3] === c2(J.costs.nov) && lt[4] === c2(J.accrue), `${tag}: the lines' total row = the costs by month and the accruals`);
    // each branch's lines
    const BL = []; J.branches.forEach(b => { BL.push([b.b]); J.branchLines[b.b].forEach(x => BL.push([x[0], c2(x[1])])); BL.push(['Total ' + b.b, c2(b.costs)]); }); BL.push(['The job', c2(J.costs.total)]);
    check(r.bl.length === BL.length && BL.every((w, i) => JSON.stringify(r.bl[i].cells) === JSON.stringify(w)), `${tag}: costs by branch, line by line, to the cent`);
    // the journals and moves
    const jAmt = r.jn.filter(x => x.cells.length === 4).map(x => x.cells[3]);
    const JW = J.journals.map(j => c2(j.amount)).concat([c2(J.accrue)]).concat(J.moves.map(j => c2(j.amount)));
    check(JSON.stringify(jAmt) === JSON.stringify(JW), `${tag}: the journals, the accruals total and the branch moves, to the cent: ` + JSON.stringify(jAmt));
    check(r.jn.filter(x => x.cells.length === 4).slice(0, J.journals.length).every((x, i) => x.cells[0].startsWith(J.journals[i].journal) && x.cells[1] === J.journals[i].po), `${tag}: each journal names its line and PO`);
    // the open items
    check(JSON.stringify(r.open) === JSON.stringify(J.open), `${tag}: the open items, word for word (${r.open.length})`);
    check(r.folds.map(f => f.id).join() === 'pl1267-fp-lines,pl1267-fp-branch,pl1267-fp-journals,pl1267-fp-open' && r.folds.every(f => !f.open && /plfold765/.test(f.cls)), `${tag}: the detail folds, closed until opened, opened for paper: ` + JSON.stringify(r.folds));
    // the live model, moved not removed
    check(r.live && r.live.tag === 'DETAILS' && !r.live.open && /pl1267-fold/.test(r.live.cls) && /^The live model/.test(r.live.summary) && /not the final P&L/.test(r.live.summary), `${tag}: the live model folds under the final P&L, closed, named the working figures: ` + JSON.stringify(r.live && r.live.summary));
    check(r.live.hasFace && r.live.parts.every(Boolean) && r.live.oldTiles.length === 3 && r.live.oldTiles.every(t => /\d/.test(t)) && r.live.oldPrint, `${tag}: the live model keeps its face, tiles, tables, cards and Print: ` + JSON.stringify(r.live.oldTiles));
    check(r.ties === 'ties' || r.ties === 'differs', `${tag}: the live model still works out its figures (data-pl1267 ${r.ties})`);
    check(r.printBtn && r.printBtn.bound && r.printBtn.inFace && r.printBtn.w > 20, `${tag}: the final P&L has its own Print, bound to the tab's print: ` + JSON.stringify(r.printBtn));
    check(r.footer === '· v12.72', `${tag}: the footer says v12.72: ${r.footer}`);
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
