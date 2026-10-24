/* Author: Andrew Fisher. v11.29 checks: the pin maths against the explorer's georeferencing (PG01 to the plan pixel worked out
   independently); the area map for PG01 (crop inside the plan, the plan image, a pin per reference of the area, PG01 white
   with a pulsing halo, every pin a navigation link, legend, Where am I; the blue dot when the phone is near, the distance
   line when it is far); the map on the status page; a done job lit in its colour (pump hi-vis, water neon blue, clean
   green) with the label icon still drawn. GET only; the record is compared.
     PAGE=build/GC500_v11.29/GC500_Delivery_Control_hosted.html node tests/test_v1129.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 800))); };
/* PG01's pin through the explorer's registration, worked out here in Python-equivalent form (see the release README): sheet pt (1003.0, 612.2) -> overview px (501.5, 306.1) */
const PG01 = {pin: [-27.986807, 153.428013], px: [501.5, 306.1]};
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.29'));
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template carries the plan map, the map on the code card and the status page, and the done colours', card.includes('var PLAN1129') && (card.match(/areaMapHtml\(a, r, day, st\)/g) || []).length === 3 && card.includes('.job.t-refill.done{background:linear-gradient(180deg,#0f2d4d') && card.includes('.job.t-pump.done{background:linear-gradient(180deg,#3a2510') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const m = await c.evaluate((PG01) => {
   const px = window.SvcMap1129.planPx(PG01.pin);
   const host = document.createElement('div'); host.innerHTML = window.SvcMap1129.html('PG01'); document.body.appendChild(host);
   const svg = host.querySelector('.amap-svg'), vb = svg ? svg.getAttribute('viewBox').split(' ').map(Number) : null;
   const pins = [...host.querySelectorAll('.amap-svg a')];
   const me = host.querySelector('.amap-svg a.me');
   const r = {px, vb, img: svg && svg.querySelector('image') && svg.querySelector('image').getAttribute('href'), pins: pins.length, hrefs: pins.every(a => /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d/.test(a.getAttribute('href')) && a.getAttribute('target') === '_blank'),
    classes: [...new Set(pins.map(a => a.className.baseVal))].sort(), me: me ? {label: me.querySelector('.lbl').textContent, halo: !!me.querySelector('.halo'), haloAnim: getComputedStyle(me.querySelector('.halo')).animationName, pinFill: getComputedStyle(me.querySelector('.pin')).fill, cx: +me.querySelector('.pin').getAttribute('cx'), cy: +me.querySelector('.pin').getAttribute('cy')} : null,
    togoFill: host.querySelector('.amap-svg a.togo .pin') ? getComputedStyle(host.querySelector('.amap-svg a.togo .pin')).fill : null, legend: host.querySelector('.amap-foot') && host.querySelector('.amap-foot').textContent.replace(/\s+/g, ' ').trim(), locate: !!host.querySelector('[data-locate]'), h3: host.querySelector('.amap h3') && host.querySelector('.amap h3').textContent,
    areaRefsWithPins: (function () { let n = 0; document.querySelectorAll('x').length; return n; })()};
   host.remove(); return r;
  }, PG01);
  const inside = m.vb && m.vb[0] >= 0 && m.vb[1] >= 0 && m.vb[0] + m.vb[2] <= 1192.01 && m.vb[1] + m.vb[3] <= 842.01 && m.vb[2] >= 230 && m.vb[3] >= 140;
  const meIn = m.me && m.me.cx >= m.vb[0] && m.me.cx <= m.vb[0] + m.vb[2] && m.me.cy >= m.vb[1] && m.me.cy <= m.vb[1] + m.vb[3];
  check('pin maths: PG01 lands on the plan pixel worked out independently from the explorer registration (within 0.3 px)', Math.abs(m.px[0] - PG01.px[0]) <= 0.3 && Math.abs(m.px[1] - PG01.px[1]) <= 0.3, m.px);
  check('area map for PG01: a crop inside the plan, the plan image, a navigation pin per reference of Area 1 (14), PG01 white with a pulsing halo inside the crop, the others hi-vis, legend and Where am I', inside && m.img === '/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp' && m.pins === 14 && m.hrefs && m.me && m.me.label === 'PG01' && m.me.halo && m.me.haloAnim === 'svc-mapme' && m.me.pinFill === 'rgb(255, 255, 255)' && meIn && Math.abs(m.me.cx - PG01.px[0]) <= 0.3 && m.togoFill === 'rgb(255, 179, 71)' && /PG01 · you scanned this/.test(m.legend) && /tap a pin to navigate/.test(m.legend) && m.locate && m.h3 === 'Area 1 · Pit Lane, Paddock & Teams · on the plan', m);
  const loc = await c.evaluate((PG01) => {
   window.SvcMap1129.setLoc([PG01.pin[0] + 0.00005, PG01.pin[1] + 0.00005]); const near = document.createElement('div'); near.innerHTML = window.SvcMap1129.html('PG01');
   window.SvcMap1129.setLoc([PG01.pin[0] + 0.02, PG01.pin[1]]); const far = document.createElement('div'); far.innerHTML = window.SvcMap1129.html('PG01');
   window.SvcMap1129.setLoc('denied'); const den = document.createElement('div'); den.innerHTML = window.SvcMap1129.html('PG01');
   window.SvcMap1129.setLoc(null);
   return {nearDot: !!near.querySelector('.amap-svg .you'), nearText: near.querySelector('.lg.you') && near.querySelector('.lg.you').textContent, farDot: !!far.querySelector('.amap-svg .you'), farText: far.querySelector('.lg.you') && far.querySelector('.lg.you').textContent, denied: den.querySelector('.amap-foot') && den.querySelector('.amap-foot').textContent};
  }, PG01);
  check('Where am I: a phone a few metres away is the blue dot; one 2 km north reads the distance and direction instead; a refusal says location is off', loc.nearDot && loc.nearText === 'You are the blue dot' && !loc.farDot && /^You are about 2\d\d\d m north of PG01, off this crop\.$/.test(loc.farText || '') && /Location is off for this browser/.test(loc.denied || ''), loc);
  const sv = await c.evaluate(() => { const host = document.createElement('div'); host.innerHTML = window.SvcSaved1127('PG01'); const r = {map: host.querySelectorAll('.amap').length, order: [...host.children].map(e => e.className).join(' | ')}; return r; });
  check('the status page after Save & close carries the area map between the area section and Show every area', sv.map === 1 && /status-area \| card amap \| showall/.test(sv.order), sv);
  const tick = card.match(/\+ navHtml\(r\) \+ areaMapHtml\(a, r, day, st\);\n  shown\.forEach/) !== null;
  check("the code's card draws the map under the reference's details, before its jobs", tick);
  const d = await c.evaluate(() => {
   const tickSvg = (document.documentElement.outerHTML.match(/var TICK = '(<svg[\s\S]*?<\/svg>)'/) || [])[1] || '<svg viewBox="0 0 32 32"><path d="M7 17l6 6L25 9"/></svg>';
   const ld = (t) => (document.documentElement.outerHTML.match(new RegExp('  ' + t + ": '(<svg viewBox=\"0 0 24 24\"[\\s\\S]*?<\\/svg>)'")) || [])[1] || '<svg viewBox="0 0 24 24"><path d="M1 1h2"/></svg>';
   const host = document.createElement('div'); host.className = 'jobs'; document.body.appendChild(host);
   const mk = (t) => `<button class="job t-${t} done" type="button"><span class="jbox">${tickSvg}</span><span class="jtxt"><b>${ld(t)}${t}</b><small>Completed 01:00</small></span></button>`;
   host.innerHTML = ['pump', 'clean', 'refill'].map(mk).join('');
   const look = (b) => { const cs = getComputedStyle(b); return {border: cs.borderTopColor, bg: cs.backgroundImage.slice(0, 40), jbox: getComputedStyle(b.querySelector('.jbox')).backgroundColor, tick: getComputedStyle(b.querySelector('.jbox svg')).stroke, small: getComputedStyle(b.querySelector('small')).color, icon: getComputedStyle(b.querySelector('.jtxt b svg')).stroke, iconDash: getComputedStyle(b.querySelector('.jtxt b svg path')).strokeDasharray}; };
   const r = {}; ['pump', 'clean', 'refill'].forEach((t, i) => { r[t] = look(host.children[i]); }); host.remove(); return r;
  });
  check('a done Pump out lights hi-vis (border, tick box, Completed line), a done Water neon blue, a done Clean & restock green; the label icon stays drawn in each', d.pump.border === 'rgb(255, 179, 71)' && d.pump.jbox === 'rgb(255, 179, 71)' && d.pump.small === 'rgb(255, 208, 138)' && d.pump.icon === 'rgb(255, 208, 138)' && d.pump.iconDash === 'none' && d.pump.tick === 'rgb(42, 26, 11)' && d.refill.border === 'rgb(95, 180, 255)' && d.refill.jbox === 'rgb(95, 180, 255)' && d.refill.small === 'rgb(159, 216, 255)' && d.refill.icon === 'rgb(159, 216, 255)' && d.refill.tick === 'rgb(6, 26, 46)' && d.clean.border === 'rgb(46, 240, 171)' && d.clean.jbox === 'rgb(46, 240, 171)' && d.clean.small === 'rgb(125, 255, 208)' && d.clean.icon === 'rgb(125, 255, 208)', d);
  await c.evaluate(() => { const host = document.createElement('div'); host.id = 'shot'; host.innerHTML = window.SvcMap1129.html('PG01'); document.body.prepend(host); });
  await c.waitForTimeout(500);
  const el = await c.$('#shot .amap'); if (el) await el.screenshot({path: path.join(out, 'area_map_PG01_' + (MOB ? 'phone' : 'desktop') + '.png')}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1129.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
