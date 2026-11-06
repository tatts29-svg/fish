/* Author: Andrew Fisher. v11.42 checks: the finder finds a tab by its name or an everyday word, the Showcase, a VMS board by
   its number, where a removal board goes, a removal morning and a generator by its register asset number, and each kind of
   row goes where it says: a tab opens, a board opens the VMS boards tab with the satellite map zoomed on it, a spot opens
   the removals map zoomed, a morning opens the removals tab on that morning, the Showcase opens; the old kinds unchanged
   (PG01, WC43, a callout). GET only; the record is compared.
     PAGE=build/GC500_v11.42/GC500_Delivery_Control_hosted.html node tests/test_v1142.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 const find = async q => p.evaluate(async q => { const i = document.getElementById('q'); i.focus(); i.value = q; i.dispatchEvent(new Event('input', {bubbles: true})); await new Promise(r => setTimeout(r, 700)); return (FINDER.list || []).map(it => ({kind: it.kind, key: it.kind === 'morning' ? it.iso : (it.key || it.tab || it.label || it.sheetKey || it.title), name: it.name || it.title || it.where || it.label || ''})); }, q);
 const pick = async () => p.evaluate(() => { finderPick(0); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof finderPick === 'function', null, {timeout: 180000});
  await p.waitForTimeout(1200);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.42'));
  const r = {};
  for (const q of ['closures', 'removals', 'where it is', 'satellite', 'showcase', 'VMS 10', 'vms16', 'VMS 02a', 'Breaker', 'Altus', 'T10', 'Friday', 'Monday', '1244536', 'GN25', 'PG01', 'WC43', 'callout 033', 'fence', 'Build']) r[q] = await find(q);
  const first = q => r[q][0] || {};
  check('everyday words find the tabs: closures and fence -> Fence closures, removals -> VMS removals, where it is and satellite -> Map explorer, Build -> Build, showcase -> the Showcase', first('closures').kind === 'tab' && first('closures').key === 'fenceclose' && r['fence'].some(x => x.kind === 'tab' && x.key === 'fenceclose') && first('removals').key === 'vmsoff' && first('where it is').key === 'map' && first('satellite').key === 'map' && first('Build').kind === 'tab' && first('Build').key === 'timeline' && first('showcase').kind === 'tab' && first('showcase').key === 'showcase', {closures: r['closures'].slice(0, 2), fence: r['fence'].slice(0, 3), removals: r['removals'].slice(0, 2), where: r['where it is'].slice(0, 2), sat: r['satellite'].slice(0, 2), build: r['Build'].slice(0, 2), show: r['showcase'].slice(0, 2)});
  check('a board by its number: "VMS 10" -> VMS 10 first, "vms16" -> VMS 16*, "VMS 02a" -> VMS 02a', first('VMS 10').kind === 'vms' && /^VMS 10\b/.test(first('VMS 10').key) && first('vms16').kind === 'vms' && /^VMS 16/.test(first('vms16').key) && first('VMS 02a').kind === 'vms' && /^VMS 02a/.test(first('VMS 02a').key), {v10: r['VMS 10'].slice(0, 3), v16: r['vms16'].slice(0, 3), v02a: r['VMS 02a'].slice(0, 2)});
  check('where a board goes: Breaker -> VMS 16 behind 2 Breaker St, Altus -> VMS 13 and 14 to the Altus compound, T10 -> VMS 17 to the T10 runoff', first('Breaker').kind === 'spot' && /VMS 16/.test(first('Breaker').key) && /Breaker St/.test(first('Breaker').name) && r['Altus'].filter(x => x.kind === 'spot').length === 2 && r['Altus'].filter(x => x.kind === 'spot').every(x => /Altus/.test(x.name)) && r['T10'].some(x => x.kind === 'spot' && /VMS 17/.test(x.key) && /T10/.test(x.name)), {breaker: r['Breaker'].slice(0, 2), altus: r['Altus'].slice(0, 3), t10: r['T10'].slice(0, 3)});
  check('a removal morning: Friday -> Friday morning 2026-10-23, Monday -> Monday 2026-10-26', first('Friday').kind === 'morning' && first('Friday').key === '2026-10-23' && r['Monday'].some(x => x.kind === 'morning' && x.key === '2026-10-26'), {fri: r['Friday'].slice(0, 2), mon: r['Monday'].slice(0, 2)});
  check('a generator by its register asset number: 1244536 -> GN25 first; GN25 still found by its reference', first('1244536').kind === 'asset' && first('1244536').key === 'GN25' && first('GN25').key === 'GN25', {n: r['1244536'].slice(0, 2), g: r['GN25'].slice(0, 2)});
  check('the old kinds unchanged: PG01 and WC43 as references first, callout 033 as a place', first('PG01').kind === 'asset' && first('PG01').key === 'PG01' && first('WC43').kind === 'asset' && first('WC43').key === 'WC43' && r['callout 033'].some(x => x.kind === 'place'), {pg: r['PG01'].slice(0, 2), wc: r['WC43'].slice(0, 2), c: r['callout 033'].slice(0, 2)});
  const rows = await p.evaluate(async () => { const i = document.getElementById('q'); const got = {}; for (const q of ['closures', 'VMS 10', 'Breaker', 'Friday']) { i.value = q; i.dispatchEvent(new Event('input', {bubbles: true})); await new Promise(r => setTimeout(r, 700)); const el = document.querySelector('#finder .fi'); got[q] = {cls: el && el.className, text: el && el.innerText.replace(/\s+/g, ' ').trim().slice(0, 160), undef: el && /undefined|\[object/.test(el.innerText)}; } return got; });
  check('the new rows draw with their words and no "undefined"', rows['closures'].cls.indexOf('tab') >= 0 && /opens the tab/.test(rows['closures'].text) && rows['VMS 10'].cls.indexOf('vms') >= 0 && /satellite map zoomed/.test(rows['VMS 10'].text) && rows['Breaker'].cls.indexOf('spot') >= 0 && /2 Breaker St/.test(rows['Breaker'].text) && rows['Friday'].cls.indexOf('morning') >= 0 && /removals tab/.test(rows['Friday'].text) && Object.values(rows).every(x => !x.undef), rows);
  await find('closures'); await pick(); await p.waitForTimeout(800);
  const t1 = await p.evaluate(() => ({tab: state.tab, finderHidden: document.getElementById('finder').hidden, q: document.getElementById('q').value}));
  check('picking "closures" opens the Fence closures tab and closes the finder', t1.tab === 'fenceclose' && t1.finderHidden && t1.q === '', t1);
  await find('VMS 10'); await pick();
  const t2 = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); (function w(){ const M = window.SatMap1141 && SatMap1141.maps.vms; const pct = M ? SatMap1141.pct('vms') : null; if ((state.tab === 'vms' && pct && pct > 100) || Date.now() - t0 > 8000) { const b = VMS1024.boards().find(x => x.pos === '10'); const pp = VMS1024.position(b); const z = SatMap1141.z18(pp.lat, pp.lon); res({tab: state.tab, pct, cx: M && M.view ? M.view.cx : null, cy: M && M.view ? M.view.cy : null, bx: z[0], by: z[1]}); } else setTimeout(w, 200); })(); }));
  check('picking "VMS 10" opens the VMS boards tab with the satellite map at 1600% centred on VMS 10', t2.tab === 'vms' && t2.pct === 1600 && Math.abs(t2.cx - t2.bx) < 2 && Math.abs(t2.cy - t2.by) < 2, t2);
  await p.waitForTimeout(2500);
  await p.screenshot({path: path.join(out, 'find_vms10_' + tag + '.png'), fullPage: false});
  await find('Breaker'); await pick();
  const t3 = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); (function w(){ const pct = window.VmsMap1139 ? VmsMap1139.pct : null; if ((state.tab === 'vmsoff' && pct > 100) || Date.now() - t0 > 8000) { const v = VmsMap1139.view, z = VmsMap1139.z18(-27.9817267, 153.42943); res({tab: state.tab, pct, dx: v ? Math.abs(v.cx - z[0]) : null, dy: v ? Math.abs(v.cy - z[1]) : null}); } else setTimeout(w, 200); })(); }));
  check('picking "Breaker" opens the VMS removals tab with the removal map at 1600% on 2 Breaker St', t3.tab === 'vmsoff' && t3.pct === 1600 && t3.dx < 2 && t3.dy < 2, t3);
  await find('Monday'); await pick(); await p.waitForTimeout(800);
  const t4 = await p.evaluate(() => ({tab: state.tab, morning: VmsOff1132.morning, chosen: [...document.querySelectorAll('#pane-vmsoff [data-v1132-morning].primary')].map(b => b.dataset.v1132Morning)}));
  check('picking "Monday" opens the removals tab on Monday 26 Oct', t4.tab === 'vmsoff' && t4.morning === '2026-10-26' && t4.chosen.join() === '2026-10-26', t4);
  await find('showcase'); await pick(); await p.waitForTimeout(2500);
  const t5 = await p.evaluate(() => ({open: !!(window.SHOW && SHOW.open), dlg: !!document.querySelector('#showcase:not([hidden])') || !!(document.getElementById('showcase') && document.getElementById('showcase').offsetParent)}));
  check('picking "showcase" opens the Showcase', t5.open || t5.dlg, t5);
  await p.evaluate(() => { if (typeof showClose === 'function') showClose(); });
  await p.waitForTimeout(600);
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1142.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
