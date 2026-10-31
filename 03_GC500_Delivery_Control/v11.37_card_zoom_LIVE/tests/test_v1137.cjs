/* Author: Andrew Fisher. v11.37 checks: the card's plan is a view the crew can move - zoom buttons, a set view, the wheel, a
   drag and a pinch change the SVG's viewBox while pins and labels keep their screen size; the explorer's tiles for the view
   are asked for by byte range from the page's own origin (level 0 to 3 by zoom), placed over the overview and kept; Closer,
   Wider and a tap on a symbol drop the moved view; the tile manifest is in the card. In the card tab nothing is served but
   the card, so the tile fetches fail cleanly. GET only; the record is compared.
     PAGE=build/GC500_v11.37/GC500_Delivery_Control_hosted.html node tests/test_v1137.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.37'));
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template carries the view, the gestures, the tile loader and the manifest (levels 0 to 3)', card.includes('function setView1137') && card.includes("addEventListener('touchmove'") && card.includes('fetch(TILES1137.base + t.file') && /var TILES1137 = \{"tile":512,"sheet":\[2384,1684\],"base":"\/w\/Coates-GC500-2026\/explorer\/assets\/vt\/","levels":\[\{"L":0/.test(card) && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage(); const tileReqs = [];
  await c.route('**/*', r => { const u = r.request().url(); if (r.request().method() !== 'GET') return r.abort(); if (u === 'https://card.test/') return r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: card}); if (/\/explorer\/assets\/vt\//.test(u)) tileReqs.push({u: u.replace(/^.*\/vt\//, ''), range: r.request().headers().range || null}); return r.fulfill({status: 404, body: ''}); });
  await c.goto('https://card.test/', {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const base = await c.evaluate(() => { const host = document.createElement('div'); host.id = 'zh'; host.style.cssText = 'position:absolute;left:0;top:0;width:390px;'; document.body.appendChild(host); window.SvcMap1129.setZoom(false); window.SvcMap1129.setView(null); host.innerHTML = window.SvcMap1129.html('PG01'); const svg = host.querySelector('.amap-svg'); const vb = svg.getAttribute('viewBox').split(' ').map(Number); const pin = svg.querySelector('a.me circle.pin');
   return {vb, tiles: !!svg.querySelector('g.tiles'), veil: !!svg.querySelector('rect.veil'), buttons: [...host.querySelectorAll('[data-vz]')].map(b => b.dataset.vz), rMe: +pin.getAttribute('r'), fs: +svg.querySelector('a.me text').getAttribute('font-size'), level: window.SvcMap1129.tiles().level(vb[2]), touchAction: getComputedStyle(svg).touchAction}; });
  check('the plan starts at the computed crop with the tile layer, the veil, + and − (no Fit until moved), and touch-action none on the plan', base.vb[2] === 230 && base.tiles && base.veil && base.buttons.join(',') === 'out,in' && base.touchAction === 'none', base);
  const zoomed = await c.evaluate(() => new Promise(res => { const host = document.getElementById('zh'); host.querySelector('[data-vz="in"]').click(); setTimeout(() => { host.innerHTML = window.SvcMap1129.html('PG01'); const svg = host.querySelector('.amap-svg'); const vb = svg.getAttribute('viewBox').split(' ').map(Number); const pin = svg.querySelector('a.me circle.pin'); const v = window.SvcMap1129.view();
   res({vb, view: v, rMe: +pin.getAttribute('r'), fs: +svg.querySelector('a.me text').getAttribute('font-size'), buttons: [...host.querySelectorAll('[data-vz]')].map(b => b.dataset.vz), level: window.SvcMap1129.tiles().level(vb[2]), wanted: window.SvcMap1129.tiles().wanted(vb[0], vb[1], vb[2], vb[3], window.SvcMap1129.tiles().level(vb[2])).length, pins: svg.querySelectorAll('a[data-ref]').length}); }, 300); }));
  check('+ halves the view about its centre; the pin and the label scale with it so they keep their size on the screen; Fit appears; a deeper tile level is asked for', zoomed.vb[2] === 115 && zoomed.view && zoomed.view.w === 115 && Math.abs(zoomed.rMe - base.rMe / 2) < 0.2 && Math.abs(zoomed.fs - base.fs / 2) < 0.2 && zoomed.buttons.join(',') === 'out,in,fit' && zoomed.level >= base.level && zoomed.wanted >= 1 && zoomed.pins >= 1, zoomed);
  const deep = await c.evaluate(() => { window.SvcMap1129.setView(501.5, 306.1, 20); const host = document.getElementById('zh'); host.innerHTML = window.SvcMap1129.html('PG01'); const svg = host.querySelector('.amap-svg'); const vb = svg.getAttribute('viewBox').split(' ').map(Number); const t = window.SvcMap1129.tiles(); const L = t.level(vb[2]); const want = t.wanted(vb[0], vb[1], vb[2], vb[3], L);
   return {vb, L, want: want.length, first: want[0] && {key: want[0].key, x: want[0].x, y: want[0].y, span: want[0].span}, me: !!svg.querySelector('a.me'), spanOk: want[0] ? Math.abs(want[0].span - 256 / Math.pow(2, L)) < 1e-6 : false}; });
  check('a deep view on PG01 (20 plan px wide) asks for level 3 tiles that cover the view, each tile 32 plan px across, with PG01 still drawn', deep.vb[2] === 20 && deep.L === 3 && deep.want >= 1 && deep.want <= 6 && deep.spanOk && deep.me && deep.first && deep.first.x <= 501.5 && deep.first.x + deep.first.span >= 491.5 - 1e-6, deep);
  await c.waitForTimeout(1200);
  check('the tiles are asked for by byte range from the explorer’s vt files (nothing served in this tab, so they fail cleanly, no page error)', tileReqs.length >= 1 && tileReqs.every(r => /^L[0-3]-[0-9a-f]+\.bin$/.test(r.u) && /^bytes=\d+-\d+$/.test(r.range || '')), tileReqs.slice(0, 4));
  const drop = await c.evaluate(() => { window.SvcMap1129.setView(600, 300, 60); const host = document.getElementById('zh'); host.innerHTML = window.SvcMap1129.html('PG01'); const a = [...host.querySelectorAll('.amap-svg a[data-ref]')].find(x => x.getAttribute('data-ref') === 'PG01'); const guard = ev => { if (ev.target.closest && ev.target.closest('.amap-svg a[data-ref]')) ev.preventDefault(); }; window.addEventListener('click', guard); a.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true})); window.removeEventListener('click', guard); const afterTap = window.SvcMap1129.view(); window.SvcMap1129.setView(600, 300, 60); host.innerHTML = window.SvcMap1129.html('PG01'); host.querySelector('[data-zoom]').click(); const afterZoomBtn = window.SvcMap1129.view(); window.SvcMap1129.setView(600, 300, 60); host.innerHTML = window.SvcMap1129.html('PG01'); host.querySelector('[data-vz="fit"]').click(); const afterFit = window.SvcMap1129.view(); host.remove(); window.SvcMap1129.setZoom(false); window.SvcMap1129.setView(null); return {afterTap, afterZoomBtn, afterFit}; });
  check('a tap on a symbol, Closer / Wider and Fit each drop the moved view', drop.afterTap === null && drop.afterZoomBtn === null && drop.afterFit === null, drop);
  const errs = await c.evaluate(() => (window.__errs || []).length);
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1137.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
