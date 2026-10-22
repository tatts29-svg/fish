/* Author: Andrew Fisher. v11.34 checks: every pin on the card's plan carries a symbol of what the reference is, drawn from the
   record's lines (cubicle, block, accessible, trailer, sewer, tank); a tap on a symbol zooms the plan to that reference and
   names it with a Navigate link instead of leaving the card; a second tap navigates; Wider lets the focus go; the key under
   the plan shows the six symbols. GET only; the record is compared.
     PAGE=build/GC500_v11.34/GC500_Delivery_Control_hosted.html node tests/test_v1134.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const kindOf = o => { const lines = o.lines || []; let best = 'fwf', rank = -1; const score = l => { const t = String(l.type || ''), k = String(l.kind || ''); if (/trailer/i.test(t)) return ['trailer', 6]; if (k === 'access') return ['access', 5]; if (k === 'block' || k === 'pan16') return ['block', 4]; if (k === 'sewer') return ['sewer', 3]; if (k === 'fwf' || k === 'pump_only') return ['fwf', 2]; if (k === 'tank') return ['tank', 1]; return ['fwf', 0]; }; if (!lines.length) return 'fwf'; lines.forEach(l => { const s = score(l); if (s[1] > rank) { rank = s[1]; best = s[0]; } }); return best; };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.34'));
  const {card, refs} = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return {card: SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true), refs: data.areas.flatMap(a => a.refs.filter(o => o.pin).map(o => ({ref: o.ref, where: o.where, lines: o.lines || []})))}; });
  check('card template draws symbols and zooms on a tap; the old "tap a pin to navigate" is gone', card.includes('function kindOf1134') && card.includes('function symHtml1134') && card.includes("closest('.amap-svg a[data-ref]')") && !card.includes('tap a pin to navigate') && (card.match(/<script/g) || []).length === 1, {len: card.length, refs: refs.length});
  const expected = {}; refs.forEach(o => { expected[o.ref] = kindOf(o); });
  const kinds = Object.values(expected).reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
  check('the record gives the kinds: toilets the many, with blocks, accessible units, trailers, sewer-connected units and tanks among them', kinds.fwf > 40 && kinds.block >= 3 && kinds.access >= 3 && kinds.trailer >= 1 && kinds.tank >= 1, kinds);
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); if (r.request().url() === 'https://card.test/') return r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: card}); return r.fulfill({status: 404, body: ''}); });
  await c.goto('https://card.test/', {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const drawn = await c.evaluate((expected) => {
   const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:390px;'; document.body.appendChild(host);
   const seen = {}, wrong = [], noSym = []; let pins = 0, key = 0;
   for (const ref of Object.keys(expected)) {
    window.SvcMap1129.setZoom(false); host.innerHTML = window.SvcMap1129.html(ref); const svg = host.querySelector('.amap-svg'); if (!svg) continue;
    key = host.querySelectorAll('.amap-foot .skey').length;
    svg.querySelectorAll('a[data-ref]').forEach(a => { pins++; const r = a.getAttribute('data-ref'), g = a.querySelector('g.sym'), pin = a.querySelector('circle.pin'); if (!g || !pin) { noSym.push(r); return; } const k = (g.getAttribute('class').match(/sym-(\w+)/) || [])[1]; if (!seen[r]) seen[r] = k; if (k !== expected[r]) wrong.push(r + ':' + k + '!=' + expected[r]); });
   }
   host.remove(); return {pins, noSym: noSym.slice(0, 5), wrong: [...new Set(wrong)].slice(0, 8), seen: Object.keys(seen).length, key};
  }, expected);
  check('every pin on every map carries the symbol the record gives it, over its coloured disc; the key shows six symbols', drawn.pins > 70 && drawn.noSym.length === 0 && drawn.wrong.length === 0 && drawn.seen === refs.length && drawn.key === 6, drawn);
  const tap = await c.evaluate(() => {
   const host = document.createElement('div'); host.id = 'tap-host'; host.style.cssText = 'position:absolute;left:0;top:0;width:390px;'; document.body.appendChild(host);
   window.SvcMap1129.setZoom(false); host.innerHTML = window.SvcMap1129.html('PG01');
   const log = []; const guard = ev => { if (ev.target.closest && ev.target.closest('.amap-svg a[data-ref]')) { log.push(ev.defaultPrevented); ev.preventDefault(); } }; window.addEventListener('click', guard);
   const a0 = [...host.querySelectorAll('.amap-svg a[data-ref]')].find(a => a.getAttribute('data-ref') === 'WC43');
   a0.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
   const afterFirst = {focus: window.SvcMap1129.focus(), zoom: window.SvcMap1129.zoom()};
   host.innerHTML = window.SvcMap1129.html('PG01');
   const svg = host.querySelector('.amap-svg'), vb = svg.getAttribute('viewBox').split(' ').map(Number), f = svg.querySelector('a.focus'), pin = f && f.querySelector('circle.pin');
   const centred = pin ? Math.abs(+pin.getAttribute('cx') - (vb[0] + vb[2] / 2)) < vb[2] * 0.2 && Math.abs(+pin.getAttribute('cy') - (vb[1] + vb[3] / 2)) < vb[3] * 0.25 : false;
   const foot = host.querySelector('.amap-foot .lg.focus'), nav = foot && foot.querySelector('a.navlink');
   const a1 = [...host.querySelectorAll('.amap-svg a[data-ref]')].find(a => a.getAttribute('data-ref') === 'WC43');
   a1.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
   window.removeEventListener('click', guard);
   const wider = (() => { window.SvcMap1129.setZoom(false); return window.SvcMap1129.focus(); })();
   host.remove();
   return {log, afterFirst, focusRef: f && f.getAttribute('data-ref'), vbw: vb[2], centred, footText: foot && foot.textContent, nav: nav && nav.getAttribute('href'), wider};
  });
  check('a tap on WC43 is kept on the card: the plan zooms to WC43 (Closer crop centred on it), WC43 is named under the plan with its units and a Navigate link; the second tap is let through to navigate; Wider lets the focus go', tap.log.length === 2 && tap.log[0] === true && tap.log[1] === false && tap.afterFirst.focus === 'WC43' && tap.afterFirst.zoom === true && tap.focusRef === 'WC43' && tap.vbw < 230 && tap.centred && /WC43/.test(tap.footText || '') && /google\.com\/maps\/dir/.test(tap.nav || '') && tap.wider === null, tap);
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1134.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
