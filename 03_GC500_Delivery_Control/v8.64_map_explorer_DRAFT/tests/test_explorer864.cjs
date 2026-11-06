// Author: Andrew Fisher. v8.64 Map explorer checks inside the dashboard, read-only against the live record.
//   PAGE=<dashboard build> LOCAL=<prepared explorer folder> [MOB=1] node tests/test_explorer864.cjs
// LOCAL serves index.html, explorer-fix864.js/.css from the folder; every other explorer asset is the live registered one.
const {open} = require('./xembed');
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('map')); const fh = await p.waitForSelector('#pane-map iframe', {timeout: 30000}); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready && window.GC500Explorer864, null, {timeout: 90000}); await p.waitForTimeout(2500);
  await f.evaluate(() => { window.__lt864 = []; new PerformanceObserver(l => { for (const e of l.getEntries()) __lt864.push(e.duration); }).observe({type: 'longtask'}); });
  const txt = id => f.evaluate(id => { const el = document.getElementById(id); return !el ? '' : el.offsetParent ? el.innerText.trim() : '(hidden: side panel always open)'; }, id);
  // labels
  const nav0 = await txt('navBtn'), fen0 = await txt('fenceMode');
  ok('labels: Search & layers (phone: Search) / Fencing', (MOB ? /^Search$/ : /^(Search & layers|\(hidden: side panel always open\))$/).test(nav0) && /^Fencing$/.test(fen0), {nav0, fen0});
  // phone: the side panel has its own way back to the map
  if (MOB) { await f.click('#navBtn'); await p.waitForTimeout(300);
    const vis = await f.evaluate(() => { const b = document.querySelector('#x864SideClose'); return !!b && getComputedStyle(b).display !== 'none' && document.body.classList.contains('nav'); });
    await f.click('#x864SideClose button'); await p.waitForTimeout(300);
    ok('phone: side panel shows Back to the map, and it closes the panel', vis && !(await f.evaluate(() => document.body.classList.contains('nav'))), {vis}); }
  // a Find category: Clear selection appears, and clears it
  if (MOB) { await f.click('#navBtn'); await p.waitForTimeout(300); }
  await f.evaluate(() => document.querySelector('#chips .chip').click()); await p.waitForTimeout(800);
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  const shown = await f.evaluate(() => !document.getElementById('x864Clear').hidden && !!document.getElementById('x864Clear').offsetParent);
  await f.click('#x864Clear'); await p.waitForTimeout(400);
  const after = await f.evaluate(() => ({chip: !!document.querySelector('#chips .chip[aria-pressed="true"]'), list: document.getElementById('findList').classList.contains('show'), pill: document.getElementById('x864Clear').hidden}));
  ok('category: Clear selection shown on the map', shown, {shown});
  ok('category: one tap clears it (chip off, list closed, pill gone)', !after.chip && !after.list && after.pill, after);
  // Fencing: labels change, a close button is in the panel, the idle refresh does not freeze
  await f.click('#fenceMode'); await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); await p.waitForTimeout(600);
  const nav1 = await txt('navBtn'), fen1 = await txt('fenceMode');
  ok('fencing labels: Fencing list / Close fencing (phone: List / Close)', (MOB ? /^List$/ : /^(Fencing list|\(hidden: side panel always open\))$/).test(nav1) && (MOB ? /^Close$/ : /^Close fencing$/).test(fen1), {nav1, fen1});
  const hdrFits = await f.evaluate(() => [...document.querySelectorAll('#navBtn,#fenceMode')].filter(b => b.offsetParent).every(b => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().left >= 0));
  ok('header buttons fit, nothing cut off', hdrFits, {hdrFits});
  const fenceClose = await f.evaluate(() => { const b = document.querySelector('#x864FenceClose button'); return !!b && !!b.offsetParent; });
  ok('fencing panel has a visible Close fencing button', fenceClose, {fenceClose});
  const n0 = await f.evaluate(() => __lt864.length); await p.waitForTimeout(9000);
  const lt = await f.evaluate(n0 => __lt864.slice(n0), n0);
  ok('fencing: no freeze over 9 s of refreshes (no task over 50 ms)', lt.length === 0, {longTasks: lt.map(Math.round)});
  // pick a fence run from a source list, then clear it from the map
  const picked = await f.evaluate(async () => { const sel = document.getElementById('fmSource'); const opt = [...sel.options].find(o => o.value !== 'all'); if (!opt) return {none: true};
    sel.value = opt.value; sel.onchange(); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#fmList [data-fmrow]'); if (!b) return {norows: true}; b.click(); await new Promise(r => setTimeout(r, 200)); return {selected: GC500FencingMap.state.selected}; });
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await p.waitForTimeout(900);
  const pill2 = await f.evaluate(() => !document.getElementById('x864Clear').hidden);
  await f.click('#x864Clear'); await p.waitForTimeout(300);
  const sel2 = await f.evaluate(() => GC500FencingMap.state.selected);
  ok('fencing pick: Clear selection shown and clears it', !!picked.selected && pill2 && sel2 == null, {picked, pill2, after: sel2});
  // Close fencing from the panel's own button
  if (MOB) { await f.click('#navBtn'); await p.waitForTimeout(300); }
  await f.click('#x864FenceClose button'); await p.waitForTimeout(400);
  ok('Close fencing button leaves fencing', !(await f.evaluate(() => document.body.classList.contains('fencing-map'))) && /^Fencing$/.test((await txt('fenceMode')).trim()), {});
  // Escape from inside the explorer: clears a selection first, then closes fencing
  await f.click('#fenceMode'); await p.waitForTimeout(500); if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await f.evaluate(async () => { const sel = document.getElementById('fmSource'); const opt = [...sel.options].find(o => o.value !== 'all'); sel.value = opt.value; sel.onchange(); await new Promise(r => setTimeout(r, 300)); document.querySelector('#fmList [data-fmrow]').click(); });
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await f.focus('#stage'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const e1 = await f.evaluate(() => ({sel: GC500FencingMap.state.selected, on: document.body.classList.contains('fencing-map')}));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const e2 = await f.evaluate(() => document.body.classList.contains('fencing-map'));
  ok('Escape: first clears the pick, then closes fencing', e1.sel == null && e1.on && !e2, {e1, e2});
  // moving resolution: lower while moving, full at rest
  const res = await f.evaluate(async () => { const c = document.getElementById('display'); const rest0 = c.width; touchInteraction(); await new Promise(r => requestAnimationFrame(r)); const moving = c.width; await new Promise(r => setTimeout(r, 450)); return {rest0, moving, rest1: c.width}; });
  ok('canvas draws lighter while moving and returns to full at rest', res.moving < res.rest0 && res.rest1 === res.rest0, res);
  // the dashboard snapshot is built with one file index
  const snap = await p.evaluate(() => { const runs = []; for (let i = 0; i < 3; i++) { const t0 = performance.now(); gc500FencingMapSnapshot(); runs.push(Math.round(performance.now() - t0)); } return {best: Math.min(...runs), runs, flag: !!window.gc500FenceSnap864}; });
  ok('dashboard fencing snapshot: best of 3 under 60 ms (live v8.63: about 120 ms)', snap.flag && snap.best < 60, snap);
  ok('no page errors (dashboard or explorer)', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  if (process.env.LOCAL) ok('candidate explorer files were served', (s.counts.local || 0) >= 3, s.counts);
  await p.screenshot({path: (process.env.OUT || '.') + '/explorer864_' + (MOB ? 'phone' : 'desktop') + '.png'});
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
