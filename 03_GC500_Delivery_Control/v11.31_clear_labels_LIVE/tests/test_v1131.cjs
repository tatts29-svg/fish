/* Author: Andrew Fisher. v11.31 checks: on the card's plan every label is laid out clear of the pins and of the other labels,
   for every reference on the record (measured from the drawn text and circles); the scanned reference's label is the largest;
   a displaced label has a leader line to its pin; Closer crops to the references near the scanned one and Wider goes back.
   GET only; the record is compared.
     PAGE=build/GC500_v11.31/GC500_Delivery_Control_hosted.html node tests/test_v1131.cjs      MOB=1 ...      LIVE=1 ... */
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
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.31'));
  const {card, refs} = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return {card: SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true), refs: data.areas.flatMap(a => a.refs.filter(o => o.pin).map(o => o.ref))}; });
  check('card template lays labels out, draws leaders, offers Closer / Wider, never uses the old fixed label spot', card.includes('function layoutLabels1131') && card.includes('class="lead"') && card.includes("'Wider' : 'Closer'") && !card.includes('f1(o.p[1] - rr - fs * 0.35)') && (card.match(/<script/g) || []).length === 1, {len: card.length, refs: refs.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); if (r.request().url() === 'https://card.test/') return r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: card}); return r.fulfill({status: 404, body: ''}); });
  await c.goto('https://card.test/', {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  /* measure every reference's map as drawn: label boxes from the text's own bounding box, pins as circles */
  const measure = await c.evaluate((refs) => {
   const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:390px;'; document.body.appendChild(host);
   const rows = [];
   for (const ref of refs) {
    for (const zoom of [false, true]) {
     window.SvcMap1129.setZoom(zoom); host.innerHTML = window.SvcMap1129.html(ref);
     const svg = host.querySelector('.amap-svg'); if (!svg) { rows.push({ref, zoom, none: true, off: (host.querySelector('.amap-off') || {}).textContent || null}); continue; }
     const vb = svg.getAttribute('viewBox').split(' ').map(Number);
     const items = [...svg.querySelectorAll('a')].map(a => { const t = a.querySelector('text'), b = t.getBBox(), pin = a.querySelector('circle.pin'); return {ref: t.textContent, me: /\bme\b/.test(a.getAttribute('class')), fs: +t.getAttribute('font-size'), box: [b.x, b.y, b.x + b.width, b.y + b.height], pin: [+pin.getAttribute('cx'), +pin.getAttribute('cy'), +pin.getAttribute('r')], lead: !!a.querySelector('line.lead')}; });
     const inter = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 0.3 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 0.3;
     const pinBox = pn => [pn[0] - pn[2], pn[1] - pn[2], pn[0] + pn[2], pn[1] + pn[2]];
     let ll = 0, lp = 0, outside = 0; const pairs = [];
     for (let i = 0; i < items.length; i++) {
      const bi = items[i].box; if (bi[0] < vb[0] - 0.5 || bi[1] < vb[1] - 0.5 || bi[2] > vb[0] + vb[2] + 0.5 || bi[3] > vb[1] + vb[3] + 0.5) outside++;
      for (let j = 0; j < items.length; j++) { if (i !== j && inter(bi, pinBox(items[j].pin))) { lp++; pairs.push(items[i].ref + '/pin ' + items[j].ref); } if (j > i && inter(bi, items[j].box)) { ll++; pairs.push(items[i].ref + '/' + items[j].ref); } }
     }
     const me = items.find(x => x.me);
     rows.push({ref, zoom, pins: items.length, ll, lp, outside, pairs: pairs.slice(0, 6), leads: items.filter(x => x.lead).length, vbw: vb[2], meFs: me && me.fs, maxOtherFs: Math.max(...items.filter(x => !x.me).map(x => x.fs), 0), meIn: !!me, btn: (host.querySelector('[data-zoom]') || {}).textContent});
    }
   }
   window.SvcMap1129.setZoom(false); host.remove();
   return rows;
  }, refs);
  const wide = measure.filter(r => !r.zoom && !r.none), close = measure.filter(r => r.zoom && !r.none);
  const badWide = wide.filter(r => r.ll || r.lp || r.outside), badClose = close.filter(r => r.ll || r.lp || r.outside);
  const offPlan = measure.filter(r => r.none && !r.zoom);
  check('every reference with a pin draws a map in both views, except the one whose record pin is off the sheet (WC85 at the Coates Compound), which gets a line saying so', wide.length + offPlan.length === refs.length && offPlan.length === 1 && offPlan[0].ref === 'WC85' && /WC85 sits off the site plan/.test(offPlan[0].off || '') && measure.filter(r => r.none).every(r => r.ref === 'WC85'), {refs: refs.length, drawn: wide.length, off: offPlan});
  check('wide view: for every reference, no label runs into another label or another pin, and none leaves the crop', badWide.length === 0, badWide.slice(0, 8));
  check('Closer view: the same, with the crop narrower and the scanned reference still on it', badClose.length === 0 && close.every(r => r.meIn) && close.every(r => r.vbw <= wide.find(w => w.ref === r.ref).vbw), {bad: badClose.slice(0, 8), narrower: close.filter(r => r.vbw <= wide.find(w => w.ref === r.ref).vbw).length});
  check('the scanned reference carries the largest label on every map', wide.every(r => r.meIn && r.meFs > r.maxOtherFs), wide.filter(r => !(r.meIn && r.meFs > r.maxOtherFs)).slice(0, 5));
  const pg01 = wide.find(r => r.ref === 'PG01'), pg01c = close.find(r => r.ref === 'PG01');
  check('PG01: the Area 1 cluster is drawn with leader lines where a label had to move out, Closer trims to the references near PG01 and the button reads Wider', pg01 && pg01.leads >= 1 && pg01.btn === 'Closer' && pg01c && pg01c.pins < pg01.pins && pg01c.pins >= 2 && pg01c.btn === 'Wider', {wide: pg01, close: pg01c});
  const tap = await c.evaluate(() => { const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); document.body.appendChild(host); const b = host.querySelector('[data-zoom]'); b.click(); const z = window.SvcMap1129.zoom(); host.remove(); window.SvcMap1129.setZoom(false); return {zoomAfterTap: z}; });
  check('tapping Closer flips the view', tap.zoomAfterTap === true, tap);
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'label_layout_v1131.json'), JSON.stringify(measure, null, 1));
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1131.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
