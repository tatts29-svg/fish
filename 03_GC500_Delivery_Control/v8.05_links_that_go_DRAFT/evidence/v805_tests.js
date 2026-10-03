// v8.05 checks - links that go where they say. Author: Andrew Fisher. Read-only: every write is aborted.
//   PAGE=<built page> [BASE=<live page>] [MOB=1] node v805_tests.js
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const MOB = process.env.MOB === '1';
const wait = ms => new Promise(r => setTimeout(r, ms));
const live = p => p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
(async () => {
  const res = []; const ok = (name, pass, detail) => { res.push({name, pass: !!pass, detail}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : '  ' + JSON.stringify(detail).slice(0, 400))); };
  const errors = [];
  const sz = {W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1, mobile: MOB, gl: false};
  // 1. The Coates Way: every pillar and red row goes to its page
  { const s = await open(Object.assign({pageFile: process.env.PAGE}, sz)), p = s.page;
    await live(p); await wait(2000);
    const out = await p.evaluate(async () => { const r = []; go('coatesway'); await new Promise(z => setTimeout(z, 1500));
      const press = async (sel, i) => { go('coatesway'); await new Promise(z => setTimeout(z, 900)); const el = document.querySelectorAll(sel)[i]; const label = (el.innerText || '').split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 50);
        el.click(); await new Promise(z => setTimeout(z, 900)); const on = document.querySelector('.pane.on'); return {label, tab: state.tab, shown: on && on.id, hash: location.hash}; };
      const np = document.querySelectorAll('#pane-coatesway [data-cwgo]').length, nr = document.querySelectorAll('#pane-coatesway [data-cwred]').length;
      for (let i = 0; i < np; i++) r.push(Object.assign({kind: 'pillar'}, await press('#pane-coatesway [data-cwgo]', i)));
      for (let i = 0; i < nr; i++) { const tr = document.querySelectorAll('#pane-coatesway [data-cwred]')[i]; if (tr && tr.style.cursor === 'pointer') r.push(Object.assign({kind: 'red'}, await press('#pane-coatesway [data-cwred]', i))); }
      return r; });
    ok('every Coates Way link leaves The Coates Way', out.length >= 4 && out.every(x => x.tab !== 'coatesway' && x.shown !== 'pane-coatesway'), out);
    ok('the page shown is the page the record says (no tab says Costs while Coates Way shows)', out.every(x => x.shown === 'pane-' + x.tab), out);
    const pil = out.filter(x => x.kind === 'pillar').map(x => x.tab);
    ok('the pillars go to Pre-starts, Today (Where we are), Equipment (the register) and Costs', JSON.stringify(pil) === JSON.stringify(['prestarts', 'today', 'plant', 'costs']), pil);
    errors.push(...s.errors); await s.browser.close(); }
  // 2. Map explorer: a link straight to the explorer opens the explorer, and stays on it after a round trip
  for (const hash of ['#sheet/__explorer', '#map']) {
    const s = await open(Object.assign({pageFile: process.env.PAGE, hash}, sz)), p = s.page;
    await live(p); await wait(6000);
    const a = await p.evaluate(() => ({tab: state.tab, sheet: state.sheet, explorer: !!document.querySelector('#pane-map #expcard'), hash: location.hash}));
    await p.evaluate(() => go('today')); await wait(1200); await p.evaluate(() => go('map')); await wait(2500);
    const b = await p.evaluate(() => ({tab: state.tab, sheet: state.sheet, explorer: !!document.querySelector('#pane-map #expcard'), hash: location.hash}));
    ok(`a link to ${hash} opens the explorer, and it is still there after Today and back`, a.explorer && a.sheet === '__explorer' && b.explorer && b.sheet === '__explorer', {a, b});
    errors.push(...s.errors); await s.browser.close(); }
  // 3. a link to a named drawing opens that drawing; a map view or unknown key opens the master plan as live does
  { const s0 = await open(Object.assign({pageFile: process.env.PAGE}, sz)); await live(s0.page);
    const keys = await s0.page.evaluate(() => DATA.sheets.map(s => s.key).filter(k => k !== 'MASTER' && k !== state.sheet).filter((k, i, a) => i === 0 || i === Math.floor(a.length / 2) || i === a.length - 1));
    await s0.browser.close();
    for (const [hash, want] of keys.map(k => ['#sheet/' + k, k]).concat([['#sheet/__satellite3d', 'MASTER'], ['#sheet/NOPE', 'MASTER']])) {
      const s = await open(Object.assign({pageFile: process.env.PAGE, hash}, sz)), p = s.page; await live(p); await wait(4500);
      const c = await p.evaluate(() => ({sheet: state.sheet, explorer: !!document.querySelector('#pane-map #expcard'), hash: location.hash}));
      ok(`a link to ${hash} opens ${want}`, c.sheet === want && !c.explorer, Object.assign({want}, c));
      errors.push(...s.errors); await s.browser.close(); } }
  // 3b. a pending explorer request never overrides a later drawing link
  { const s = await open(Object.assign({pageFile: process.env.PAGE}, sz)), p = s.page; await live(p); await wait(2000);
    const key = await p.evaluate(() => DATA.sheets.map(x => x.key).filter(k => k !== 'MASTER')[1]);
    const c = await p.evaluate(async key => { go('today'); state.wantExp805 = true; location.hash = '#sheet/' + key; await new Promise(z => setTimeout(z, 2500));
      return {sheet: state.sheet, explorer: !!document.querySelector('#pane-map #expcard'), hash: location.hash, flag: !!state.wantExp805}; }, key);
    ok('a pending explorer request does not override a later drawing link', c.sheet === key && !c.explorer && !c.flag, Object.assign({key}, c));
    errors.push(...s.errors); await s.browser.close(); }
  // 4. Today, Money: the three totals leave Today's screen; what only that card held is in the stream card; paper as before
  { const s = await open(Object.assign({pageFile: process.env.PAGE}, sz)), p = s.page; await live(p); await wait(2000);
    const m = await p.evaluate(async () => { go('today'); await new Promise(z => setTimeout(z, 1500));
      const d = document.querySelector('#pane-today details.fold95[data-fold="Money"]'); d.open = true; await new Promise(z => setTimeout(z, 1200));
      d.querySelectorAll('details').forEach(x => { x.open = true; }); await new Promise(z => setTimeout(z, 300));
      const vis = e => !!e && e.getClientRects().length > 0, txt = d.innerText;
      const ledger = d.querySelector('.mcard.ledgerc'), m805 = d.querySelector('.m805');
      return {ledgerShown: vis(ledger), m805Shown: vis(m805), hasStreamsDiff: /Each stream: revenue · direct costs · the difference/.test(txt), hasCaveat: /Forecast incomplete/.test(txt),
        costTotalOnScreen: txt.includes(money0(moneySummary().cost.known)), diffTotalOnScreen: txt.includes(money0(Math.abs(moneySummary().difference0))), link: !!d.querySelector('[data-go805="costs"]')}; });
    ok('Today: "Are we making money?" is off the screen; its stream differences and caveat are in the stream card', !m.ledgerShown && m.m805Shown && m.hasStreamsDiff && m.hasCaveat && !m.costTotalOnScreen && !m.diffTotalOnScreen && m.link, m);
    await p.click('#pane-today [data-go805="costs"]').catch(() => {}); await wait(1200);
    const t2 = await p.evaluate(() => state.tab); ok('the stream card\'s link opens Costs & charges', t2 === 'costs', t2);
    await p.evaluate(() => go('today')); await wait(1200); await p.emulateMedia({media: 'print'}); await wait(400);
    const pr = await p.evaluate(() => { const d = document.querySelector('#pane-today details.fold95[data-fold="Money"]'), vis = e => !!e && e.getClientRects().length > 0; return {ledger: vis(d.querySelector('.mcard.ledgerc')), m805: vis(d.querySelector('.m805'))}; });
    ok('paper: the Money card prints as before and the screen-only part does not', pr.ledger && !pr.m805, pr);
    errors.push(...s.errors); await s.browser.close(); }
  if (process.env.BASE && !MOB) {
    const pages = async file => { const h = await open({pageFile: file, W: 1440, H: 900, gl: false}), q = h.page; await live(q); await q.emulateMedia({reducedMotion: 'reduce'}); await wait(2000);
      await q.evaluate(() => go('today')); await wait(1500); await q.evaluate(() => document.querySelectorAll('#pane-today details.fold95').forEach(d => { d.open = true; })); await wait(2000);
      const count = b => (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      const ctrlP = count(await q.pdf({format: 'A4'})); await q.evaluate(() => document.body.classList.add('printing-progress')); const report = count(await q.pdf({format: 'A4'}));
      await h.browser.close(); return {ctrlP, report}; };
    const a = await pages(process.env.BASE), b = await pages(process.env.PAGE);
    ok('paper (real PDF): as many pages as live, Ctrl+P on Today and the A4 report', a.ctrlP === b.ctrlP && a.report === b.report, {live: a, v805: b}); }
  ok('no page errors', errors.length === 0, errors.slice(0, 3));
  const pass = res.filter(r => r.pass).length; console.log(`${pass}/${res.length} ${MOB ? 'phone' : 'desktop'}`);
  fs.writeFileSync(path.join(__dirname, 'v805_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify({author: 'Andrew Fisher', mobile: MOB, results: res, errors}, null, 1));
})().catch(e => { console.error(e); process.exitCode = 1; });
