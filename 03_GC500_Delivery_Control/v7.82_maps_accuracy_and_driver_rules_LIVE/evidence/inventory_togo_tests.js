// v7.82 - Inventory: every location still to come, clickable. Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness.
//   PAGE=<built page> [MOB=1] [OUT=<json>] node inventory_togo_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 1000}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  await p.waitForFunction(() => typeof togo782Html === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await p.evaluate(() => { INV.disc = '*'; location.hash = '#change/' + todayIso(); try { render(); } catch (e) {} });
  await p.waitForSelector('#tg782', {timeout: 60000}); await new Promise(r => setTimeout(r, 1200));
  const A = await p.evaluate(() => { const box = document.querySelector('#tg782'), keys = [...box.querySelectorAll('li [data-open].tg-ref')].map(b => b.dataset.open);
    const want = allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key) && !inPlace782(a.key)).map(a => a.key);
    const days = [...box.querySelectorAll('.tg-dh')].map(d => d.textContent.trim().slice(0, 15));
    const rows = [...box.querySelectorAll('li')].map(li => ({ref: !!li.querySelector('.tg-ref[data-open]'), act: !!li.querySelector('[data-map], .tg-map[data-open]'), loc: (li.querySelector('.tg-loc') || {}).textContent || ''}));
    return {n: keys.length, uniq: new Set(keys).size, missing: want.filter(k => !keys.includes(k)), days, rows: rows.length, allClickable: rows.every(r => r.ref && r.act), allLoc: rows.every(r => r.loc.trim().length > 0), p33: /\bP33\b/.test(box.textContent.replace(/\bP33\b(?=[^<]*class="tg-ref)/g, '')) && [...box.querySelectorAll('.tg-loc,.tg-t')].some(e => /\bP33\b/.test(e.textContent)), overflowX: document.documentElement.scrollWidth > innerWidth + 1}; });
  ok('I1 with Everything chosen, every location not on site yet is listed once (' + A.n + ')', A.n > 0 && A.uniq === A.n && !A.missing.length, JSON.stringify({n: A.n, missing: A.missing.slice(0, 10)}));
  ok('I2 grouped by the day it is due, each location with its words and a status', A.days.length > 1 && A.allLoc, A.days.join(' | '));
  ok('I3 everything clickable: the reference opens the item; Map shows where it goes (or Set in Edit when there is no map spot yet)', A.allClickable, A.rows + ' rows');
  ok('I4 "P33" is not shown in the list words; no sideways scroll', !A.p33 && !A.overflowX, JSON.stringify({p33: A.p33, overflowX: A.overflowX}));
  const k0 = await p.evaluate(() => { const b = document.querySelector('#tg782 .tg-ref[data-open]'); b.click(); return b.dataset.open; }); await new Promise(r => setTimeout(r, 1500));
  const o = await p.evaluate(() => ({on: document.querySelector('#drawer') && document.querySelector('#drawer').classList.contains('on'), text: (document.querySelector('#drawer') || {}).textContent.slice(0, 200)}));
  ok('I5 pressing a reference opens that item', o.on && o.text.includes(k0), k0);
  await p.evaluate(() => { location.hash = '#change/' + todayIso(); try { render(); } catch (e) {} }); await p.waitForSelector('#tg782 [data-map]'); await new Promise(r => setTimeout(r, 800));
  const mk = await p.evaluate(() => { const b = document.querySelector('#tg782 [data-map]'); const k = b.dataset.map; b.click(); return k; }); await new Promise(r => setTimeout(r, 3000));
  const m = await p.evaluate(() => ({hash: location.hash, tab: (document.querySelector('[aria-current="page"]') || {}).textContent || ''}));
  ok('I6 Map takes you to the map at that location', /^#sheet\//.test(m.hash) || /map/i.test(m.tab), JSON.stringify(Object.assign(m, {key: mk})));
  await p.evaluate(() => { location.hash = '#change/' + todayIso(); try { render(); } catch (e) {} }); await p.waitForSelector('#tg782'); await new Promise(r => setTimeout(r, 1500));
  const bb = await p.evaluate(() => { const e = document.querySelector('#tg782'); e.scrollIntoView({block: 'start'}); const r = e.getBoundingClientRect(); return {x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y))}; });
  await p.screenshot({path: path.join(__dirname, 'inventory_still_to_come_' + (MOB ? 'phone' : 'desktop') + '.png'), clip: bb});
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 300)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
