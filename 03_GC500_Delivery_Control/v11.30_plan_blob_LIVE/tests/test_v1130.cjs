/* Author: Andrew Fisher. v11.30 checks: the card no longer points the map's image at the plan's URL (the card's CSP refuses it);
   it fetches the plan and hands the map a blob URL, keeps a data URL copy in local storage and uses that copy first on the
   next open; until the plan is there the map says so; pins that share a spot are spread. In the card tab (no origin) the
   fetch fails, so the loader is exercised with a kept copy and a set source. GET only; the record is compared.
     PAGE=build/GC500_v11.30/GC500_Delivery_Control_hosted.html node tests/test_v1130.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 800))); };
const PNG1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.30'));
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template fetches the plan as a blob, keeps a copy, never points the image at the URL', card.includes('function loadPlan1129') && card.includes('URL.createObjectURL(blob)') && card.includes('readAsDataURL(blob)') && !card.includes('<image href="\' + PLAN1129.url') && card.includes('function spread1129') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  /* the card tab gets an origin of its own so local storage works as it does on a phone; nothing is served there but the card, so the plan fetch fails */
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); if (r.request().url() === 'https://card.test/') return r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: card}); return r.fulfill({status: 404, body: ''}); });
  await c.goto('https://card.test/', {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(3000);
  const s0 = await c.evaluate(() => { const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); const svg = host.querySelector('.amap-svg'); return {state: window.SvcMap1129.state(), src: window.SvcMap1129.src(), img: !!svg.querySelector('image'), note: svg.querySelector('.plannote') && svg.querySelector('.plannote').textContent, pins: svg.querySelectorAll('a').length}; });
  check('with no origin to fetch from, the map carries no image and says the plan loads with signal; the pins are still there', (s0.state === 'failed' || s0.state === 'loading') && s0.src === '' && !s0.img && /Plan load/.test(s0.note || '') && s0.pins === 14, s0);
  const s1 = await c.evaluate((PNG1) => { window.SvcMap1129.setSrc(PNG1, 'fetched'); const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); const img = host.querySelector('.amap-svg image'); return {href: img && img.getAttribute('href').slice(0, 14), note: !!host.querySelector('.plannote'), w: img && img.getAttribute('width'), h: img && img.getAttribute('height')}; }, PNG1);
  check('once the plan is in hand the map draws it as the image under the pins, full sheet size, and the note goes', s1.href === 'data:image/png' && !s1.note && s1.w === '1192' && s1.h === '842', s1);
  const s2 = await c.evaluate(() => { window.SvcMap1129.setSrc('', 'idle'); window.SvcMap1129.reload(); return {state: window.SvcMap1129.state(), src: window.SvcMap1129.src()}; });
  check('with nothing kept, a reload fetches again (and fails here, with no plan to be had)', (s2.state === 'loading' || s2.state === 'failed') && s2.src === '', s2);
  const s3 = await c.evaluate((PNG1) => { try { localStorage.setItem('gc500.svc1067.plan1129', PNG1); } catch (e) { return {error: String(e)}; } window.SvcMap1129.setSrc('', 'idle'); window.SvcMap1129.reload(); const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); const img = host.querySelector('.amap-svg image'); return {state: window.SvcMap1129.state(), src: window.SvcMap1129.src().slice(0, 14), drawn: img && img.getAttribute('href').slice(0, 14)}; }, PNG1);
  check('a kept copy in local storage is used first on the next open, without a fetch, and the map draws it', s3.state === 'kept' && s3.src === 'data:image/png' && s3.drawn === 'data:image/png', s3);
  const sp = await c.evaluate(() => { const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); const at = (ref) => { const a = [...host.querySelectorAll('.amap-svg a')].find(x => x.querySelector('text').textContent === ref); const c = a.querySelector('.pin'); return [+c.getAttribute('cx'), +c.getAttribute('cy')]; }; const p1 = at('PG01'), p3 = at('PG03'), p5 = at('PG05'); const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]); return {p1, p3, p5, d13: d(p1, p3), d15: d(p1, p5), d35: d(p3, p5)}; });
  check('PG01, PG03 and PG05, which share one pin on the record, are spread so each label can be read', sp.d13 > 8 && sp.d15 > 8 && sp.d35 > 8 && sp.d13 < 40, sp);
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1130.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
