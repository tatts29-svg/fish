/* Author: Andrew Fisher. v11.51 checks: the Map explorer opens with no area outlines; they appear while the explorer's
   Toilets & amenities chip is pressed and go when it is released; the selector opens on "With the toilets" and still
   offers every area, "All areas" and "Hide"; one area chosen draws that area alone; the symbols beside the codes and
   #expcard stay. GET only; the record is compared.
     PAGE=build/GC500_v11.51/GC500_Delivery_Control_hosted.html node tests/test_v1151.cjs      MOB=1 ...      LIVE=1 ... */
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
 const h = await open(MOB ? {pageFile, hash: '#map', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#map', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.51'));
  let fr = null; const t0 = Date.now();
  while (Date.now() - t0 < 60000) { fr = p.frames().find(f => f.name() === 'expFrame' || /\/explorer\//.test(f.url())); if (fr) { const ok = await fr.evaluate(() => !!(window.MapUnits1147 && window.MapUnits1147.state.ready)).catch(() => false); if (ok) break; } await p.waitForTimeout(500); }
  await p.waitForTimeout(1500);
  const st = async () => fr.evaluate(() => { const s = window.MapUnits1147.state; return {filter: s.filter, paints: s.paints, shown: s.shown, areas: parent.MapUnits1147.areas().length, ready: s.ready, toiletsOn: window.MapUnits1147.toiletsOn(), chip: !![...document.querySelectorAll('button.chip[data-cat]')].find(b => /^Toilets/.test(b.textContent.trim())), canvas: !!document.getElementById('areas1147'), ref: typeof window.referenceQuantity1010 === 'function'}; });
  const s0 = await st();
  const bar = await p.evaluate(() => { const b = document.getElementById('map1147-controls'); const sel = b && b.querySelector('select'); return {bar: !!b, options: sel ? [...sel.options].map(o => o.value + '|' + o.textContent) : [], value: sel ? sel.value : null, hint: b ? b.querySelector('small').textContent : '', expcard: !!document.getElementById('expcard'), key: b ? b.querySelectorAll('.map1147-key span').length : 0}; });
  check('on opening: the explorer is ready with its symbols, the Toilets chip is off, no area is drawn (nothing painted at all), the selector sits on "With the toilets" with every area, All areas and Hide still offered, the hint says the areas belong to the toilets, the symbols key and #expcard are there',
   s0.ready && s0.paints === 0 && !s0.toiletsOn && s0.shown.length === 0 && s0.areas >= 13 && s0.chip && s0.canvas && s0.ref && s0.filter === 'auto' && bar.bar && bar.value === 'auto' && bar.options[0].startsWith('auto|With the toilets') && bar.options.some(o => o.startsWith('|All areas')) && bar.options.some(o => o.startsWith('off|Hide')) && bar.options.filter(o => /^\d+\|Area \d+/.test(o)).length >= 13 && /belong to the toilets/.test(bar.hint) && bar.expcard && bar.key >= 10, {s0, bar: {value: bar.value, n: bar.options.length, first: bar.options[0], key: bar.key, hint: bar.hint.slice(0, 80)}});
  await p.evaluate(() => { const c = document.getElementById('expcard'); if (c) c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(out, 'explorer_default_no_areas_' + tag + '.png'), fullPage: false});
  const press = async () => fr.evaluate(() => { const c = [...document.querySelectorAll('button.chip[data-cat]')].find(b => /^Toilets/.test(b.textContent.trim())); c.click(); return new Promise(r => setTimeout(() => r(window.MapUnits1147.state), 1200)); });
  const s1 = await press();
  check('the Toilets & amenities chip pressed: the areas draw, each on its own, within a second', (await st()).toiletsOn && s1.shown.length >= 10 && s1.paints > 0, {shown: s1.shown, paints: [s0.paints, s1.paints]});
  await p.waitForTimeout(800);
  await p.screenshot({path: path.join(out, 'explorer_toilets_areas_' + tag + '.png'), fullPage: false});
  const s2 = await press();
  check('the chip released: the areas go again', !(await st()).toiletsOn && s2.shown.length === 0, {shown: s2.shown});
  const one = await p.evaluate(() => new Promise(res => { const sel = document.querySelector('#map1147-controls select'); sel.value = '1'; sel.dispatchEvent(new Event('change', {bubbles: true})); setTimeout(() => { const f = document.getElementById('expFrame').contentWindow.MapUnits1147.state; res({filter: f.filter, shown: f.shown}); }, 1500); }));
  check('one area chosen from the selector draws that area alone, with the chip off', one.filter === '1' && one.shown.join(',') === '1', one);
  await p.waitForTimeout(800);
  await p.screenshot({path: path.join(out, 'explorer_area1_chosen_' + tag + '.png'), fullPage: false});
  const back = await p.evaluate(() => new Promise(res => { const sel = document.querySelector('#map1147-controls select'); sel.value = 'auto'; sel.dispatchEvent(new Event('change', {bubbles: true})); setTimeout(() => { const f = document.getElementById('expFrame').contentWindow.MapUnits1147.state; res({filter: f.filter, shown: f.shown, value: sel.value}); }, 1200); }));
  check('back to "With the toilets": nothing drawn while the chip is off', back.filter === 'auto' && back.shown.length === 0 && back.value === 'auto', back);
  const all = await p.evaluate(() => new Promise(res => { const sel = document.querySelector('#map1147-controls select'); sel.value = ''; sel.dispatchEvent(new Event('change', {bubbles: true})); setTimeout(() => { const f = document.getElementById('expFrame').contentWindow.MapUnits1147.state; sel.value = 'auto'; sel.dispatchEvent(new Event('change', {bubbles: true})); res({filter: f.filter, shown: f.shown}); }, 1200); }));
  check('"All areas" still draws the outlines on request (those in the view, which Area 1 had just zoomed to)', all.filter === '' && all.shown.length >= 3 && all.shown.includes('1'), all);
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1151.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
